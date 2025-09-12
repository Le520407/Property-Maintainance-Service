const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const referralService = require('./services/referralService');
require('dotenv').config();

async function testFirstOrderOnlyLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get current state
    const referrer = await User.findOne({ email: 'le520735@gmail.com' });
    const t3User = await User.findOne({ email: 't3@gmail.com' });
    
    console.log('\n=== Before Third Order ===');
    console.log(`Referrer Points Balance: ${referrer.pointsBalance}`);
    console.log(`T3 hasCompletedFirstOrder: ${t3User.hasCompletedFirstOrder}`);
    console.log(`T3 firstOrderCompletedAt: ${t3User.firstOrderCompletedAt}`);

    // Create a THIRD order for T3 (should NOT give points)
    console.log('\n=== Creating Third Order for T3 ===');
    const thirdOrder = new Order({
      customer: t3User._id,
      items: [{
        productId: 'electrical-repair',
        name: 'Electrical Outlet Repair',
        price: 200,
        quantity: 1,
        subtotal: 200
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
      subtotal: 200,
      shippingCost: 15,
      total: 215,
      paymentMethod: 'hitpay',
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    await thirdOrder.save();
    console.log(`✅ Created third order: ${thirdOrder.orderNumber} for $${thirdOrder.total}`);

    // Try to track referral commission (should be skipped)
    console.log('\n=== Testing Referral Tracking ===');
    const result = await referralService.trackPurchaseConversion(
      thirdOrder._id,
      thirdOrder.total,
      t3User._id
    );

    console.log('Referral Result:', result);

    // Check final state
    const updatedReferrer = await User.findById(referrer._id);
    const updatedT3 = await User.findById(t3User._id);

    console.log('\n=== After Third Order ===');
    console.log(`Referrer Points Balance: ${updatedReferrer.pointsBalance} (should be same as before)`);
    console.log(`T3 hasCompletedFirstOrder: ${updatedT3.hasCompletedFirstOrder} (should be true)`);

    // Clean up - delete the test order
    await Order.findByIdAndDelete(thirdOrder._id);
    console.log('\n✅ Cleaned up test order');

    if (updatedReferrer.pointsBalance === referrer.pointsBalance) {
      console.log('\n🎉 SUCCESS: No additional points were awarded for subsequent order!');
    } else {
      console.log('\n❌ FAILURE: Points were incorrectly awarded for subsequent order!');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testFirstOrderOnlyLogic();