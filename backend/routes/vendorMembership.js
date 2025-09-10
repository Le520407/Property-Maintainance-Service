const express = require('express');
const router = express.Router();
const { VendorMembershipTier, VendorMembership } = require('../models/VendorMembership');
const Vendor = require('../models/Vendor');
const { auth, requireRole } = require('../middleware/auth');
const hitpayService = require('../services/hitpayService');

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

// Upgrade/change membership tier with HitPay payment
router.post('/upgrade', auth, requireRole(['vendor']), async (req, res) => {
  try {
    console.log('🚀 UPGRADE REQUEST RECEIVED:');
    console.log('- Request body:', JSON.stringify(req.body, null, 2));
    console.log('- User ID:', req.user._id);
    console.log('- User role:', req.user.role);
    
    const { targetTier, billingCycle = 'MONTHLY' } = req.body;
    
    if (!['PROFESSIONAL', 'PREMIUM', 'ENTERPRISE'].includes(targetTier)) {
      console.log('❌ INVALID TIER ERROR:', targetTier);
      return res.status(400).json({ message: 'Invalid membership tier' });
    }

    console.log('✅ Tier validation passed:', targetTier);

    const vendor = await Vendor.findOne({ userId: req.user._id }).populate('userId');
    if (!vendor) {
      console.log('❌ VENDOR NOT FOUND for user:', req.user._id);
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    console.log('✅ Vendor found:', vendor._id);

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

    console.log('Tier upgrade check:', {
      currentTier: membership.currentTier,
      currentTierLevel,
      targetTier,
      targetTierLevel,
      isUpgrade: targetTierLevel > currentTierLevel
    });

    if (targetTierLevel <= currentTierLevel) {
      return res.status(400).json({ 
        message: 'Can only upgrade to higher tier',
        details: {
          currentTier: membership.currentTier,
          targetTier: targetTier,
          suggestion: targetTierLevel === currentTierLevel ? 'You are already on this tier' : 'Please select a higher tier'
        }
      });
    }

    // Calculate pricing
    const price = billingCycle === 'YEARLY' 
      ? targetTierDetails.yearlyPrice 
      : targetTierDetails.monthlyPrice;

    // Create HitPay payment request for vendor membership upgrade
    const paymentData = {
      amount: price,
      currency: 'SGD',
      email: vendor.userId.email,
      name: vendor.userId.fullName || `${vendor.userId.firstName} ${vendor.userId.lastName}`,
      purpose: `Vendor Membership Upgrade - ${targetTier} (${billingCycle})`,
      reference_number: `vendor_upgrade_${vendor._id}_${targetTier}_${Date.now()}`,
      redirect_url: `${process.env.FRONTEND_URL}/vendor/membership/success`,
      webhook: `${process.env.WEBHOOK_URL || 'http://localhost:5000'}/api/vendor/membership/webhook/hitpay`,
      send_email: true
    };

    console.log('Creating HitPay payment for vendor membership upgrade:', paymentData);
    
    let hitpayPayment;
    try {
      hitpayPayment = await hitpayService.createPayment(paymentData);
      console.log('HitPay payment request created for vendor:', hitpayPayment);
    } catch (paymentError) {
      console.error('Failed to create HitPay payment for vendor:', paymentError);
      return res.status(500).json({ 
        message: 'Failed to create payment request',
        error: paymentError.message 
      });
    }

    // Store the target tier for upgrade (but don't update currentTier until payment confirmation)
    membership.pendingUpgradeTier = targetTier;
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

    // Store HitPay payment reference
    membership.hitpayPaymentId = hitpayPayment.id || hitpayPayment.payment_request_id;
    membership.hitpayReference = paymentData.reference_number;

    // Add to history
    membership.membershipHistory.push({
      fromTier: membership.currentTier, // Keep the actual current tier as fromTier
      toTier: targetTier,
      reason: 'UPGRADE_REQUEST',
      initiatedBy: 'VENDOR'
    });

    await membership.save();
    
    // Note: Vendor features will be activated after successful payment via webhook

    res.json({
      success: true,
      message: 'Membership upgrade payment created. Please complete payment.',
      membership,
      pricing: {
        tier: targetTier,
        billingCycle,
        price,
        currency: 'SGD'
      },
      paymentUrl: hitpayPayment.url,
      paymentId: hitpayPayment.id || hitpayPayment.payment_request_id,
      reference: paymentData.reference_number
    });
  } catch (error) {
    console.error('🚨 MEMBERSHIP UPGRADE ERROR:');
    console.error('- Error message:', error.message);
    console.error('- Error stack:', error.stack);
    console.error('- Request body:', req.body);
    console.error('- User ID:', req.user._id);
    res.status(500).json({ 
      message: 'Failed to upgrade membership',
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Create vendor membership payment (for new subscriptions or one-time payments)
router.post('/create-payment', auth, requireRole(['vendor']), async (req, res) => {
  try {
    const { targetTier, billingCycle = 'MONTHLY' } = req.body;
    
    if (!['PROFESSIONAL', 'PREMIUM', 'ENTERPRISE'].includes(targetTier)) {
      return res.status(400).json({ message: 'Invalid membership tier' });
    }

    const vendor = await Vendor.findOne({ userId: req.user._id }).populate('userId');
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

    // Check if vendor already has active membership
    let membership = await VendorMembership.findOne({ vendorId: vendor._id });
    
    if (membership && membership.subscriptionStatus === 'ACTIVE') {
      return res.status(400).json({ 
        message: 'You already have an active membership. Please use the upgrade option instead.',
        shouldUseUpgrade: true
      });
    }

    // Calculate pricing
    const price = billingCycle === 'YEARLY' 
      ? targetTierDetails.yearlyPrice 
      : targetTierDetails.monthlyPrice;

    // Create HitPay payment request for vendor membership
    const paymentData = {
      amount: price,
      currency: 'SGD',
      email: vendor.userId.email,
      name: vendor.userId.fullName || `${vendor.userId.firstName} ${vendor.userId.lastName}`,
      purpose: `Vendor Membership - ${targetTier} (${billingCycle})`,
      reference_number: `vendor_membership_${vendor._id}_${targetTier}_${Date.now()}`,
      redirect_url: `${process.env.FRONTEND_URL}/vendor/membership/success`,
      webhook: `${process.env.WEBHOOK_URL || 'http://localhost:5000'}/api/vendor/membership/webhook/hitpay`,
      send_email: true
    };

    console.log('Creating HitPay payment for vendor membership:', paymentData);
    
    let hitpayPayment;
    try {
      hitpayPayment = await hitpayService.createPayment(paymentData);
      console.log('HitPay payment request created for vendor membership:', hitpayPayment);
    } catch (paymentError) {
      console.error('Failed to create HitPay payment for vendor membership:', paymentError);
      return res.status(500).json({ 
        message: 'Failed to create payment request',
        error: paymentError.message 
      });
    }

    // Create or update membership record (pending until payment)
    if (!membership) {
      membership = new VendorMembership({
        vendorId: vendor._id,
        currentTier: targetTier,
        billingCycle: billingCycle,
        subscriptionStatus: 'PENDING'
      });
    } else {
      membership.currentTier = targetTier;
      membership.billingCycle = billingCycle;
      membership.subscriptionStatus = 'PENDING';
    }
    
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

    // Store HitPay payment reference
    membership.hitpayPaymentId = hitpayPayment.id || hitpayPayment.payment_request_id;
    membership.hitpayReference = paymentData.reference_number;
    membership.paymentStatus = 'PENDING';

    // Add to history
    membership.membershipHistory.push({
      fromTier: membership.currentTier || 'BASIC',
      toTier: targetTier,
      reason: 'NEW_SUBSCRIPTION',
      initiatedBy: 'VENDOR'
    });

    await membership.save();
    
    res.json({
      success: true,
      message: 'Vendor membership payment created. Please complete payment.',
      membership: {
        id: membership._id,
        tier: targetTier,
        billingCycle,
        status: 'PENDING'
      },
      pricing: {
        tier: targetTier,
        billingCycle,
        price,
        currency: 'SGD'
      },
      paymentUrl: hitpayPayment.url,
      paymentId: hitpayPayment.id || hitpayPayment.payment_request_id,
      reference: paymentData.reference_number
    });
  } catch (error) {
    console.error('Vendor membership payment creation error:', error);
    res.status(500).json({ message: 'Failed to create membership payment' });
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

// HitPay webhook handler for vendor membership payments
router.post('/webhook/hitpay', async (req, res) => {
  try {
    console.log('Received HitPay webhook for vendor membership payment:', req.body);

    const {
      payment_id,
      payment_request_id,
      phone,
      amount,
      currency,
      status,
      reference_number,
      hmac
    } = req.body;

    // Verify webhook authenticity (if webhook secret is configured)
    if (process.env.HITPAY_WEBHOOK_SECRET) {
      const isValid = hitpayService.verifyWebhookSignature(req.body, hmac);
      if (!isValid) {
        console.error('Invalid webhook signature for vendor membership');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    // Find vendor membership by reference number
    const membership = await VendorMembership.findOne({ 
      hitpayReference: reference_number 
    }).populate('vendorId');
    
    if (!membership) {
      console.error('Vendor membership not found for reference:', reference_number);
      return res.status(404).json({ error: 'Membership not found' });
    }

    console.log('Processing webhook for vendor membership:', membership._id);

    // Update membership based on payment status
    switch (status) {
      case 'completed':
      case 'succeeded':
        // Move from pending to active tier
        if (membership.pendingUpgradeTier) {
          const previousTier = membership.currentTier;
          membership.currentTier = membership.pendingUpgradeTier;
          membership.pendingUpgradeTier = null;
          
          console.log(`✅ Upgraded tier from ${previousTier} to ${membership.currentTier}`);
        }
        
        membership.subscriptionStatus = 'ACTIVE';
        membership.paymentStatus = 'PAID';
        
        // Activate vendor features
        const vendor = await Vendor.findById(membership.vendorId);
        if (vendor) {
          await vendor.upgradeMembership(membership.currentTier);
          console.log(`✅ Vendor ${membership.vendorId} upgraded to ${membership.currentTier}`);
        }
        
        console.log(`✅ Vendor membership ${membership._id} payment completed and activated`);
        break;
        
      case 'failed':
        // Clear pending upgrade on failed payment
        if (membership.pendingUpgradeTier) {
          console.log(`❌ Clearing pending upgrade from ${membership.currentTier} to ${membership.pendingUpgradeTier}`);
          membership.pendingUpgradeTier = null;
        }
        
        membership.subscriptionStatus = 'SUSPENDED';
        membership.paymentStatus = 'FAILED';
        console.log(`❌ Vendor membership ${membership._id} payment failed`);
        break;
        
      case 'pending':
        membership.paymentStatus = 'PENDING';
        console.log(`⏳ Vendor membership ${membership._id} payment pending`);
        break;
        
      default:
        console.log(`📝 Vendor membership ${membership._id} payment status: ${status}`);
        break;
    }

    // Update payment details
    if (payment_id) {
      membership.hitpayPaymentId = payment_id;
    }
    
    membership.lastPaymentDate = new Date();
    await membership.save();

    console.log('Vendor membership updated successfully:', {
      membershipId: membership._id,
      vendorId: membership.vendorId,
      tier: membership.currentTier,
      status: membership.subscriptionStatus,
      paymentStatus: membership.paymentStatus
    });

    res.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Error processing HitPay vendor membership webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;