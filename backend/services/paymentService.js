const Payment = require('../models/Payment');
const Job = require('../models/Job');
const Message = require('../models/Message');

class PaymentService {
  constructor() {
    // Initialize payment gateways
    this.gateways = {
      STRIPE: this.initializeStripe(),
      PAYPAL: this.initializePayPal(),
      MOCK: this.initializeMock() // For testing
    };
  }

  /**
   * Initialize Stripe (placeholder - you'd use real Stripe SDK)
   */
  initializeStripe() {
    // In production, you'd initialize Stripe with:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    return {
      name: 'STRIPE',
      createPaymentIntent: async (amount, currency = 'sgd', metadata = {}) => {
        // Mock Stripe response for demo
        return {
          id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
          status: 'requires_payment_method',
          amount: amount * 100, // Stripe uses cents
          currency: currency
        };
      },
      confirmPayment: async (paymentIntentId) => {
        // Mock successful payment confirmation
        return {
          id: paymentIntentId,
          status: 'succeeded',
          charges: {
            data: [{
              id: `ch_${Date.now()}`,
              receipt_url: `https://pay.stripe.com/receipts/${Date.now()}`,
              outcome: { type: 'authorized' }
            }]
          }
        };
      },
      createRefund: async (chargeId, amount) => {
        return {
          id: `re_${Date.now()}`,
          status: 'succeeded',
          amount: amount * 100
        };
      }
    };
  }

  /**
   * Initialize PayPal (placeholder)
   */
  initializePayPal() {
    return {
      name: 'PAYPAL',
      createOrder: async (amount, currency = 'SGD') => {
        return {
          id: `PAYPAL_${Date.now()}`,
          status: 'CREATED',
          amount: { value: amount.toString(), currency_code: currency }
        };
      },
      captureOrder: async (orderId) => {
        return {
          id: orderId,
          status: 'COMPLETED',
          payment_source: { paypal: {} }
        };
      }
    };
  }

  /**
   * Initialize Mock gateway for testing
   */
  initializeMock() {
    return {
      name: 'MOCK',
      processPayment: async (amount, paymentMethod) => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate 90% success rate
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          return {
            success: true,
            transactionId: `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'COMPLETED',
            gatewayFee: amount * 0.029 + 0.30, // 2.9% + $0.30 fee
            receiptUrl: `https://mock-gateway.com/receipt/${Date.now()}`
          };
        } else {
          return {
            success: false,
            status: 'FAILED',
            error: 'Payment declined by bank',
            errorCode: 'CARD_DECLINED'
          };
        }
      }
    };
  }

  /**
   * Create a payment session for a job
   */
  async createPaymentSession(jobId, customerId, paymentMethod = 'MOCK', gateway = 'MOCK') {
    try {
      const job = await Job.findById(jobId).populate(['customerId', 'vendorId']);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.customerId._id.toString() !== customerId.toString()) {
        throw new Error('Unauthorized: You can only pay for your own jobs');
      }
      
      if (job.status !== 'QUOTE_ACCEPTED') {
        throw new Error('Job is not ready for payment. Quote must be accepted first.');
      }
      
      if (!job.totalAmount || job.totalAmount <= 0) {
        throw new Error('Invalid job amount');
      }

      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        jobId: jobId,
        status: { $in: ['PENDING', 'PROCESSING', 'COMPLETED'] }
      });
      
      if (existingPayment && existingPayment.status === 'COMPLETED') {
        throw new Error('Payment already completed for this job');
      }
      
      if (existingPayment && existingPayment.status === 'PENDING') {
        // Return existing pending payment
        return existingPayment;
      }

      // Create new payment record
      const payment = new Payment({
        jobId: jobId,
        customerId: customerId,
        vendorId: job.vendorId._id,
        totalAmount: job.totalAmount,
        paymentMethod: paymentMethod,
        paymentGateway: gateway,
        status: 'PENDING',
        metadata: {
          jobNumber: job.jobNumber,
          jobTitle: job.title,
          vendorName: `${job.vendorId.firstName} ${job.vendorId.lastName}`
        }
      });

      await payment.save();

      console.log(`💳 Payment session created: ${payment.paymentId} for job ${job.jobNumber}`);

      return payment;

    } catch (error) {
      console.error('Error creating payment session:', error);
      throw error;
    }
  }

  /**
   * Process payment through selected gateway
   */
  async processPayment(paymentId, paymentDetails = {}) {
    try {
      const payment = await Payment.findOne({ paymentId }).populate({
        path: 'jobId',
        populate: [
          { path: 'customerId', select: 'firstName lastName email' },
          { path: 'vendorId', select: 'firstName lastName email' }
        ]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'PENDING') {
        throw new Error(`Payment is not in pending status. Current status: ${payment.status}`);
      }

      // Update status to processing
      payment.status = 'PROCESSING';
      await payment.save();

      const gateway = this.gateways[payment.paymentGateway];
      if (!gateway) {
        throw new Error(`Unsupported payment gateway: ${payment.paymentGateway}`);
      }

      let gatewayResponse;

      // Process payment based on gateway
      switch (payment.paymentGateway) {
        case 'STRIPE':
          gatewayResponse = await this.processStripePayment(payment, paymentDetails);
          break;
        case 'PAYPAL':
          gatewayResponse = await this.processPayPalPayment(payment, paymentDetails);
          break;
        case 'MOCK':
          gatewayResponse = await gateway.processPayment(payment.totalAmount, payment.paymentMethod);
          break;
        default:
          throw new Error(`Gateway ${payment.paymentGateway} not implemented`);
      }

      // Update payment based on gateway response
      if (gatewayResponse.success) {
        await payment.markAsCompleted(gatewayResponse.transactionId, gatewayResponse);
        
        // Update job status
        await Job.findByIdAndUpdate(payment.jobId._id, {
          status: 'PAID',
          'payment.status': 'PAID',
          'payment.paidAmount': payment.totalAmount,
          'payment.paidAt': new Date(),
          'payment.transactionId': gatewayResponse.transactionId
        });

        // Send system messages
        await this.sendPaymentNotifications(payment);

        console.log(`✅ Payment completed: ${payment.paymentId} - $${payment.totalAmount}`);
        
        return {
          success: true,
          payment: payment,
          message: 'Payment completed successfully'
        };

      } else {
        // Payment failed
        payment.status = 'FAILED';
        payment.gatewayResponse = gatewayResponse;
        await payment.save();

        console.log(`❌ Payment failed: ${payment.paymentId} - ${gatewayResponse.error}`);
        
        return {
          success: false,
          payment: payment,
          error: gatewayResponse.error,
          errorCode: gatewayResponse.errorCode
        };
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(payment, paymentDetails) {
    const stripe = this.gateways.STRIPE;
    
    try {
      // Create payment intent
      const paymentIntent = await stripe.createPaymentIntent(
        payment.totalAmount,
        'sgd',
        {
          jobId: payment.jobId.toString(),
          paymentId: payment.paymentId
        }
      );

      // In a real implementation, you'd return the client_secret to frontend
      // and confirm payment on the client side
      
      // For demo, we'll simulate successful payment
      const confirmedPayment = await stripe.confirmPayment(paymentIntent.id);
      
      return {
        success: true,
        transactionId: confirmedPayment.id,
        status: 'COMPLETED',
        paymentIntentId: paymentIntent.id,
        receiptUrl: confirmedPayment.charges.data[0].receipt_url,
        gatewayFee: payment.totalAmount * 0.029 + 0.30 // Stripe fee structure
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'STRIPE_ERROR'
      };
    }
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(payment, paymentDetails) {
    const paypal = this.gateways.PAYPAL;
    
    try {
      // Create PayPal order
      const order = await paypal.createOrder(payment.totalAmount, 'SGD');
      
      // Simulate order capture
      const capturedOrder = await paypal.captureOrder(order.id);
      
      return {
        success: true,
        transactionId: capturedOrder.id,
        status: 'COMPLETED',
        orderId: order.id,
        gatewayFee: payment.totalAmount * 0.034 + 0.35 // PayPal fee structure
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'PAYPAL_ERROR'
      };
    }
  }

  /**
   * Send payment notifications
   */
  async sendPaymentNotifications(payment) {
    try {
      const job = payment.jobId;

      // Notify customer
      await Message.createSystemMessage(
        job._id,
        null,
        payment.customerId,
        'PAYMENT_RECEIVED',
        {
          amount: payment.totalAmount,
          paymentId: payment.paymentId,
          transactionId: payment.transactionId
        }
      );

      // Notify vendor
      await Message.createSystemMessage(
        job._id,
        null,
        payment.vendorId,
        'PAYMENT_RECEIVED',
        {
          amount: payment.vendorAmount,
          paymentId: payment.paymentId,
          commissionAmount: payment.platformCommission
        }
      );

    } catch (error) {
      console.error('Error sending payment notifications:', error);
    }
  }

  /**
   * Process vendor payout
   */
  async processVendorPayout(paymentId) {
    try {
      const payment = await Payment.findOne({ paymentId }).populate([
        { path: 'vendorId', select: 'firstName lastName email' },
        { path: 'jobId', select: 'jobNumber title' }
      ]);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Payment must be completed before processing payout');
      }

      if (payment.vendorPayout.status !== 'PENDING') {
        throw new Error(`Payout already ${payment.vendorPayout.status.toLowerCase()}`);
      }

      // Update payout status
      payment.vendorPayout.status = 'PROCESSING';
      payment.vendorPayout.processedDate = new Date();
      
      // In a real implementation, you'd integrate with:
      // - Bank transfer APIs
      // - PayPal payouts API
      // - Wallet systems
      
      // For demo, we'll simulate successful payout
      const isSuccess = Math.random() > 0.05; // 95% success rate
      
      if (isSuccess) {
        payment.vendorPayout.status = 'COMPLETED';
        payment.vendorPayout.payoutReference = `PAYOUT_${Date.now()}`;
        
        console.log(`💰 Vendor payout completed: ${payment.vendorAmount} to ${payment.vendorId.email}`);
        
        return {
          success: true,
          message: 'Payout processed successfully',
          amount: payment.vendorAmount,
          reference: payment.vendorPayout.payoutReference
        };
      } else {
        payment.vendorPayout.status = 'FAILED';
        payment.vendorPayout.failureReason = 'Bank account verification failed';
        
        return {
          success: false,
          error: 'Payout failed - bank account verification required'
        };
      }

    } catch (error) {
      console.error('Error processing vendor payout:', error);
      throw error;
    } finally {
      if (payment) await payment.save();
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId, refundAmount, reason, requestedBy) {
    try {
      const payment = await Payment.findOne({ paymentId }).populate([
        { path: 'jobId', select: 'jobNumber title status' }
      ]);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Can only refund completed payments');
      }

      const maxRefundable = payment.totalAmount - payment.totalRefunded;
      if (refundAmount > maxRefundable) {
        throw new Error(`Refund amount exceeds available balance. Max refundable: $${maxRefundable}`);
      }

      // Process refund through gateway
      let gatewayRefund;
      const gateway = this.gateways[payment.paymentGateway];

      switch (payment.paymentGateway) {
        case 'STRIPE':
          gatewayRefund = await gateway.createRefund(payment.transactionId, refundAmount);
          break;
        case 'MOCK':
          // Simulate refund processing
          gatewayRefund = {
            id: `REF_${Date.now()}`,
            status: 'succeeded',
            amount: refundAmount
          };
          break;
        default:
          throw new Error(`Refunds not supported for ${payment.paymentGateway}`);
      }

      // Add refund to payment record
      await payment.processRefund(refundAmount, reason, requestedBy);

      console.log(`💸 Refund processed: $${refundAmount} for payment ${payment.paymentId}`);

      return {
        success: true,
        message: 'Refund processed successfully',
        refundAmount: refundAmount,
        refundId: gatewayRefund.id
      };

    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const payment = await Payment.findOne({ paymentId }).populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'vendorId', select: 'firstName lastName email' },
        { path: 'jobId', select: 'jobNumber title category' }
      ]);

      return payment;

    } catch (error) {
      console.error('Error getting payment details:', error);
      throw error;
    }
  }

  /**
   * Get payments for a specific job
   */
  async getPaymentsForJob(jobId) {
    try {
      const payments = await Payment.find({ jobId }).populate([
        { path: 'customerId', select: 'firstName lastName email' },
        { path: 'vendorId', select: 'firstName lastName email' }
      ]).sort({ createdAt: -1 });

      return payments;

    } catch (error) {
      console.error('Error getting payments for job:', error);
      throw error;
    }
  }

  /**
   * Get user payments with pagination
   */
  async getUserPayments(query, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      const payments = await Payment.find(query)
        .populate([
          { path: 'jobId', select: 'jobNumber title category' },
          { path: 'customerId', select: 'firstName lastName email' },
          { path: 'vendorId', select: 'firstName lastName email' }
        ])
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Payment.countDocuments(query);

      return {
        payments,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      };

    } catch (error) {
      console.error('Error getting user payments:', error);
      throw error;
    }
  }

  /**
   * Get pending payouts
   */
  async getPendingPayouts() {
    try {
      const pendingPayouts = await Payment.find({
        'vendorPayout.status': 'PENDING',
        status: 'COMPLETED'
      }).populate([
        { path: 'vendorId', select: 'firstName lastName email' },
        { path: 'jobId', select: 'jobNumber title' }
      ]).sort({ 'vendorPayout.scheduledDate': 1 });

      return pendingPayouts;

    } catch (error) {
      console.error('Error getting pending payouts:', error);
      throw error;
    }
  }

  /**
   * Batch process payouts
   */
  async batchProcessPayouts(paymentIds) {
    try {
      const results = [];

      for (const paymentId of paymentIds) {
        try {
          const result = await this.processVendorPayout(paymentId);
          results.push({
            paymentId,
            success: result.success,
            ...result
          });
        } catch (error) {
          results.push({
            paymentId,
            success: false,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Error processing batch payouts:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(webhookData) {
    try {
      const { type, data } = webhookData;

      switch (type) {
        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleFailedPayment(data.object);
          break;
        default:
          console.log(`Unhandled Stripe webhook type: ${type}`);
      }

    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * Handle PayPal webhook
   */
  async handlePayPalWebhook(webhookData) {
    try {
      const { event_type, resource } = webhookData;

      switch (event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handleSuccessfulPayment(resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handleFailedPayment(resource);
          break;
        default:
          console.log(`Unhandled PayPal webhook type: ${event_type}`);
      }

    } catch (error) {
      console.error('Error handling PayPal webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment from webhook
   */
  async handleSuccessfulPayment(paymentData) {
    try {
      // Implementation depends on webhook payload structure
      console.log('Processing successful payment webhook:', paymentData);
    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment from webhook
   */
  async handleFailedPayment(paymentData) {
    try {
      // Implementation depends on webhook payload structure
      console.log('Processing failed payment webhook:', paymentData);
    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw error;
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(timeframe = 30) {
    try {
      const stats = await Payment.getPaymentStats(timeframe);
      
      // Get additional metrics
      const fromDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
      
      const additionalStats = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: fromDate }
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);

      const pendingPayouts = await Payment.countDocuments({
        'vendorPayout.status': 'PENDING',
        status: 'COMPLETED'
      });

      return {
        ...stats,
        paymentMethodBreakdown: additionalStats,
        pendingPayouts,
        timeframe: `${timeframe} days`
      };

    } catch (error) {
      console.error('Error getting payment analytics:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();