const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TwoFactorLogin = require('../models/TwoFactorLogin');
const { generateToken } = require('../utils/jwt');
const { sendTAC } = require('../utils/tacMailer');
const bcrypt = require('bcryptjs');

function makeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Step 1: request TAC
router.post('/auth/tac/request', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Check if user has TAC enabled
    if (!user.tacEnabled) {
      return res.status(400).json({ 
        message: 'TAC is not enabled for this account. Please enable it in your profile settings first.' 
      });
    }

    const code = makeCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await TwoFactorLogin.create({ user: user._id, email: user.email, code, expiresAt });

    try { await sendTAC(user.email, code); } catch (err) { console.error('Send mail failed:', err.message); }

    res.json({ message: 'TAC_SENT' });
  } catch (err) {
    console.error('TAC request error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Step 2: verify TAC
router.post('/auth/tac/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const record = await TwoFactorLogin.findOne({ email, code, used: false }).sort({ createdAt: -1 });
    if (!record) return res.status(401).json({ message: 'Invalid code' });
    if (record.expiresAt < new Date()) return res.status(401).json({ message: 'Code expired' });

    record.used = true;
    await record.save();

    const user = await User.findById(record.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = generateToken({ userId: user._id, email: user.email, role: user.role });
    res.json({ message: 'OK', token, user });
  } catch (err) {
    console.error('TAC verify error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
