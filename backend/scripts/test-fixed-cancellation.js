const mongoose = require('mongoose');
require('dotenv').config();

async function testFixedCancellation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const membershipService = require('../services/membershipService');
    const { CustomerMembership } = require('../models/CustomerMembership');
    
    // Test with the membership that has a custom billing ID
    const customerId = '68b799644ebd2c16b42f84f7';
    
    console.log('🔍 Testing cancellation with fixed logic...');
    console.log('   Customer:', customerId);
    console.log('');
    
    // Get the membership before cancellation
    const membershipBefore = await CustomerMembership.findOne({ 
      customer: customerId,
      status: 'ACTIVE'
    });
    
    if (!membershipBefore) {
      console.log('❌ No active membership found for this customer');
      await mongoose.disconnect();
      return;
    }
    
    console.log('📊 Membership before cancellation:');
    console.log('   Status:', membershipBefore.status);
    console.log('   HitPay Billing ID:', membershipBefore.hitpayRecurringBillingId);
    console.log('   HitPay Plan ID:', membershipBefore.hitpayPlanId);
    console.log('   Cancelled At:', membershipBefore.cancelledAt);
    console.log('');
    
    // Test the cancellation
    try {
      console.log('🧪 Testing membership cancellation...');
      const result = await membershipService.cancelMembership(customerId, false);
      
      console.log('✅ Cancellation completed successfully!');
      console.log('📊 Updated membership:');
      console.log('   Status:', result.status);
      console.log('   Cancelled At:', result.cancelledAt);
      console.log('   Will Expire At:', result.willExpireAt);
      console.log('   Cancellation Reason:', result.cancellationReason);
      
    } catch (error) {
      console.error('❌ Error during cancellation:', error.message);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFixedCancellation();
