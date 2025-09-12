const mongoose = require('mongoose');
const { Referral } = require('./models/Referral');
const User = require('./models/User');
const Order = require('./models/Order');
const PointsTransaction = require('./models/PointsTransaction');
const referralService = require('./services/referralService');
require('dotenv').config();

async function testCustomerReferralFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the customer referrer and referred user
    const referrer = await User.findOne({ email: 'le520735@gmail.com' });
    const referredUser = await User.findOne({ email: 't3@gmail.com' });
    
    if (!referrer || !referredUser) {
      console.log('❌ Could not find referrer or referred user');
      return;
    }

    console.log(`\n=== Before Test ===`);
    console.log(`Referrer (${referrer.firstName} ${referrer.lastName}):`);
    console.log(`  Points Balance: ${referrer.pointsBalance}`);
    console.log(`  Total Points Earned: ${referrer.totalPointsEarned}`);
    console.log(`  Referral User Type: ${referrer.referralUserType}`);
    console.log(`  Reward Type: ${referrer.rewardType}`);

    console.log(`\nReferred User (${referredUser.firstName} ${referredUser.lastName}):`);
    console.log(`  Has Completed First Order: ${referredUser.hasCompletedFirstOrder}`);

    // Create a test order for the referred user
    console.log(`\n=== Creating Test Order ===`);
    const testOrder = new Order({
      customer: referredUser._id,
      items: [{
        productId: 'test-service',
        name: 'Test Service',
        price: 100,
        quantity: 1,
        subtotal: 100
      }],
      shippingAddress: {
        recipientName: `${referredUser.firstName} ${referredUser.lastName}`,
        phone: '1234567890',
        email: referredUser.email,
        address: 'Test Address',
        city: 'Singapore',
        state: 'Singapore',
        postalCode: '123456',
        country: 'Singapore'
      },
      subtotal: 100,
      shippingCost: 10,
      total: 110,
      paymentMethod: 'hitpay',
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentId: 'test-payment-id',
      paymentReference: 'test-ref'
    });

    await testOrder.save();
    console.log(`✅ Created test order: ${testOrder.orderNumber} for $${testOrder.total}`);

    // Test the referral tracking
    console.log(`\n=== Testing Referral Commission Tracking ===`);
    const result = await referralService.trackPurchaseConversion(
      testOrder._id,
      testOrder.total,
      referredUser._id
    );

    console.log(`Commission Result:`, result);

    // Check the results
    console.log(`\n=== After Test ===`);
    const updatedReferrer = await User.findById(referrer._id);
    const updatedReferredUser = await User.findById(referredUser._id);

    console.log(`Referrer (${updatedReferrer.firstName} ${updatedReferrer.lastName}):`);
    console.log(`  Points Balance: ${updatedReferrer.pointsBalance}`);
    console.log(`  Total Points Earned: ${updatedReferrer.totalPointsEarned}`);

    // Check points transactions
    const pointsTransactions = await PointsTransaction.find({ user: updatedReferrer._id });
    console.log(`\nPoints Transactions for Referrer:`);
    pointsTransactions.forEach((txn, idx) => {
      console.log(`  ${idx + 1}. ${txn.type}: ${txn.points} points - ${txn.description} (${txn.createdAt})`);
    });

    // Clean up - delete the test order
    await Order.findByIdAndDelete(testOrder._id);
    console.log(`\n✅ Cleaned up test order`);

    console.log(`\n=== Test Complete ===`);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testCustomerReferralFix();