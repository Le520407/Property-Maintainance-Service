// Quick server to test payment responses
const express = require('express');
const app = express();

app.use(express.json());

// Mock HitPay service
const mockHitPayService = {
  isDemo: true,
  
  async createSubscriptionPlanV2(planData) {
    const { cycle, times_to_be_charged, name, description, amount, currency = 'SGD' } = planData;
    
    console.log('🎯 HitPay Demo Mode: Creating subscription plan V2', planData);
    
    const demoResponse = {
      success: true,
      error: null,
      data: {
        id: `demo_plan_v2_${Date.now()}`,
        name: name || `Demo Plan ${cycle}`,
        description: description || `Demo subscription plan - ${cycle}`,
        amount: amount || 1000,
        currency: currency,
        cycle: cycle,
        times_to_be_charged: times_to_be_charged,
        status: 'active',
        created_at: new Date().toISOString(),
        reference: `demo_ref_${Date.now()}`
      }
    };
    
    console.log('💰 PAYMENT RESPONSE (Demo Subscription Plan):');
    console.log('==============================================');
    console.log('✅ SUCCESS: Subscription plan created');
    console.log('📊 Plan Details:', JSON.stringify(demoResponse.data, null, 2));
    console.log('💵 Amount:', (demoResponse.data.amount / 100).toFixed(2), demoResponse.data.currency);
    console.log('🔄 Cycle:', demoResponse.data.cycle);
    console.log('🔢 Times to charge:', demoResponse.data.times_to_be_charged);
    console.log('==============================================');
    
    return demoResponse;
  }
};

// Your exact curl endpoint
app.post('/api/hitpay/subscription-plan', async (req, res) => {
  try {
    const { cycle, times_to_be_charged, name, description, amount, currency } = req.body;

    console.log('📋 Creating subscription plan with data:', req.body);

    const result = await mockHitPayService.createSubscriptionPlanV2({
      cycle,
      times_to_be_charged,
      name,
      description,
      amount,
      currency
    });

    if (result.success) {
      console.log('✅ Subscription plan created successfully');
      return res.status(200).json({
        success: true,
        message: 'Subscription plan created successfully',
        data: result.data
      });
    } else {
      console.log('❌ Failed to create subscription plan:', result.error);
      return res.status(400).json({
        success: false,
        message: result.error,
        data: result.data
      });
    }

  } catch (error) {
    console.error('💥 Error in subscription plan endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

const PORT = 5001; // Use different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`🚀 Test Payment Server running on port ${PORT}`);
  console.log(`📍 Test endpoint: POST http://localhost:${PORT}/api/hitpay/subscription-plan`);
  console.log('🎯 Ready to show payment responses in console!');
});
