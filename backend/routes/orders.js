const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const hitpayService = require('../services/hitpayService');

// Create a new order and initiate payment
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'hitpay' } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Calculate item subtotals and map field names
    const processedItems = items.map(item => ({
      productId: String(item.serviceId), // Convert serviceId to string for productId
      name: item.serviceName, // Map serviceName to name
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));

    const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingCost = 10; // Fixed shipping cost
    const total = subtotal + shippingCost;

    // Map shipping address field names
    const mappedShippingAddress = {
      recipientName: shippingAddress.fullName, // Map fullName to recipientName
      phone: shippingAddress.phone,
      email: shippingAddress.email,
      address: shippingAddress.street, // Map street to address
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      notes: shippingAddress.notes
    };

    // Create order in database
    const order = new Order({
      customer: userId,
      items: processedItems,
      shippingAddress: mappedShippingAddress,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    // Create HitPay payment request
    try {
      const paymentData = {
        amount: total,
        currency: 'SGD',
        purpose: `Order ${order.orderNumber}`,
        reference_number: order.orderNumber,
        webhook: process.env.WEBHOOK_URL || 'https://ttytyd.com',
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order._id}/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout`,
        expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      console.log('Creating HitPay payment for order:', order.orderNumber);
      const paymentResponse = await hitpayService.createPayment(paymentData);

      // Update order with payment details
      order.paymentId = paymentResponse.id;
      order.paymentUrl = paymentResponse.url;
      order.paymentReference = paymentResponse.reference_number;
      await order.save();

      console.log('Payment created successfully:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentId: paymentResponse.id,
        paymentUrl: paymentResponse.url
      });

      res.json({
        success: true,
        message: 'Order created successfully',
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus
        },
        paymentUrl: paymentResponse.url,
        paymentId: paymentResponse.id
      });

    } catch (paymentError) {
      console.error('Payment creation failed:', paymentError);
      
      // Update order status to failed
      order.paymentStatus = 'failed';
      order.notes = `Payment creation failed: ${paymentError.message}`;
      await order.save();

      res.status(500).json({
        success: false,
        message: 'Failed to create payment. Please try again.',
        error: paymentError.message,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus
        }
      });
    }

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('customer', 'firstName lastName email');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get specific order
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({
      _id: orderId,
      customer: userId
    }).populate('customer', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// HitPay webhook handler for order payments
router.post('/webhook/hitpay', async (req, res) => {
  try {
    console.log('Received HitPay webhook for order payment:', req.body);

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
        console.error('Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    // Find order by reference number (order number)
    const order = await Order.findOne({ orderNumber: reference_number });
    
    if (!order) {
      console.error('Order not found for reference:', reference_number);
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('Processing webhook for order:', order.orderNumber);

    // Update order based on payment status
    switch (status) {
      case 'completed':
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        console.log(`✅ Order ${order.orderNumber} payment completed`);
        break;
        
      case 'failed':
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        console.log(`❌ Order ${order.orderNumber} payment failed`);
        break;
        
      case 'pending':
        order.paymentStatus = 'pending';
        console.log(`⏳ Order ${order.orderNumber} payment pending`);
        break;
        
      default:
        console.log(`📝 Order ${order.orderNumber} payment status: ${status}`);
        break;
    }

    // Update payment details
    if (payment_id) {
      order.paymentId = payment_id;
    }

    await order.save();

    console.log('Order updated successfully:', {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus
    });

    res.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Error processing HitPay webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Cancel order (only if payment is pending)
router.patch('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({
      _id: orderId,
      customer: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow cancellation if payment is pending
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order. Payment has been processed.'
      });
    }

    order.status = 'cancelled';
    order.paymentStatus = 'failed';
    order.notes = (order.notes || '') + ' Order cancelled by customer.';
    
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

module.exports = router;
