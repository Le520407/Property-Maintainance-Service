const mongoose = require('mongoose');
require('dotenv').config();

async function testRealBillingIdCancellation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const membershipService = require('../services/membershipService');
    const { CustomerMembership } = require('../models/CustomerMembership');
    
    // Find a membership with a real HitPay billing ID
    const membershipWithRealId = await CustomerMembership.findOne({ 
      hitpayRecurringBillingId: { $regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i },
      status: 'ACTIVE'
    });
    
    if (!membershipWithRealId) {
      console.log('ℹ️ No active membership with real HitPay billing ID found for testing');
      console.log('💡 This means all current active memberships use custom/demo IDs');
      await mongoose.disconnect();
      return;
    }
    
    console.log('🔍 Found membership with real HitPay billing ID:');
    console.log('   Customer:', membershipWithRealId.customer);
    console.log('   Status:', membershipWithRealId.status);
    console.log('   HitPay Billing ID:', membershipWithRealId.hitpayRecurringBillingId);
    console.log('   HitPay Plan ID:', membershipWithRealId.hitpayPlanId);
    console.log('');
    
    console.log('🧪 Testing cancellation with real HitPay billing ID...');
    console.log('⚠️  This will actually cancel the subscription in HitPay!');
    console.log('❓ Do you want to proceed? (This test would cancel a real subscription)');
    console.log('💡 For now, just confirming the logic detects real IDs correctly');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testRealBillingIdCancellation();
