const { MembershipTier, CustomerMembership } = require('../models/CustomerMembership');

// Initialize Stripe only if we have a real key
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_demo_key_for_development') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

class MembershipService {
  
  // Get all available membership tiers
  async getMembershipTiers() {
    return await MembershipTier.find({ isActive: true }).sort({ monthlyPrice: 1 });
  }

  // Get customer's current membership
  async getCustomerMembership(customerId) {
    return await CustomerMembership.findOne({ 
      customer: customerId, 
      status: 'ACTIVE' 
    }).populate('tier');
  }

  // Create new membership subscription
  async createMembership(customerId, tierId, billingCycle = 'MONTHLY', paymentMethodId) {
    const tier = await MembershipTier.findById(tierId);
    if (!tier) throw new Error('Invalid membership tier');

    // Check if customer already has active membership
    const existingMembership = await this.getCustomerMembership(customerId);
    if (existingMembership) {
      throw new Error('Customer already has an active membership');
    }

    // Check if we're in demo mode (using fake Stripe keys)
    const isDemoMode = process.env.STRIPE_SECRET_KEY.includes('demo') || process.env.STRIPE_SECRET_KEY.includes('test_demo');
    console.log('Demo mode:', isDemoMode, 'Stripe key:', process.env.STRIPE_SECRET_KEY);

    let stripeCustomerId = 'cus_demo_customer';
    let stripeSubscriptionId = 'sub_demo_subscription';

    if (!isDemoMode) {
      // Create Stripe customer if not exists
      try {
        const stripeCustomer = await stripe.customers.create({
          metadata: { userId: customerId.toString() }
        });
        stripeCustomerId = stripeCustomer.id;
      } catch (error) {
        throw new Error('Failed to create Stripe customer: ' + error.message);
      }
    }

    // Create Stripe subscription
    const price = billingCycle === 'YEARLY' ? tier.yearlyPrice : tier.monthlyPrice;
    const interval = billingCycle === 'YEARLY' ? 'year' : 'month';

    if (!isDemoMode) {
      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(price * 100), // Convert to cents
        currency: 'sgd',
        recurring: { interval },
        product_data: {
          name: `${tier.displayName} - ${billingCycle}`,
          description: tier.description
        }
      });

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePrice.id }],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent']
      });
      
      stripeSubscriptionId = subscription.id;
    }

    // Create membership record
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const membership = new CustomerMembership({
      customer: customerId,
      tier: tierId,
      billingCycle,
      startDate,
      endDate,
      nextBillingDate: endDate,
      stripeCustomerId,
      stripeSubscriptionId
    });

    await membership.resetMonthlyUsage();
    await membership.save();

    return await membership.populate('tier');
  }

  // Upgrade/Downgrade membership
  async changeMembership(customerId, newTierId, immediate = true) {
    const membership = await this.getCustomerMembership(customerId);
    if (!membership) throw new Error('No active membership found');

    const newTier = await MembershipTier.findById(newTierId);
    if (!newTier) throw new Error('Invalid membership tier');

    // Check if we're in demo mode
    const isDemoMode = process.env.STRIPE_SECRET_KEY.includes('demo') || process.env.STRIPE_SECRET_KEY.includes('test_demo');
    console.log('Plan change - Demo mode:', isDemoMode);

    const oldTier = membership.tier;
    
    // Calculate prorated amount
    const daysRemaining = Math.ceil((membership.endDate - new Date()) / (1000 * 60 * 60 * 24));
    const totalDays = membership.billingCycle === 'YEARLY' ? 365 : 30;
    const proratedOldAmount = (oldTier.monthlyPrice * daysRemaining) / totalDays;
    const proratedNewAmount = (newTier.monthlyPrice * daysRemaining) / totalDays;
    const proratedDifference = proratedNewAmount - proratedOldAmount;

    if (!isDemoMode && immediate && proratedDifference > 0) {
      // Charge the difference immediately for upgrades (only in real mode)
      await stripe.invoiceItems.create({
        customer: membership.stripeCustomerId,
        amount: Math.round(proratedDifference * 100),
        currency: 'sgd',
        description: `Prorated upgrade from ${oldTier.displayName} to ${newTier.displayName}`
      });

      const invoice = await stripe.invoices.create({
        customer: membership.stripeCustomerId,
        auto_advance: true
      });
      
      await stripe.invoices.pay(invoice.id);
    }

    // Update Stripe subscription (only in real mode)
    if (!isDemoMode) {
      const subscription = await stripe.subscriptions.retrieve(membership.stripeSubscriptionId);
      const newPrice = membership.billingCycle === 'YEARLY' ? newTier.yearlyPrice : newTier.monthlyPrice;
      
      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(newPrice * 100),
        currency: 'sgd',
        recurring: { interval: membership.billingCycle.toLowerCase() },
        product_data: {
          name: `${newTier.displayName} - ${membership.billingCycle}`,
          description: newTier.description
        }
      });

      await stripe.subscriptions.update(membership.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
        price: stripePrice.id
        }],
        proration_behavior: immediate ? 'create_prorations' : 'none'
      });
    }

    // Update membership record
    membership.tier = newTierId;
    await membership.save();

    return await membership.populate('tier');
  }

  // Cancel membership
  async cancelMembership(customerId, immediate = false) {
    const membership = await this.getCustomerMembership(customerId);
    if (!membership) throw new Error('No active membership found');

    if (!['ACTIVE', 'PENDING'].includes(membership.status)) {
      throw new Error('Membership is already cancelled or inactive');
    }

    // Check if we're in demo mode for Stripe
    const isStripeDemo = process.env.STRIPE_SECRET_KEY?.includes('demo') || process.env.STRIPE_SECRET_KEY?.includes('test_demo');
    const isHitPayDemo = process.env.HITPAY_SANDBOX === 'true';
    
    console.log('Plan cancel - Stripe Demo mode:', isStripeDemo, 'HitPay Demo mode:', isHitPayDemo);

    try {
      // Handle HitPay subscription cancellation - Use saved billing ID
      if (membership.paymentMethod === 'HITPAY') {
        console.log('🛑 Cancelling HitPay subscription...');
        console.log('🔍 Frontend→Backend: PUT /api/membership/cancel (internal API)');
        console.log('🔍 Backend→HitPay: Will use DELETE methods (external APIs)');
        console.log('📊 Cancellation Context:');
        console.log('  - Customer ID:', membership.customer);
        console.log('  - Membership ID:', membership._id);
        console.log('  - HitPay Billing ID:', membership.hitpayRecurringBillingId);
        console.log('  - HitPay Plan ID:', membership.hitpayPlanId);
        console.log('  - Tier:', membership.tier?.name);
        console.log('  - Status:', membership.status);
        
        const hitpayService = require('./hitpayService');
        
        // Step 1: Cancel recurring billing (this shows in HitPay dashboard) 
        // 🎯 This uses the billing ID we saved during subscription creation
        if (membership.hitpayRecurringBillingId) {
          // Check if this is a real HitPay billing ID vs our custom/demo ID
          const isRealHitPayId = membership.hitpayRecurringBillingId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          const isDemo = membership.hitpayRecurringBillingId.includes('demo_') || 
                         membership.hitpayRecurringBillingId.includes('membership_');
          
          if (isRealHitPayId && !isDemo) {
            console.log('🔄 [HITPAY DELETE] Cancelling recurring billing:', membership.hitpayRecurringBillingId);
            console.log('🌐 Method: DELETE /v1/recurring-billing/' + membership.hitpayRecurringBillingId);
            console.log('💡 This is a real HitPay billing ID');
            try {
              const recurringResult = await hitpayService.cancelRecurringBilling(membership.hitpayRecurringBillingId);
              console.log('✅ HitPay DELETE recurring billing - SUCCESS');
              console.log('📊 Cancellation confirmed for billing ID:', membership.hitpayRecurringBillingId);
              console.log('📊 HitPay response status:', recurringResult.status);
            } catch (recurringError) {
              console.warn('⚠️ HitPay DELETE recurring billing - FAILED:', recurringError.message);
              
              // Check if error is due to ID not found (already cancelled or doesn't exist)
              if (recurringError.message.includes('No query results')) {
                console.log('💡 Billing ID not found in HitPay - may already be cancelled or deleted');
              }
            }
          } else {
            console.log('⚠️ Skipping HitPay API call - this is not a real HitPay billing ID');
            console.log('🔍 Billing ID type detected:', isDemo ? 'demo/custom ID' : 'invalid format');
            console.log('🔍 Billing ID:', membership.hitpayRecurringBillingId);
            console.log('💡 Will only update local database status');
          }
        } else {
          console.log('❌ No billing ID found - cannot cancel HitPay subscription');
          console.log('💡 This might be a legacy subscription or manual entry');
        }
        
        // Step 2: Delete subscription plan (cleanup)
        if (membership.hitpayPlanId) {
          // Check if this is a real HitPay plan ID
          const isRealHitPayPlanId = membership.hitpayPlanId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          const isDemo = membership.hitpayPlanId.includes('demo_');
          
          if (isRealHitPayPlanId && !isDemo) {
            console.log('🗑️ [HITPAY DELETE] Deleting subscription plan:', membership.hitpayPlanId);
            console.log('🌐 Method: DELETE /v1/subscription-plan/' + membership.hitpayPlanId);
            try {
              const planResult = await hitpayService.cancelSubscriptionPlan(membership.hitpayPlanId);
              if (planResult.success) {
                console.log('✅ HitPay DELETE subscription plan - SUCCESS');
              } else {
                console.warn('⚠️ HitPay DELETE subscription plan - FAILED:', planResult.error);
              }
            } catch (planError) {
              console.warn('⚠️ HitPay DELETE subscription plan - ERROR:', planError.message);
              
              // Check if error is due to ID not found
              if (planError.message.includes('No query results')) {
                console.log('💡 Plan ID not found in HitPay - may already be deleted');
              }
            }
          } else {
            console.log('⚠️ Skipping HitPay plan deletion - not a real HitPay plan ID');
            console.log('🔍 Plan ID:', membership.hitpayPlanId);
          }
        }
        
        // Skip if demo/test subscription
        if (isHitPayDemo || (membership.hitpayRecurringBillingId && membership.hitpayRecurringBillingId.includes('demo_'))) {
          console.log('⚠️ Skipping HitPay cancellation for demo/test subscription');
        }
      }

      // Handle Stripe subscription cancellation
      if (membership.stripeSubscriptionId && !isStripeDemo) {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.update(membership.stripeSubscriptionId, {
          cancel_at_period_end: !immediate
        });
        console.log('✅ Stripe subscription cancellation scheduled');
      }

      // Update membership status based on cancellation type
      if (immediate) {
        membership.status = 'EXPIRED'; // Immediate cancellation = expired
        membership.endDate = new Date();
        membership.autoRenew = false;
        membership.cancelledAt = new Date();
        membership.willExpireAt = new Date();
        membership.cancellationReason = 'Immediate cancellation requested';
        console.log('✅ Membership cancelled and expired immediately');
      } else {
        // Cancel recurring billing but maintain access until period ends
        membership.status = 'CANCELLED'; // Change status to CANCELLED to show user it's cancelled
        membership.autoRenew = false;
        membership.cancelledAt = new Date(); // Track when cancellation was requested
        membership.willExpireAt = membership.endDate; // Make it explicit when access ends
        membership.cancellationReason = 'End-of-period cancellation requested';
        
        console.log('✅ Subscription cancelled - access maintained until:', membership.endDate);
        console.log('✅ Status changed to CANCELLED - user can see it\'s cancelled but still has access');
        console.log('✅ No more charges will be taken from HitPay/Stripe');
        console.log('✅ Will automatically expire on:', membership.endDate);
      }

      await membership.save();
      return membership;

    } catch (error) {
      console.error('❌ Error during membership cancellation:', error);
      throw new Error('Failed to cancel membership: ' + error.message);
    }
  }

  // Check if customer can create service request
  async canCreateServiceRequest(customerId) {
    const membership = await this.getCustomerMembership(customerId);
    if (!membership) return { allowed: true, reason: 'No membership - pay per service' };

    await membership.resetMonthlyUsage();
    
    // Use the new access logic that handles CANCELLED status properly
    if (membership.hasActiveAccess() && membership.canCreateServiceRequest()) {
      return { allowed: true, membership };
    } else if (!membership.hasActiveAccess()) {
      const accessStatus = membership.getAccessStatus();
      return { 
        allowed: false, 
        reason: accessStatus.statusMessage,
        membership 
      };
    } else {
      return { 
        allowed: false, 
        reason: 'Monthly service request limit reached',
        membership 
      };
    }
  }

  // Use service request quota
  async useServiceRequest(customerId, isEmergency = false) {
    const membership = await this.getCustomerMembership(customerId);
    if (!membership) return null;

    await membership.resetMonthlyUsage();

    if (membership.canCreateServiceRequest()) {
      membership.currentUsage.serviceRequestsUsed += 1;
      if (isEmergency) {
        membership.currentUsage.emergencyRequestsUsed += 1;
      }
      await membership.save();
      return membership;
    }

    throw new Error('Service request limit exceeded');
  }

  // Get membership benefits for a job
  async getMembershipBenefits(customerId) {
    const membership = await this.getCustomerMembership(customerId);
    if (!membership) return null;

    return {
      responseTimeHours: membership.getResponseTime(),
      materialDiscountPercent: membership.getMaterialDiscount(),
      emergencyServiceAllowed: membership.tier.features.emergencyService,
      prioritySupport: membership.tier.features.prioritySupport,
      dedicatedManager: membership.tier.features.dedicatedManager
    };
  }

  // Process monthly billing
  async processMonthlyBilling() {
    const today = new Date();
    const memberships = await CustomerMembership.find({
      status: 'ACTIVE',
      nextBillingDate: { $lte: today },
      autoRenew: true
    }).populate('tier');

    const results = [];
    
    for (const membership of memberships) {
      try {
        // Reset usage for new billing period
        await membership.resetMonthlyUsage();
        
        // Update next billing date
        const nextBillingDate = new Date(membership.nextBillingDate);
        if (membership.billingCycle === 'YEARLY') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
        
        membership.nextBillingDate = nextBillingDate;
        membership.endDate = nextBillingDate;
        await membership.save();

        results.push({ membership: membership._id, status: 'success' });
      } catch (error) {
        console.error(`Failed to process billing for membership ${membership._id}:`, error);
        results.push({ 
          membership: membership._id, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Get membership analytics
  async getMembershipAnalytics(customerId) {
    const membership = await this.getCustomerMembership(customerId);
    if (!membership) return null;

    await membership.resetMonthlyUsage();

    const tierFeatures = membership.tier.features;
    const usage = membership.currentUsage;

    return {
      tier: membership.tier.displayName,
      billingCycle: membership.billingCycle,
      nextBillingDate: membership.nextBillingDate,
      usage: {
        serviceRequests: {
          used: usage.serviceRequestsUsed,
          limit: tierFeatures.serviceRequestsPerMonth === -1 ? 'Unlimited' : tierFeatures.serviceRequestsPerMonth,
          remaining: tierFeatures.serviceRequestsPerMonth === -1 ? 'Unlimited' : 
                     Math.max(0, tierFeatures.serviceRequestsPerMonth - usage.serviceRequestsUsed)
        },
        materialDiscount: {
          percentage: tierFeatures.materialDiscountPercent,
          totalSaved: usage.materialDiscountUsed
        },
        inspections: {
          used: usage.inspectionCreditsUsed,
          available: tierFeatures.annualInspections
        }
      },
      benefits: {
        responseTime: `${tierFeatures.responseTimeHours} hours`,
        emergencyService: tierFeatures.emergencyService,
        prioritySupport: tierFeatures.prioritySupport,
        dedicatedManager: tierFeatures.dedicatedManager
      }
    };
  }
}

module.exports = new MembershipService();