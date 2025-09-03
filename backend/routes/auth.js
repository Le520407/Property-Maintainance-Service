const express = require('express');
const User = require('../models/User');
const { Referral } = require('../models/Referral');
const InviteCode = require('../models/InviteCode');
const { generateToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      city, 
      country, 
      role = 'CUSTOMER',
      referralCode
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and password are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate referral code if provided (only for non-vendor users)
    let referralData = null;
    if (referralCode && role.toLowerCase() !== 'vendor') {
      const referral = await Referral.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referral) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      referralData = referral;
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      phone,
      city,
      country,
      role: role.toLowerCase(),
      referredBy: referralData ? referralData.referrer : null,
      referralCode: (referralCode && role.toLowerCase() !== 'vendor') ? referralCode.toUpperCase() : null
    });

    // Apply referral if valid
    if (referralData) {
      try {
        // Add user to referral
        referralData.referredUsers.push({
          user: user._id,
          tier: 1,
          status: 'ACTIVE'
        });
        
        referralData.totalReferrals += 1;
        referralData.activeReferrals += 1;
        
        // Update tier if needed
        await referralData.updateTier();
        await referralData.save();
      } catch (referralError) {
        console.error('Error applying referral:', referralError);
        // Don't fail registration if referral application fails
      }
    }

    // Generate token
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        role: user.role,
        status: user.status,
        referredBy: user.referredBy
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register referral agent with invite code
router.post('/register-agent', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone,
      address,
      city, 
      country,
      inviteCode
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !inviteCode) {
      return res.status(400).json({ 
        message: 'First name, last name, email, password, and invite code are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate invite code
    const inviteCodeDoc = await InviteCode.findOne({ 
      code: inviteCode.toUpperCase().trim(),
      userType: 'referral'
    });

    if (!inviteCodeDoc) {
      return res.status(400).json({ message: 'Invalid invite code for agent registration' });
    }

    const validation = inviteCodeDoc.isValid();
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    // Generate unique agent code
    let agentCode;
    let isUniqueAgentCode = false;
    let attempts = 0;
    
    while (!isUniqueAgentCode && attempts < 10) {
      agentCode = `AGT-${firstName.substring(0, 2).toUpperCase()}${lastName.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const existing = await User.findOne({ agentCode });
      if (!existing) {
        isUniqueAgentCode = true;
      }
      attempts++;
    }

    if (!isUniqueAgentCode) {
      return res.status(500).json({ message: 'Failed to generate unique agent code' });
    }

    // Create referral agent user
    const user = await User.create({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      phone,
      address,
      city,
      country,
      role: 'referral',
      status: 'ACTIVE',
      agentCode,
      inviteCode: inviteCode.toUpperCase(),
      commissionRate: 15.0,
      agentTier: 'BRONZE',
      isAgentActive: true
    });

    // Use the invite code
    await inviteCodeDoc.useCode(user._id, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Create referral record for the new agent
    const newReferral = new Referral({
      referralCode: `${firstName.substring(0, 2).toUpperCase()}${lastName.substring(0, 2).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      referrer: user._id,
      referralTier: 1,
      isActive: true
    });
    await newReferral.save();

    // Update user with referral code
    user.referralCode = newReferral.referralCode;
    await user.save();

    // Generate token
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });

    res.status(201).json({
      message: 'Referral agent registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        role: user.role,
        status: user.status,
        agentCode: user.agentCode,
        referralCode: user.referralCode,
        agentTier: user.agentTier,
        commissionRate: user.commissionRate
      }
    });

  } catch (error) {
    console.error('Agent registration error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Register technician (simplified version - full registration should use /vendor/register)
router.post('/register-technician', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      city, 
      country,
      skills = [],
      experience = 0,
      hourlyRate = 0
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and password are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create technician
    const user = await User.create({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      phone,
      city,
      country,
      role: 'vendor',
      status: 'PENDING', // Technicians need approval
      skills,
      experience,
      hourlyRate
    });

    // Generate token
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });

    res.status(201).json({
      message: 'Technician registered successfully. Account pending approval.',
      token,
      user
    });

  } catch (error) {
    console.error('Technician registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ 
        message: user.status === 'PENDING' ? 'Account pending approval' : 'Account is suspended' 
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });

    // Remove password from response
    user.password = undefined;

    res.json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement a token blacklist here if needed
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;