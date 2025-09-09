const MembershipUpgradeService = require('../services/membershipUpgradeService');
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

      // Calculate period end date (for display purposes)
      const periodEndDate = membership.endDate || membership.nextBillingDate;
      
      // Enhance membership data with billing information
      const enhancedMembership = {
        ...membership.toObject(),
        billingInfo: {
          nextBillingDate: membership.nextBillingDate,
          periodEndDate: periodEndDate,
          billingCycle: membership.billingCycle,
          currentPrice: membership.currentPrice,
          autoRenew: membership.autoRenew,
          daysUntilRenewal: membership.nextBillingDate ? 
            Math.ceil((new Date(membership.nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
        },
        canUpgrade: membership.status === 'ACTIVE',
        canCancel: membership.status === 'ACTIVE',
        canReactivate: ['CANCELLED', 'SUSPENDED'].includes(membership.status)
      };

      const analytics = await membershipService.getMembershipAnalytics(userId);
      res.json({
        success: true,
        membership: enhancedMembership,
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

      // Check if user already has any membership and handle accordingly
      const existingMembership = await membershipService.getCustomerMembership(userId);
      let refundInfo = null;
      
      if (existingMembership && ['ACTIVE', 'PENDING', 'SUSPENDED'].includes(existingMembership.status)) {
        console.log('User has existing membership, will cancel and upgrade');
        
        // Calculate what refund/credit they would get
        const calculation = MembershipUpgradeService.calculatePlanChangeAmount(
          existingMembership, 
          selectedTier, 
          billingCycle
        );
        
        refundInfo = calculation;
        console.log('Plan change calculation:', calculation);
        
        // Cancel existing memberships
        await MembershipUpgradeService.cancelExistingMembership(userId, 'PLAN_CHANGE');
        
        // Adjust the amount to charge based on refund
        const amount = calculation.netAmount;
        console.log(`Adjusted amount after refund: $${amount} (was $${calculation.newPlanAmount})`);
      }

      // Calculate amount and cycle (use refund-adjusted amount if applicable)
      const baseAmount = billingCycle === 'YEARLY' ? selectedTier.yearlyPrice : selectedTier.monthlyPrice;
      const amount = refundInfo ? refundInfo.netAmount : baseAmount;
      const cycle = billingCycle.toLowerCase(); // 'monthly' or 'yearly'
      
      // Step 1: Create subscription plan in HitPay
      const planData = {
        name: `${selectedTier.displayName} - ${billingCycle}${refundInfo ? ' (Plan Change)' : ''}`,
        description: refundInfo 
          ? `${selectedTier.description} (Plan change - Net amount after refund: $${amount})` 
          : selectedTier.description,
        amount: amount,
        currency: 'SGD',
        cycle: cycle,
        reference: `plan_${selectedTier._id}_${billingCycle.toLowerCase()}${refundInfo ? '_change' : ''}`
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
      let amount;
      if (billingCycle === 'YEARLY') {
        // If yearly price is not set, calculate as 10 months (2 months discount)
        amount = selectedTier.yearlyPrice || (selectedTier.monthlyPrice * 10);
      } else {
        amount = selectedTier.monthlyPrice;
      }
      
      console.log('Payment calculation:', { 
        tier: selectedTier.name, 
        billingCycle, 
        monthlyPrice: selectedTier.monthlyPrice,
        yearlyPrice: selectedTier.yearlyPrice,
        calculatedAmount: amount 
      });
      
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
      const startDate = new Date();
      const nextBillingDate = billingCycle === 'YEARLY' ? 
        new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000) : // 1 year
        new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);   // 1 month
      
      const membership = new CustomerMembership({
        customer: userId,
        tier: tierId,
        status: 'PENDING',
        billingCycle: billingCycle,
        monthlyPrice: selectedTier.monthlyPrice,
        yearlyPrice: selectedTier.yearlyPrice || (selectedTier.monthlyPrice * 10),
        currentPrice: amount,
        paymentMethod: 'HITPAY',
        startDate: startDate,
        // For one-time payments, set end date based on billing cycle
        endDate: nextBillingDate,
        nextBillingDate: nextBillingDate,
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
      console.log('=== CHANGE PLAN REQUEST START ===');
      console.log('Request body:', req.body);
      console.log('User:', req.user?.email, req.user?._id);
      console.log('User role:', req.user?.role);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
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
      
      let hitpayPlan;
      let recurringBilling;
      
      try {
        hitpayPlan = await hitpayService.createSubscriptionPlan(planData);
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
        recurringBilling = await hitpayService.createRecurringBilling(billingData);
        console.log('HitPay recurring billing created for upgrade:', recurringBilling);
        
      } catch (hitpayError) {
        console.log('HitPay plan change error:', hitpayError);
        
        // Check if it's an API key error - fall back to demo mode
        if (hitpayError.message && hitpayError.message.includes('Invalid business api key')) {
          console.log('🔄 HitPay API key invalid - switching to demo mode for plan change');
          
          // Demo mode: Just update the membership directly
          currentMembership.tier = newTierId;
          currentMembership.billingCycle = billingCycle;
          currentMembership.monthlyPrice = newTier.monthlyPrice;
          currentMembership.yearlyPrice = newTier.yearlyPrice;
          currentMembership.currentPrice = amount;
          currentMembership.status = 'ACTIVE'; // Set to ACTIVE in demo mode
          currentMembership.paymentMethod = 'MANUAL';
          currentMembership.nextBillingDate = new Date(Date.now() + (billingCycle === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000);
          
          await currentMembership.save();
          
          console.log('✅ Membership plan changed successfully in demo mode');
          
          return res.status(200).json({
            success: true,
            message: 'Membership plan changed successfully (Demo Mode)',
            data: {
              membership: currentMembership,
              isDemo: true
            }
          });
        } else {
          // Re-throw non-API key errors
          throw hitpayError;
        }
      }

      // For successful HitPay integration, update the membership
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow
      
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

  // Preview plan change costs (no actual changes made)
  async previewPlanChange(req, res) {
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
          message: 'New membership tier not found'
        });
      }

      // Calculate the costs
      const calculation = MembershipUpgradeService.calculatePlanChangeAmount(
        currentMembership,
        newTier,
        billingCycle
      );

      res.json({
        success: true,
        preview: {
          currentPlan: {
            name: currentMembership.tier?.displayName || 'Current Plan',
            amount: currentMembership.currentPrice || currentMembership.monthlyPrice,
            billingCycle: currentMembership.billingCycle
          },
          newPlan: {
            name: newTier.displayName,
            amount: calculation.newPlanAmount,
            billingCycle: billingCycle
          },
          financial: {
            refundFromCurrentPlan: calculation.refundAmount,
            newPlanCost: calculation.newPlanAmount,
            netAmountToPay: calculation.netAmount,
            refundToCustomer: calculation.refundToCustomer,
            isUpgrade: calculation.isUpgrade,
            needsPayment: calculation.needsPayment
          },
          summary: calculation.needsPayment 
            ? `You will pay $${calculation.netAmount} for the plan change` 
            : `You will receive a refund of $${calculation.refundToCustomer}`
        }
      });

    } catch (error) {
      console.error('Plan change preview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview plan change',
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

  // Reactivate a cancelled or suspended membership
  async reactivate(req, res) {
    try {
      const userId = req.user._id;
      
      // Find the user's membership
      const membership = await CustomerMembership.findOne({ 
        customer: userId 
      }).populate('tier');

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'No membership found'
        });
      }

      if (!['CANCELLED', 'SUSPENDED'].includes(membership.status)) {
        return res.status(400).json({
          success: false,
          message: 'Membership is already active or cannot be reactivated'
        });
      }

      // Create a new payment for reactivation
      const amount = membership.billingCycle === 'YEARLY' ? 
        membership.yearlyPrice : membership.monthlyPrice;

      const paymentData = {
        amount: amount,
        currency: 'SGD',
        email: req.user.email,
        redirect_url: `${process.env.FRONTEND_URL}/membership/success`,
        reference_number: `reactivate_${userId}_${membership._id}_${Date.now()}`,
        webhook: process.env.WEBHOOK_URL || 'https://ttytyd.com',
        name: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
        purpose: `Reactivate ${membership.tier.displayName} Membership`,
        send_email: true
      };

      console.log('Creating HitPay payment for membership reactivation:', paymentData);
      
      let hitpayPayment;
      try {
        hitpayPayment = await hitpayService.createPayment(paymentData);
        console.log('HitPay reactivation payment created:', hitpayPayment);
      } catch (paymentError) {
        console.error('Failed to create HitPay reactivation payment:', paymentError);
        throw new Error('Failed to create reactivation payment: ' + paymentError.message);
      }

      // Update membership with new payment info but keep it in current status until payment
      membership.hitpayPlanId = hitpayPayment.payment_request_id || hitpayPayment.id;
      membership.hitpayRecurringBillingId = paymentData.reference_number;
      await membership.save();

      res.json({
        success: true,
        message: 'Reactivation payment created. Please complete the payment to reactivate your membership.',
        paymentUrl: hitpayPayment.url,
        paymentRequestId: hitpayPayment.payment_request_id || hitpayPayment.id,
        membership: {
          id: membership._id,
          tier: membership.tier,
          status: membership.status,
          amount
        }
      });

    } catch (error) {
      console.error('Membership reactivation error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to reactivate membership',
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

  // HitPay webhook handler
  hitpayWebhookHandler = async (req, res) => {
    try {
      console.log('🔔 HitPay webhook received:', req.body);
      
      const { status } = req.body;
      
      // Verify webhook signature if secret is available
      if (process.env.HITPAY_WEBHOOK_SECRET) {
        // TODO: Implement HitPay webhook signature verification
        console.log('⚠️ HitPay webhook signature verification not implemented yet');
      }

      // Handle different payment statuses
      switch (status) {
        case 'completed':
          await this.handleHitPayPaymentCompleted(req.body);
          break;
        case 'failed':
          await this.handleHitPayPaymentFailed(req.body);
          break;
        case 'cancelled':
          await this.handleHitPayPaymentCancelled(req.body);
          break;
        default:
          console.log(`Unhandled HitPay webhook status: ${status}`);
      }

      res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('HitPay webhook handler error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async handleHitPayPaymentCompleted(paymentData) {
    try {
      const { payment_request_id, reference_number, amount } = paymentData;
      
      console.log('💰 Processing completed HitPay payment:', { payment_request_id, reference_number, amount });

      // Find the membership by payment reference
      const membership = await CustomerMembership.findOne({
        $or: [
          { hitpayPlanId: payment_request_id },
          { hitpayRecurringBillingId: reference_number }
        ]
      }).populate('tier');

      if (!membership) {
        console.error('❌ Membership not found for payment:', { payment_request_id, reference_number });
        return;
      }

      console.log('📋 Found membership:', { id: membership._id, status: membership.status });

      // Update start date if this is the first payment (was pending)
      const wasPending = membership.status === 'PENDING';
      
      // Update membership status to ACTIVE
      membership.status = 'ACTIVE';
      
      // Calculate next billing date based on billing cycle
      const now = new Date();
      if (membership.billingCycle === 'YEARLY') {
        membership.nextBillingDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      } else {
        membership.nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
      }

      // Update start date if this was the first payment
      if (wasPending) {
        membership.startDate = now;
      }

      await membership.save();

      console.log('✅ Membership activated successfully:', {
        membershipId: membership._id,
        customer: membership.customer,
        tier: membership.tier.name,
        nextBillingDate: membership.nextBillingDate
      });

      // TODO: Send confirmation email to customer
      
    } catch (error) {
      console.error('Error handling HitPay payment completion:', error);
    }
  }

  async handleHitPayPaymentFailed(paymentData) {
    try {
      const { payment_request_id, reference_number } = paymentData;
      
      console.log('❌ Processing failed HitPay payment:', { payment_request_id, reference_number });

      const membership = await CustomerMembership.findOne({
        $or: [
          { hitpayPlanId: payment_request_id },
          { hitpayRecurringBillingId: reference_number }
        ]
      });

      if (membership) {
        membership.status = 'SUSPENDED';
        await membership.save();
        
        console.log('⚠️ Membership suspended due to payment failure:', membership._id);
        // TODO: Send payment failure notification email
      }
    } catch (error) {
      console.error('Error handling HitPay payment failure:', error);
    }
  }

  async handleHitPayPaymentCancelled(paymentData) {
    try {
      const { payment_request_id, reference_number } = paymentData;
      
      console.log('❌ Processing cancelled HitPay payment:', { payment_request_id, reference_number });

      const membership = await CustomerMembership.findOne({
        $or: [
          { hitpayPlanId: payment_request_id },
          { hitpayRecurringBillingId: reference_number }
        ]
      });

      if (membership && membership.status === 'PENDING') {
        // If it was a new subscription that got cancelled, remove it
        await membership.deleteOne();
        console.log('🗑️ Pending membership removed due to payment cancellation:', membership._id);
      }
    } catch (error) {
      console.error('Error handling HitPay payment cancellation:', error);
    }
  }
}

module.exports = new MembershipController();