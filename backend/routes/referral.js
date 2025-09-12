const express = require('express');
const router = express.Router();
const { Referral, Commission, Payout, COMMISSION_RATES } = require('../models/Referral');
const { ReferralClick, ReferralLink, FraudDetection, ReferralAnalytics } = require('../models/ReferralTracking');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');
const referralService = require('../services/referralService');

// Generate or get user's referral code
router.post('/generate-code', auth, async (req, res) => {
  try {
    let referral = await Referral.findOne({ referrer: req.user._id });
    
    if (!referral) {
      // Generate unique referral code
      let referralCode;
      let isUnique = false;
      
      while (!isUnique) {
        referralCode = Referral.generateReferralCode();
        const existing = await Referral.findOne({ referralCode });
        if (!existing) isUnique = true;
      }
      
      referral = new Referral({
        referralCode,
        referrer: req.user._id
      });
      
      await referral.save();
    }
    
    await referral.populate('referrer', 'firstName lastName email');
    
    res.json({
      message: 'Referral code generated successfully',
      referral: {
        code: referral.referralCode,
        tier: referral.referralTier,
        tierName: COMMISSION_RATES[referral.referralTier].name,
        totalReferrals: referral.totalReferrals,
        activeReferrals: referral.activeReferrals,
        totalCommissionEarned: referral.totalCommissionEarned,
        pendingCommission: referral.pendingCommission
      }
    });
    
  } catch (error) {
    console.error('Generate referral code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply referral code during registration
router.post('/apply-code', async (req, res) => {
  try {
    const { referralCode, userId } = req.body;
    
    if (!referralCode || !userId) {
      return res.status(400).json({ 
        message: 'Referral code and user ID are required' 
      });
    }
    
    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is trying to use their own referral code
    if (referral.referrer.toString() === userId) {
      return res.status(400).json({ 
        message: 'Cannot use your own referral code' 
      });
    }
    
    // Check if user already referred
    const existingRef = referral.referredUsers.find(
      ref => ref.user.toString() === userId
    );
    
    if (existingRef) {
      return res.status(400).json({ 
        message: 'User already referred with this code' 
      });
    }
    
    // Add user to referral
    referral.referredUsers.push({
      user: userId,
      tier: 1,
      status: 'ACTIVE'
    });
    
    referral.totalReferrals += 1;
    referral.activeReferrals += 1;
    
    // Update tier if needed
    await referral.updateTier();
    await referral.save();
    
    res.json({
      message: 'Referral code applied successfully',
      referrer: referral.referrer,
      tier: referral.referralTier
    });
    
  } catch (error) {
    console.error('Apply referral code error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's referral dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const referral = await Referral.findOne({ referrer: req.user._id })
      .populate('referredUsers.user', 'firstName lastName email createdAt totalSpent');
    
    if (!referral) {
      return res.json({
        hasReferralCode: false,
        message: 'No referral code generated yet'
      });
    }

    // Get current user to check type
    const currentUser = await User.findById(req.user._id);
    const isPropertyAgent = currentUser.referralUserType === 'property_agent' || currentUser.role === 'referral';
    
    let statistics, recentTransactions;
    
    if (isPropertyAgent) {
      // For property agents: show money commissions
      const commissions = await Commission.find({ referrer: req.user._id });
      const totalEarned = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
      const pendingEarnings = commissions
        .filter(comm => comm.status === 'PENDING' || comm.status === 'APPROVED')
        .reduce((sum, comm) => sum + comm.commissionAmount, 0);
      
      // Get recent commissions
      recentTransactions = await Commission.find({ referrer: req.user._id })
        .populate('referredUser', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);
      
      statistics = {
        totalReferrals: referral.totalReferrals,
        activeReferrals: referral.activeReferrals,
        totalEarned,
        pendingEarnings,
        totalPaid: referral.totalCommissionPaid,
        rewardType: 'money'
      };
    } else {
      // For customers: show points
      const PointsTransaction = require('../models/PointsTransaction');
      
      // Get recent points transactions
      recentTransactions = await PointsTransaction.find({ 
        user: req.user._id,
        type: 'EARNED_REFERRAL'
      })
        .populate('metadata.referredUser', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);
      
      // Calculate points earned from referrals
      const referralPoints = recentTransactions.reduce((sum, txn) => sum + txn.points, 0);
      
      statistics = {
        totalReferrals: referral.totalReferrals,
        activeReferrals: referral.activeReferrals,
        totalEarned: referralPoints, // Total points earned from referrals
        pendingEarnings: 0, // No pending concept for points
        totalPaid: 0, // Not applicable for points
        pointsBalance: currentUser.pointsBalance,
        totalPointsEarned: currentUser.totalPointsEarned,
        rewardType: 'points'
      };
    }
    
    // Calculate tier progress (same for both types)
    const currentTier = referral.referralTier;
    const nextTier = currentTier < 3 ? currentTier + 1 : null;
    const nextTierRequirement = nextTier ? COMMISSION_RATES[nextTier].minReferrals : null;
    const progress = nextTier ? 
      ((referral.activeReferrals - COMMISSION_RATES[currentTier].minReferrals) / 
       (COMMISSION_RATES[nextTier].minReferrals - COMMISSION_RATES[currentTier].minReferrals)) * 100 : 100;
    
    res.json({
      hasReferralCode: true,
      referralCode: referral.referralCode,
      userType: isPropertyAgent ? 'property_agent' : 'customer',
      currentTier: {
        level: currentTier,
        name: COMMISSION_RATES[currentTier].name,
        rate: COMMISSION_RATES[currentTier].rate,
        bonusRate: COMMISSION_RATES[currentTier].bonusRate
      },
      nextTier: nextTier ? {
        level: nextTier,
        name: COMMISSION_RATES[nextTier].name,
        rate: COMMISSION_RATES[nextTier].rate,
        requirement: nextTierRequirement,
        progress: Math.min(progress, 100)
      } : null,
      statistics,
      referredUsers: referral.referredUsers,
      recentCommissions: isPropertyAgent ? recentTransactions : [], // For backward compatibility
      recentTransactions // New field for both types
    });
    
  } catch (error) {
    console.error('Get referral dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Process commission for an order
router.post('/process-commission', auth, async (req, res) => {
  try {
    const { orderId, orderAmount, referredUserId } = req.body;
    
    if (!orderId || !orderAmount || !referredUserId) {
      return res.status(400).json({ 
        message: 'Order ID, amount, and referred user ID are required' 
      });
    }
    
    // Find the referral for the referred user
    const referral = await Referral.findOne({ 
      'referredUsers.user': referredUserId 
    });
    
    if (!referral) {
      return res.status(404).json({ message: 'No referral found for this user' });
    }
    
    // Calculate commission
    const commissionData = referral.calculateCommission(orderAmount);
    
    // Create commission record
    const commission = new Commission({
      referral: referral._id,
      referrer: referral.referrer,
      referredUser: referredUserId,
      orderId,
      orderAmount,
      commissionRate: commissionData.rate,
      commissionAmount: commissionData.amount,
      tier: commissionData.tier,
      status: 'PENDING'
    });
    
    await commission.save();
    
    // Update referral totals
    referral.totalCommissionEarned += commissionData.amount;
    referral.pendingCommission += commissionData.amount;
    
    // Update referred user's total spent
    const referredUserIndex = referral.referredUsers.findIndex(
      ref => ref.user.toString() === referredUserId
    );
    
    if (referredUserIndex >= 0) {
      referral.referredUsers[referredUserIndex].totalSpent += orderAmount;
      
      // If this is their first purchase, mark them as active
      if (referral.referredUsers[referredUserIndex].firstPurchaseAmount === 0) {
        referral.referredUsers[referredUserIndex].firstPurchaseAmount = orderAmount;
        referral.referredUsers[referredUserIndex].status = 'ACTIVE';
      }
    }
    
    await referral.save();
    
    res.json({
      message: 'Commission processed successfully',
      commission: {
        amount: commissionData.amount,
        rate: commissionData.rate,
        tier: commissionData.tier,
        tierName: commissionData.tierName
      }
    });
    
  } catch (error) {
    console.error('Process commission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's commission history
router.get('/commissions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { referrer: req.user._id };
    if (status) {
      query.status = status;
    }
    
    const commissions = await Commission.find(query)
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

// Request payout
router.post('/request-payout', auth, async (req, res) => {
  try {
    const { paymentMethod, bankDetails, paypalEmail, minAmount = 50 } = req.body;
    
    // Get approved commissions
    const approvedCommissions = await Commission.find({
      referrer: req.user._id,
      status: 'APPROVED'
    });
    
    const totalAmount = approvedCommissions.reduce(
      (sum, comm) => sum + comm.commissionAmount, 0
    );
    
    if (totalAmount < minAmount) {
      return res.status(400).json({ 
        message: `Minimum payout amount is $${minAmount}` 
      });
    }
    
    // Create payout request
    const payout = new Payout({
      referrer: req.user._id,
      commissions: approvedCommissions.map(c => c._id),
      totalAmount,
      paymentMethod,
      bankDetails,
      paypalEmail
    });
    
    await payout.save();
    
    // Update commission status to processing
    await Commission.updateMany(
      { _id: { $in: approvedCommissions.map(c => c._id) } },
      { status: 'PROCESSING' }
    );
    
    res.json({
      message: 'Payout request submitted successfully',
      payout: {
        id: payout._id,
        amount: totalAmount,
        commissionsCount: approvedCommissions.length
      }
    });
    
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payout history
router.get('/payouts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const payouts = await Payout.find({ referrer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payout.countDocuments({ referrer: req.user._id });
    
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

// Get referral link for sharing
router.get('/share-link', auth, async (req, res) => {
  try {
    const referral = await Referral.findOne({ referrer: req.user._id });
    
    if (!referral) {
      return res.status(404).json({ message: 'No referral code found' });
    }
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/register?ref=${referral.referralCode}`;
    
    res.json({
      referralCode: referral.referralCode,
      referralLink,
      shareText: `Join Swift Fix Pro with my referral code ${referral.referralCode} and get started with professional property maintenance services!`
    });
    
  } catch (error) {
    console.error('Get share link error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==== ENHANCED REFERRAL TRACKING ENDPOINTS ====

// Generate advanced referral links with tracking
router.post('/generate-link', auth, async (req, res) => {
  try {
    const { campaign, source, medium, content, term, expiresAt } = req.body;
    
    const linkData = await referralService.generateReferralLink(req.user._id, {
      campaign,
      source,
      medium,
      content,
      term,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    res.json({
      success: true,
      message: 'Referral link generated successfully',
      data: linkData
    });
    
  } catch (error) {
    console.error('Generate referral link error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track referral link click
router.get('/r/:shortUrl', async (req, res) => {
  try {
    const { shortUrl } = req.params;
    
    const trackingData = await referralService.trackClick(shortUrl, req);
    
    if (trackingData.success) {
      // Set session cookie for conversion tracking
      res.cookie('referral_session', trackingData.sessionId, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      
      // Redirect to original URL
      res.redirect(trackingData.redirectUrl);
    } else {
      res.status(404).json({ message: 'Referral link not found' });
    }
    
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track signup conversion (called during user registration)
router.post('/track-signup', async (req, res) => {
  try {
    const { referralCode, userId, sessionId } = req.body;
    
    if (!referralCode || !userId) {
      return res.status(400).json({ 
        message: 'Referral code and user ID are required' 
      });
    }
    
    const result = await referralService.trackSignupConversion(referralCode, userId, sessionId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Track signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track purchase conversion (called after order completion)
router.post('/track-purchase', auth, async (req, res) => {
  try {
    const { orderId, orderAmount, customerId } = req.body;
    
    if (!orderId || !orderAmount || !customerId) {
      return res.status(400).json({ 
        message: 'Order ID, amount, and customer ID are required' 
      });
    }
    
    const result = await referralService.trackPurchaseConversion(orderId, orderAmount, customerId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Track purchase error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get advanced referral analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const { period = 'DAILY', startDate, endDate } = req.query;
    
    let query = {
      referrerId: req.user._id,
      period: period.toUpperCase()
    };
    
    if (startDate || endDate) {
      query.periodDate = {};
      if (startDate) query.periodDate.$gte = new Date(startDate);
      if (endDate) query.periodDate.$lte = new Date(endDate);
    }
    
    const analytics = await ReferralAnalytics.find(query)
      .sort({ periodDate: -1 })
      .limit(30);
    
    // Get overall stats
    const overallStats = await referralService.getUserReferralStats(req.user._id);
    
    res.json({
      analytics,
      overallStats,
      period: period.toUpperCase()
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get referral links created by user
router.get('/links', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    
    let query = { referrerId: req.user._id };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const links = await ReferralLink.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ReferralLink.countDocuments(query);
    
    res.json({
      links,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
    
  } catch (error) {
    console.error('Get referral links error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update referral link status
router.patch('/links/:linkId', auth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { isActive, expiresAt } = req.body;
    
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);
    
    const link = await ReferralLink.findOneAndUpdate(
      { linkId, referrerId: req.user._id },
      updateData,
      { new: true }
    );
    
    if (!link) {
      return res.status(404).json({ message: 'Referral link not found' });
    }
    
    res.json({
      success: true,
      message: 'Referral link updated successfully',
      link
    });
    
  } catch (error) {
    console.error('Update referral link error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get click tracking data for a specific link
router.get('/links/:linkId/clicks', auth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    // Verify link belongs to user
    const link = await ReferralLink.findOne({ linkId, referrerId: req.user._id });
    if (!link) {
      return res.status(404).json({ message: 'Referral link not found' });
    }
    
    let query = { referralCode: link.referralCode };
    
    if (startDate || endDate) {
      query.clickedAt = {};
      if (startDate) query.clickedAt.$gte = new Date(startDate);
      if (endDate) query.clickedAt.$lte = new Date(endDate);
    }
    
    const clicks = await ReferralClick.find(query)
      .select('ipAddress device location source clickedAt converted convertedAt riskScore')
      .sort({ clickedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ReferralClick.countDocuments(query);
    
    // Get summary stats
    const stats = await ReferralClick.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } },
          avgRiskScore: { $avg: '$riskScore' },
          uniqueCountries: { $addToSet: '$location.country' }
        }
      }
    ]);
    
    res.json({
      clicks,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      stats: stats[0] || {
        totalClicks: 0,
        conversions: 0,
        avgRiskScore: 0,
        uniqueCountries: []
      }
    });
    
  } catch (error) {
    console.error('Get link clicks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==== USER WALLET & EARNINGS ====

// Get user wallet information
router.get('/wallet', auth, async (req, res) => {
  try {
    const stats = await referralService.getUserReferralStats(req.user._id);
    
    // Get detailed commission breakdown
    const commissionBreakdown = await Commission.aggregate([
      { $match: { referrer: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$commissionAmount' }
        }
      }
    ]);
    
    // Get recent transactions
    const recentTransactions = await Commission.find({ referrer: req.user._id })
      .populate('referredUser', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('commissionAmount status createdAt approvedAt paidAt referredUser orderAmount commissionRate');
    
    // Get payout history
    const payoutHistory = await Payout.find({ referrer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      wallet: {
        totalEarnings: stats.stats.totalEarnings,
        pendingEarnings: stats.stats.pendingEarnings,
        availableForPayout: commissionBreakdown
          .filter(c => c._id === 'APPROVED')
          .reduce((sum, c) => sum + c.totalAmount, 0),
        totalPaid: commissionBreakdown
          .filter(c => c._id === 'PAID')
          .reduce((sum, c) => sum + c.totalAmount, 0)
      },
      commissionBreakdown,
      recentTransactions,
      payoutHistory,
      minimumPayout: process.env.MINIMUM_PAYOUT_AMOUNT || 50
    });
    
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==== FRAUD DETECTION & ADMIN ====

// Get fraud alerts for user's referrals
router.get('/fraud-alerts', auth, async (req, res) => {
  try {
    const alerts = await FraudDetection.find({
      'affectedUsers.userId': req.user._id,
      status: { $in: ['DETECTED', 'INVESTIGATING'] }
    })
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({ alerts });
    
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==== ADMIN ENDPOINTS (Protected) ====

// Admin: Get referral system overview
router.get('/admin/overview', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const overview = await referralService.getAdminReferralStats();
    res.json(overview);
    
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get fraud detection dashboard
router.get('/admin/fraud', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { page = 1, limit = 20, severity, status } = req.query;
    
    let query = {};
    if (severity) query.severity = severity;
    if (status) query.status = status;
    
    const fraudCases = await FraudDetection.find(query)
      .populate('affectedUsers.userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await FraudDetection.countDocuments(query);
    
    // Get fraud stats
    const stats = await FraudDetection.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      fraudCases,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      stats
    });
    
  } catch (error) {
    console.error('Admin fraud dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Process commission approvals
router.post('/admin/approve-commissions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { commissionIds } = req.body;
    
    if (!commissionIds || !Array.isArray(commissionIds)) {
      return res.status(400).json({ message: 'Commission IDs array required' });
    }
    
    const result = await Commission.updateMany(
      { _id: { $in: commissionIds } },
      { 
        status: 'APPROVED',
        approvedAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} commissions approved`,
      approvedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('Approve commissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Process payouts
router.post('/admin/process-payouts', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const result = await referralService.processPayouts();
    res.json(result);
    
  } catch (error) {
    console.error('Process payouts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;