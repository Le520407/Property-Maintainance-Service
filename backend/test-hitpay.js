// Load environment variables first
require('dotenv').config();

const hitpay = require('./services/hitpayService');

async function testHitPayConfiguration() {
  console.log('🧪 Testing HitPay Configuration');
  console.log('================================');
  
  console.log('Base URL:', hitpay.baseUrl);
  console.log('API Key:', hitpay.apiKey ? `${hitpay.apiKey.substr(0, 8)}...` : 'Not set');
  console.log('Is Demo Mode:', hitpay.isDemo);
  console.log('Is Test Mode:', hitpay.isTestMode);
  console.log('Webhook URL:', process.env.WEBHOOK_URL);
  
  // Test payment creation
  try {
    console.log('\n📝 Testing Payment Request Creation...');
    const testPayment = {
      amount: 1000, // $10.00 in cents
      currency: 'SGD',
      email: 'test@example.com',
      reference_number: 'TEST_' + Date.now(),
      name: 'Test Customer',
      purpose: 'Test Payment'
    };
    
    const result = await hitpay.createPayment(testPayment);
    console.log('✅ Payment request created successfully!');
    console.log('Payment URL:', result.url);
    console.log('Payment ID:', result.id || result.payment_request_id);
    
  } catch (error) {
    console.error('❌ Payment creation failed:', error.message);
  }
}

testHitPayConfiguration().catch(console.error);
