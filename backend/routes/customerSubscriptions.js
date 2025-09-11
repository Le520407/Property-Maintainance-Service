const express = require('express');
const router = express.Router();
const { SubscriptionTier, CustomerSubscription } = require('../models/CustomerSubscription');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const hitpayService = require('../services/hitpayService');

// Get all subscription tiers
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await SubscriptionTier.find({ isActive: true })
      .sort({ monthlyPrice: 1 });
    
    // Add calculated yearly pricing and savings for each tier
    const tiersWithYearlyPricing = tiers.map(tier => {
      const tierObj = tier.toObject();
      const yearlyPrice = tierObj.yearlyPrice || (tierObj.monthlyPrice * 10);
      const yearlySavings = (tierObj.monthlyPrice * 12) - yearlyPrice;
      
      return {
        ...tierObj,
        yearlyPrice: yearlyPrice,
        yearlySavings: yearlySavings,
        yearlyPercentageDiscount: Math.round((yearlySavings / (tierObj.monthlyPrice * 12)) * 100)
      };
    });
    
    res.json({
      success: true,
      data: tiersWithYearlyPricing
    });
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription tiers'
    });
  }
});

// Get user's current subscription
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const subscription = await CustomerSubscription.findOne({
      customer: req.user._id,
      status: { $in: ['ACTIVE', 'PAUSED'] }
    }).populate('customer', 'name email');
    
    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription found'
      });
    }
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription'
    });
  }
});

// Subscribe to a plan (with recurring payments)
router.post('/subscribe', 
  authenticateToken,
  [
    body('propertyType').isIn(['HDB', 'CONDOMINIUM', 'LANDED', 'COMMERCIAL'])
      .withMessage('Valid property type required'),
    body('billingCycle').optional().isIn(['MONTHLY', 'YEARLY'])
      .withMessage('Billing cycle must be MONTHLY or YEARLY'),
    body('paymentMethod.type').isIn(['CARD', 'BANK_TRANSFER', 'PAYPAL'])
      .withMessage('Valid payment method required'),
    body('paymentMethod.last4').optional().isLength({ min: 4, max: 4 }),
    body('paymentMethod.brand').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { propertyType, billingCycle = 'MONTHLY', paymentMethod } = req.body;

      // Check if user already has active subscription
      const existingSubscription = await CustomerSubscription.findOne({
        customer: req.user._id,
        status: 'ACTIVE'
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active subscription'
        });
      }

      // Get tier pricing
      const tier = await SubscriptionTier.findOne({ 
        propertyType,
        isActive: true 
      });

      if (!tier) {
        return res.status(404).json({
          success: false,
          message: 'Subscription tier not found'
        });
      }

      // Calculate pricing based on billing cycle
      const price = billingCycle === 'YEARLY' ? 
        tier.monthlyPrice * 12 * 0.9 : // 10% discount for yearly
        tier.monthlyPrice;

      // Create HitPay recurring plan first
      const planData = {
        name: `${tier.displayName} ${billingCycle} Plan`,
        amount: price,
        currency: 'SGD',
        cycle: billingCycle.toLowerCase(),
        description: `${propertyType} property maintenance subscription - ${billingCycle}`,
        reference: `customer_plan_${req.user._id}_${Date.now()}`
      };

      console.log('Creating HitPay recurring plan for customer subscription:', planData);
      const hitpayPlan = await hitpayService.createRecurringPlan(planData);
      console.log('HitPay plan created:', hitpayPlan);

      // Create HitPay recurring billing
      const billingData = {
        planId: hitpayPlan.id,
        customerEmail: req.user.email,
        customerName: req.user.name || req.user.email,
        startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        redirectUrl: `${process.env.FRONTEND_URL}/subscription/success`,
        reference: `customer_billing_${req.user._id}_${Date.now()}`,
        paymentMethods: ['card']
      };

      console.log('Creating HitPay recurring billing for customer:', billingData);
      const recurringBilling = await hitpayService.createRecurringBilling(billingData);
      console.log('HitPay recurring billing created:', recurringBilling);

      // Calculate next billing date
      const nextBillingDate = new Date();
      if (billingCycle === 'YEARLY') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      // Create subscription with recurring payment info
      const subscription = new CustomerSubscription({
        customer: req.user._id,
        propertyType,
        monthlyPrice: tier.monthlyPrice,
        billingCycle,
        currentPrice: price,
        nextBillingDate,
        paymentMethod,
        paymentGateway: 'HITPAY',
        hitpayData: {
          planId: hitpayPlan.id,
          recurringBillingId: recurringBilling.id,
          checkoutUrl: recurringBilling.url
        },
        billingHistory: [{
          amount: price,
          status: 'PENDING',
          paymentMethod: paymentMethod.type,
          transactionId: recurringBilling.id,
          description: `Initial ${billingCycle.toLowerCase()} subscription setup`,
          createdAt: new Date()
        }]
      });

      await subscription.save();
      await subscription.populate('customer', 'name email');

      // **NEW: Process referral rewards when subscription is first created successfully**
      try {
        const referralRewardService = require('../services/referralRewardService');
        const rewardResult = await referralRewardService.processReferralRewards(
          req.user._id, 
          subscription._id, 
          subscription.currentPrice, 
          'subscription'
        );
        
        if (rewardResult.processed) {
          console.log(`🎁 Referral rewards processed for new subscription ${subscription._id}:`, rewardResult);
        } else {
          console.log(`ℹ️ No referral rewards for subscription ${subscription._id}: ${rewardResult.reason}`);
        }
      } catch (rewardError) {
        console.error('Error processing referral rewards for subscription:', rewardError);
        // Don't fail subscription creation if reward processing fails
      }

      res.status(201).json({
        success: true,
        data: subscription,
        paymentUrl: recurringBilling.url,
        message: 'Subscription created successfully. Complete payment to activate.',
        demo: hitpayPlan.demo || recurringBilling.demo || false
      });

    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update subscription (with proration)
router.put('/update/:id', 
  authenticateToken,
  [
    body('propertyType').optional().isIn(['HDB', 'CONDOMINIUM', 'LANDED', 'COMMERCIAL']),
    body('billingCycle').optional().isIn(['MONTHLY', 'YEARLY']),
    body('paymentMethod.type').optional().isIn(['CARD', 'BANK_TRANSFER', 'PAYPAL']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const subscription = await CustomerSubscription.findOne({
        _id: req.params.id,
        customer: req.user._id
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      const { propertyType, billingCycle, paymentMethod } = req.body;
      let proratedAmount = 0;
      let proratedDescription = '';

      // Handle property type change with proration
      if (propertyType && propertyType !== subscription.propertyType) {
        const newTier = await SubscriptionTier.findOne({ 
          propertyType,
          isActive: true 
        });

        if (!newTier) {
          return res.status(404).json({
            success: false,
            message: 'New subscription tier not found'
          });
        }

        // Calculate proration
        const now = new Date();
        const nextBilling = new Date(subscription.nextBillingDate);
        const daysRemaining = Math.ceil((nextBilling - now) / (1000 * 60 * 60 * 24));
        const totalDays = subscription.billingCycle === 'YEARLY' ? 365 : 30;
        
        const oldPrice = subscription.currentPrice || subscription.monthlyPrice;
        const newPrice = subscription.billingCycle === 'YEARLY' ? 
          newTier.monthlyPrice * 12 * 0.9 : 
          newTier.monthlyPrice;

        const proratedOldAmount = (oldPrice * daysRemaining) / totalDays;
        const proratedNewAmount = (newPrice * daysRemaining) / totalDays;
        proratedAmount = proratedNewAmount - proratedOldAmount;
        
        proratedDescription = `Prorated ${subscription.propertyType} to ${propertyType} (${daysRemaining} days remaining)`;

        subscription.propertyType = propertyType;
        subscription.monthlyPrice = newTier.monthlyPrice;
        subscription.currentPrice = newPrice;

        // Add proration entry to billing history
        if (Math.abs(proratedAmount) > 0.01) { // Only if significant amount
          subscription.billingHistory.push({
            amount: proratedAmount,
            status: proratedAmount > 0 ? 'PENDING' : 'CREDIT',
            paymentMethod: subscription.paymentMethod.type,
            transactionId: `PRORATION_${Date.now()}`,
            description: proratedDescription,
            type: 'PRORATION',
            createdAt: new Date()
          });
        }
      }

      // Handle billing cycle change
      if (billingCycle && billingCycle !== subscription.billingCycle) {
        const tier = await SubscriptionTier.findOne({ 
          propertyType: subscription.propertyType,
          isActive: true 
        });

        if (tier) {
          const newPrice = billingCycle === 'YEARLY' ? 
            tier.monthlyPrice * 12 * 0.9 : 
            tier.monthlyPrice;

          subscription.billingCycle = billingCycle;
          subscription.currentPrice = newPrice;

          // Update next billing date based on new cycle
          const nextBillingDate = new Date();
          if (billingCycle === 'YEARLY') {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          } else {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          }
          subscription.nextBillingDate = nextBillingDate;
        }
      }

      if (paymentMethod) {
        subscription.paymentMethod = paymentMethod;
      }

      await subscription.save();
      await subscription.populate('customer', 'name email');

      res.json({
        success: true,
        data: subscription,
        proration: {
          amount: proratedAmount,
          description: proratedDescription,
          applied: Math.abs(proratedAmount) > 0.01
        },
        message: 'Subscription updated successfully'
      });

    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating subscription'
      });
    }
  }
);

// Cancel subscription (with billing finalization)
router.post('/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const { reason, immediate = false } = req.body;

    const subscription = await CustomerSubscription.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled'
      });
    }

    // Calculate any refund or remaining value
    let refundAmount = 0;
    let refundDescription = '';

    if (immediate) {
      // Immediate cancellation - calculate prorated refund
      const now = new Date();
      const nextBilling = new Date(subscription.nextBillingDate);
      const lastBilling = new Date(subscription.lastBillingDate || subscription.createdAt);
      
      const totalDays = subscription.billingCycle === 'YEARLY' ? 365 : 30;
      const daysUsed = Math.ceil((now - lastBilling) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysUsed);
      
      if (daysRemaining > 0) {
        const currentPrice = subscription.currentPrice || subscription.monthlyPrice;
        refundAmount = (currentPrice * daysRemaining) / totalDays;
        refundDescription = `Prorated refund for ${daysRemaining} unused days`;
      }

      subscription.status = 'CANCELLED';
      subscription.isActive = false;
    } else {
      // End of billing period cancellation
      subscription.status = 'CANCELLING';
      subscription.willCancelAt = subscription.nextBillingDate;
      refundDescription = 'Subscription will remain active until next billing date';
    }

    subscription.cancelledAt = new Date();
    subscription.cancelReason = reason;

    // Add cancellation entry to billing history
    subscription.billingHistory.push({
      amount: immediate ? -Math.abs(refundAmount) : 0,
      status: immediate ? (refundAmount > 0 ? 'REFUND_PENDING' : 'CANCELLED') : 'SCHEDULED_CANCELLATION',
      paymentMethod: subscription.paymentMethod.type,
      transactionId: `CANCEL_${Date.now()}`,
      description: immediate ? 
        (refundAmount > 0 ? refundDescription : 'Immediate cancellation') :
        'Scheduled cancellation at end of billing period',
      type: 'CANCELLATION',
      createdAt: new Date()
    });

    // TODO: Cancel HitPay recurring billing if exists
    if (subscription.hitpayData?.recurringBillingId) {
      console.log('TODO: Cancel HitPay recurring billing:', subscription.hitpayData.recurringBillingId);
      // await hitpayService.cancelRecurringBilling(subscription.hitpayData.recurringBillingId);
    }

    await subscription.save();

    res.json({
      success: true,
      data: subscription,
      cancellation: {
        immediate,
        refundAmount: refundAmount || 0,
        refundDescription,
        effectiveDate: immediate ? new Date() : subscription.nextBillingDate
      },
      message: immediate ? 
        'Subscription cancelled immediately' : 
        'Subscription will be cancelled at the end of current billing period'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
    });
  }
});


// Get billing history for subscription
router.get('/billing-history/:id', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;
    
    const subscription = await CustomerSubscription.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    let billingHistory = [...subscription.billingHistory];

    // Apply filters
    if (status) {
      billingHistory = billingHistory.filter(entry => entry.status === status);
    }

    if (type) {
      billingHistory = billingHistory.filter(entry => entry.type === type);
    }

    if (startDate || endDate) {
      billingHistory = billingHistory.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date();
        return entryDate >= start && entryDate <= end;
      });
    }

    // Sort by date (newest first)
    billingHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = billingHistory.slice(startIndex, endIndex);

    // Calculate totals
    const totalPaid = billingHistory
      .filter(entry => entry.status === 'PAID')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);

    const totalRefunds = billingHistory
      .filter(entry => entry.amount < 0)
      .reduce((sum, entry) => sum + Math.abs(entry.amount || 0), 0);

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          propertyType: subscription.propertyType,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPrice: subscription.currentPrice || subscription.monthlyPrice,
          nextBillingDate: subscription.nextBillingDate
        },
        billingHistory: paginatedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(billingHistory.length / limit),
          totalEntries: billingHistory.length,
          limit: parseInt(limit)
        },
        summary: {
          totalPaid: totalPaid.toFixed(2),
          totalRefunds: totalRefunds.toFixed(2),
          netAmount: (totalPaid - totalRefunds).toFixed(2)
        }
      },
      message: 'Billing history retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing history'
    });
  }
});

// Get all billing history for user (across all subscriptions)
router.get('/billing-history', authenticateToken, async (req, res) => {
  try {
    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const { page = 1, limit = 20, status, type, startDate, endDate } = req.query;
    
    // Check CustomerMembership for current memberships (new system)
    const { CustomerMembership } = require('../models/CustomerMembership');
    const memberships = await CustomerMembership.find({
      customer: req.user._id
    }).populate('tier').sort({ createdAt: -1 });

    let allBillingHistory = [];

    // If we have memberships, create billing history entries from membership data
    if (memberships.length > 0) {
      memberships.forEach(membership => {
        // Create a billing entry for the membership subscription
        const billingEntry = {
          _id: membership._id.toString() + '_membership',
          amount: membership.currentPrice || membership.tier.monthlyPrice,
          status: membership.paymentMethod === 'MANUAL' ? 'PAID' : 
                  membership.status === 'ACTIVE' ? 'PAID' : 'PENDING',
          type: 'SUBSCRIPTION',
          description: `${membership.tier.displayName} Membership`,
          billingDate: membership.nextBillingDate || membership.startDate,
          createdAt: membership.startDate,
          subscriptionId: membership._id,
          propertyType: membership.tier.name,
          subscriptionStatus: membership.status,
          paymentMethod: membership.paymentMethod,
          billingCycle: membership.billingCycle
        };
        allBillingHistory.push(billingEntry);
      });
    }

    // Also check old CustomerSubscription system for backward compatibility
    const subscriptions = await CustomerSubscription.find({
      customer: req.user._id
    }).select('billingHistory propertyType status billingCycle');

    // Aggregate billing history from old subscription system if exists
    subscriptions.forEach(subscription => {
      subscription.billingHistory.forEach(entry => {
        allBillingHistory.push({
          ...entry.toObject(),
          subscriptionId: subscription._id,
          propertyType: subscription.propertyType,
          subscriptionStatus: subscription.status
        });
      });
    });

    // Apply filters
    if (status) {
      allBillingHistory = allBillingHistory.filter(entry => entry.status === status);
    }

    if (type) {
      allBillingHistory = allBillingHistory.filter(entry => entry.type === type);
    }

    if (startDate || endDate) {
      allBillingHistory = allBillingHistory.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date();
        return entryDate >= start && entryDate <= end;
      });
    }

    // Sort by date (newest first)
    allBillingHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = allBillingHistory.slice(startIndex, endIndex);

    // Calculate totals
    const totalPaid = allBillingHistory
      .filter(entry => entry.status === 'PAID')
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);

    const totalRefunds = allBillingHistory
      .filter(entry => entry.amount < 0)
      .reduce((sum, entry) => sum + Math.abs(entry.amount || 0), 0);

    res.json({
      success: true,
      data: {
        billingHistory: paginatedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(allBillingHistory.length / limit),
          totalEntries: allBillingHistory.length,
          limit: parseInt(limit)
        },
        summary: {
          totalPaid: totalPaid.toFixed(2),
          totalRefunds: totalRefunds.toFixed(2),
          netAmount: (totalPaid - totalRefunds).toFixed(2),
          totalSubscriptions: subscriptions.length
        }
      },
      message: 'Complete billing history retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching complete billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching billing history'
    });
  }
});

// Use free service (social impact)
router.post('/use-free-service/:id', authenticateToken, async (req, res) => {
  try {
    const subscription = await CustomerSubscription.findOne({
      _id: req.params.id,
      customer: req.user._id,
      status: 'ACTIVE'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found'
      });
    }

    const canUse = subscription.useFreeService();

    if (!canUse) {
      return res.status(400).json({
        success: false,
        message: 'No free services available'
      });
    }

    await subscription.save();

    res.json({
      success: true,
      data: {
        freeServicesUsed: subscription.socialImpactContribution.freeServicesUsed,
        freeServicesEarned: subscription.socialImpactContribution.freeServicesEarned,
        remainingFreeServices: subscription.socialImpactContribution.freeServicesEarned - subscription.socialImpactContribution.freeServicesUsed
      },
      message: 'Free service used successfully'
    });

  } catch (error) {
    console.error('Error using free service:', error);
    res.status(500).json({
      success: false,
      message: 'Error using free service'
    });
  }
});

// Record paid service (for social impact calculation)
router.post('/record-service/:id', authenticateToken, async (req, res) => {
  try {
    const subscription = await CustomerSubscription.findOne({
      _id: req.params.id,
      customer: req.user._id,
      status: 'ACTIVE'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found'
      });
    }

    subscription.addPaidService();
    await subscription.save();

    res.json({
      success: true,
      data: {
        paidServicesCount: subscription.socialImpactContribution.paidServicesCount,
        freeServicesEarned: subscription.socialImpactContribution.freeServicesEarned,
        totalContribution: subscription.socialImpactContribution.totalContribution
      },
      message: 'Service recorded successfully'
    });

  } catch (error) {
    console.error('Error recording service:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording service'
    });
  }
});

// Get subscription analytics (admin only)
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalSubscriptions = await CustomerSubscription.countDocuments({ status: 'ACTIVE' });
    const totalRevenue = await CustomerSubscription.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, total: { $sum: '$monthlyPrice' } } }
    ]);

    const subscriptionsByTier = await CustomerSubscription.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$propertyType', count: { $sum: 1 }, revenue: { $sum: '$monthlyPrice' } } }
    ]);

    const socialImpact = await CustomerSubscription.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: null,
          totalPaidServices: { $sum: '$socialImpactContribution.paidServicesCount' },
          totalFreeServices: { $sum: '$socialImpactContribution.freeServicesEarned' },
          totalFreeServicesUsed: { $sum: '$socialImpactContribution.freeServicesUsed' },
          totalContribution: { $sum: '$socialImpactContribution.totalContribution' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSubscriptions,
          monthlyRevenue: totalRevenue[0]?.total || 0,
          averageRevenuePerUser: totalSubscriptions > 0 ? (totalRevenue[0]?.total || 0) / totalSubscriptions : 0
        },
        subscriptionsByTier,
        socialImpact: socialImpact[0] || {
          totalPaidServices: 0,
          totalFreeServices: 0,
          totalFreeServicesUsed: 0,
          totalContribution: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// HitPay webhook handler for customer subscription recurring payments
router.post('/webhook/hitpay-recurring', async (req, res) => {
  try {
    console.log('HitPay customer subscription webhook received');
    console.log('Webhook body:', req.body);

    const webhookData = req.body;
    const { payment_id, recurring_billing_id, amount, currency, status, hmac, reference } = webhookData;

    // Validate webhook signature
    if (!hitpayService.validateRecurringWebhook(webhookData, hmac)) {
      console.error('Invalid HitPay webhook signature for customer subscription');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Find subscription by HitPay recurring billing ID
    const subscription = await CustomerSubscription.findOne({
      'hitpayData.recurringBillingId': recurring_billing_id
    }).populate('customer', 'name email');

    if (!subscription) {
      console.error('Subscription not found for recurring billing ID:', recurring_billing_id);
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    console.log('Processing payment for subscription:', subscription._id);

    if (status === 'completed' || status === 'paid') {
      // Successful payment
      subscription.status = 'ACTIVE';
      subscription.isActive = true;
      subscription.lastBillingDate = new Date();

      // Update next billing date
      const nextBillingDate = new Date();
      if (subscription.billingCycle === 'YEARLY') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
      subscription.nextBillingDate = nextBillingDate;

      // Add successful payment to billing history
      subscription.billingHistory.push({
        amount: parseFloat(amount),
        status: 'PAID',
        paymentMethod: subscription.paymentMethod.type,
        transactionId: payment_id,
        description: `${subscription.billingCycle} subscription renewal`,
        type: 'RENEWAL',
        hitpayPaymentId: payment_id,
        hitpayReference: reference,
        createdAt: new Date()
      });

      console.log('✅ Customer subscription payment successful:', {
        subscriptionId: subscription._id,
        amount,
        paymentId: payment_id
      });

      // **NEW: Process referral rewards when subscription payment is completed**
      try {
        const referralRewardService = require('../services/referralRewardService');
        const rewardResult = await referralRewardService.processReferralRewards(
          subscription.customer, 
          subscription._id, 
          parseFloat(amount), 
          'subscription'
        );
        
        if (rewardResult.processed) {
          console.log(`🎁 Referral rewards processed for subscription payment ${subscription._id}:`, rewardResult);
        } else {
          console.log(`ℹ️ No referral rewards for subscription ${subscription._id}: ${rewardResult.reason}`);
        }
      } catch (rewardError) {
        console.error('Error processing referral rewards for subscription payment:', rewardError);
        // Don't fail webhook processing if reward processing fails
      }

    } else if (status === 'failed') {
      // Failed payment
      const failedAttempts = subscription.billingHistory.filter(
        entry => entry.status === 'FAILED' && 
        entry.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      ).length;

      subscription.billingHistory.push({
        amount: parseFloat(amount),
        status: 'FAILED',
        paymentMethod: subscription.paymentMethod.type,
        transactionId: payment_id,
        description: `Failed ${subscription.billingCycle} subscription renewal`,
        type: 'RENEWAL',
        hitpayPaymentId: payment_id,
        hitpayReference: reference,
        createdAt: new Date()
      });

      // If too many failed attempts, pause subscription
      if (failedAttempts >= 2) {
        subscription.status = 'PAUSED';
        subscription.isActive = false;
        console.log('⚠️ Customer subscription paused due to failed payments:', subscription._id);
      }

      console.log('❌ Customer subscription payment failed:', {
        subscriptionId: subscription._id,
        amount,
        paymentId: payment_id,
        failedAttempts: failedAttempts + 1
      });
    }

    await subscription.save();

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing HitPay customer subscription webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook'
    });
  }
});

// Success/cancel callback handlers for customer subscriptions
router.get('/payment/success', async (req, res) => {
  try {
    const { payment_id, recurring_billing_id, status } = req.query;
    
    console.log('Customer subscription payment success callback:', { 
      payment_id, 
      recurring_billing_id, 
      status 
    });

    if (recurring_billing_id) {
      const subscription = await CustomerSubscription.findOne({
        'hitpayData.recurringBillingId': recurring_billing_id
      });

      if (subscription) {
        console.log('🔍 Found subscription for activation:', {
          subscriptionId: subscription._id,
          currentStatus: subscription.status,
          customerId: subscription.customer
        });

        // Update subscription status to active
        subscription.status = 'ACTIVE';
        subscription.isActive = true;
        
        console.log('✅ Subscription status updated to ACTIVE');
        
        // Update billing history entry from PENDING to PAID
        const pendingEntry = subscription.billingHistory.find(
          entry => entry.status === 'PENDING' && entry.transactionId === recurring_billing_id
        );
        
        if (pendingEntry) {
          pendingEntry.status = 'PAID';
          pendingEntry.hitpayPaymentId = payment_id;
          pendingEntry.paidAt = new Date();
          console.log('✅ Billing history updated: PENDING → PAID');
        } else {
          console.log('⚠️ No pending billing entry found, creating new PAID entry');
          subscription.billingHistory.push({
            amount: subscription.currentPrice,
            status: 'PAID',
            paymentMethod: subscription.paymentMethod?.type || 'unknown',
            transactionId: recurring_billing_id,
            description: `Initial ${subscription.billingCycle.toLowerCase()} subscription payment`,
            hitpayPaymentId: payment_id,
            paidAt: new Date(),
            createdAt: new Date()
          });
        }

        await subscription.save();
        
        console.log('✅ Customer subscription activated successfully:', {
          subscriptionId: subscription._id,
          paymentId: payment_id,
          status: subscription.status,
          isActive: subscription.isActive
        });
      } else {
        console.log('❌ No subscription found for recurring_billing_id:', recurring_billing_id);
      }
    }

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/subscription/success?payment_id=${payment_id}&status=${status}`);
    
  } catch (error) {
    console.error('Error handling subscription payment success:', error);
    res.redirect(`${process.env.FRONTEND_URL}/subscription/error`);
  }
});

router.get('/payment/cancel', async (req, res) => {
  try {
    const { payment_id, recurring_billing_id } = req.query;
    
    console.log('Customer subscription payment cancelled:', { 
      payment_id, 
      recurring_billing_id 
    });

    // Redirect to frontend cancel page
    res.redirect(`${process.env.FRONTEND_URL}/subscription/cancelled`);
    
  } catch (error) {
    console.error('Error handling subscription payment cancellation:', error);
    res.redirect(`${process.env.FRONTEND_URL}/subscription/error`);
  }
});

module.exports = router;