const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
    debaterFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    debaterAgainst: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    audienceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    currentTurn: { type: String, enum: ['for', 'against'], default: 'for' },
    turnNumber: { type: Number, default: 1 },
    maxTurns: { type: Number, default: 3 },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isSoloMode: { type: Boolean, default: false },
    soloSide: { type: String, enum: ['for', 'against'], default: 'for' },
    forVotes: { type: Number, default: 0 },
    againstVotes: { type: Number, default: 0 },
    timerEndsAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);