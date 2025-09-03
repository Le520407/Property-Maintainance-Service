const crypto = require('crypto');

class HitPayService {
  constructor() {
    this.baseUrl = process.env.HITPAY_BASE_URL || 'https://api.sandbox.hit-pay.com/v1';
    this.apiKey = process.env.HITPAY_API_KEY;
    this.salt = process.env.HITPAY_SALT;
    this.webhookSecret = process.env.HITPAY_WEBHOOK_SECRET;
    
    // Demo mode: Check for placeholder values or demo keys
    this.isDemo = !this.apiKey || 
                  this.apiKey === 'test_9b6b83ea014999e2507e35a8e644a4a9df2c85055f2c5f44cf7efadf46b9328c' ||
                  this.apiKey === 'demo_api_key_for_development' ||
                  this.apiKey.startsWith('demo_') ||
                  this.apiKey.startsWith('test_') ||
                  process.env.NODE_ENV === 'development'; // Force demo mode in development
    
    if (this.isDemo) {
      console.log('🚀 HitPay Service initialized in DEMO MODE');
    } else {
      console.log('🚀 HitPay Service initialized with LIVE API');
    }
  }

  /**
   * Create a subscription plan (Step 1)
   */
  async createSubscriptionPlan(planData) {
    // Demo mode for testing without real HitPay credentials
    if (this.isDemo) {
      console.log('🎯 HitPay Demo Mode: Creating subscription plan', planData);
      
      const demoResponse = {
        id: `demo_plan_${Date.now()}`,
        name: planData.name,
        amount: planData.amount,
        currency: planData.currency || 'SGD',
        cycle: planData.cycle,
        reference: planData.reference,
        status: 'active'
      };
      
      console.log('💰 PAYMENT RESPONSE (Demo Plan Creation):');
      console.log('==========================================');
      console.log('✅ SUCCESS: Subscription plan created');
      console.log('📊 Plan Details:', JSON.stringify(demoResponse, null, 2));
      console.log('💵 Amount:', (demoResponse.amount / 100).toFixed(2), demoResponse.currency);
      console.log('🔄 Cycle:', demoResponse.cycle);
      console.log('🏷️ Plan ID:', demoResponse.id);
      console.log('==========================================');
      
      return demoResponse;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('name', planData.name);
      formData.append('description', planData.description || planData.name);
      formData.append('currency', planData.currency || 'SGD');
      formData.append('amount', planData.amount.toString());
      formData.append('cycle', planData.cycle); // weekly, monthly, yearly
      formData.append('reference', planData.reference || `plan_${Date.now()}`);

      const response = await fetch(`${this.baseUrl}/subscription-plan`, {
        method: 'POST',
        headers: {
          'meowmeowmeow': this.apiKey,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HitPay API Error: ${error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating HitPay subscription plan:', error);
      throw error;
    }
  }

  /**
   * Create recurring billing for customer (Step 2)
   */
  async createRecurringBilling(billingData) {
    // Demo mode for testing without real HitPay credentials
    if (this.isDemo) {
      console.log('🎯 HitPay Demo Mode: Creating recurring billing', billingData);
      const billingId = `demo_billing_${Date.now()}`;
      const demoResponse = {
        id: billingId,
        plan_id: billingData.planId,
        status: 'pending',
        url: `${process.env.FRONTEND_URL}/membership/demo-checkout?billing_id=${billingId}&amount=${billingData.amount || 'N/A'}&plan=${billingData.planId}`,
        customer_email: billingData.customerEmail,
        customer_name: billingData.customerName,
        start_date: billingData.startDate,
        reference: billingData.reference
      };
      
      console.log('💰 PAYMENT RESPONSE (Demo Mode):');
      console.log('=====================================');
      console.log('✅ SUCCESS: Recurring billing created');
      console.log('📊 Billing Details:', JSON.stringify(demoResponse, null, 2));
      console.log('🔗 Payment URL:', demoResponse.url);
      console.log('💳 Status:', demoResponse.status);
      console.log('=====================================');
      
      return demoResponse;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('plan_id', billingData.planId);
      formData.append('customer_email', billingData.customerEmail);
      formData.append('customer_name', billingData.customerName || '');
      formData.append('start_date', billingData.startDate); // YYYY-MM-DD format
      formData.append('redirect_url', billingData.redirectUrl || `${process.env.FRONTEND_URL}/membership/success`);
      formData.append('reference', billingData.reference || `billing_${Date.now()}`);
      
      if (billingData.paymentMethods && billingData.paymentMethods.length > 0) {
        billingData.paymentMethods.forEach(method => {
          formData.append('payment_methods[]', method);
        });
      }

      const response = await fetch(`${this.baseUrl}/recurring-billing`, {
        method: 'POST',
        headers: {
          'meowmeowmeow': this.apiKey,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HitPay API Error: ${error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating HitPay recurring billing:', error);
      throw error;
    }
  }

  /**
   * Create one-time payment request (POST /v1/payment-requests)
   * Mandatory fields: amount, currency
   */
  async createPayment(paymentData) {
    // Demo mode for testing without real HitPay credentials
    if (this.isDemo) {
      console.log('🎯 HitPay Demo Mode: Creating payment request', paymentData);
      const paymentRequestId = `demo_payment_req_${Date.now()}`;
      const demoResponse = {
        id: paymentRequestId,
        payment_request_id: paymentRequestId,
        url: `${process.env.FRONTEND_URL}/membership/demo-payment?payment_request_id=${paymentRequestId}&reference_number=${paymentData.reference_number}&amount=${paymentData.amount}&currency=${paymentData.currency || 'SGD'}&status=pending&demo=true`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'SGD',
        reference_number: paymentData.reference_number || `REF${Date.now()}`,
        status: 'pending',
        email: paymentData.email
      };
      
      console.log('💰 PAYMENT RESPONSE (Demo Payment Request):');
      console.log('=============================================');
      console.log('✅ SUCCESS: Payment request created');
      console.log('📊 Payment Details:', JSON.stringify(demoResponse, null, 2));
      console.log('💵 Amount:', (demoResponse.amount / 100).toFixed(2), demoResponse.currency);
      console.log('🔗 Payment URL:', demoResponse.url);
      console.log('🏷️ Payment Request ID:', demoResponse.payment_request_id);
      console.log('📧 Customer Email:', demoResponse.email);
      console.log('🔢 Reference:', demoResponse.reference_number);
      console.log('💳 Status:', demoResponse.status);
      console.log('=============================================');
      
      return demoResponse;
    }

    try {
      // Validate mandatory fields
      if (!paymentData.amount || !paymentData.currency) {
        throw new Error('Missing mandatory fields: amount and currency are required');
      }

      const formData = new URLSearchParams();
      // Mandatory fields
      formData.append('amount', paymentData.amount.toString());
      formData.append('currency', paymentData.currency);
      
      // Optional fields matching your example
      if (paymentData.email) {
        formData.append('email', paymentData.email);
      }
      if (paymentData.redirect_url) {
        formData.append('redirect_url', paymentData.redirect_url);
      }
      if (paymentData.reference_number) {
        formData.append('reference_number', paymentData.reference_number);
      }
      if (paymentData.webhook) {
        formData.append('webhook', paymentData.webhook);
      }
      
      // Additional optional fields
      if (paymentData.name) {
        formData.append('name', paymentData.name);
      }
      if (paymentData.purpose) {
        formData.append('purpose', paymentData.purpose);
      }
      if (paymentData.send_email !== undefined) {
        formData.append('send_email', paymentData.send_email ? 'true' : 'false');
      }
      
      // Payment methods
      if (paymentData.payment_methods && paymentData.payment_methods.length > 0) {
        paymentData.payment_methods.forEach(method => {
          formData.append('payment_methods[]', method);
        });
      }

      console.log('🚀 Creating HitPay payment request with data:', Object.fromEntries(formData));

      const response = await fetch(`${this.baseUrl}/payment-requests`, {
        method: 'POST',
        headers: {
          'X-BUSINESS-API-KEY': this.apiKey,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ PAYMENT RESPONSE (FAILED):');
        console.log('=============================');
        console.log('💥 ERROR: Payment request failed');
        console.log('📊 Status Code:', response.status);
        console.log('📄 Error Details:', errorText);
        console.log('=============================');
        throw new Error(`HitPay API Error: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      
      console.log('💰 PAYMENT RESPONSE (SUCCESS):');
      console.log('===============================');
      console.log('✅ SUCCESS: Payment request created');
      console.log('📊 Payment Details:', JSON.stringify(result, null, 2));
      console.log('💵 Amount:', (result.amount / 100).toFixed(2), result.currency);
      console.log('🔗 Payment URL:', result.url);
      console.log('🏷️ Payment Request ID:', result.id);
      console.log('🔢 Reference:', result.reference_number);
      console.log('💳 Status:', result.status);
      console.log('===============================');

      return result;
    } catch (error) {
      console.log('❌ PAYMENT RESPONSE (ERROR):');
      console.log('============================');
      console.log('💥 ERROR: Payment request creation failed');
      console.log('📄 Error Message:', error.message);
      console.log('============================');
      console.error('Error creating HitPay payment request:', error);
      throw error;
    }
  }

  /**
   * Create subscription plan using the exact HitPay API format you specified
   * @param {Object} planData - Plan configuration
   * @param {string} planData.cycle - monthly, weekly, yearly
   * @param {number} planData.times_to_be_charged - Number of times to charge (1 for one-time, null for infinite)
   * @param {string} planData.name - Plan name (optional)
   * @param {string} planData.description - Plan description (optional)
   * @param {number} planData.amount - Amount in cents (optional)
   * @param {string} planData.currency - Currency code (optional, defaults to SGD)
   * @returns {Object} Success/failure response with HitPay data
   */
  async createSubscriptionPlanV2(planData) {
    const { cycle, times_to_be_charged, name, description, amount, currency = 'SGD' } = planData;

    // Validate required fields
    if (!cycle) {
      return {
        success: false,
        error: 'Cycle is required (monthly, weekly, yearly)',
        data: null
      };
    }

    if (times_to_be_charged === undefined || times_to_be_charged === null) {
      return {
        success: false,
        error: 'times_to_be_charged is required (1 for one-time, null for infinite)',
        data: null
      };
    }

    // Demo mode for testing without real HitPay credentials
    if (this.isDemo) {
      console.log('🎯 HitPay Demo Mode: Creating subscription plan V2', planData);
      
      const demoResponse = {
        success: true,
        error: null,
        data: {
          id: `demo_plan_v2_${Date.now()}`,
          name: name || `Demo Plan ${cycle}`,
          description: description || `Demo subscription plan - ${cycle}`,
          amount: amount || 1000, // Default 10.00 SGD in cents
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

    // Real API call
    try {
      // Prepare request body
      const requestBody = {
        cycle: cycle,
        times_to_be_charged: times_to_be_charged
      };

      // Add optional fields if provided
      if (name) requestBody.name = name;
      if (description) requestBody.description = description;
      if (amount) requestBody.amount = amount;
      if (currency) requestBody.currency = currency;

      console.log('🚀 Creating HitPay subscription plan:', requestBody);

      const response = await fetch(`${this.baseUrl}/subscription-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BUSINESS-API-KEY': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ HitPay API Error:', response.status, responseData);
        return {
          success: false,
          error: responseData.message || `API Error: ${response.status} ${response.statusText}`,
          data: responseData
        };
      }

      console.log('✅ HitPay subscription plan created successfully:', responseData);
      return {
        success: true,
        error: null,
        data: responseData
      };

    } catch (error) {
      console.error('💥 Network/Parse Error:', error);
      return {
        success: false,
        error: `Network error: ${error.message}`,
        data: null
      };
    }
  }
}

module.exports = new HitPayService();
