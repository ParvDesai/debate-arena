const Argument = require('../models/Argument');
const Room = require('../models/Room');
const { scoreArgument } = require('../services/geminiService');

exports.submitArgument = async (req, res) => {
    try {
        const { roomId, text } = req.body;
        const room = await Room.findById(roomId);

        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (room.status !== 'active') return res.status(400).json({ message: 'Debate is not active' });

        const userId = req.userId.toString();
        const isFor = room.debaterFor?.toString() === userId;
        const isAgainst = room.debaterAgainst?.toString() === userId;

        if (!isFor && !isAgainst) {
            return res.status(403).json({ message: 'You are not a debater in this room' });
        }

        const side = isFor ? 'for' : 'against';
        if (room.currentTurn !== side) {
            return res.status(400).json({ message: 'It is not your turn' });
        }

        // Get prior arguments for context
        const priorArgs = await Argument.find({ roomId }).sort({ turnNumber: 1 }).lean();

        // Score with Gemini
        const aiScore = await scoreArgument(room.topic, side, text, priorArgs);

        const argument = await Argument.create({
            roomId,
            userId: req.userId,
            side,
            text,
            turnNumber: room.turnNumber,
            aiScore,
            aiFeedback: aiScore.feedback
        });

        // Advance turn
        const nextTurn = room.currentTurn === 'for' ? 'against' : 'for';
        const newTurnNumber = room.currentTurn === 'against' ? room.turnNumber + 1 : room.turnNumber;

        if (newTurnNumber > room.maxTurns) {
            room.status = 'finished';

            // Calculate winner
            const allArgs = await Argument.find({ roomId }).lean();
            const forTotal = allArgs.filter(a => a.side === 'for').reduce((sum, a) => sum + a.aiScore.total, 0);
            const againstTotal = allArgs.filter(a => a.side === 'against').reduce((sum, a) => sum + a.aiScore.total, 0);

            if (forTotal > againstTotal) {
                room.winnerId = room.debaterFor;
            } else if (againstTotal > forTotal) {
                room.winnerId = room.debaterAgainst;
            }
            // If tied, winnerId stays null
        } else {
            room.currentTurn = nextTurn;
            room.turnNumber = newTurnNumber;
        }

        room.timerEndsAt = null;
        await room.save();

        res.status(201).json({ argument, room });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getArguments = async (req, res) => {
    try {
        const arguments_ = await Argument.find({ roomId: req.params.roomId })
            .populate('userId', 'username')
            .sort({ turnNumber: 1, createdAt: 1 });
        res.json({ arguments: arguments_ });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
