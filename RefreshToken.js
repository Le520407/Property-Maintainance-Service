const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, index: true },
  userAgent: { type: String },
  ip: { type: String },
  revokedAt: { type: Date },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
