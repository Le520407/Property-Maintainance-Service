const express = require('express');
const router = express.Router();
const qs = require('querystring');
const hitpayService = require('../services/hitpayService');
const { CustomerSubscription, SubscriptionTier } = require('../models/CustomerSubscription');
const CustomerMembership = require('../models/CustomerMembership');
const { VendorMembership } = require('../models/VendorMembership');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const { auth } = require('../middleware/auth');

/**
 * Demo success handler for development testing
 */
router.get('/demo/success', async (req, res) => {
  try {
    const { payment_id, recurring_billing_id, status } = req.query;
    
    console.log('Demo success handler called:', { payment_id, recurring_billing_id, status });
    
    // For demo mode, we simulate successful payment processing
    if (recurring_billing_id && recurring_billing_id.startsWith('demo_billing_')) {
      // Find and activate the pending membership
      const membership = await CustomerMembership.findOne({
        hitpayRecurringBillingId: recurring_billing_id,
        status: 'PENDING'
      });
      
      if (membership) {
        console.log('🧪 Demo: Activating pending membership:', {
          membershipId: membership._id,
          currentStatus: membership.status
        });
        
        membership.status = 'ACTIVE';
        membership.isActive = true;
        membership.startDate = new Date();
        membership.lastPaymentDate = new Date();
        
        // Set end date for demo
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        membership.endDate = endDate;
        
        await membership.save();
        
        console.log('✅ Demo: Membership activated successfully:', {
          membershipId: membership._id,
          status: membership.status,
          isActive: membership.isActive
        });
      } else {
        console.log('❌ Demo: No pending membership found for recurring_billing_id:', recurring_billing_id);
      }
    }
    
    res.redirect(`${process.env.FRONTEND_URL}/membership/success?demo=true&status=completed`);
  } catch (error) {
    console.error('Demo success handler error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/membership/error?error=demo_processing_failed`);
  }
});

/**
 * Create HitPay payment request - Basic API endpoint
 * POST /api/hitpay/payment-request
 * Mandatory fields: amount, currency
 */
router.post('/payment-request', async (req, res) => {
  try {
    const {
      email,
      redirect_url,
      reference_number,
      webhook,
      currency,
      amount,
      name,
      purpose,
      send_email,
      payment_methods
    } = req.body;

    // Validate mandatory fields
    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Missing mandatory fields: amount and currency are required'
      });
    }

    // Prepare payment data
    const paymentData = {
      amount: parseFloat(amount),
      currency: currency,
      email: email,
      redirect_url: redirect_url,
      reference_number: reference_number,
      webhook: webhook || `${process.env.WEBHOOK_URL}/api/hitpay/webhook`,
      name: name,
      purpose: purpose,
      send_email: send_email,
      payment_methods: payment_methods
    };

    console.log('🚀 Creating HitPay payment request via /payment-request endpoint');
    
    // Create payment request using HitPay service
    const hitpayResponse = await hitpayService.createPayment(paymentData);

    // Return payment_request_id and URL as specified
    res.json({
      success: true,
      message: 'Payment request created successfully',
      payment_request_id: hitpayResponse.id || hitpayResponse.payment_request_id,
      url: hitpayResponse.url,
      data: hitpayResponse
    });

  } catch (error) {
    console.error('Error creating HitPay payment request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment request',
      error: error.message
    });
  }
});

/**
 * Create job payment request
 * POST /api/hitpay/job-payment
 */
router.post('/job-payment', auth, async (req, res) => {
  try {
    const { jobId, amount, currency = 'SGD', description } = req.body;
    
    // Validate required fields
    if (!jobId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Job ID and amount are required'
      });
    }

    // Get job details to validate ownership and amount
    const Job = require('../models/Job');
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user owns this job
    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only pay for your own jobs'
      });
    }

    // Prepare payment data using the exact HitPay API format
    const paymentData = {
      email: req.user.email,
      name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.fullName || 'Customer',
      phone: req.user.phone || '',
      amount: parseFloat(amount),
      currency: currency,
      payment_methods: ['card'],
      purpose: description || `Payment for Job #${job.jobNumber || jobId}`,
      reference_number: `job_${jobId}_${Date.now()}`,
      redirect_url: `${process.env.FRONTEND_URL}/jobs/${jobId}?payment=success`,
      webhook: `${process.env.WEBHOOK_URL}/api/hitpay/webhook/job`,
      allow_repeated_payments: 'false',
      add_admin_fee: 'false',
      send_email: 'false',
      send_sms: 'true',
      generate_qr: false
    };

    console.log('🚀 Creating HitPay job payment request for job:', jobId);
    
    // Create payment request using HitPay service
    const hitpayResponse = await hitpayService.createPayment(paymentData);
    
    console.log('✅ HitPay payment request created successfully');
    console.log('📊 Payment URL:', hitpayResponse.url);
    
    // Store payment record
    const payment = new Payment({
      paymentId: hitpayResponse.id || hitpayResponse.payment_request_id,
      jobId: jobId,
      customerId: req.user._id,
      vendorId: job.vendorId || job.vendor,
      totalAmount: parseFloat(amount),
      status: 'PENDING',
      paymentMethod: 'HITPAY',
      paymentGateway: 'HITPAY',
      description: paymentData.purpose,
      gateway: {
        name: 'HITPAY',
        transactionId: hitpayResponse.id || hitpayResponse.payment_request_id,
        currency: currency
      }
    });
    
    try {
      await payment.save();
      console.log('✅ Payment record saved to database');
    } catch (dbError) {
      console.error('❌ Error saving payment to database:', dbError);
      // Continue anyway - don't let database errors block the payment flow
    }

    console.log('🚀 Sending response to frontend with payment_url:', hitpayResponse.url);

    // Return payment_request_id and URL
    res.json({
      success: true,
      message: 'Job payment request created successfully',
      payment_request_id: hitpayResponse.id || hitpayResponse.payment_request_id,
      payment_url: hitpayResponse.url,
      jobId: jobId,
      amount: amount,
      currency: currency
    });

  } catch (error) {
    console.error('Error creating job payment request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job payment request',
      error: error.message
    });
  }
});

/**
 * Create HitPay recurring subscription
 */
router.post('/create-subscription', auth, async (req, res) => {
  try {
    const { propertyType, billingCycle = 'MONTHLY' } = req.body;
    const userId = req.user._id;

    // Validate billing cycle
    if (!['MONTHLY', 'YEARLY'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid billing cycle. Must be MONTHLY or YEARLY'
      });
    }

    // Check if user already has active subscription
    const existingSubscription = await CustomerSubscription.findOne({
      customer: userId,
      status: 'ACTIVE'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Get subscription tier
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
    const basePrice = tier.monthlyPrice;
    const actualPrice = billingCycle === 'YEARLY' ? tier.yearlyPrice || (basePrice * 10) : basePrice;
    const cycle = billingCycle === 'YEARLY' ? 'yearly' : 'monthly';

    // Get user details
    const user = await User.findById(userId);

    // Create HitPay recurring plan
    const planData = {
      name: `${tier.displayName} - ${propertyType} - ${billingCycle}`,
      amount: actualPrice,
      currency: 'SGD',
      cycle: cycle,
      iterations: null, // Infinite
      reference: `plan_${propertyType.toLowerCase()}_${billingCycle.toLowerCase()}_${Date.now()}`
    };

    const hitpayPlan = await hitpayService.createRecurringPlan(planData);

    // Subscribe customer to the plan
    const customerData = {
      email: user.email,
      name: user.fullName || `${user.firstName} ${user.lastName}`,
      reference: `sub_${userId}_${billingCycle.toLowerCase()}_${Date.now()}`
    };

    const hitpaySubscription = await hitpayService.subscribeCustomer(
      hitpayPlan.id,
      customerData
    );

    // Calculate next billing date based on cycle
    const nextBillingDate = new Date();
    if (billingCycle === 'YEARLY') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // Create pending subscription in our database
    const subscription = new CustomerSubscription({
      customer: userId,
      propertyType,
      billingCycle,
      monthlyPrice: basePrice,
      actualPrice: actualPrice,
      status: 'PENDING',
      startDate: new Date(),
      nextBillingDate: nextBillingDate,
      paymentMethod: {
        type: 'HITPAY'
      },
      paymentGateway: 'HITPAY',
      hitpayData: {
        subscriptionId: hitpaySubscription.id,
        planId: hitpayPlan.id,
        reference: customerData.reference
      }
    });

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscriptionId: subscription._id,
        paymentUrl: hitpaySubscription.url,
        hitpaySubscriptionId: hitpaySubscription.id,
        billingCycle: billingCycle,
        actualPrice: actualPrice,
        savings: billingCycle === 'YEARLY' ? (basePrice * 12 - actualPrice) : 0
      }
    });

  } catch (error) {
    console.error('Error creating HitPay subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
});

/**
 * Create HitPay one-time payment
 */
router.post('/create-payment', auth, async (req, res) => {
  try {
    const { amount, purpose, jobId } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const user = await User.findById(userId);

    const paymentData = {
      amount: parseFloat(amount),
      currency: 'SGD',
      name: user.fullName || `${user.firstName} ${user.lastName}`,
      email: user.email,
      purpose: purpose || 'Property Maintenance Service',
      reference: `payment_${jobId || userId}_${Date.now()}`,
      redirectUrl: `${process.env.FRONTEND_URL}/payment/success`
    };

    const hitpayPayment = await hitpayService.createPayment(paymentData);

    // Create payment record in our database
    if (jobId) {
      const payment = new Payment({
        jobId,
        customerId: userId,
        totalAmount: amount,
        platformCommission: amount * 0.1, // 10% platform commission
        vendorAmount: amount * 0.9,
        status: 'PENDING',
        paymentMethod: 'HITPAY',
        paymentGateway: 'HITPAY',
        paymentId: `HITPAY_${Date.now()}`,
        hitpayData: {
          paymentRequestId: hitpayPayment.id,
          reference: paymentData.reference
        }
      });

      await payment.save();
    }

    res.json({
      success: true,
      message: 'Payment created successfully',
      data: {
        paymentUrl: hitpayPayment.url,
        paymentId: hitpayPayment.id,
        reference: paymentData.reference
      }
    });

  } catch (error) {
    console.error('Error creating HitPay payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
});

/**
 * Cancel HitPay subscription
 */
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const { subscriptionId, reason } = req.body;
    const userId = req.user._id;

    const subscription = await CustomerSubscription.findOne({
      _id: subscriptionId,
      customer: userId
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

    // Cancel subscription in HitPay
    if (subscription.hitpayData?.subscriptionId) {
      await hitpayService.cancelSubscription(subscription.hitpayData.subscriptionId);
    }

    // Update subscription in our database
    subscription.status = 'CANCELLED';
    subscription.cancelledAt = new Date();
    subscription.cancelReason = reason || 'Customer request';
    subscription.isActive = false;

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling HitPay subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

/**
 * Get subscription status from HitPay
 */
router.get('/subscription/:subscriptionId/status', auth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user._id;

    const subscription = await CustomerSubscription.findOne({
      _id: subscriptionId,
      customer: userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    let hitpayStatus = null;
    if (subscription.hitpayData?.subscriptionId) {
      try {
        hitpayStatus = await hitpayService.getSubscription(
          subscription.hitpayData.subscriptionId
        );
      } catch (error) {
        console.error('Error fetching HitPay subscription status:', error);
      }
    }

    res.json({
      success: true,
      data: {
        localSubscription: subscription,
        hitpaySubscription: hitpayStatus
      }
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status',
      error: error.message
    });
  }
});

/**
 * HitPay webhook handler (supports both JSON and URL-encoded formats)
 */
router.post('/webhook', express.raw({ type: ['application/json', 'application/x-www-form-urlencoded'] }), async (req, res) => {
  try {
    let webhookData;
    const contentType = req.headers['content-type'];

    // Handle JSON webhook (recurring billing)
    if (contentType && contentType.includes('application/json')) {
      const signature = req.headers['x-signature'];
      const payload = JSON.parse(req.body);

      // Verify webhook signature
      if (!hitpayService.verifyWebhookSignature(payload, signature)) {
        console.error('Invalid webhook signature');
        return res.status(400).send('Invalid signature');
      }

      webhookData = hitpayService.processWebhook(payload);
    }
    // Handle URL-encoded webhook (payment-requests)
    else {
      const rawData = req.body.toString();
      console.log('Raw webhook data:', rawData);

      // Verify URL webhook signature
      if (!hitpayService.verifyUrlWebhookSignature(rawData)) {
        console.error('Invalid URL webhook signature');
        return res.status(400).send('Invalid signature');
      }

      webhookData = hitpayService.processUrlWebhook(rawData);
    }

    console.log('HitPay webhook received:', webhookData);

    // Handle subscription payments
    if (webhookData.subscriptionId || webhookData.billingId) {
      await handleSubscriptionWebhook(webhookData);
    }
    // Handle one-time payments
    else if (webhookData.paymentId) {
      await handlePaymentWebhook(webhookData);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing HitPay webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Handle subscription webhook
 */
async function handleSubscriptionWebhook(webhookData) {
  try {
    const subscription = await CustomerSubscription.findOne({
      'hitpayData.subscriptionId': webhookData.subscriptionId
    });

    if (!subscription) {
      console.error('Subscription not found for HitPay subscription ID:', webhookData.subscriptionId);
      return;
    }

    const paymentStatus = hitpayService.getPaymentStatusMapping(webhookData.status);
    const subscriptionStatus = hitpayService.getSubscriptionStatusMapping(webhookData.status);

    // Add billing history entry
    subscription.billingHistory.push({
      date: new Date(),
      amount: webhookData.amount,
      status: paymentStatus,
      paymentMethod: 'HITPAY',
      transactionId: webhookData.paymentId,
      hitpayPaymentId: webhookData.paymentId,
      hitpayReference: webhookData.reference,
      paymentGateway: 'HITPAY'
    });

    // Update subscription status based on payment status
    if (webhookData.status === 'completed') {
      subscription.status = 'ACTIVE';
      subscription.updateNextBillingDate();
    } else if (webhookData.status === 'failed') {
      subscription.status = 'PAUSED';
    } else if (webhookData.status === 'canceled') {
      subscription.status = 'CANCELLED';
      subscription.cancelledAt = new Date();
      subscription.isActive = false;
    }

    await subscription.save();

    console.log(`Subscription ${subscription._id} updated with payment status: ${webhookData.status}`);

  } catch (error) {
    console.error('Error handling subscription webhook:', error);
    throw error;
  }
}

/**
 * Handle one-time payment webhook
 */
async function handlePaymentWebhook(webhookData) {
  try {
    // Check for regular payment records first
    const payment = await Payment.findOne({
      'hitpayData.reference': webhookData.reference
    });

    if (payment) {
      const paymentStatus = hitpayService.getPaymentStatusMapping(webhookData.status);

      // Update payment status
      payment.status = paymentStatus;
      payment.transactionId = webhookData.paymentId;
      payment.hitpayData.paymentId = webhookData.paymentId;

      if (webhookData.status === 'completed') {
        payment.completedAt = new Date();
      }

      await payment.save();
      console.log(`Payment ${payment._id} updated with status: ${webhookData.status}`);
      return;
    }

    // Check for membership payment records
    const membership = await CustomerMembership.findOne({
      hitpayRecurringBillingId: webhookData.reference
    }).populate('tier');

    if (membership) {
      console.log('🔍 Found membership payment record:', {
        membershipId: membership._id,
        currentStatus: membership.status,
        tier: membership.tier?.name,
        customerId: membership.customer
      });

      if (webhookData.status === 'completed' || webhookData.status === 'succeeded') {
        console.log('💳 Processing successful payment for membership:', membership._id);
        
        // Activate the membership
        membership.status = 'ACTIVE';
        membership.isActive = true;
        membership.startDate = new Date();
        membership.lastPaymentDate = new Date();
        
        // Set next billing date (for one-time payments, this is the end date)
        const endDate = new Date();
        if (membership.billingCycle === 'YEARLY') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        membership.endDate = endDate;
        membership.nextBillingDate = endDate;

        // Initialize usage tracking
        await membership.resetMonthlyUsage();

        console.log('✅ Customer membership activated successfully:', {
          membershipId: membership._id,
          status: membership.status,
          isActive: membership.isActive,
          startDate: membership.startDate,
          endDate: membership.endDate
        });

        console.log(`Membership ${membership._id} activated for user ${membership.customer}`);
      } else if (webhookData.status === 'failed') {
        membership.status = 'SUSPENDED';
        console.log(`Membership payment failed for ${membership._id}`);
      } else if (webhookData.status === 'cancelled') {
        membership.status = 'CANCELLED';
        console.log(`Membership payment cancelled for ${membership._id}`);
      }

      await membership.save();
      console.log(`Membership ${membership._id} updated with payment status: ${webhookData.status}`);
      return;
    }

    // Check for vendor membership payment records
    const vendorMembership = await VendorMembership.findOne({
      hitpayReference: webhookData.reference
    }).populate('vendorId');

    if (vendorMembership) {
      console.log('Found vendor membership payment record:', vendorMembership._id);

      if (webhookData.status === 'completed' || webhookData.status === 'succeeded') {
        // Activate the vendor membership
        vendorMembership.subscriptionStatus = 'ACTIVE';
        vendorMembership.paymentStatus = 'PAID';
        vendorMembership.lastPaymentDate = new Date();
        
        // Activate vendor features
        const vendor = await Vendor.findById(vendorMembership.vendorId);
        if (vendor) {
          await vendor.upgradeMembership(vendorMembership.currentTier);
          console.log(`Vendor ${vendorMembership.vendorId} upgraded to ${vendorMembership.currentTier}`);
        }
        
        console.log(`Vendor membership ${vendorMembership._id} activated`);
      } else if (webhookData.status === 'failed') {
        vendorMembership.subscriptionStatus = 'SUSPENDED';
        vendorMembership.paymentStatus = 'FAILED';
        console.log(`Vendor membership payment failed for ${vendorMembership._id}`);
      } else if (webhookData.status === 'cancelled') {
        vendorMembership.subscriptionStatus = 'CANCELLED';
        vendorMembership.paymentStatus = 'CANCELLED';
        console.log(`Vendor membership payment cancelled for ${vendorMembership._id}`);
      }

      await vendorMembership.save();
      console.log(`Vendor membership ${vendorMembership._id} updated with payment status: ${webhookData.status}`);
      return;
    }

    console.error('Neither Payment, Customer Membership, nor Vendor Membership found for HitPay reference:', webhookData.reference);

  } catch (error) {
    console.error('Error handling payment webhook:', error);
    throw error;
  }
}

/**
 * HitPay recurring billing webhook handler
 */
router.post('/webhook/recurring', express.raw({ type: 'application/x-www-form-urlencoded' }), async (req, res) => {
  try {
    console.log('HitPay recurring billing webhook received');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body.toString());

    // Parse form data
    const params = new URLSearchParams(req.body.toString());
    const webhookData = {};
    for (const [key, value] of params) {
      webhookData[key] = value;
    }

    console.log('Parsed webhook data:', webhookData);

    const { payment_id, recurring_billing_id, amount, currency, status, hmac } = webhookData;

    // Validate webhook signature
    if (!hitpayService.validateRecurringWebhook(webhookData, hmac)) {
      console.error('Invalid recurring billing webhook signature');
      return res.status(400).send('Invalid signature');
    }

    console.log('Webhook signature validated successfully');

    // Parse webhook data
    const parsedData = hitpayService.parseRecurringWebhook(webhookData);
    console.log('Parsed recurring billing webhook:', parsedData);

    // Find the membership by HitPay recurring billing ID
    const membership = await CustomerMembership.findOne({
      hitpayRecurringBillingId: recurring_billing_id
    }).populate('tier');

    if (!membership) {
      console.error('Membership not found for recurring billing ID:', recurring_billing_id);
      return res.status(404).send('Membership not found');
    }

    console.log('Found membership:', membership._id);

    // Update membership status based on payment status
    if (status === 'succeeded') {
      membership.status = 'ACTIVE';
      
      // Calculate next billing date
      const nextBilling = new Date();
      if (membership.billingCycle === 'YEARLY') {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      } else {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }
      membership.nextBillingDate = nextBilling;

      console.log('Membership activated:', membership._id);
    } else if (status === 'failed') {
      membership.status = 'SUSPENDED';
      console.log('Membership suspended due to payment failure:', membership._id);
    }

    await membership.save();

    // Log the payment in our records
    console.log(`Recurring payment processed: ${payment_id} - ${status} - ${amount} ${currency}`);

    res.status(200).send('OK');

  } catch (error) {
    console.error('Error processing recurring billing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Demo-only: Simulate HitPay recurring billing webhook to activate membership
 * This helps in development when real HitPay webhooks are not configured.
 */
router.post('/simulate/recurring', async (req, res) => {
  try {
    // Only allow in demo mode
    if (!hitpayService.isDemo) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    const { payment_id, recurring_billing_id, amount, currency = 'SGD', status = 'completed' } = req.body || {};

    if (!recurring_billing_id) {
      return res.status(400).json({ success: false, message: 'recurring_billing_id is required' });
    }

    const membership = await CustomerMembership.findOne({
      hitpayRecurringBillingId: recurring_billing_id
    }).populate('tier');

    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found for recurring billing id' });
    }

    if (status === 'completed' || status === 'succeeded') {
      membership.status = 'ACTIVE';
      const nextBilling = new Date();
      if (membership.billingCycle === 'YEARLY') {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      } else {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }
      membership.nextBillingDate = nextBilling;
    } else if (status === 'failed') {
      membership.status = 'SUSPENDED';
    }

    await membership.save();

    console.log(`Simulated recurring payment processed: ${payment_id} - ${status} - ${amount} ${currency}`);

    return res.json({ success: true, membership });
  } catch (error) {
    console.error('Error simulating recurring webhook:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

/**
 * Create subscription plan using the exact HitPay API format
 * POST /api/hitpay/subscription-plan
 */
router.post('/subscription-plan', async (req, res) => {
  try {
    const { cycle, times_to_be_charged, name, description, amount, currency } = req.body;

    console.log('📋 Creating subscription plan with data:', req.body);

    // Call the new HitPay service method
    const result = await hitpayService.createSubscriptionPlanV2({
      cycle,
      times_to_be_charged,
      name,
      description,
      amount,
      currency
    });

    if (result.success) {
      console.log('✅ Subscription plan created successfully');
      return res.status(200).json({
        success: true,
        message: 'Subscription plan created successfully',
        data: result.data
      });
    } else {
      console.log('❌ Failed to create subscription plan:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error,
        data: result.data
      });
    }

  } catch (error) {
    console.error('💥 Error in subscription plan endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Update subscription plan using HitPay API V2
 * PUT /api/hitpay/subscription-plan/:planId
 */
router.put('/subscription-plan/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    console.log('🔄 Updating subscription plan:', planId, 'with data:', updateData);

    // Call the HitPay service method
    const result = await hitpayService.updateSubscriptionPlan(planId, updateData);

    if (result.success) {
      console.log('✅ Subscription plan updated successfully');
      return res.status(200).json({
        success: true,
        message: 'Subscription plan updated successfully',
        data: result.data
      });
    } else {
      console.log('❌ Failed to update subscription plan:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error,
        data: result.data
      });
    }

  } catch (error) {
    console.error('💥 Error in update subscription plan endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Cancel subscription plan using HitPay API V2
 * DELETE /api/hitpay/subscription-plan/:planId
 */
router.delete('/subscription-plan/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    console.log('🗑️ Cancelling subscription plan:', planId);

    // Call the HitPay service method
    const result = await hitpayService.cancelSubscriptionPlan(planId);

    if (result.success) {
      console.log('✅ Subscription plan cancelled successfully');
      return res.status(200).json({
        success: true,
        message: 'Subscription plan cancelled successfully',
        data: result.data
      });
    } else {
      console.log('❌ Failed to cancel subscription plan:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error,
        data: result.data
      });
    }

  } catch (error) {
    console.error('💥 Error in cancel subscription plan endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Process refund using HitPay API V2
 * POST /api/hitpay/refund
 */
router.post('/refund', async (req, res) => {
  try {
    const { amount, payment_id, webhook, send_email, email } = req.body;

    console.log('💰 Processing refund:', req.body);

    // Call the HitPay service method
    const result = await hitpayService.processRefund({
      amount,
      payment_id,
      webhook,
      send_email,
      email
    });

    if (result.success) {
      console.log('✅ Refund processed successfully');
      return res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: result.data
      });
    } else {
      console.log('❌ Failed to process refund:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error,
        data: result.data
      });
    }

  } catch (error) {
    console.error('💥 Error in refund endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Job payment webhook handler
router.post('/webhook/job', express.raw({ type: ['application/json', 'application/x-www-form-urlencoded'] }), async (req, res) => {
  try {
    console.log('Job payment webhook received:', req.body.toString());
    
    // Parse the webhook data
    const webhookData = qs.parse(req.body.toString());
    console.log('Parsed job webhook data:', webhookData);

    // Verify the webhook signature
    const signature = req.headers['x-signature'];
    if (!hitpayService.verifyWebhookSignature(req.body.toString(), signature)) {
      console.error('Invalid job webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { payment_id, status, reference_number } = webhookData;
    
    // Find the payment record using paymentId field
    const payment = await Payment.findOne({ paymentId: payment_id });
    if (!payment) {
      console.error('Job payment not found:', payment_id);
      return res.status(404).json({ error: 'Payment not found' });
    }

    console.log('Job payment found:', payment._id);

    // Update payment status
    payment.status = status === 'completed' ? 'COMPLETED' : status.toUpperCase();
    payment.gateway.gatewayStatus = status;
    if (reference_number) {
      payment.gateway.referenceNumber = reference_number;
    }
    await payment.save();

    if (status === 'completed') {
      // Update job status to paid
      await Job.findByIdAndUpdate(payment.jobId, {
        payment_status: 'paid',
        status: 'confirmed'
      });
      
      console.log('Job payment completed, job status updated to confirmed');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Job webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Update payment status manually
 */
router.post('/update-payment-status', auth, async (req, res) => {
  try {
    const { reference, status } = req.body;
    
    console.log('Update payment status request:', { reference, status, userId: req.user._id });
    
    if (!reference || !status) {
      return res.status(400).json({ error: 'Reference and status are required' });
    }

    // Find the payment by reference
    let payment = await Payment.findOne({ reference });
    console.log('Found payment by reference:', payment ? { id: payment._id, currentStatus: payment.status, jobId: payment.jobId } : 'Not found');
    
    // If no payment found by exact reference, try to find by partial match (for cases where HitPay returns different reference format)
    if (!payment && reference) {
      payment = await Payment.findOne({ 
        $or: [
          { reference: { $regex: reference, $options: 'i' } },
          { gatewayPaymentId: reference }
        ]
      });
      console.log('Found payment by partial match:', payment ? { id: payment._id, currentStatus: payment.status, jobId: payment.jobId } : 'Not found');
    }
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Convert status to uppercase to match enum
    const paymentStatus = status.toUpperCase();
    
    // Update payment status
    payment.status = paymentStatus;
    await payment.save();
    console.log('Payment status updated to:', paymentStatus);

    // Update job status if payment is completed
    if (paymentStatus === 'COMPLETED' && payment.jobId) {
      const job = await Job.findById(payment.jobId);
      console.log('Found job:', job ? { id: job._id, currentStatus: job.status } : 'Not found');
      
      if (job) {
        job.status = 'PAID';
        // Also update the job's embedded payment status
        if (!job.payment) {
          job.payment = {};
        }
        job.payment.status = 'PAID';
        job.payment.paidAt = new Date();
        job.payment.transactionId = payment.reference;
        job.payment.paidAmount = payment.amount;
        
        await job.save();
        console.log('Job status updated to PAID and payment info updated');
      }
    }

    res.json({ 
      success: true, 
      message: 'Payment status updated successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        reference: payment.reference
      }
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

/**
 * Update payment status by job ID (fallback when reference is unknown)
 */
router.post('/update-job-payment-status', auth, async (req, res) => {
  try {
    const { jobId, status } = req.body;
    
    console.log('Update job payment status request:', { jobId, status, userId: req.user._id });
    
    if (!jobId || !status) {
      return res.status(400).json({ error: 'Job ID and status are required' });
    }

    // Find the latest payment for this job
    const payment = await Payment.findOne({ jobId }).sort({ createdAt: -1 });
    console.log('Found latest payment for job:', payment ? { id: payment._id, currentStatus: payment.status, reference: payment.reference } : 'Not found');
    
    if (!payment) {
      return res.status(404).json({ error: 'No payment found for this job' });
    }

    // Convert status to uppercase to match enum
    const paymentStatus = status.toUpperCase();
    
    // Update payment status
    payment.status = paymentStatus;
    await payment.save();
    console.log('Payment status updated to:', paymentStatus);

    // Update job status if payment is completed
    if (paymentStatus === 'COMPLETED') {
      const job = await Job.findById(jobId);
      console.log('Found job:', job ? { id: job._id, currentStatus: job.status } : 'Not found');
      
      if (job) {
        job.status = 'PAID';
        // Also update the job's embedded payment status
        if (!job.payment) {
          job.payment = {};
        }
        job.payment.status = 'PAID';
        job.payment.paidAt = new Date();
        job.payment.transactionId = payment.reference;
        job.payment.paidAmount = payment.amount;
        
        await job.save();
        console.log('Job status updated to PAID and payment info updated');
      }
    }

    res.json({ 
      success: true, 
      message: 'Payment status updated successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        reference: payment.reference,
        jobId: payment.jobId
      }
    });

  } catch (error) {
    console.error('Update job payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

module.exports = router;
