const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
    try {
        const users = await User.find()
            .select('username wins losses totalScore gamesPlayed')
            .sort({ wins: -1, totalScore: -1 })
            .limit(20);
        res.json({ leaderboard: users });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
