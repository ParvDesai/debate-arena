const mongoose = require('mongoose');

const argumentSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    side: { type: String, enum: ['for', 'against'], required: true },
    text: { type: String, required: true },
    turnNumber: { type: Number, required: true },
    aiScore: {
        coherence: { type: Number, default: 0 },
        evidence: { type: Number, default: 0 },
        logic: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    aiFeedback: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Argument', argumentSchema);