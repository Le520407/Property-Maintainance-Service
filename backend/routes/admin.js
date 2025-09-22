const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Job = require('../models/Job');
const Rating = require('../models/Rating');
const { Referral, Commission, Payout, COMMISSION_RATES } = require('../models/Referral');
const InviteCode = require('../models/InviteCode');
const { authenticateToken: auth } = require('../middleware/auth');
const referralService = require('../services/referralService');

// Include CEA verification routes
const ceaVerificationRoutes = require('./ceaVerification');
router.use('/', ceaVerificationRoutes);

// Create user (Admin permission required)
router.post('/create-user', auth, async (req, res) => {
  try {
    // Check permissions
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      city,
      country,
      role = 'customer',
      skills = [],
      experience = 0,
      hourlyRate = 0,
      permissions = [],
      isSuper = false,
      status = 'ACTIVE'
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and password are required' 
      });
    }

    // Validate role
    if (!['customer', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be customer, vendor, or admin' 
      });
    }

    // Only super admin can create other super admins, but regular admin can create regular admins
    if (role === 'admin' && isSuper && !req.user.isSuper) {
      return res.status(403).json({ 
        message: 'Super admin privileges required to create super admin users' 
      });
    }
    
    // Only admin or above can create admin accounts
    if (role === 'admin' && !req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ 
        message: 'Admin privileges required to create admin users' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create user data object
    const userData = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      phone,
      city,
      country,
      role,
      status,
    };

    // Set role-specific fields
    if (role === 'vendor') {
      userData.skills = skills;
      userData.experience = experience;
      userData.hourlyRate = hourlyRate;
    }

    if (role === 'admin') {
      userData.permissions = permissions.filter(p => 
        ['manage_users', 'manage_content', 'manage_services', 'manage_payments', 'view_analytics', 'manage_system'].includes(p)
      );
      userData.isSuper = isSuper && req.user.isSuper; // Only super admin can create other super admins
    }

    const newUser = new User(userData);
    await newUser.save();

    // Return user info (excluding password)
    const userResponse = newUser.toJSON();
    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`,
      user: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin account (requires super admin privileges) - maintaining backward compatibility
router.post('/create-admin', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (!req.user.isSuper && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Super admin privileges required.' 
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      permissions = [],
      isSuper = false 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and password are required' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create admin user
    const adminUser = new User({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      phone,
      role: 'admin',
      permissions: permissions.filter(p => ['manage_users', 'manage_content', 'manage_services', 'manage_payments', 'view_analytics', 'manage_system'].includes(p)),
      isSuper: isSuper && req.user.isSuper, // Only super admin can create other super admins
      status: 'ACTIVE'
    });

    await adminUser.save();

    // Return user info (excluding password)
    const userResponse = adminUser.toJSON();
    res.status(201).json({
      message: 'Admin user created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (Admin permission required)
router.get('/users', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, role, status, search } = req.query;
    
    // Build query conditions
    const query = {};
    if (role && ['customer', 'vendor', 'admin'].includes(role)) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // For vendors, fetch accurate ratings
    const usersWithRatings = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      if (user.role === 'vendor') {
        try {
          // Get accurate rating statistics for vendor
          const ratingStats = await Rating.getVendorStats(user._id);
          userObj.accurateRating = {
            averageRating: ratingStats.averageRating || 0,
            totalRatings: ratingStats.totalRatings || 0,
            ratingDistribution: ratingStats.ratingDistribution || {}
          };
        } catch (error) {
          console.error(`Error fetching rating for vendor ${user._id}:`, error);
          userObj.accurateRating = {
            averageRating: 0,
            totalRatings: 0,
            ratingDistribution: {}
          };
        }
      }
      
      return userObj;
    }));

    res.json({
      users: usersWithRatings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status (Admin permission required)
router.patch('/users/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent non-super admins from modifying other admin statuses
    if (user.role === 'admin' && !req.user.isSuper) {
      return res.status(403).json({ message: 'Cannot modify admin user' });
    }

    user.status = status;
    await user.save();

    res.json({ message: 'User status updated successfully', user: user.toJSON() });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (Super admin permission required)
router.patch('/users/:id/role', auth, async (req, res) => {
  try {
    if (!req.user.isSuper) {
      return res.status(403).json({ message: 'Super admin privileges required' });
    }

    const { role } = req.body;
    if (!['customer', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    
    // If changing to admin, set default permissions
    if (role === 'admin') {
      user.permissions = ['manage_content', 'view_analytics'];
    } else {
      user.permissions = [];
      user.isSuper = false;
    }
    
    await user.save();

    res.json({ message: 'User role updated successfully', user: user.toJSON() });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user details (Admin permission required)
router.put('/users/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      password,
      phone, 
      city, 
      country,
      role,
      status,
      skills,
      experience,
      hourlyRate,
      permissions,
      isSuper
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent non-super admins from modifying admin users
    if (user.role === 'admin' && !req.user.isSuper) {
      return res.status(403).json({ message: 'Cannot modify admin user' });
    }

    // Prevent modifying own account through this endpoint (except super admin)
    if (user._id.toString() === req.user.userId && !req.user.isSuper) {
      return res.status(400).json({ message: 'Cannot modify your own account through this endpoint' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update basic fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (firstName || lastName) {
      user.fullName = `${firstName || user.firstName} ${lastName || user.lastName}`;
    }
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (city) user.city = city;
    if (country) user.country = country;

    // Update password only if provided (for security)
    if (password && password.trim() !== '') {
      user.password = password;
    }

    // Role-specific updates
    if (role && ['customer', 'vendor', 'admin'].includes(role)) {
      const oldRole = user.role;
      user.role = role;

      // Handle role change
      if (oldRole !== role) {
        if (role === 'admin') {
          // When changing to admin, set default permissions
          user.permissions = permissions || ['manage_content', 'view_analytics'];
          user.isSuper = isSuper && req.user.isSuper; // Only super admin can create other super admins
        } else {
          // When changing from admin to other roles, clear admin-specific fields
          user.permissions = [];
          user.isSuper = false;
        }

        // Clear vendor-specific fields when changing from vendor
        if (oldRole === 'vendor' && role !== 'vendor') {
          user.skills = [];
          user.experience = 0;
          user.hourlyRate = 0;
        }
      }
    }

    // Vendor-specific fields
    if (user.role === 'vendor' || role === 'vendor') {
      if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : [];
      if (experience !== undefined) user.experience = experience;
      if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
    }

    // Admin-specific fields (only super admin can modify these)
    if ((user.role === 'admin' || role === 'admin') && req.user.isSuper) {
      if (permissions !== undefined) {
        user.permissions = permissions.filter(p => 
          ['manage_users', 'manage_content', 'manage_services', 'manage_payments', 'view_analytics', 'manage_system'].includes(p)
        );
      }
      if (isSuper !== undefined) user.isSuper = isSuper;
    }

    // Status update
    if (status && ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'].includes(status)) {
      user.status = status;
    }

    await user.save();

    // Return user info (excluding password)
    const userResponse = user.toJSON();
    res.json({
      message: 'User updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get system statistics (Admin permission required)
router.get('/stats', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments({ status: 'PENDING' })
    ]);

    res.json({
      totalCustomers: stats[0],
      totalVendors: stats[1],
      totalAdmins: stats[2],
      activeUsers: stats[3],
      pendingUsers: stats[4],
      totalUsers: stats[0] + stats[1] + stats[2]
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Super admin permission required)
router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (!req.user.isSuper) {
      return res.status(403).json({ message: 'Super admin privileges required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ REFERRAL MANAGEMENT ROUTES ============

// Get referral system overview
router.get('/referrals/overview', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [
      totalReferrals,
      activeReferrals,
      totalCommissions,
      pendingCommissions,
      totalPayouts,
      pendingPayouts
    ] = await Promise.all([
      Referral.countDocuments(),
      Referral.countDocuments({ isActive: true }),
      Commission.countDocuments(),
      Commission.countDocuments({ status: 'PENDING' }),
      Payout.countDocuments(),
      Payout.countDocuments({ status: 'PENDING' })
    ]);

    // Get commission amounts
    const commissionStats = await Commission.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$commissionAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const tierDistribution = await Referral.aggregate([
      {
        $group: {
          _id: '$referralTier',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$totalCommissionEarned' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overview: {
        totalReferrals,
        activeReferrals,
        totalCommissions,
        pendingCommissions,
        totalPayouts,
        pendingPayouts
      },
      commissionStats,
      tierDistribution,
      commissionRates: COMMISSION_RATES
    });

  } catch (error) {
    console.error('Get referral overview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all referrals with pagination
router.get('/referrals', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, tier, status, search } = req.query;
    
    const query = {};
    if (tier) query.referralTier = parseInt(tier);
    if (status) query.isActive = status === 'active';
    
    let referrals = await Referral.find(query)
      .populate('referrer', 'firstName lastName email role')
      .sort({ totalCommissionEarned: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by search if provided
    if (search) {
      referrals = referrals.filter(ref => 
        ref.referrer.firstName.toLowerCase().includes(search.toLowerCase()) ||
        ref.referrer.lastName.toLowerCase().includes(search.toLowerCase()) ||
        ref.referrer.email.toLowerCase().includes(search.toLowerCase()) ||
        ref.referralCode.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Referral.countDocuments(query);

    res.json({
      referrals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get referral details
router.get('/referrals/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const referral = await Referral.findById(req.params.id)
      .populate('referrer', 'firstName lastName email role createdAt')
      .populate('referredUsers.user', 'firstName lastName email createdAt totalSpent');

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Get commissions for this referral
    const commissions = await Commission.find({ referral: referral._id })
      .populate('referredUser', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      referral,
      commissions,
      statistics: {
        totalCommissions: commissions.length,
        totalEarned: commissions.reduce((sum, c) => sum + c.commissionAmount, 0),
        pendingAmount: commissions
          .filter(c => c.status === 'PENDING')
          .reduce((sum, c) => sum + c.commissionAmount, 0)
      }
    });

  } catch (error) {
    console.error('Get referral details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all commissions with filtering
router.get('/commissions', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_payments')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status, tier, startDate, endDate } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (tier) query.tier = parseInt(tier);
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const commissions = await Commission.find(query)
      .populate('referrer', 'firstName lastName email')
      .populate('referredUser', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Commission.countDocuments(query);

    res.json({
      commissions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update commission status
router.patch('/commissions/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_payments')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, notes } = req.body;
    
    if (!['PENDING', 'APPROVED', 'PAID', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ message: 'Commission not found' });
    }

    const oldStatus = commission.status;
    commission.status = status;
    commission.notes = notes || commission.notes;

    if (status === 'APPROVED' && oldStatus !== 'APPROVED') {
      commission.approvedAt = new Date();
    } else if (status === 'PAID' && oldStatus !== 'PAID') {
      commission.paidAt = new Date();
      
      // Update referral totals
      const referral = await Referral.findById(commission.referral);
      if (referral) {
        referral.totalCommissionPaid += commission.commissionAmount;
        referral.pendingCommission -= commission.commissionAmount;
        await referral.save();
      }
    }

    await commission.save();

    res.json({
      message: 'Commission status updated successfully',
      commission
    });

  } catch (error) {
    console.error('Update commission status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payout requests
router.get('/payouts', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_payments')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const payouts = await Payout.find(query)
      .populate('referrer', 'firstName lastName email')
      .populate('commissions')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payout.countDocuments(query);

    res.json({
      payouts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payout status
router.patch('/payouts/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_payments')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, transactionId, failureReason, notes } = req.body;
    
    if (!['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    const oldStatus = payout.status;
    payout.status = status;
    payout.transactionId = transactionId || payout.transactionId;
    payout.failureReason = failureReason || payout.failureReason;
    payout.notes = notes || payout.notes;

    if (status === 'PROCESSING' && oldStatus === 'PENDING') {
      payout.processedAt = new Date();
    } else if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      payout.completedAt = new Date();
      
      // Update commission status to PAID
      await Commission.updateMany(
        { _id: { $in: payout.commissions } },
        { 
          status: 'PAID',
          paidAt: new Date()
        }
      );
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      // Revert commission status to APPROVED
      await Commission.updateMany(
        { _id: { $in: payout.commissions } },
        { status: 'APPROVED' }
      );
    }

    await payout.save();

    res.json({
      message: 'Payout status updated successfully',
      payout
    });

  } catch (error) {
    console.error('Update payout status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update referral tier manually
router.patch('/referrals/:id/tier', auth, async (req, res) => {
  try {
    if (!req.user.isSuper) {
      return res.status(403).json({ message: 'Super admin privileges required' });
    }

    const { tier } = req.body;
    
    if (!tier || ![1, 2, 3].includes(parseInt(tier))) {
      return res.status(400).json({ message: 'Invalid tier. Must be 1, 2, or 3' });
    }

    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    referral.referralTier = parseInt(tier);
    await referral.save();

    res.json({
      message: 'Referral tier updated successfully',
      referral
    });

  } catch (error) {
    console.error('Update referral tier error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Deactivate/Activate referral
router.patch('/referrals/:id/toggle-status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    referral.isActive = !referral.isActive;
    await referral.save();

    res.json({
      message: `Referral ${referral.isActive ? 'activated' : 'deactivated'} successfully`,
      referral
    });

  } catch (error) {
    console.error('Toggle referral status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ VENDOR VERIFICATION ROUTES ============

// Get pending vendors for verification
router.get('/vendors/pending', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10 } = req.query;

    const pendingVendors = await Vendor.find({
      verificationStatus: 'PENDING'
    })
    .populate('userId', 'firstName lastName email phone city createdAt status')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Vendor.countDocuments({ verificationStatus: 'PENDING' });

    res.json({
      vendors: pendingVendors,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });

  } catch (error) {
    console.error('Get pending vendors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all vendors with filtering
router.get('/vendors', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      page = 1, 
      limit = 10, 
      verificationStatus, 
      serviceCategory, 
      city, 
      search 
    } = req.query;

    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (serviceCategory) query.serviceCategories = serviceCategory;
    if (city) query.serviceArea = new RegExp(city, 'i');

    let vendors = await Vendor.find(query)
      .populate('userId', 'firstName lastName email phone city status createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out vendors without valid userId (to prevent null reference errors)
    vendors = vendors.filter(vendor => vendor.userId);

    // Apply search filter if provided
    if (search) {
      vendors = vendors.filter(vendor => 
        vendor.userId?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        vendor.userId?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        vendor.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        vendor.companyName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Vendor.countDocuments(query);

    res.json({
      vendors,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });

  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get vendor details for verification
router.get('/vendors/:vendorId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vendor = await Vendor.findById(req.params.vendorId)
      .populate('userId', 'firstName lastName email phone city country createdAt status')
      .populate('verifiedBy', 'firstName lastName email');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Get vendor statistics
    const [jobStats, ratingStats] = await Promise.all([
      Job.aggregate([
        { $match: { vendorId: vendor.userId._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]),
      Rating.getVendorStats(vendor.userId._id)
    ]);

    res.json({
      vendor,
      statistics: {
        jobs: jobStats.reduce((acc, stat) => {
          acc[stat._id.toLowerCase()] = {
            count: stat.count,
            amount: stat.totalAmount || 0
          };
          return acc;
        }, {}),
        ratings: ratingStats
      }
    });

  } catch (error) {
    console.error('Get vendor details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify/Reject vendor
router.patch('/vendors/:vendorId/verify', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, notes } = req.body; // status: 'VERIFIED' or 'REJECTED'

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Update vendor verification status
    vendor.verificationStatus = status;
    vendor.verificationNotes = notes;
    vendor.verifiedBy = req.user._id;
    vendor.verifiedAt = new Date();

    await vendor.save();

    // Update user status based on verification
    const userStatus = status === 'VERIFIED' ? 'ACTIVE' : 'SUSPENDED';
    await User.findByIdAndUpdate(vendor.userId, { status: userStatus });

    res.json({
      message: `Vendor ${status.toLowerCase()} successfully`,
      vendor
    });

  } catch (error) {
    console.error('Verify vendor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get vendor verification statistics
router.get('/vendors/stats/verification', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Promise.all([
      Vendor.countDocuments({ verificationStatus: 'PENDING' }),
      Vendor.countDocuments({ verificationStatus: 'VERIFIED' }),
      Vendor.countDocuments({ verificationStatus: 'REJECTED' }),
      Vendor.countDocuments({ isActive: true, verificationStatus: 'VERIFIED' })
    ]);

    // Get verification trends by month
    const monthlyTrends = await Vendor.aggregate([
      {
        $match: {
          verifiedAt: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$verifiedAt' },
            year: { $year: '$verifiedAt' },
            status: '$verificationStatus'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    // Get category distribution
    const categoryStats = await Vendor.aggregate([
      {
        $match: { verificationStatus: 'VERIFIED' }
      },
      {
        $unwind: '$serviceCategories'
      },
      {
        $group: {
          _id: '$serviceCategories',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      totals: {
        pending: stats[0],
        verified: stats[1],
        rejected: stats[2],
        active: stats[3]
      },
      monthlyTrends,
      categoryStats
    });

  } catch (error) {
    console.error('Get vendor verification stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Suspend/Unsuspend vendor
router.patch('/vendors/:vendorId/suspend', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { suspend, reason } = req.body; // suspend: boolean

    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Update vendor status
    vendor.isActive = !suspend;
    if (suspend && reason) {
      vendor.verificationNotes = `Suspended: ${reason}`;
    }

    await vendor.save();

    // Update user status
    const userStatus = suspend ? 'SUSPENDED' : 'ACTIVE';
    await User.findByIdAndUpdate(vendor.userId, { status: userStatus });

    res.json({
      message: `Vendor ${suspend ? 'suspended' : 'unsuspended'} successfully`,
      vendor
    });

  } catch (error) {
    console.error('Suspend vendor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get vendor jobs for admin review
router.get('/vendors/:vendorId/jobs', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status } = req.query;

    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const query = { vendorId: vendor.userId };
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('customerId', 'firstName lastName phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });

  } catch (error) {
    console.error('Get vendor jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get vendor ratings for admin review
router.get('/vendors/:vendorId/ratings', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10 } = req.query;

    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const ratings = await Rating.find({ vendorId: vendor.userId })
      .populate('customerId', 'firstName lastName')
      .populate('jobId', 'title jobNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments({ vendorId: vendor.userId });

    res.json({
      ratings,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });

  } catch (error) {
    console.error('Get vendor ratings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== REFERRAL AGENT MANAGEMENT ====================

// Get all referral agents
router.get('/agents', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      page = 1, 
      limit = 20, 
      tier, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { role: 'referral' };
    
    // tier filter removed - no tier system for agents
    if (status === 'active') filter.isAgentActive = true;
    if (status === 'inactive') filter.isAgentActive = false;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { agentCode: { $regex: search, $options: 'i' } }
      ];
    }

    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortDirection };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [agents, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    // Get referral stats for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const referral = await Referral.findOne({ referrer: agent._id });
        return {
          ...agent.toObject(),
          referralStats: referral ? {
            totalReferrals: referral.totalReferrals,
            activeReferrals: referral.activeReferrals,
            referralCode: referral.referralCode
          } : {
            totalReferrals: 0,
            activeReferrals: 0,
            referralCode: null
          }
        };
      })
    );

    res.json({
      success: true,
      data: agentsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasMore: skip + agents.length < totalCount
      }
    });

  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get agent details
router.get('/agents/:agentId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const agent = await User.findById(req.params.agentId).select('-password');
    if (!agent || agent.role !== 'referral') {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Get referral stats
    const referralStats = await referralService.getUserReferralStats(agent._id);

    // Get commission history
    const commissions = await Commission.find({ referrer: agent._id })
      .populate('referredUser', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        agent: agent.toObject(),
        referralStats,
        recentCommissions: commissions
      }
    });

  } catch (error) {
    console.error('Get agent details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get agent verification tools and security analysis
router.get('/agents/:agentId/verification-tools', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const agent = await User.findById(req.params.agentId).select('-password');
    if (!agent || agent.role !== 'referral') {
      return res.status(404).json({ message: 'Agent not found' });
    }

    // Simple security analysis
    const warnings = [];
    let riskLevel = 'LOW';

    // Check email domain
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(agent.email)) {
      warnings.push('Non-Gmail email address');
      riskLevel = 'HIGH';
    }

    // Check CEA verification status
    if (!agent.ceaRegistrationNumber) {
      warnings.push('No CEA registration number');
      riskLevel = 'HIGH';
    }

    if (agent.ceaVerificationStatus !== 'VERIFIED') {
      warnings.push('CEA verification pending');
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    }

    // Simple verification data
    const verificationData = {
      agent: {
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        ceaNumber: agent.ceaRegistrationNumber,
        riskLevel,
        warnings,
        verificationStatus: agent.ceaVerificationStatus
      },
      quickActions: {
        ceaSearch: {
          url: `https://eservices.cea.gov.sg/aceas/public-register/`,
          description: 'Verify CEA Registration'
        },
        googleSearch: {
          url: `https://www.google.com/search?q="${agent.firstName} ${agent.lastName}" property agent singapore`,
          description: 'Search Agent Information'
        }
      },
      verificationTools: {
        verificationSteps: [
          {
            step: 1,
            title: 'Check CEA Registration',
            description: 'Verify the agent\'s CEA number is valid and active',
            action: 'Search CEA public register',
            checkpoints: [
              'CEA number exists and is active',
              'Name matches registration'
            ]
          },
          {
            step: 2,
            title: 'Verify Email Domain',
            description: 'Ensure agent uses Gmail for security',
            action: 'Check email domain',
            checkpoints: [
              'Email uses @gmail.com domain'
            ]
          },
          {
            step: 3,
            title: 'Final Approval',
            description: 'Complete verification process',
            action: 'Approve or reject agent',
            checkpoints: [
              'All checks completed',
              'Ready for decision'
            ]
          }
        ],
        recommendations: []
      }
    };

    // Add simple recommendations
    if (!gmailRegex.test(agent.email)) {
      verificationData.verificationTools.recommendations.push({
        priority: 'HIGH',
        action: 'Require Gmail Address',
        description: 'Agent must use Gmail before verification'
      });
    }

    if (!agent.ceaRegistrationNumber) {
      verificationData.verificationTools.recommendations.push({
        priority: 'HIGH',
        action: 'CEA Number Required',
        description: 'Agent must provide valid CEA number'
      });
    }

    res.json(verificationData);

  } catch (error) {
    console.error('Get verification tools error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update agent status
router.patch('/agents/:agentId/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { isAgentActive } = req.body;
    
    const agent = await User.findById(req.params.agentId);
    if (!agent || agent.role !== 'referral') {
      return res.status(404).json({ message: 'Agent not found' });
    }

    agent.isAgentActive = isAgentActive;
    await agent.save();

    res.json({
      success: true,
      message: `Agent ${isAgentActive ? 'activated' : 'deactivated'} successfully`,
      data: { isAgentActive }
    });

  } catch (error) {
    console.error('Update agent status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update agent commission rate
router.patch('/agents/:agentId/commission', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('manage_users')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { commissionRate } = req.body;
    
    if (commissionRate < 0 || commissionRate > 50) {
      return res.status(400).json({ message: 'Commission rate must be between 0 and 50%' });
    }

    const agent = await User.findById(req.params.agentId);
    if (!agent || agent.role !== 'referral') {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const oldRate = agent.commissionRate;
    agent.commissionRate = commissionRate;
    await agent.save();

    res.json({
      success: true,
      message: 'Commission rate updated successfully',
      data: {
        oldRate,
        newRate: commissionRate
      }
    });

  } catch (error) {
    console.error('Update commission rate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Manual tier upgrade - REMOVED (no tier system for agents)

// Get agent analytics overview
router.get('/agents/analytics/overview', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin() && !req.user.hasPermission('view_analytics')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalAgents = await User.countDocuments({ role: 'referral' });
    const activeAgents = await User.countDocuments({ role: 'referral', isAgentActive: true });

    // tierBreakdown removed - no tier system for agents

    const topPerformers = await User.find({ role: 'referral' })
      .select('firstName lastName email agentCode totalCommissionEarned')
      .sort({ totalCommissionEarned: -1 })
      .limit(10);

    const totalCommissionsPaid = await User.aggregate([
      { $match: { role: 'referral' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalCommissionPaid' },
          pending: { $sum: '$pendingCommission' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalAgents,
          activeAgents,
          inactiveAgents: totalAgents - activeAgents
        },
        topPerformers,
        commissions: totalCommissionsPaid[0] || { total: 0, pending: 0 }
      }
    });

  } catch (error) {
    console.error('Get agent analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;