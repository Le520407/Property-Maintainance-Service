const mongoose = require('mongoose');
require('dotenv').config();

async function testHitPayCancellation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hitpayService = require('../services/hitpayService');
    const { CustomerMembership } = require('../models/CustomerMembership');
    
    // Test with the membership that was cancelled today
    const membership = await CustomerMembership.findOne({ 
      customer: '68b799644ebd2c16b42f84f7',
      cancelledAt: { $exists: true }
    });
    
    if (!membership) {
      console.log('❌ No cancelled membership found');
      return;
    }
    
    console.log('🔍 Testing with membership:');
    console.log('   Customer:', membership.customer);
    console.log('   Status:', membership.status);
    console.log('   HitPay Billing ID:', membership.hitpayRecurringBillingId);
    console.log('   HitPay Plan ID:', membership.hitpayPlanId);
    console.log('   Cancelled At:', membership.cancelledAt);
    console.log('');
    
    // Test the HitPay cancellation API
    console.log('🧪 Testing HitPay cancellation API...');
    
    try {
      // Test recurring billing cancellation
      if (membership.hitpayRecurringBillingId) {
        console.log('🔄 Testing recurring billing cancellation...');
        const result = await hitpayService.cancelRecurringBilling(membership.hitpayRecurringBillingId);
        console.log('✅ Recurring billing cancellation result:', result);
      }
      
      // Test subscription plan cancellation
      if (membership.hitpayPlanId) {
        console.log('🔄 Testing subscription plan cancellation...');
        const result = await hitpayService.cancelSubscriptionPlan(membership.hitpayPlanId);
        console.log('✅ Subscription plan cancellation result:', result);
      }
      
    } catch (error) {
      console.error('❌ Error during HitPay API test:', error.message);
      console.error('📊 Full error:', error);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testHitPayCancellation();
