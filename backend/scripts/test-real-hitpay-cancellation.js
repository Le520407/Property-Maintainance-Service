const mongoose = require('mongoose');
require('dotenv').config();

async function testRealHitPayCancellation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hitpayService = require('../services/hitpayService');
    
    // Test with a real HitPay billing ID (not our custom generated one)
    const realBillingId = '9fd74f7a-937b-4156-9f00-37439edda256'; // From the most recent active membership
    
    console.log('🔍 Testing with real HitPay billing ID:', realBillingId);
    console.log('');
    
    // Test the HitPay cancellation API
    console.log('🧪 Testing HitPay cancellation API...');
    
    try {
      console.log('🔄 Testing recurring billing cancellation...');
      const result = await hitpayService.cancelRecurringBilling(realBillingId);
      console.log('✅ Recurring billing cancellation result:', result);
      
    } catch (error) {
      console.error('❌ Error during HitPay API test:', error.message);
      
      // Check if it's because the billing ID doesn't exist or is already cancelled
      if (error.message.includes('No query results')) {
        console.log('🔍 This billing ID might not exist in HitPay or is already cancelled');
      } else if (error.message.includes('already cancelled')) {
        console.log('🔍 This billing ID is already cancelled in HitPay');
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testRealHitPayCancellation();
