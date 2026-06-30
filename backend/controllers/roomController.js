const Room = require('../models/Room');
const Argument = require('../models/Argument');
const User = require('../models/User');

exports.createRoom = async (req, res) => {
    try {
        const { topic, maxTurns, isSoloMode, soloSide } = req.body;
        if (!topic) return res.status(400).json({ message: 'Topic is required' });

        const roomData = {
            topic,
            debaterFor: req.userId,
            isSoloMode: isSoloMode || false
        };

        // Only set maxTurns if explicitly provided
        if (maxTurns) {
            roomData.maxTurns = maxTurns;
        }

        if (isSoloMode) {
            roomData.soloSide = soloSide || 'for';
            roomData.status = 'active';
            // In solo mode, set the user on the correct side
            if (soloSide === 'against') {
                roomData.debaterFor = null;
                roomData.debaterAgainst = req.userId;
            }
        }

        const room = await Room.create(roomData);
        res.status(201).json({ message: 'Room created', room });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.joinRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (room.status !== 'waiting') return res.status(400).json({ message: 'Room is not open for joining' });

        const userId = req.userId.toString();
        const isDebaterFor = room.debaterFor?.toString() === userId;
        const isDebaterAgainst = room.debaterAgainst?.toString() === userId;
        const isAudience = room.audienceIds.map(id => id.toString()).includes(userId);

        if (isDebaterFor || isDebaterAgainst || isAudience) {
            return res.status(400).json({ message: 'Already in this room' });
        }

        if (!room.debaterAgainst) {
            room.debaterAgainst = req.userId;
            if (room.debaterFor) room.status = 'active';
        } else {
            room.audienceIds.push(req.userId);
        }

        await room.save();
        res.json({ message: 'Joined room', room });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('debaterFor', 'username')
            .populate('debaterAgainst', 'username')
            .populate('winnerId', 'username')
            .populate('audienceIds', 'username');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json({ room });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ isSoloMode: { $ne: true }, status: { $in: ['waiting', 'active'] } })
            .populate('debaterFor', 'username')
            .populate('debaterAgainst', 'username')
            .sort({ createdAt: -1 });
        res.json({ rooms });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getReplay = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('debaterFor', 'username')
            .populate('debaterAgainst', 'username')
            .populate('winnerId', 'username');
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const arguments_ = await Argument.find({ roomId: req.params.id })
            .populate('userId', 'username')
            .sort({ turnNumber: 1, createdAt: 1 });

        // Build text transcript
        let transcript = `=== DEBATE ARENA TRANSCRIPT ===\n`;
        transcript += `Topic: ${room.topic}\n`;
        transcript += `FOR: ${room.debaterFor?.username || 'AI'} | AGAINST: ${room.debaterAgainst?.username || 'AI'}\n`;
        transcript += `Status: ${room.status}\n`;
        transcript += `${'='.repeat(40)}\n\n`;

        arguments_.forEach(arg => {
            transcript += `--- Turn ${arg.turnNumber} (${arg.side.toUpperCase()}) - ${arg.userId?.username || 'AI'} ---\n`;
            transcript += `${arg.text}\n`;
            transcript += `Score: Coherence ${arg.aiScore.coherence}/10 | Evidence ${arg.aiScore.evidence}/10 | Logic ${arg.aiScore.logic}/10 | Total: ${arg.aiScore.total}/30\n`;
            transcript += `Feedback: ${arg.aiFeedback}\n\n`;
        });

        if (room.winnerId) {
            transcript += `\n${'='.repeat(40)}\nWINNER: ${room.winnerId.username}\n`;
        } else if (room.status === 'finished') {
            transcript += `\n${'='.repeat(40)}\nRESULT: TIE\n`;
        }

        res.json({ room, arguments: arguments_, transcript });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};