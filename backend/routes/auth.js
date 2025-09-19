const express = require('express');
const User = require('../models/User');
const { Referral } = require('../models/Referral');
const { generateToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const ceaVerificationService = require('../services/ceaVerificationService');

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
        
        // **FIXED: Properly track signup conversion for dashboard earnings**
        const referralService = require('../services/referralService');
        await referralService.trackSignupConversion(referralCode.toUpperCase(), user._id);
        
        // **LEGACY: Build referral chain for points/rewards system**
        const referralRewardService = require('../services/referralRewardService');
        await referralRewardService.buildReferralChain(user, referralCode.toUpperCase());
        
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

// Register referral agent with CEA registration
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
      ceaRegistrationNumber
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and password are required' 
      });
    }

    // CEA Registration validation for property agents
    if (!ceaRegistrationNumber) {
      return res.status(400).json({ 
        message: 'CEA registration number is required for property agents' 
      });
    }

    // Validate CEA registration format
    const ceaValidation = ceaVerificationService.validateRegistrationFormat(ceaRegistrationNumber);
    if (!ceaValidation.isValid) {
      return res.status(400).json({ 
        message: ceaValidation.error
      });
    }

    // Check if CEA registration number already exists
    const existingCEAUser = await User.findOne({ 
      ceaRegistrationNumber: ceaRegistrationNumber.toUpperCase() 
    });
    if (existingCEAUser) {
      return res.status(400).json({ 
        message: 'This CEA registration number is already registered' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
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
      city: city || 'Singapore',
      country: country || 'Singapore',
      role: 'referral',
      status: 'PENDING', // Set to pending until CEA verification
      agentCode,
      commissionRate: 15.0,
      isAgentActive: false, // Will be activated after CEA verification
      ceaRegistrationNumber: ceaRegistrationNumber.toUpperCase(),
      ceaVerificationStatus: 'PENDING_MANUAL_VERIFICATION',
      referralUserType: 'property_agent',
      rewardType: 'money'
    });

    // Create CEA verification record for reference
    ceaVerificationService.createVerificationRecord({
      registrationNumber: ceaRegistrationNumber.toUpperCase(),
      agentName: `${firstName} ${lastName}`,
      email,
      phone
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

    // Check if user has TAC enabled - if so, require TAC login
    if (user.tacEnabled) {
      return res.status(403).json({ 
        message: 'Two-Factor Authentication is required for this account. Please use the TAC login option.',
        requiresTAC: true,
        email: user.email
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
      user,
      tacAvailable: user.tacEnabled || false // Include TAC availability
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

// Update TAC preference
router.put('/tac-preference', authenticateToken, async (req, res) => {
  try {
    const { tacEnabled } = req.body;
    
    if (typeof tacEnabled !== 'boolean') {
      return res.status(400).json({ message: 'tacEnabled must be a boolean value' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.tacEnabled = tacEnabled;
    await user.save();

    res.json({ 
      message: `TAC ${tacEnabled ? 'enabled' : 'disabled'} successfully`,
      tacEnabled: user.tacEnabled
    });

  } catch (error) {
    console.error('Update TAC preference error:', error);
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

// Validate CEA registration number format
router.post('/validate-cea', async (req, res) => {
  try {
    const { ceaRegistrationNumber } = req.body;
    
    if (!ceaRegistrationNumber) {
      return res.status(400).json({ 
        valid: false,
        message: 'CEA registration number is required' 
      });
    }

    // Validate CEA registration format
    const ceaValidation = ceaVerificationService.validateRegistrationFormat(ceaRegistrationNumber);
    if (!ceaValidation.isValid) {
      return res.status(400).json({ 
        valid: false,
        message: ceaValidation.error
      });
    }

    // Check if CEA number is already registered
    const existingUser = await User.findOne({ 
      ceaRegistrationNumber: ceaRegistrationNumber.toUpperCase() 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        valid: false,
        message: 'This CEA registration number is already registered' 
      });
    }

    res.json({ 
      valid: true,
      message: 'CEA registration number is valid and available' 
    });
  } catch (error) {
    console.error('CEA validation error:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Internal server error during validation' 
    });
  }
});

module.exports = router;