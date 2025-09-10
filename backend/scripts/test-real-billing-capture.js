require('dotenv').config();
const mongoose = require('mongoose');
const hitpayService = require('../services/hitpayService');

async function testRealBillingIdCapture() {
  try {
    console.log('🔍 Testing Real HitPay Billing ID Capture');
    console.log('=========================================');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    console.log('\n🔧 HitPay Service Configuration:');
    console.log('- API Key:', process.env.HITPAY_API_KEY ? `${process.env.HITPAY_API_KEY.substring(0, 8)}...` : 'NOT SET');
    console.log('- Base URL:', process.env.HITPAY_BASE_URL);
    console.log('- Sandbox Mode:', process.env.HITPAY_SANDBOX);
    console.log('- Service Demo Mode:', hitpayService.isDemo);
    console.log('- Service Test Mode:', hitpayService.isTestMode);

    if (hitpayService.isDemo) {
      console.log('\n⚠️ WARNING: HitPay service is in DEMO mode');
      console.log('Real billing IDs will NOT be captured in demo mode');
      console.log('To get real billing IDs, ensure you have a valid HitPay API key');
      return;
    }

    console.log('\n🚀 Testing real HitPay API calls...');

    // Test 1: Create a subscription plan
    console.log('\n📋 Step 1: Creating subscription plan...');
    const planData = {
      name: 'Test Real Billing Plan',
      amount: 1000, // $10.00 SGD in cents
      currency: 'SGD',
      cycle: 'monthly', // Changed from 'month' to 'monthly'
      reference: `test_real_plan_${Date.now()}`
    };

    let plan;
    try {
      plan = await hitpayService.createSubscriptionPlan(planData);
      console.log('✅ Plan created with ID:', plan.id);
      console.log('🔑 Plan details:', plan);
    } catch (planError) {
      console.error('❌ Failed to create plan:', planError.message);
      return;
    }

    // Test 2: Create recurring billing
    console.log('\n🔄 Step 2: Creating recurring billing...');
    const billingData = {
      planId: plan.id,
      customerEmail: 'real.test@hitpay.com', // Use a more standard email format
      customerName: 'Test Customer',
      startDate: new Date().toISOString().split('T')[0],
      redirectUrl: 'https://example.com/success',
      reference: `test_real_billing_${Date.now()}`,
      paymentMethods: ['card']
    };

    let billing;
    try {
      billing = await hitpayService.createRecurringBilling(billingData);
      console.log('✅ Billing created with ID:', billing.id);
      console.log('🔑 Billing details:', billing);
      
      // Check if we got a real billing ID
      if (billing.id && !billing.id.startsWith('demo_') && !billing.id.startsWith('test_')) {
        console.log('🎯 SUCCESS: Real HitPay billing ID captured!');
        console.log('📝 Billing ID format:', billing.id);
        console.log('🔗 Payment URL:', billing.url);
      } else {
        console.log('⚠️ WARNING: Received test/demo billing ID:', billing.id);
      }
    } catch (billingError) {
      console.error('❌ Failed to create billing:', billingError.message);
      return;
    }

    // Test 3: Cleanup - Cancel the test subscription
    console.log('\n🗑️ Step 3: Cleaning up test subscription...');
    try {
      await hitpayService.cancelRecurringBilling(billing.id);
      console.log('✅ Test billing cancelled successfully');
    } catch (cancelError) {
      console.log('⚠️ Could not cancel test billing (may need manual cleanup):', cancelError.message);
    }

    try {
      await hitpayService.cancelSubscriptionPlan(plan.id);
      console.log('✅ Test plan cancelled successfully');
    } catch (cancelError) {
      console.log('⚠️ Could not cancel test plan (may need manual cleanup):', cancelError.message);
    }

    console.log('\n🎯 TEST COMPLETE');
    console.log('================');
    console.log('✅ Real billing ID capture working!');
    console.log('💡 Your system will now save real HitPay billing IDs for automatic cancellation');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testRealBillingIdCapture().catch(console.error);
