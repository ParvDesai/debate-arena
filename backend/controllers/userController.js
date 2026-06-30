const User = require('../models/User');
const Room = require('../models/Room');

exports.getProfile = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username })
            .select('username wins losses totalScore gamesPlayed createdAt');

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch recent finished debates the user participated in
        const recentDebates = await Room.find({
            $or: [{ debaterFor: user._id }, { debaterAgainst: user._id }],
            status: 'finished'
        })
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('debaterFor', 'username')
            .populate('debaterAgainst', 'username')
            .populate('winnerId', 'username')
            .select('topic debaterFor debaterAgainst winnerId isSoloMode updatedAt');

        const winRate = user.gamesPlayed > 0
            ? Math.round((user.wins / user.gamesPlayed) * 100)
            : 0;

        res.json({ user, recentDebates, winRate });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
