const express = require('express');
const router = express.Router();
const { VendorVendorMembershipTier, VendorMembership } = require('../models/VendorMembership');
const Vendor = require('../models/Vendor');
const { auth, requireRole } = require('../middleware/auth');

// Get all membership tiers (public)
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await VendorMembershipTier.find({ isActive: true })
      .sort({ sortOrder: 1 });
    
    res.json({ 
      success: true,
      tiers 
    });
  } catch (error) {
    console.error('Get membership tiers error:', error);
    res.status(500).json({ message: 'Failed to fetch membership tiers' });
  }
});

// Get specific membership tier details
router.get('/tiers/:tierName', async (req, res) => {
  try {
    const { tierName } = req.params;
    const tier = await VendorMembershipTier.findOne({ 
      name: tierName.toUpperCase(), 
      isActive: true 
    });
    
    if (!tier) {
      return res.status(404).json({ message: 'Membership tier not found' });
    }
    
    res.json({ 
      success: true,
      tier 
    });
  } catch (error) {
    console.error('Get membership tier error:', error);
    res.status(500).json({ message: 'Failed to fetch membership tier' });
  }
});

// Get vendor's current membership
router.get('/my-membership', auth, requireRole(['vendor']), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    let membership = await VendorMembership.findOne({ vendorId: vendor._id });
    
    if (!membership) {
      // Create default basic membership
      membership = new VendorMembership({
        vendorId: vendor._id,
        currentTier: 'BASIC',
        subscriptionStatus: 'ACTIVE'
      });
      await membership.save();
    }

    // Get current tier details
    const tierDetails = await VendorMembershipTier.findOne({ 
      name: membership.currentTier,
      isActive: true 
    });

    res.json({
      success: true,
      membership,
      tierDetails,
      vendorFeatures: vendor.membershipFeatures
    });
  } catch (error) {
    console.error('Get vendor membership error:', error);
    res.status(500).json({ message: 'Failed to fetch membership details' });
  }
});

// Get membership usage statistics
router.get('/usage-stats', auth, requireRole(['vendor']), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const membership = await VendorMembership.findOne({ vendorId: vendor._id });
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    // Calculate current month usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const stats = {
      currentTier: membership.currentTier,
      monthlyUsage: membership.monthlyUsage,
      featureUsage: membership.featureUsage,
      benefitsEarned: membership.benefitsEarned,
      limits: {
        portfolioImages: vendor.getMaxPortfolioImages(),
        customPackages: vendor.canCreateCustomPackages(),
        commissionRate: vendor.getCommissionRate()
      },
      daysRemaining: membership.daysRemaining
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({ message: 'Failed to fetch usage statistics' });
  }
});

// Upgrade/change membership tier
router.post('/upgrade', auth, requireRole(['vendor']), async (req, res) => {
  try {
    const { targetTier, billingCycle = 'MONTHLY' } = req.body;
    
    if (!['PROFESSIONAL', 'PREMIUM', 'ENTERPRISE'].includes(targetTier)) {
      return res.status(400).json({ message: 'Invalid membership tier' });
    }

    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Get target tier details
    const targetTierDetails = await VendorMembershipTier.findOne({ 
      name: targetTier,
      isActive: true 
    });
    
    if (!targetTierDetails) {
      return res.status(404).json({ message: 'Target membership tier not found' });
    }

    let membership = await VendorMembership.findOne({ vendorId: vendor._id });
    
    if (!membership) {
      membership = new VendorMembership({
        vendorId: vendor._id,
        currentTier: 'BASIC'
      });
    }

    // Check if it's actually an upgrade
    const tierHierarchy = { BASIC: 0, PROFESSIONAL: 1, PREMIUM: 2, ENTERPRISE: 3 };
    const currentTierLevel = tierHierarchy[membership.currentTier];
    const targetTierLevel = tierHierarchy[targetTier];

    if (targetTierLevel <= currentTierLevel) {
      return res.status(400).json({ message: 'Can only upgrade to higher tier' });
    }

    // Calculate pricing
    const price = billingCycle === 'YEARLY' 
      ? targetTierDetails.yearlyPrice 
      : targetTierDetails.monthlyPrice;

    // Update membership record
    membership.currentTier = targetTier;
    membership.billingCycle = billingCycle;
    membership.subscriptionStatus = 'PENDING'; // Will be ACTIVE after payment
    
    // Set billing dates
    const now = new Date();
    membership.subscriptionStartDate = now;
    
    if (billingCycle === 'YEARLY') {
      membership.subscriptionEndDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      membership.nextBillingDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else {
      membership.subscriptionEndDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      membership.nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    // Add to history
    membership.membershipHistory.push({
      fromTier: membership.currentTier,
      toTier: targetTier,
      reason: 'UPGRADE_REQUEST',
      initiatedBy: 'VENDOR'
    });

    await membership.save();
    
    // Update vendor features (will be activated after payment)
    await vendor.upgradeMembership(targetTier);

    res.json({
      success: true,
      message: 'Membership upgrade initiated',
      membership,
      pricing: {
        tier: targetTier,
        billingCycle,
        price,
        currency: 'SGD'
      }
    });
  } catch (error) {
    console.error('Membership upgrade error:', error);
    res.status(500).json({ message: 'Failed to upgrade membership' });
  }
});

// Cancel membership
router.post('/cancel', auth, requireRole(['vendor']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const membership = await VendorMembership.findOne({ vendorId: vendor._id });
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    if (membership.currentTier === 'BASIC') {
      return res.status(400).json({ message: 'Cannot cancel basic membership' });
    }

    // Cancel the membership
    await membership.cancelSubscription(reason);
    
    // Downgrade to basic after subscription period ends
    // Features remain active until subscription expires
    
    res.json({
      success: true,
      message: 'Membership cancellation scheduled',
      membership
    });
  } catch (error) {
    console.error('Membership cancellation error:', error);
    res.status(500).json({ message: 'Failed to cancel membership' });
  }
});

// Get membership history
router.get('/history', auth, requireRole(['vendor']), async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const membership = await VendorMembership.findOne({ vendorId: vendor._id });
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    res.json({
      success: true,
      history: membership.membershipHistory.sort((a, b) => b.changeDate - a.changeDate)
    });
  } catch (error) {
    console.error('Get membership history error:', error);
    res.status(500).json({ message: 'Failed to fetch membership history' });
  }
});

// Admin: Create/Update membership tiers
router.post('/admin/tiers', auth, requireRole(['admin']), async (req, res) => {
  try {
    const tierData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'displayName', 'description', 'monthlyPrice', 'yearlyPrice'];
    const missingFields = requiredFields.filter(field => !tierData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    let tier = await VendorMembershipTier.findOne({ name: tierData.name.toUpperCase() });
    
    if (tier) {
      // Update existing tier
      Object.assign(tier, tierData);
      tier.name = tierData.name.toUpperCase();
    } else {
      // Create new tier
      tier = new VendorMembershipTier({
        ...tierData,
        name: tierData.name.toUpperCase()
      });
    }
    
    await tier.save();
    
    res.json({
      success: true,
      message: tier.isModified() ? 'Membership tier updated' : 'Membership tier created',
      tier
    });
  } catch (error) {
    console.error('Create/Update tier error:', error);
    res.status(500).json({ message: 'Failed to save membership tier' });
  }
});

// Admin: Get all vendor memberships
router.get('/admin/memberships', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, tier, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (tier) query.currentTier = tier.toUpperCase();
    if (status) query.subscriptionStatus = status.toUpperCase();
    
    const memberships = await VendorMembership.find(query)
      .populate({
        path: 'vendorId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VendorMembership.countDocuments(query);
    
    res.json({
      success: true,
      memberships,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admin memberships error:', error);
    res.status(500).json({ message: 'Failed to fetch memberships' });
  }
});

module.exports = router;