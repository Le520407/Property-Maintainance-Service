const express = require('express');
const User = require('../models/User');
const { Referral } = require('../models/Referral');
const InviteCode = require('../models/InviteCode');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const ceaVerificationService = require('../services/ceaVerificationService');
const googleAuthService = require('../services/googleAuthService');

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

    // Gmail format validation for property agents
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Property agents must use a valid Gmail address (e.g., username@gmail.com)' 
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

    // Detect potential fraud indicators
    const fraudCheck = ceaVerificationService.detectFraudIndicators({
      firstName,
      lastName,
      email,
      ceaRegistrationNumber
    }, existingCEAUser);

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

    // Create referral agent user (pending approval)
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
      status: fraudCheck.riskLevel === 'HIGH' ? 'SUSPENDED' : 'PENDING', // Suspend high risk users
      agentCode,
      commissionRate: 15.0,
      isAgentActive: false, // Will be activated after CEA verification
      ceaRegistrationNumber: ceaRegistrationNumber.toUpperCase(),
      ceaVerificationStatus: 'PENDING_MANUAL_VERIFICATION',
      ceaFraudRiskLevel: fraudCheck.riskLevel,
      ceaFraudWarnings: fraudCheck.warnings,
      referralUserType: 'property_agent',
      rewardType: 'money',
      canExchangePointsForMoney: true
    });

    // Create CEA verification record for reference with fraud detection
    const verificationRecord = ceaVerificationService.createVerificationRecord({
      registrationNumber: ceaRegistrationNumber.toUpperCase(),
      agentName: `${firstName} ${lastName}`,
      email,
      phone
    });
    
    // Add fraud check results to verification
    verificationRecord.fraudCheck = fraudCheck;
    verificationRecord.securityNotes = fraudCheck.warnings.length > 0 
      ? `SECURITY ALERT: ${fraudCheck.warnings.join(', ')}` 
      : 'No security concerns detected';
    verificationRecord.verificationPriority = fraudCheck.riskLevel === 'HIGH' ? 'URGENT' : 'NORMAL';

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
      message: 'Agent registration submitted successfully. Please wait for admin approval of your CEA number.',
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
        commissionRate: user.commissionRate,
        ceaRegistrationNumber: user.ceaRegistrationNumber,
        ceaVerificationStatus: user.ceaVerificationStatus
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

    // Generate access token and refresh token
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id, email: user.email, role: user.role });
    
    // Save refresh token to user (optional, for single-device logout)
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
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
    // Clear refresh token from database
    const user = await User.findById(req.user.userId);
    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiresAt = null;
      await user.save();
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      refreshToken,
      refreshTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const newToken = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Optionally generate new refresh token for rotation
    const newRefreshToken = generateRefreshToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        tacEnabled: user.tacEnabled || false
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
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

// Google OAuth Routes

// Get Google OAuth URL
router.get('/google/url', (req, res) => {
  try {
    const authUrl = googleAuthService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Google OAuth URL generation error:', error);
    res.status(500).json({ message: 'Failed to generate Google OAuth URL' });
  }
});

// Handle Google OAuth callback
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Verify Google OAuth code and get user info
    const googleUser = await googleAuthService.verifyCallback(code);

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user with Google data
      user = new User({
        firstName: googleUser.firstName || googleUser.name.split(' ')[0],
        lastName: googleUser.lastName || googleUser.name.split(' ').slice(1).join(' ') || '',
        email: googleUser.email,
        googleId: googleUser.googleId,
        profilePicture: googleUser.picture,
        isEmailVerified: googleUser.emailVerified,
        role: 'customer',
        status: 'ACTIVE',
        // No password needed for Google OAuth users
        authProvider: 'google'
      });

      await user.save();
    } else {
      // Update existing user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        user.authProvider = user.authProvider || 'google';
        if (googleUser.picture && !user.profilePicture) {
          user.profilePicture = googleUser.picture;
        }
        await user.save();
      }
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });

    res.json({
      message: 'Google authentication successful',
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
        profilePicture: user.profilePicture,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// Handle Google ID Token (for direct frontend integration)
router.post('/google/verify', async (req, res) => {
  try {
    console.log('🔍 Google verify endpoint called');
    console.log('Request body:', req.body);
    
    const { idToken } = req.body;

    if (!idToken) {
      console.log('❌ No ID token provided');
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    console.log('🔑 Verifying Google ID token...');
    // Verify Google ID token
    const googleUser = await googleAuthService.verifyIdToken(idToken);

    console.log('👤 Checking if user exists:', googleUser.email);
    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      console.log('🆕 New Google user - needs to complete registration');
      // New user needs to complete registration
      // Return special response indicating registration completion needed
      res.json({
        requiresRegistration: true,
        message: 'Please complete your registration',
        googleData: {
          email: googleUser.email,
          firstName: googleUser.firstName || googleUser.name.split(' ')[0],
          lastName: googleUser.lastName || googleUser.name.split(' ').slice(1).join(' ') || '',
          fullName: googleUser.name,
          profilePicture: googleUser.picture,
          googleId: googleUser.googleId,
          isEmailVerified: googleUser.emailVerified
        }
      });
      return;
    } else {
      console.log('👤 Existing user found, updating Google info...');
      // Update existing user with Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        user.authProvider = user.authProvider || 'google';
        if (googleUser.picture && !user.profilePicture) {
          user.profilePicture = googleUser.picture;
        }
        await user.save();
        console.log('✅ User updated with Google info');
      }
    }

    // Generate JWT token for existing user
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });

    res.json({
      message: 'Google authentication successful',
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
        profilePicture: user.profilePicture,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    console.error('❌ Google ID token verification error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Complete Google user registration
router.post('/google/complete-registration', async (req, res) => {
  try {
    console.log('🆕 Completing Google user registration');
    const { 
      googleData, 
      phone, 
      address, 
      city, 
      state, 
      zipCode, 
      country 
    } = req.body;

    if (!googleData || !googleData.email || !googleData.googleId) {
      return res.status(400).json({ message: 'Google data is required' });
    }

    // Check if user already exists (shouldn't happen, but safety check)
    const existingUser = await User.findOne({ email: googleData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with Google data and additional info
    const user = new User({
      firstName: googleData.firstName,
      lastName: googleData.lastName,
      fullName: googleData.fullName,
      email: googleData.email,
      googleId: googleData.googleId,
      profilePicture: googleData.profilePicture,
      isEmailVerified: googleData.isEmailVerified,
      phone: phone || '',
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      country: country || 'Singapore',
      role: 'customer',
      status: 'ACTIVE',
      authProvider: 'google'
    });

    console.log('💾 Saving completed Google user registration...');
    await user.save();
    console.log('✅ Google user registration completed successfully');

    // Generate JWT token
    const token = generateToken({ userId: user._id, email: user.email, role: user.role });

    res.json({
      message: 'Registration completed successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider
      }
    });

  } catch (error) {
    console.error('❌ Google registration completion error:', error);
    res.status(500).json({ 
      message: 'Registration completion failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;