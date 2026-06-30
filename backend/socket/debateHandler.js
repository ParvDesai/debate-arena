const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Argument = require('../models/Argument');
const User = require('../models/User');
const Vote = require('../models/Vote');
const { scoreArgument, generateCounterArgument } = require('../services/geminiService');

// Track active timers & spectators
const roomTimers = {};
const roomSpectators = {};

function startRoomTimer(io, roomId) {
    if (roomTimers[roomId]) {
        clearInterval(roomTimers[roomId]);
        clearTimeout(roomTimers[roomId]);
    }
    
    let remaining = 60;
    roomTimers[roomId] = setInterval(async () => {
        remaining--;
        io.to(roomId).emit('timer-tick', remaining);
        if (remaining <= 0) {
            clearInterval(roomTimers[roomId]);
            io.to(roomId).emit('timer-expired');
            // Give client a 1.5s grace period to auto-submit draft arguments before forfeiting
            roomTimers[roomId] = setTimeout(async () => {
                delete roomTimers[roomId];
                await handleTimerExpiry(io, roomId);
            }, 1500);
        }
    }, 1000);
}

async function handleTimerExpiry(io, roomId) {
    try {
        const room = await Room.findById(roomId)
            .populate('debaterFor', 'username')
            .populate('debaterAgainst', 'username');
        if (!room || room.status !== 'active') return;

        // Advance turn (current player forfeits their turn)
        const nextTurn = room.currentTurn === 'for' ? 'against' : 'for';
        const nextTurnNumber = room.currentTurn === 'against' ? room.turnNumber + 1 : room.turnNumber;

        if (nextTurnNumber > room.maxTurns) {
            // Debate is over
            room.status = 'finished';
            const allArgs = await Argument.find({ roomId }).lean();
            const forTotal = allArgs.filter(a => a.side === 'for').reduce((s, a) => s + a.aiScore.total, 0);
            const againstTotal = allArgs.filter(a => a.side === 'against').reduce((s, a) => s + a.aiScore.total, 0);

            if (forTotal > againstTotal) room.winnerId = room.debaterFor;
            else if (againstTotal > forTotal) room.winnerId = room.debaterAgainst;

            // Solo mode games do not count toward leaderboard stats
            if (!room.isSoloMode) {
                if (room.debaterFor) await User.findByIdAndUpdate(room.debaterFor, { $inc: { gamesPlayed: 1 } });
                if (room.debaterAgainst) await User.findByIdAndUpdate(room.debaterAgainst, { $inc: { gamesPlayed: 1 } });
                if (room.winnerId) {
                    await User.findByIdAndUpdate(room.winnerId, { $inc: { wins: 1 } });
                    const loserId = room.winnerId.toString() === room.debaterFor?._id?.toString()
                        ? room.debaterAgainst : room.debaterFor;
                    if (loserId) await User.findByIdAndUpdate(loserId, { $inc: { losses: 1 } });
                }
            }

            room.timerEndsAt = null;
            await room.save();
            await room.populate('winnerId', 'username');

            io.to(roomId).emit('debate-finished', { room, forTotal, againstTotal, winner: room.winnerId });
        } else {
            room.currentTurn = nextTurn;
            room.turnNumber = nextTurnNumber;
            room.timerEndsAt = null;
            await room.save();

            io.to(roomId).emit('turn-changed', {
                currentTurn: room.currentTurn,
                turnNumber: room.turnNumber
            });

            // In solo mode, trigger AI if it's now the AI's turn
            if (room.isSoloMode && room.currentTurn !== room.soloSide) {
                await handleAITurn(io, room, roomId);
            }

            // Restart timer for next turn (check presence)
            await updateRoomPresence(io, roomId);
        }
    } catch (err) {
        console.error('Timer expiry handler error:', err.message);
    }
}

async function updateRoomPresence(io, roomId) {
    try {
        const room = await Room.findById(roomId);
        if (!room || room.status !== 'active') return;

        // Fetch all sockets in the room
        const sockets = await io.in(roomId).fetchSockets();
        const presentUserIds = new Set(sockets.map(s => s.userId?.toString()).filter(Boolean));

        const forId = room.debaterFor?.toString();
        const againstId = room.debaterAgainst?.toString();

        // In solo mode, AI side is always considered present.
        const forPresent = room.isSoloMode ? true : (forId ? presentUserIds.has(forId) : false);
        const againstPresent = room.isSoloMode ? true : (againstId ? presentUserIds.has(againstId) : false);

        const bothPresent = forPresent && againstPresent;

        io.to(roomId).emit('debater-presence', {
            forPresent,
            againstPresent,
            bothPresent
        });

        if (bothPresent) {
            // Both are here! If timer isn't running, start it
            if (!roomTimers[roomId]) {
                startRoomTimer(io, roomId);
            }
        } else {
            // Someone left! Pause/clear the timer
            if (roomTimers[roomId]) {
                clearInterval(roomTimers[roomId]);
                clearTimeout(roomTimers[roomId]);
                delete roomTimers[roomId];
                
                room.timerEndsAt = null;
                await room.save();
                
                io.to(roomId).emit('timer-tick', 60);
                io.to(roomId).emit('timer-paused');
            }
        }
    } catch (err) {
        console.error('updateRoomPresence error:', err.message);
    }
}

module.exports = function (io) {
    // Socket auth middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Not authenticated'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.userId}`);

        socket.on('join-room', async (roomId) => {
            socket.join(roomId);
            socket.currentRoom = roomId;

            if (!roomSpectators[roomId]) roomSpectators[roomId] = new Set();
            roomSpectators[roomId].add(socket.id);

            io.to(roomId).emit('spectator-count', roomSpectators[roomId].size);

            // Send current room state
            try {
                const [room, argumentsList] = await Promise.all([
                    Room.findById(roomId)
                        .populate('debaterFor', 'username')
                        .populate('debaterAgainst', 'username'),
                    Argument.find({ roomId }).sort({ turnNumber: 1, createdAt: 1 }).populate('userId', 'username')
                ]);
                
                if (room) {
                    const statePayload = { 
                        room, 
                        arguments: argumentsList,
                        spectators: roomSpectators[roomId].size
                    };

                    // If room is active, broadcast to ALL so both debaters get the state
                    if (room.status === 'active') {
                        io.to(roomId).emit('room-state', statePayload);
                        await updateRoomPresence(io, roomId);

                        // In solo mode, if it's the AI's turn and no arguments yet, trigger AI first move
                        if (room.isSoloMode && room.currentTurn !== room.soloSide && argumentsList.length === 0) {
                            await handleAITurn(io, room, roomId);
                        }
                    } else {
                        socket.emit('room-state', statePayload);
                    }
                }
            } catch (err) {
                console.error('Error fetching room:', err.message);
            }
        });



        socket.on('start-timer', async (roomId) => {
            if (roomTimers[roomId]) return; // Already running

            const TURN_SECONDS = 60;

            try {
                const room = await Room.findById(roomId);
                if (!room || room.status !== 'active') return;

                room.timerEndsAt = new Date(Date.now() + TURN_SECONDS * 1000);
                await room.save();

                let remaining = TURN_SECONDS;
                roomTimers[roomId] = setInterval(async () => {
                    remaining--;
                    io.to(roomId).emit('timer-tick', remaining);

                    if (remaining <= 0) {
                        clearInterval(roomTimers[roomId]);
                        delete roomTimers[roomId];
                        io.to(roomId).emit('timer-expired');
                    }
                }, 1000);
            } catch (err) {
                console.error('Timer error:', err.message);
            }
        });

        socket.on('submit-argument', async ({ roomId, text }) => {
            try {
                const room = await Room.findById(roomId);
                if (!room || room.status !== 'active') return;

                const userId = socket.userId;
                const isFor = room.debaterFor?.toString() === userId.toString();
                const isAgainst = room.debaterAgainst?.toString() === userId.toString();
                if (!isFor && !isAgainst) return;

                const side = isFor ? 'for' : 'against';
                if (room.currentTurn !== side) return;

                // Clear timer
                if (roomTimers[roomId]) {
                    clearInterval(roomTimers[roomId]);
                    clearTimeout(roomTimers[roomId]);
                    delete roomTimers[roomId];
                }

                // Broadcast that argument was received (show loading)
                io.to(roomId).emit('scoring-in-progress', { side, turnNumber: room.turnNumber });

                // Get prior arguments
                const priorArgs = await Argument.find({ roomId }).sort({ turnNumber: 1 }).lean();

                // Score with Gemini
                const aiScore = await scoreArgument(room.topic, side, text, priorArgs);

                const argument = await Argument.create({
                    roomId,
                    userId,
                    side,
                    text,
                    turnNumber: room.turnNumber,
                    aiScore,
                    aiFeedback: aiScore.feedback
                });

                // Populate userId for broadcast
                await argument.populate('userId', 'username');

                // Advance turn
                const nextTurn = room.currentTurn === 'for' ? 'against' : 'for';
                const nextTurnNumber = room.currentTurn === 'against' ? room.turnNumber + 1 : room.turnNumber;

                if (nextTurnNumber > room.maxTurns) {
                    room.status = 'finished';

                    // Calculate winner
                    const allArgs = await Argument.find({ roomId }).lean();
                    const forTotal = allArgs.filter(a => a.side === 'for').reduce((s, a) => s + a.aiScore.total, 0);
                    const againstTotal = allArgs.filter(a => a.side === 'against').reduce((s, a) => s + a.aiScore.total, 0);

                    if (forTotal > againstTotal) {
                        room.winnerId = room.debaterFor;
                    } else if (againstTotal > forTotal) {
                        room.winnerId = room.debaterAgainst;
                    }

                    // Solo mode games do not count toward leaderboard stats
                    if (!room.isSoloMode) {
                        if (room.debaterFor) await User.findByIdAndUpdate(room.debaterFor, { $inc: { gamesPlayed: 1 } });
                        if (room.debaterAgainst) await User.findByIdAndUpdate(room.debaterAgainst, { $inc: { gamesPlayed: 1 } });

                        if (room.winnerId) {
                            await User.findByIdAndUpdate(room.winnerId, { $inc: { wins: 1, totalScore: Math.max(forTotal, againstTotal) } });
                            const loserId = room.winnerId.toString() === room.debaterFor?.toString()
                                ? room.debaterAgainst : room.debaterFor;
                            if (loserId) {
                                await User.findByIdAndUpdate(loserId, { $inc: { losses: 1, totalScore: Math.min(forTotal, againstTotal) } });
                            }
                        }
                    }

                    room.timerEndsAt = null;
                    await room.save();
                    await room.populate('debaterFor', 'username');
                    await room.populate('debaterAgainst', 'username');
                    await room.populate('winnerId', 'username');

                    io.to(roomId).emit('argument-scored', argument);

                    // Small delay before verdict for drama
                    setTimeout(() => {
                        io.to(roomId).emit('debate-finished', {
                            room,
                            forTotal,
                            againstTotal,
                            winner: room.winnerId
                        });
                    }, 2000);
                } else {
                    room.currentTurn = nextTurn;
                    room.turnNumber = nextTurnNumber;
                    room.timerEndsAt = null;
                    await room.save();

                    io.to(roomId).emit('argument-scored', argument);
                    io.to(roomId).emit('turn-changed', {
                        currentTurn: room.currentTurn,
                        turnNumber: room.turnNumber
                    });

                    // If solo mode and it's now the AI's turn
                    if (room.isSoloMode && room.currentTurn !== room.soloSide) {
                        await handleAITurn(io, room, roomId);
                    }

                    // Restart timer for next turn (check presence)
                    await updateRoomPresence(io, roomId);
                }
            } catch (err) {
                console.error('Submit argument error:', err.message);
                socket.emit('error-msg', 'Failed to submit argument');
            }
        });

        socket.on('audience-vote', async ({ roomId, side }) => {
            try {
                const existing = await Vote.findOne({ roomId, userId: socket.userId });
                if (existing) {
                    // Update vote
                    const oldSide = existing.side;
                    existing.side = side;
                    await existing.save();

                    const room = await Room.findById(roomId);
                    if (oldSide !== side) {
                        if (side === 'for') {
                            room.forVotes += 1;
                            room.againstVotes = Math.max(0, room.againstVotes - 1);
                        } else {
                            room.againstVotes += 1;
                            room.forVotes = Math.max(0, room.forVotes - 1);
                        }
                        await room.save();
                    }
                } else {
                    await Vote.create({ roomId, userId: socket.userId, side });
                    const update = side === 'for' ? { $inc: { forVotes: 1 } } : { $inc: { againstVotes: 1 } };
                    await Room.findByIdAndUpdate(roomId, update);
                }

                const room = await Room.findById(roomId);
                io.to(roomId).emit('vote-updated', {
                    forVotes: room.forVotes,
                    againstVotes: room.againstVotes
                });
            } catch (err) {
                console.error('Vote error:', err.message);
            }
        });

        // Forfeit / settle debate — the person whose turn it is gives up
        socket.on('forfeit-debate', async ({ roomId }) => {
            try {
                const room = await Room.findById(roomId)
                    .populate('debaterFor', 'username')
                    .populate('debaterAgainst', 'username');
                if (!room || room.status !== 'active') return;

                const userId = socket.userId;
                const isFor = room.debaterFor?._id?.toString() === userId.toString();
                const isAgainst = room.debaterAgainst?._id?.toString() === userId.toString();
                if (!isFor && !isAgainst) return;

                // Clear timer
                if (roomTimers[roomId]) {
                    clearInterval(roomTimers[roomId]);
                    clearTimeout(roomTimers[roomId]);
                    delete roomTimers[roomId];
                }

                room.status = 'finished';

                // The person who forfeits loses — opponent wins
                if (isFor) {
                    room.winnerId = room.debaterAgainst;
                } else {
                    room.winnerId = room.debaterFor;
                }

                // Calculate scores for the result screen
                const allArgs = await Argument.find({ roomId }).lean();
                const forTotal = allArgs.filter(a => a.side === 'for').reduce((s, a) => s + (a.aiScore?.total || 0), 0);
                const againstTotal = allArgs.filter(a => a.side === 'against').reduce((s, a) => s + (a.aiScore?.total || 0), 0);

                // Solo mode games do not count toward leaderboard stats
                if (!room.isSoloMode) {
                    if (room.debaterFor) await User.findByIdAndUpdate(room.debaterFor, { $inc: { gamesPlayed: 1 } });
                    if (room.debaterAgainst) await User.findByIdAndUpdate(room.debaterAgainst, { $inc: { gamesPlayed: 1 } });
                    if (room.winnerId) {
                        await User.findByIdAndUpdate(room.winnerId, { $inc: { wins: 1 } });
                        const loserId = isFor ? room.debaterFor : room.debaterAgainst;
                        if (loserId) await User.findByIdAndUpdate(loserId, { $inc: { losses: 1 } });
                    }
                }

                room.timerEndsAt = null;
                await room.save();
                await room.populate('winnerId', 'username');

                io.to(roomId).emit('debate-finished', {
                    room,
                    forTotal,
                    againstTotal,
                    winner: room.winnerId,
                    forfeit: true,
                    forfeitedBy: isFor ? 'for' : 'against'
                });

                console.log(`Debate ${roomId} forfeited by ${isFor ? 'FOR' : 'AGAINST'}`);
            } catch (err) {
                console.error('Forfeit error:', err.message);
                socket.emit('error-msg', 'Failed to forfeit debate');
            }
        });

        socket.on('leave-room', async (roomId) => {
            socket.leave(roomId);
            if (roomSpectators[roomId]) {
                roomSpectators[roomId].delete(socket.id);
                io.to(roomId).emit('spectator-count', roomSpectators[roomId].size);
            }
            await updateRoomPresence(io, roomId);
        });

        socket.on('disconnect', async () => {
            const roomId = socket.currentRoom;
            if (roomId && roomSpectators[roomId]) {
                roomSpectators[roomId].delete(socket.id);
                io.to(roomId).emit('spectator-count', roomSpectators[roomId].size);
            }
            if (roomId) {
                await updateRoomPresence(io, roomId);
            }
        });
    });
};

async function handleAITurn(io, room, roomId) {
    try {
        io.to(roomId).emit('ai-thinking');

        const priorArgs = await Argument.find({ roomId }).sort({ turnNumber: 1 }).lean();
        const aiSide = room.currentTurn;

        // Simulate thinking delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const aiText = await generateCounterArgument(room.topic, room.soloSide, priorArgs);
        const aiScore = await scoreArgument(room.topic, aiSide, aiText, priorArgs);

        const argument = await Argument.create({
            roomId,
            userId: null, // AI has no user account
            side: aiSide,
            text: aiText,
            turnNumber: room.turnNumber,
            aiScore,
            aiFeedback: aiScore.feedback
        });

        // Populate for broadcast by converting to a plain object first
        const argumentPayload = argument.toObject();
        argumentPayload.userId = { _id: 'ai', username: 'AI Opponent' };

        io.to(roomId).emit('argument-scored', argumentPayload);

        // Advance turn
        const nextTurn = room.currentTurn === 'for' ? 'against' : 'for';
        const nextTurnNumber = room.currentTurn === 'against' ? room.turnNumber + 1 : room.turnNumber;

        if (nextTurnNumber > room.maxTurns) {
            room.status = 'finished';
            const allArgs = await Argument.find({ roomId }).lean();
            const forTotal = allArgs.filter(a => a.side === 'for').reduce((s, a) => s + a.aiScore.total, 0);
            const againstTotal = allArgs.filter(a => a.side === 'against').reduce((s, a) => s + a.aiScore.total, 0);

            if (forTotal > againstTotal) {
                room.winnerId = room.debaterFor;
            } else if (againstTotal > forTotal) {
                room.winnerId = room.debaterAgainst;
            }

            room.timerEndsAt = null;
            await room.save();

            setTimeout(() => {
                io.to(roomId).emit('debate-finished', {
                    room,
                    forTotal,
                    againstTotal,
                    winner: room.winnerId
                });
            }, 2000);
        } else {
            room.currentTurn = nextTurn;
            room.turnNumber = nextTurnNumber;
            room.timerEndsAt = null;
            await room.save();

            io.to(roomId).emit('turn-changed', {
                currentTurn: room.currentTurn,
                turnNumber: room.turnNumber
            });

            // 15-second reading cooldown before player's turn timer starts
            const COOLDOWN_SECONDS = 15;
            io.to(roomId).emit('ai-cooldown', { seconds: COOLDOWN_SECONDS });

            let cooldownRemaining = COOLDOWN_SECONDS;
            await new Promise((resolve) => {
                const cooldownInterval = setInterval(() => {
                    cooldownRemaining--;
                    io.to(roomId).emit('ai-cooldown-tick', cooldownRemaining);
                    if (cooldownRemaining <= 0) {
                        clearInterval(cooldownInterval);
                        io.to(roomId).emit('ai-cooldown-ended');
                        resolve();
                    }
                }, 1000);
            });

            // Restart timer for player's next turn (check presence)
            await updateRoomPresence(io, roomId);
        }
    } catch (err) {
        console.error('AI turn error:', err.message);
        io.to(roomId).emit('error-msg', 'AI opponent encountered an error');
    }
}
