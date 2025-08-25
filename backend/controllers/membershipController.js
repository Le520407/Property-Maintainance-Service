const membershipService = require('../services/membershipService');
const { validationResult } = require('express-validator');
const { CustomerMembership } = require('../models/CustomerMembership');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class MembershipController {
  
  // Get all membership tiers
  async getTiers(req, res) {
    try {
      const tiers = await membershipService.getMembershipTiers();
      res.json({
        success: true,
        tiers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch membership tiers',
        error: error.message
      });
    }
  }

  // Get current user's membership
  async getMyMembership(req, res) {
    try {
      const userId = req.user._id;
      const membership = await membershipService.getCustomerMembership(userId);
      
      if (!membership) {
        return res.json({
          success: true,
          membership: null,
          message: 'No active membership found'
        });
      }

      const analytics = await membershipService.getMembershipAnalytics(userId);

      res.json({
        success: true,
        membership,
        analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch membership details',
        error: error.message
      });
    }
  }

  // Subscribe to a membership plan
  async subscribe(req, res) {
    try {
      console.log('Membership subscription request:', {
        userId: req.user?._id,
        body: req.body
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user._id;
      const { tierId, billingCycle, paymentMethodId } = req.body;

      console.log('Creating membership for:', { userId, tierId, billingCycle, paymentMethodId });

      const membership = await membershipService.createMembership(
        userId, 
        tierId, 
        billingCycle, 
        paymentMethodId
      );

      console.log('Membership created successfully:', membership._id);

      res.status(201).json({
        success: true,
        message: 'Membership created successfully',
        membership
      });
    } catch (error) {
      console.error('Membership creation error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create membership',
        error: error.message
      });
    }
  }

  // Change membership plan (upgrade/downgrade)
  async changePlan(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user._id;
      const { newTierId, immediate = true } = req.body;

      const membership = await membershipService.changeMembership(
        userId, 
        newTierId, 
        immediate
      );

      res.json({
        success: true,
        message: 'Membership updated successfully',
        membership
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to update membership',
        error: error.message
      });
    }
  }

  // Cancel membership
  async cancel(req, res) {
    try {
      const userId = req.user._id;
      const { immediate = false } = req.body;

      const membership = await membershipService.cancelMembership(userId, immediate);

      res.json({
        success: true,
        message: immediate ? 'Membership cancelled immediately' : 'Membership will be cancelled at the end of billing period',
        membership
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to cancel membership',
        error: error.message
      });
    }
  }

  // Check service request eligibility
  async checkServiceEligibility(req, res) {
    try {
      const userId = req.user._id;
      const eligibility = await membershipService.canCreateServiceRequest(userId);

      res.json({
        success: true,
        eligibility
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check eligibility',
        error: error.message
      });
    }
  }

  // Get membership benefits
  async getBenefits(req, res) {
    try {
      const userId = req.user._id;
      const benefits = await membershipService.getMembershipBenefits(userId);

      res.json({
        success: true,
        benefits
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch benefits',
        error: error.message
      });
    }
  }

  // Get membership analytics/usage
  async getAnalytics(req, res) {
    try {
      const userId = req.user._id;
      const analytics = await membershipService.getMembershipAnalytics(userId);

      if (!analytics) {
        return res.json({
          success: true,
          analytics: null,
          message: 'No active membership found'
        });
      }

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  }

  // Webhook to handle Stripe events
  async webhookHandler(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async handleSubscriptionUpdated(subscription) {
    // Update membership status based on Stripe subscription
    const membership = await CustomerMembership.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (membership) {
      if (subscription.status === 'active') {
        membership.status = 'ACTIVE';
      } else if (subscription.status === 'canceled') {
        membership.status = 'CANCELLED';
      }
      
      await membership.save();
    }
  }

  async handleSubscriptionDeleted(subscription) {
    const membership = await CustomerMembership.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (membership) {
      membership.status = 'CANCELLED';
      membership.endDate = new Date();
      await membership.save();
    }
  }

  async handlePaymentSucceeded(invoice) {
    // Reset usage when payment succeeds for new billing period
    if (invoice.billing_reason === 'subscription_cycle') {
      const membership = await CustomerMembership.findOne({
        stripeCustomerId: invoice.customer
      });

      if (membership) {
        await membership.resetMonthlyUsage();
      }
    }
  }

  async handlePaymentFailed(invoice) {
    const membership = await CustomerMembership.findOne({
      stripeCustomerId: invoice.customer
    });

    if (membership) {
      membership.status = 'SUSPENDED';
      await membership.save();
      
      // Send notification email to customer
      // TODO: Implement email notification
    }
  }
}

module.exports = new MembershipController();