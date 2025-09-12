const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const referralService = require('./services/referralService');
require('dotenv').config();

async function createRealOrderForT3() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find T3 user (the referred user)
    const t3User = await User.findOne({ email: 't3@gmail.com' });
    if (!t3User) {
      console.log('❌ T3 user not found');
      return;
    }

    console.log(`Creating order for: ${t3User.firstName} ${t3User.lastName}`);

    // Create a real order for T3
    const order = new Order({
      customer: t3User._id,
      items: [{
        productId: 'plumbing-repair',
        name: 'Emergency Plumbing Repair',
        price: 150,
        quantity: 1,
        subtotal: 150
      }],
      shippingAddress: {
        recipientName: `${t3User.firstName} ${t3User.lastName}`,
        phone: '65123456789',
        email: t3User.email,
        address: '123 Orchard Road',
        city: 'Singapore',
        state: 'Singapore',
        postalCode: '238882',
        country: 'Singapore'
      },
      subtotal: 150,
      shippingCost: 10,
      total: 160,
      paymentMethod: 'hitpay',
      status: 'confirmed', // Mark as confirmed (completed)
      paymentStatus: 'paid' // Mark as paid
    });

    await order.save();
    console.log(`✅ Created order: ${order.orderNumber} for $${order.total}`);

    // Trigger referral commission tracking
    console.log('\n=== Triggering Referral Tracking ===');
    const result = await referralService.trackPurchaseConversion(
      order._id,
      order.total,
      t3User._id
    );

    console.log('Referral Result:', result);

    // Check results
    const referrer = await User.findOne({ email: 'le520735@gmail.com' });
    console.log(`\n=== Referrer Update ===`);
    console.log(`Referrer Points Balance: ${referrer.pointsBalance}`);
    console.log(`Referrer Total Points Earned: ${referrer.totalPointsEarned}`);

    // Mark T3's first order as completed
    await t3User.markFirstOrderCompleted();
    console.log(`✅ Marked T3's first order as completed`);

    console.log('\n🎉 Real order created successfully! Check your dashboard now.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createRealOrderForT3();