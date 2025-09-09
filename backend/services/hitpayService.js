const crypto = require('crypto');

class HitPayService {
  constructor() {
    this.baseUrl = process.env.HITPAY_BASE_URL || 'https://api.hit-pay.com/v1';
    this.apiKey = process.env.HITPAY_API_KEY || 'test_d82989991c25051a639bcc27a6e685b6aaa2ff19a8ce3f9767e6c77f0d87df88';
    this.salt = process.env.HITPAY_SALT;
    this.webhookSecret = process.env.HITPAY_WEBHOOK_SECRET;
    this.isSandbox = process.env.HITPAY_SANDBOX === 'true';
    
    // Demo mode: Check for placeholder values or demo keys
    this.isDemo = !this.apiKey || 
                  this.apiKey === 'demo_api_key_for_development' ||
                  this.apiKey === 'your_real_api_key_from_hitpay_dashboard' ||
                  this.apiKey.startsWith('demo_') ||
                  this.apiKey.startsWith('your_real_api_key');
    
    // Determine mode based on API key and configuration
    if (this.apiKey.startsWith('test_')) {
      this.isTestMode = true;
      this.isDemo = false;
      console.log('🧪 HitPay Service initialized in TEST MODE (Sandbox)');
    } else if (this.apiKey.startsWith('live_')) {
      this.isTestMode = false;
      this.isDemo = false;
      console.log('🚀 HitPay Service initialized with LIVE API');
    } else if (this.isDemo) {
      console.log('🚀 HitPay Service initialized in DEMO MODE');
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
          'X-BUSINESS-API-KEY': this.apiKey,
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
    console.log('🔍 HitPay Service Mode Check:');
    console.log('- API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('- Base URL:', this.baseUrl);
    console.log('- Is Demo:', this.isDemo);
    console.log('- Is Test Mode:', this.isTestMode);
    console.log('- Is Sandbox:', this.isSandbox);

    // Only use demo mode if no valid API key
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

    // 🚀 REAL HITPAY API CALL (Test or Live mode)
    console.log('🚀 Making REAL HitPay API call for recurring billing...');
    try {
      const formData = new URLSearchParams();
      formData.append('plan_id', billingData.planId);
      formData.append('customer_email', billingData.customerEmail);
      formData.append('customer_name', billingData.customerName || '');
      formData.append('start_date', billingData.startDate); // YYYY-MM-DD format
      formData.append('redirect_url', billingData.redirectUrl || `${process.env.FRONTEND_URL}/membership/success`);
      formData.append('reference', billingData.reference || `billing_${Date.now()}`);
      
      // Add webhook URL for payment notifications
      const webhookUrl = `${process.env.WEBHOOK_URL}/api/membership/hitpay-webhook`;
      formData.append('webhook', webhookUrl);
      console.log('🔔 Setting webhook URL for recurring billing:', webhookUrl);
      
      if (billingData.paymentMethods && billingData.paymentMethods.length > 0) {
        billingData.paymentMethods.forEach(method => {
          formData.append('payment_methods[]', method);
        });
      }

      console.log('📤 Sending request to HitPay API:');
      console.log('- URL:', `${this.baseUrl}/recurring-billing`);
      console.log('- Data:', Object.fromEntries(formData));

      const response = await fetch(`${this.baseUrl}/recurring-billing`, {
        method: 'POST',
        headers: {
          'X-BUSINESS-API-KEY': this.apiKey,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      console.log('📥 HitPay API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HitPay API Error Response:', errorText);
        throw new Error(`HitPay API Error (${response.status}): ${errorText || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ REAL BILLING ID RECEIVED FROM HITPAY:');
      console.log('==========================================');
      console.log('📊 Full API Response:', JSON.stringify(result, null, 2));
      console.log('🆔 Billing ID:', result.id);
      console.log('📋 Plan ID:', result.plan_id);
      console.log('🔗 Payment URL:', result.url);
      console.log('💳 Status:', result.status);
      console.log('==========================================');

      return result;
    } catch (error) {
      console.error('❌ Error creating HitPay recurring billing:', error);
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

    if (times_to_be_charged === undefined) {
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
      // Prepare form data (HitPay expects form data, not JSON)
      const formData = new URLSearchParams();
      formData.append('cycle', cycle);
      if (times_to_be_charged !== null) {
        formData.append('times_to_be_charged', times_to_be_charged.toString());
      }
      if (name) formData.append('name', name);
      if (description) formData.append('description', description);
      if (amount) formData.append('amount', amount.toString());
      if (currency) formData.append('currency', currency);

      console.log('🚀 Creating HitPay subscription plan V2 with form data');

      const response = await fetch(`${this.baseUrl}/subscription-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-BUSINESS-API-KEY': this.apiKey
        },
        body: formData.toString()
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

  /**
   * Update an existing subscription plan using HitPay API V2
   * @param {string} planId - The ID of the plan to update
   * @param {Object} updateData - Plan update configuration
   * @param {string} updateData.name - Plan name (optional)
   * @param {string} updateData.description - Plan description (optional)
   * @param {number} updateData.amount - Amount in cents (optional)
   * @param {string} updateData.cycle - monthly, weekly, yearly (optional)
   * @param {string} updateData.cycle_frequency - day, week, month (optional)
   * @param {number} updateData.cycle_repeat - Number of cycles (optional)
   * @param {string} updateData.currency - Currency code (optional, defaults to SGD)
   * @param {string} updateData.reference - Reference string (optional)
   * @param {string} updateData.redirect_url - Redirect URL after payment (optional)
   * @param {string} updateData.start_date_method - sign_up_date or fixed_date (optional)
   * @param {number} updateData.fixed_date - Fixed date for billing (optional)
   * @param {number} updateData.times_to_be_charged - Number of times to charge (optional)
   * @returns {Object} Success/failure response with HitPay data
   */
  async updateSubscriptionPlan(planId, updateData) {
    if (!planId) {
      return {
        success: false,
        error: 'Plan ID is required for update',
        data: null
      };
    }

    // Demo mode for testing without real HitPay credentials
    if (this.isDemo) {
      console.log('🎯 HitPay Demo Mode: Updating subscription plan', { planId, updateData });
      
      return {
        success: true,
        error: null,
        data: {
          id: planId,
          ...updateData,
          updated_at: new Date().toISOString(),
          status: 'active',
          demo: true
        }
      };
    }

    try {
      console.log('🔄 Updating HitPay subscription plan:', planId);
      console.log('📝 Update data:', updateData);

      const response = await fetch(`${this.baseUrl}/subscription-plan/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-BUSINESS-API-KEY': this.apiKey
        },
        body: JSON.stringify(updateData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ HitPay Update API Error:', response.status, responseData);
        return {
          success: false,
          error: responseData.message || `API Error: ${response.status} ${response.statusText}`,
          data: responseData
        };
      }

      console.log('✅ HitPay subscription plan updated successfully:', responseData);
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

  /**
   * Cancel (delete) an existing subscription plan using HitPay API V1
   * Uses the DELETE /v1/subscription-plan/{plan_id} endpoint
   * @param {string} planId - The ID of the plan to cancel
   * @returns {Object} Success/failure response with HitPay data
   */
  async cancelSubscriptionPlan(planId) {
    if (!planId) {
      return {
        success: false,
        error: 'Plan ID is required for cancellation',
        data: null
      };
    }

    // Demo mode for testing without real HitPay credentials
    if (this.isDemo) {
      console.log('🎯 HitPay Demo Mode: Cancelling subscription plan', planId);
      
      return {
        success: true,
        error: null,
        data: {
          id: planId,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          demo: true,
          message: 'Subscription plan cancelled successfully'
        }
      };
    }

    try {
      console.log('🗑️ Cancelling HitPay subscription plan:', planId);
      
      // Use the exact API format as requested
      const url = `https://api.sandbox.hit-pay.com/v1/subscription-plan/${planId}`;
      const options = {
        method: 'DELETE',
        headers: {
          'X-BUSINESS-API-KEY': this.apiKey
        },
        body: undefined
      };

      console.log('🌐 [HITPAY API] Making DELETE request to:', url);
      console.log('� [HITPAY API] Method:', options.method);
      console.log('🔑 [HITPAY API] Headers:', Object.keys(options.headers));

      const response = await fetch(url, options);

      // Handle response data
      let data;
      try {
        data = await response.json();
        console.log('📥 HitPay Response Data:', data);
      } catch (parseError) {
        // If JSON parsing fails, handle as successful deletion
        console.log('✅ No response body (successful deletion)');
        data = { 
          success: true, 
          message: 'Subscription plan deleted successfully',
          deleted_at: new Date().toISOString()
        };
      }

      if (!response.ok) {
        console.error('❌ HitPay Cancel API Error:', response.status, data);
        return {
          success: false,
          error: data?.message || `API Error: ${response.status} ${response.statusText}`,
          data: data
        };
      }

      console.log('✅ HitPay subscription plan cancelled successfully');
      return {
        success: true,
        error: null,
        data: {
          id: planId,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          message: 'Subscription plan cancelled successfully',
          ...data
        }
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

  /**
   * Process a refund using HitPay API V2
   * @param {Object} refundData - Refund configuration
   * @param {number} refundData.amount - Amount to refund in cents
   * @param {string} refundData.payment_id - The original payment ID to refund
   * @param {string} refundData.webhook - Webhook URL for refund notifications (optional)
   * @param {boolean} refundData.send_email - Whether to send email notification (optional)
   * @param {string} refundData.email - Email address to send notification (optional)
   * @returns {Object} Success/failure response with HitPay refund data
   */
  async processRefund(refundData) {
    const { amount, payment_id, webhook, send_email = true, email } = refundData;

    // Validate required fields
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'Amount is required and must be greater than 0',
        data: null
      };
    }

    if (!payment_id) {
      return {
        success: false,
        error: 'Payment ID is required for refund',
        data: null
      };
    }

    // Demo mode for testing without real HitPay credentials
    if (this.isDemo) {
      console.log('🎯 HitPay Demo Mode: Processing refund', refundData);
      
      return {
        success: true,
        error: null,
        data: {
          id: `demo_refund_${Date.now()}`,
          payment_id: payment_id,
          amount: amount,
          status: 'succeeded',
          created_at: new Date().toISOString(),
          email: email,
          demo: true,
          message: 'Refund processed successfully in demo mode'
        }
      };
    }

    try {
      console.log('💰 Processing HitPay refund:', refundData);

      const requestBody = {
        amount: amount,
        payment_id: payment_id
      };

      // Add optional fields if provided
      if (webhook) requestBody.webhook = webhook;
      if (send_email !== undefined) requestBody.send_email = send_email.toString();
      if (email) requestBody.email = email;

      const response = await fetch(`${this.baseUrl}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BUSINESS-API-KEY': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ HitPay Refund API Error:', response.status, responseData);
        return {
          success: false,
          error: responseData.message || `API Error: ${response.status} ${response.statusText}`,
          data: responseData
        };
      }

      console.log('✅ HitPay refund processed successfully:', responseData);
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

  /**
   * Cancel recurring billing subscription
   * @param {string} recurringBillingId - The recurring billing ID to cancel
   */
  async cancelRecurringBilling(recurringBillingId) {
    // Demo mode for testing
    if (this.isDemo) {
      console.log('🎯 HitPay Demo Mode: Cancelling recurring billing', recurringBillingId);
      
      const demoResponse = {
        success: true,
        message: 'Recurring billing cancelled successfully (demo mode)',
        billing_id: recurringBillingId,
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      };
      
      console.log('💰 CANCELLATION RESPONSE (Demo Mode):');
      console.log('====================================');
      console.log('✅ SUCCESS: Recurring billing cancelled');
      console.log('📊 Cancellation Details:', JSON.stringify(demoResponse, null, 2));
      console.log('🆔 Billing ID:', demoResponse.billing_id);
      console.log('💳 Status:', demoResponse.status);
      console.log('====================================');
      
      return demoResponse;
    }

    try {
      // Real API call to cancel recurring billing
      console.log('🔄 [HITPAY API] Making DELETE request for recurring billing');
      console.log('🌐 [HITPAY API] URL:', `${this.baseUrl}/recurring-billing/${recurringBillingId}`);
      console.log('🔧 [HITPAY API] Method: DELETE');
      
      const response = await fetch(`${this.baseUrl}/recurring-billing/${recurringBillingId}`, {
        method: 'DELETE',
        headers: {
          'X-BUSINESS-API-KEY': this.apiKey,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HitPay Cancel API Error: ${error || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ HitPay recurring billing cancelled:', result);
      return result;

    } catch (error) {
      console.error('❌ Error cancelling HitPay recurring billing:', error);
      throw error;
    }
  }
}

module.exports = new HitPayService();
