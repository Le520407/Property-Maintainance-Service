const membershipService = require('../services/membershipService');
const hitpayService = require('../services/hitpayService');
const { validationResult } = require('express-validator');
const { CustomerMembership } = require('../models/CustomerMembership');

// Force HitPay service out of demo mode if we have real API key
if (process.env.HITPAY_SANDBOX === 'false' && process.env.HITPAY_API_KEY?.startsWith('test_')) {
  hitpayService.isDemo = false;
  hitpayService.isSandbox = true;
  console.log('🔧 Forced HitPay service out of demo mode for real API');
}

// Initialize Stripe only if we have a real key
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_demo_key_for_development') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

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

  // Subscribe to a membership plan using HitPay
  async subscribe(req, res) {
    try {
      console.log('HitPay membership subscription request:', {
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
      const { tierId, billingCycle = 'MONTHLY' } = req.body;

      console.log('Creating HitPay subscription for:', { userId, tierId, billingCycle });

      // Get tier details
      const tiers = await membershipService.getMembershipTiers();
      const selectedTier = tiers.find(tier => tier._id.toString() === tierId);
      
      if (!selectedTier) {
        return res.status(404).json({
          success: false,
          message: 'Membership tier not found'
        });
      }

      // Check if user already has active membership
      const existingMembership = await membershipService.getCustomerMembership(userId);
      if (existingMembership && existingMembership.status === 'ACTIVE') {
        // For HitPay integration, we treat this as an upgrade/change request
        console.log('User has existing membership, treating as change plan request');
        return res.status(400).json({
          success: false,
          message: 'You already have an active membership. Please use the upgrade option instead.',
          shouldUseUpgrade: true
        });
      }

      // Calculate amount and cycle
      const amount = billingCycle === 'YEARLY' ? selectedTier.yearlyPrice : selectedTier.monthlyPrice;
      const cycle = billingCycle.toLowerCase(); // 'monthly' or 'yearly'
      
      // Step 1: Create subscription plan in HitPay
      const planData = {
        name: `${selectedTier.displayName} - ${billingCycle}`,
        description: selectedTier.description,
        amount: amount,
        currency: 'SGD',
        cycle: cycle,
        reference: `plan_${selectedTier._id}_${billingCycle.toLowerCase()}`
      };

      console.log('Creating HitPay subscription plan:', planData);
      
      let hitpayPlan, recurringBilling;
      
      try {
        hitpayPlan = await hitpayService.createSubscriptionPlan(planData);
        console.log('HitPay plan created:', hitpayPlan);
      } catch (planError) {
        console.error('Failed to create HitPay plan:', planError);
        // If HitPay API fails, fall back to demo mode
        hitpayPlan = {
          id: `demo_plan_${Date.now()}`,
          name: planData.name,
          amount: planData.amount,
          currency: planData.currency || 'SGD',
          cycle: planData.cycle,
          reference: planData.reference,
          status: 'active',
          demo: true
        };
        console.log('Using demo plan fallback:', hitpayPlan);
      }

      // Step 2: Create recurring billing for customer
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow
      
      const billingData = {
        planId: hitpayPlan.id,
        customerEmail: req.user.email,
        customerName: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
        startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
        redirectUrl: `${process.env.FRONTEND_URL}/membership/success`,
        reference: `sub_${userId}_${Date.now()}`,
        paymentMethods: ['card', 'paynow'] // Support both card and PayNow
      };

      console.log('Creating HitPay recurring billing:', billingData);
      
      try {
        recurringBilling = await hitpayService.createRecurringBilling(billingData);
        console.log('HitPay recurring billing created:', recurringBilling);
      } catch (billingError) {
        console.error('Failed to create HitPay billing:', billingError);
        // If HitPay API fails, fall back to demo mode
        recurringBilling = {
          id: `demo_billing_${Date.now()}`,
          plan_id: hitpayPlan.id,
          status: 'pending',
          url: `${process.env.FRONTEND_URL}/membership/success?payment_id=demo_payment_${Date.now()}&recurring_billing_id=demo_billing_${Date.now()}&status=completed&demo=true`,
          customer_email: req.user.email,
          customer_name: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
          start_date: startDate.toISOString().split('T')[0],
          reference: billingData.reference,
          demo: true
        };
        console.log('Using demo billing fallback:', recurringBilling);
      }

      // Store the subscription details in our database (pending until payment)
      const membership = new CustomerMembership({
        customer: userId,
        tier: tierId,
        status: 'PENDING',
        billingCycle: billingCycle,
        monthlyPrice: selectedTier.monthlyPrice,
        yearlyPrice: selectedTier.yearlyPrice,
        currentPrice: amount,
        hitpayPlanId: hitpayPlan.id,
        hitpayRecurringBillingId: recurringBilling.id,
        nextBillingDate: startDate,
        startDate: new Date(),
        paymentMethod: 'HITPAY'
      });

      await membership.save();

      console.log('Membership created successfully:', membership._id);

      // Return the HitPay checkout URL for frontend redirect
      res.status(201).json({
        success: true,
        message: hitpayPlan.demo || recurringBilling.demo ? 
          'Demo mode: Subscription plan created. Use the demo checkout URL.' : 
          'Subscription plan created. Redirecting to HitPay checkout.',
        membership: {
          id: membership._id,
          tier: selectedTier,
          billingCycle,
          amount,
          status: 'PENDING'
        },
        checkoutUrl: recurringBilling.url, // HitPay checkout URL (real or demo)
        hitpayData: {
          planId: hitpayPlan.id,
          recurringBillingId: recurringBilling.id
        },
        demo: hitpayPlan.demo || recurringBilling.demo || false
      });

    } catch (error) {
      console.error('HitPay membership creation error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create membership subscription',
        error: error.message
      });
    }
  }

  // Create one-time payment for membership (alternative to subscription)
  async createPayment(req, res) {
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
      const { tierId, billingCycle = 'MONTHLY' } = req.body;

      console.log('Creating one-time membership payment:', { userId, tierId, billingCycle });

      // Import the model directly since we need it
      const { MembershipTier } = require('../models/CustomerMembership');
      
      const selectedTier = await MembershipTier.findById(tierId);
      if (!selectedTier) {
        return res.status(404).json({
          success: false,
          message: 'Membership tier not found'
        });
      }

      // Check if user already has active membership
      const existingMembership = await membershipService.getCustomerMembership(userId);
      if (existingMembership && existingMembership.status === 'ACTIVE') {
        return res.status(400).json({
          success: false,
          message: 'You already have an active membership. Please use the upgrade option instead.',
          shouldUseUpgrade: true
        });
      }

      // Calculate amount based on billing cycle
      const amount = billingCycle === 'YEARLY' ? selectedTier.yearlyPrice : selectedTier.monthlyPrice;
      
      // Create HitPay one-time payment request
      const paymentData = {
        amount: amount,
        currency: 'SGD',
        email: req.user.email,
        redirect_url: `${process.env.FRONTEND_URL}/membership/success`,
        reference_number: `membership_${userId}_${tierId}_${Date.now()}`,
        webhook: process.env.WEBHOOK_URL || 'https://swiftfixpay.com',
        name: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
        purpose: `${selectedTier.displayName} Membership - ${billingCycle}`,
        send_email: true
        // Remove payment_methods to let HitPay use account defaults
      };

      console.log('Creating HitPay payment request for membership:', paymentData);
      
      let hitpayPayment;
      try {
        hitpayPayment = await hitpayService.createPayment(paymentData);
        console.log('HitPay payment request created:', hitpayPayment);
      } catch (paymentError) {
        console.error('Failed to create HitPay payment:', paymentError);
        throw new Error('Failed to create payment request: ' + paymentError.message);
      }

      // Store the membership details in our database (pending until payment)
      const membership = new CustomerMembership({
        customer: userId,
        tier: tierId,
        status: 'PENDING',
        billingCycle: billingCycle,
        monthlyPrice: selectedTier.monthlyPrice,
        yearlyPrice: selectedTier.yearlyPrice,
        currentPrice: amount,
        paymentMethod: 'HITPAY',
        startDate: new Date(),
        // For one-time payments, set end date based on billing cycle
        endDate: billingCycle === 'YEARLY' ? 
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : // 1 year
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),   // 1 month
        autoRenew: false, // One-time payments don't auto-renew
        // Store payment reference for webhook processing
        hitpayPlanId: hitpayPayment.payment_request_id || hitpayPayment.id,
        hitpayRecurringBillingId: paymentData.reference_number
      });

      await membership.save();

      console.log('One-time membership payment created successfully:', membership._id);

      // Return the HitPay payment URL for frontend redirect
      res.status(201).json({
        success: true,
        message: 'One-time payment created. Redirecting to HitPay checkout.',
        membership: {
          id: membership._id,
          tier: selectedTier,
          billingCycle,
          amount,
          status: 'PENDING',
          paymentType: 'ONE_TIME'
        },
        paymentUrl: hitpayPayment.url, // HitPay payment URL
        paymentRequestId: hitpayPayment.payment_request_id || hitpayPayment.id,
        reference: paymentData.reference_number
      });

    } catch (error) {
      console.error('HitPay one-time payment creation error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create one-time payment',
        error: error.message
      });
    }
  }

  // Change membership plan (upgrade/downgrade) using HitPay
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
      const { newTierId, billingCycle = 'MONTHLY' } = req.body;

      console.log('HitPay plan change request:', { userId, newTierId, billingCycle });

      // Get current membership
      const currentMembership = await membershipService.getCustomerMembership(userId);
      if (!currentMembership) {
        return res.status(404).json({
          success: false,
          message: 'No active membership found'
        });
      }

      // Get new tier details
      const tiers = await membershipService.getMembershipTiers();
      const newTier = tiers.find(tier => tier._id.toString() === newTierId);
      
      if (!newTier) {
        return res.status(404).json({
          success: false,
          message: 'Membership tier not found'
        });
      }

      // Calculate amount and cycle
      const amount = billingCycle === 'YEARLY' ? newTier.yearlyPrice : newTier.monthlyPrice;
      const cycle = billingCycle.toLowerCase();
      
      // Step 1: Create new subscription plan in HitPay
      const planData = {
        name: `${newTier.displayName} - ${billingCycle} (Upgrade)`,
        description: newTier.description,
        amount: amount,
        currency: 'SGD',
        cycle: cycle,
        reference: `plan_upgrade_${newTier._id}_${billingCycle.toLowerCase()}`
      };

      console.log('Creating HitPay subscription plan for upgrade:', planData);
      const hitpayPlan = await hitpayService.createSubscriptionPlan(planData);
      console.log('HitPay plan created for upgrade:', hitpayPlan);

      // Step 2: Create recurring billing for customer
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow
      
      const billingData = {
        planId: hitpayPlan.id,
        customerEmail: req.user.email,
        customerName: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
        startDate: startDate.toISOString().split('T')[0],
        redirectUrl: `${process.env.FRONTEND_URL}/membership/success`,
        reference: `upgrade_${userId}_${Date.now()}`,
        paymentMethods: ['card', 'paynow']
      };

      console.log('Creating HitPay recurring billing for upgrade:', billingData);
      const recurringBilling = await hitpayService.createRecurringBilling(billingData);
      console.log('HitPay recurring billing created for upgrade:', recurringBilling);

      // Update the existing membership with new HitPay details (pending until payment)
      currentMembership.tier = newTierId;
      currentMembership.billingCycle = billingCycle;
      currentMembership.monthlyPrice = newTier.monthlyPrice;
      currentMembership.yearlyPrice = newTier.yearlyPrice;
      currentMembership.currentPrice = amount;
      currentMembership.status = 'PENDING'; // Will be ACTIVE after payment
      currentMembership.hitpayPlanId = hitpayPlan.id;
      currentMembership.hitpayRecurringBillingId = recurringBilling.id;
      currentMembership.nextBillingDate = startDate;
      currentMembership.paymentMethod = 'HITPAY';

      await currentMembership.save();

      console.log('Membership updated for upgrade:', currentMembership._id);

      // Return the HitPay checkout URL for frontend redirect
      res.json({
        success: true,
        message: 'Plan upgrade initiated. Redirecting to HitPay checkout.',
        membership: {
          id: currentMembership._id,
          tier: newTier,
          billingCycle,
          amount,
          status: 'PENDING'
        },
        checkoutUrl: recurringBilling.url, // HitPay checkout URL
        hitpayData: {
          planId: hitpayPlan.id,
          recurringBillingId: recurringBilling.id
        }
      });

    } catch (error) {
      console.error('HitPay plan change error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to update membership plan',
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