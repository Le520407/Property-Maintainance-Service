const express = require('express');
const router = express.Router();
const PaymentService = require('../services/paymentService');
const { auth, requireRole } = require('../middleware/auth');

// Create payment session (Customer only)
router.post('/create-session/:jobId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can create payment sessions' });
    }

    const { paymentMethod = 'CREDIT_CARD', gateway = 'MOCK' } = req.body;
    
    const payment = await PaymentService.createPaymentSession(
      req.params.jobId,
      req.user._id,
      paymentMethod,
      gateway
    );

    res.status(201).json({
      message: 'Payment session created successfully',
      payment: {
        paymentId: payment.paymentId,
        totalAmount: payment.totalAmount,
        platformCommission: payment.platformCommission,
        vendorAmount: payment.vendorAmount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        paymentGateway: payment.paymentGateway,
        expiresAt: payment.expiresAt
      }
    });

  } catch (error) {
    console.error('Error creating payment session:', error);
    res.status(400).json({ 
      message: 'Failed to create payment session',
      error: error.message 
    });
  }
});

// Process payment (Customer only)
router.post('/process/:paymentId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can process payments' });
    }

    const { cardDetails, billingAddress } = req.body;
    
    const result = await PaymentService.processPayment(req.params.paymentId, {
      cardDetails,
      billingAddress
    });

    if (result.success) {
      res.json({
        message: 'Payment processed successfully',
        payment: {
          paymentId: result.payment.paymentId,
          transactionId: result.payment.transactionId,
          totalAmount: result.payment.totalAmount,
          status: result.payment.status,
          completedAt: result.payment.completedAt
        }
      });
    } else {
      res.status(400).json({
        message: 'Payment failed',
        error: result.error,
        errorCode: result.errorCode
      });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      message: 'Payment processing failed',
      error: error.message 
    });
  }
});

// Get payment details
router.get('/:paymentId', auth, async (req, res) => {
  try {
    const payment = await PaymentService.getPaymentDetails(req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check permissions
    const isCustomer = payment.customerId.toString() === req.user._id.toString();
    const isVendor = payment.vendorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payment });

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Failed to fetch payment details' });
  }
});

// Get payments for job
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const payments = await PaymentService.getPaymentsForJob(req.params.jobId);
    
    // Basic permission check - implement more specific checks as needed
    if (!payments.length) {
      return res.json({ payments: [] });
    }

    const firstPayment = payments[0];
    const isCustomer = firstPayment.customerId.toString() === req.user._id.toString();
    const isVendor = firstPayment.vendorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ payments });

  } catch (error) {
    console.error('Error fetching job payments:', error);
    res.status(500).json({ message: 'Failed to fetch job payments' });
  }
});

// Get user payments (Customer or Vendor)
router.get('/user/my-payments', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'vendor') {
      query.vendorId = req.user._id;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status) query.status = status;

    const payments = await PaymentService.getUserPayments(query, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(payments);

  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Process vendor payout (Admin only)
router.post('/payout/:paymentId', auth, requireRole('admin'), async (req, res) => {
  try {
    const result = await PaymentService.processVendorPayout(req.params.paymentId);

    if (result.success) {
      res.json({
        message: 'Vendor payout processed successfully',
        amount: result.amount,
        reference: result.reference
      });
    } else {
      res.status(400).json({
        message: 'Payout failed',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error processing vendor payout:', error);
    res.status(500).json({ 
      message: 'Failed to process vendor payout',
      error: error.message 
    });
  }
});

// Process refund (Admin only)
router.post('/refund/:paymentId', auth, requireRole('admin'), async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;
    
    if (!refundAmount || !reason) {
      return res.status(400).json({ message: 'Refund amount and reason are required' });
    }

    const result = await PaymentService.processRefund(
      req.params.paymentId,
      parseFloat(refundAmount),
      reason,
      req.user._id
    );

    if (result.success) {
      res.json({
        message: 'Refund processed successfully',
        refundAmount: result.refundAmount,
        refundId: result.refundId
      });
    } else {
      res.status(400).json({
        message: 'Refund failed',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ 
      message: 'Failed to process refund',
      error: error.message 
    });
  }
});

// Get payment analytics (Admin only)
router.get('/analytics/overview', auth, requireRole('admin'), async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    
    const analytics = await PaymentService.getPaymentAnalytics(parseInt(timeframe));
    
    res.json({
      message: 'Payment analytics retrieved successfully',
      analytics
    });

  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ message: 'Failed to fetch payment analytics' });
  }
});

// Get pending payouts (Admin only)
router.get('/admin/pending-payouts', auth, requireRole('admin'), async (req, res) => {
  try {
    const pendingPayouts = await PaymentService.getPendingPayouts();
    
    res.json({
      pendingPayouts,
      total: pendingPayouts.length,
      message: pendingPayouts.length > 0 
        ? `Found ${pendingPayouts.length} pending payouts`
        : 'No pending payouts found'
    });

  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    res.status(500).json({ message: 'Failed to fetch pending payouts' });
  }
});

// Batch process payouts (Admin only)
router.post('/admin/batch-payout', auth, requireRole('admin'), async (req, res) => {
  try {
    const { paymentIds } = req.body;
    
    if (!paymentIds || !Array.isArray(paymentIds)) {
      return res.status(400).json({ message: 'Payment IDs array is required' });
    }

    const results = await PaymentService.batchProcessPayouts(paymentIds);
    
    res.json({
      message: 'Batch payout processing completed',
      results: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      details: results
    });

  } catch (error) {
    console.error('Error processing batch payouts:', error);
    res.status(500).json({ 
      message: 'Failed to process batch payouts',
      error: error.message 
    });
  }
});

// Webhook endpoint for payment gateway notifications
router.post('/webhook/:gateway', async (req, res) => {
  try {
    const { gateway } = req.params;
    const webhookData = req.body;
    
    // Handle webhook based on gateway
    switch (gateway.toLowerCase()) {
      case 'stripe':
        await PaymentService.handleStripeWebhook(webhookData);
        break;
      case 'paypal':
        await PaymentService.handlePayPalWebhook(webhookData);
        break;
      default:
        // Unhandled webhook
        break;
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;