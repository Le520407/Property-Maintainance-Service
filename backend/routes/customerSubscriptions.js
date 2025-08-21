const express = require('express');
const router = express.Router();
const { SubscriptionTier, CustomerSubscription } = require('../models/CustomerSubscription');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all subscription tiers
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await SubscriptionTier.find({ isActive: true })
      .sort({ monthlyPrice: 1 });
    
    res.json({
      success: true,
      data: tiers
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

// Subscribe to a plan
router.post('/subscribe', 
  authenticateToken,
  [
    body('propertyType').isIn(['HDB', 'CONDOMINIUM', 'LANDED', 'COMMERCIAL'])
      .withMessage('Valid property type required'),
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

      const { propertyType, paymentMethod } = req.body;

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

      // Create subscription
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const subscription = new CustomerSubscription({
        customer: req.user._id,
        propertyType,
        monthlyPrice: tier.monthlyPrice,
        nextBillingDate,
        paymentMethod,
        billingHistory: [{
          amount: tier.monthlyPrice,
          status: 'PAID',
          paymentMethod: paymentMethod.type,
          transactionId: `TXN_${Date.now()}`
        }]
      });

      await subscription.save();
      await subscription.populate('customer', 'name email');

      res.status(201).json({
        success: true,
        data: subscription,
        message: 'Subscription created successfully'
      });

    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating subscription'
      });
    }
  }
);

// Update subscription
router.put('/update/:id', 
  authenticateToken,
  [
    body('propertyType').optional().isIn(['HDB', 'CONDOMINIUM', 'LANDED', 'COMMERCIAL']),
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

      const { propertyType, paymentMethod } = req.body;

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

        subscription.propertyType = propertyType;
        subscription.monthlyPrice = newTier.monthlyPrice;
      }

      if (paymentMethod) {
        subscription.paymentMethod = paymentMethod;
      }

      await subscription.save();
      await subscription.populate('customer', 'name email');

      res.json({
        success: true,
        data: subscription,
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

// Cancel subscription
router.post('/cancel/:id', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

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

    subscription.status = 'CANCELLED';
    subscription.cancelledAt = new Date();
    subscription.cancelReason = reason;
    subscription.isActive = false;

    await subscription.save();

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription'
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

module.exports = router;