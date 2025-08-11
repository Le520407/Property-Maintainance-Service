const express = require('express');
const router = express.Router();
const { Referral, Commission, Payout, COMMISSION_RATES } = require('../models/Referral');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

// Generate or get user's referral code
router.post('/generate-code', auth, async (req, res) => {
  try {
    let referral = await Referral.findOne({ referrer: req.user.userId });
    
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
        referrer: req.user.userId
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
    const referral = await Referral.findOne({ referrer: req.user.userId })
      .populate('referredUsers.user', 'firstName lastName email createdAt totalSpent');
    
    if (!referral) {
      return res.json({
        hasReferralCode: false,
        message: 'No referral code generated yet'
      });
    }
    
    // Get commission statistics
    const commissions = await Commission.find({ referrer: req.user.userId });
    const totalEarned = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
    const pendingEarnings = commissions
      .filter(comm => comm.status === 'PENDING' || comm.status === 'APPROVED')
      .reduce((sum, comm) => sum + comm.commissionAmount, 0);
    
    // Get recent commissions
    const recentCommissions = await Commission.find({ referrer: req.user.userId })
      .populate('referredUser', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Calculate tier progress
    const currentTier = referral.referralTier;
    const nextTier = currentTier < 3 ? currentTier + 1 : null;
    const nextTierRequirement = nextTier ? COMMISSION_RATES[nextTier].minReferrals : null;
    const progress = nextTier ? 
      ((referral.activeReferrals - COMMISSION_RATES[currentTier].minReferrals) / 
       (COMMISSION_RATES[nextTier].minReferrals - COMMISSION_RATES[currentTier].minReferrals)) * 100 : 100;
    
    res.json({
      hasReferralCode: true,
      referralCode: referral.referralCode,
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
      statistics: {
        totalReferrals: referral.totalReferrals,
        activeReferrals: referral.activeReferrals,
        totalEarned,
        pendingEarnings,
        totalPaid: referral.totalCommissionPaid
      },
      referredUsers: referral.referredUsers,
      recentCommissions
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
    
    const query = { referrer: req.user.userId };
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
      referrer: req.user.userId,
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
      referrer: req.user.userId,
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
    
    const payouts = await Payout.find({ referrer: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payout.countDocuments({ referrer: req.user.userId });
    
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
    const referral = await Referral.findOne({ referrer: req.user.userId });
    
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

module.exports = router;