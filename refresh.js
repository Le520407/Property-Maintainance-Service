const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL_DAYS = parseInt((process.env.REFRESH_TOKEN_TTL || '30d').replace('d','')) || 30;

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString('hex');
}

async function issueRefreshToken(userId, meta = {}) {
  const raw = generateRefreshTokenValue();
  const tokenHash = await bcrypt.hash(raw, 12);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24*60*60*1000);
  await RefreshToken.create({ user: userId, tokenHash, expiresAt, ...meta });
  return raw;
}

async function rotateRefreshToken(userId, oldRawToken, meta = {}) {
  await revokeRefreshToken(oldRawToken);
  return issueRefreshToken(userId, meta);
}

async function revokeRefreshToken(raw) {
  const tokens = await RefreshToken.find().lean();
  for (const t of tokens) {
    const ok = await bcrypt.compare(raw, t.tokenHash);
    if (ok) {
      await RefreshToken.updateOne({ _id: t._id }, { $set: { revokedAt: new Date() } });
      return true;
    }
  }
  return false;
}

async function findTokenOwner(raw) {
  const tokens = await RefreshToken.find({ revokedAt: { $exists: false } }).lean();
  for (const t of tokens) {
    const ok = await bcrypt.compare(raw, t.tokenHash);
    if (ok && t.expiresAt > new Date()) return t.user;
  }
  return null;
}

module.exports = {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  findTokenOwner
};
