const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    side: { type: String, enum: ['for', 'against'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Vote', voteSchema);