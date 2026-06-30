const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);