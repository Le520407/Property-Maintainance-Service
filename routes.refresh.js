const express = require('express');
const cookieParser = require('cookie-parser');
const { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken, findTokenOwner } = require('../utils/refresh');
const User = require('../models/User');

const router = express.Router();
const COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'rt';

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: 1000 * 60 * 60 * 24 * 30
  });
}

// Optional: replace your existing login handler with this one to also issue refresh tokens
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = await issueRefreshToken(user.id, {
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ message: 'No refresh token' });
    const userId = await findTokenOwner(token);
    if (!userId) return res.status(401).json({ message: 'Invalid refresh token' });

    const user = await User.findById(userId);
    const accessToken = signAccessToken({ userId: user.id, role: user.role });

    // Rotation
    const newRefresh = await rotateRefreshToken(user.id, token, {
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
    setRefreshCookie(res, newRefresh);
    res.json({ accessToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Refresh failed' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) await revokeRefreshToken(token);
    res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
    res.json({ message: 'Logged out' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;
