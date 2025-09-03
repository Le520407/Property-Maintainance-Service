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
      console.log('HitPay Demo Mode: Creating subscription plan', planData);
      return {
        id: `demo_plan_${Date.now()}`,
        name: planData.name,
        amount: planData.amount,
        currency: planData.currency || 'SGD',
        cycle: planData.cycle,
        reference: planData.reference,
        status: 'active'
      };
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
      console.log('HitPay Demo Mode: Creating recurring billing', billingData);
      const billingId = `demo_billing_${Date.now()}`;
      return {
        id: billingId,
        plan_id: billingData.planId,
        status: 'pending',
        url: `${process.env.FRONTEND_URL}/membership/demo-checkout?billing_id=${billingId}&amount=${billingData.amount || 'N/A'}&plan=${billingData.planId}`,
        customer_email: billingData.customerEmail,
        customer_name: billingData.customerName,
        start_date: billingData.startDate,
        reference: billingData.reference
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('plan_id', billingData.planId);
      formData.append('customer_email', billingData.customerEmail);
      formData.append('customer_name', billingData.customerName || '');
      formData.append('start_date', billingData.startDate); // YYYY-MM-DD format
      formData.append('redirect_url', billingData.redirectUrl || `${process.env.FRONTEND_URL}/membership/success`);
      formData.append('webhook', `${process.env.BACKEND_URL}/api/hitpay/webhook`);
      formData.append('reference', billingData.reference || `sub_${Date.now()}`);
      formData.append('send_email', 'true');
      
      // Add payment methods
      if (billingData.paymentMethods && billingData.paymentMethods.length > 0) {
        billingData.paymentMethods.forEach(method => {
          formData.append('payment_methods[]', method);
        });
      } else {
        formData.append('payment_methods[]', 'card');
        formData.append('payment_methods[]', 'paynow');
      }

      // Custom amount if different from plan
      if (billingData.amount) {
        formData.append('amount', billingData.amount.toString());
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
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch(`${this.baseUrl}/recurring-billing/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'meowmeowmeow': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HitPay API Error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling HitPay subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      const response = await fetch(`${this.baseUrl}/recurring-billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'meowmeowmeow': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HitPay API Error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching HitPay subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}/recurring-billing/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'meowmeowmeow': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`HitPay API Error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating HitPay subscription:', error);
      throw error;
    }
  }

  /**
   * Create one-time payment (Alternative to recurring billing)
   */
  async createPayment(paymentData) {
    // Demo mode for testing without real HitPay credentials
    if (this.isDemo) {
      console.log('HitPay Demo Mode: Creating one-time payment', paymentData);
      const paymentId = `demo_payment_${Date.now()}`;
      return {
        id: paymentId,
        url: `${process.env.FRONTEND_URL}/membership/success?payment_id=${paymentId}&reference_number=${paymentData.reference}&amount=${paymentData.amount}&currency=${paymentData.currency || 'SGD'}&status=completed&demo=true`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'SGD',
        reference_number: paymentData.reference,
        status: 'pending'
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('amount', paymentData.amount.toString());
      formData.append('currency', paymentData.currency || 'SGD');
      formData.append('name', paymentData.name || 'Customer');
      formData.append('email', paymentData.email);
      formData.append('purpose', paymentData.purpose || 'Membership Payment');
      formData.append('reference_number', paymentData.reference || `payment_${Date.now()}`);
      formData.append('redirect_url', paymentData.redirectUrl || `${process.env.FRONTEND_URL}/membership/success`);
      formData.append('webhook', `${process.env.BACKEND_URL}/api/hitpay/webhook`);
      formData.append('send_email', paymentData.sendEmail ? 'true' : 'false');
      
      // Payment methods
      if (paymentData.paymentMethods && paymentData.paymentMethods.length > 0) {
        paymentData.paymentMethods.forEach(method => {
          formData.append('payment_methods[]', method);
        });
      } else {
        formData.append('payment_methods[]', 'card');
        formData.append('payment_methods[]', 'paynow');
      }

      const response = await fetch(`${this.baseUrl}/payment-requests`, {
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
      console.error('Error creating HitPay payment:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const computedSignature = crypto
        .createHmac('sha256', this.webhookSecret || this.salt)
        .update(JSON.stringify(payload))
        .digest('hex');

      return signature === computedSignature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook data
   */
  processWebhook(payload) {
    const {
      payment_id,
      payment_request_id,
      phone,
      amount,
      currency,
      status,
      reference_number,
      webhook_id,
      subscription_id,
      billing_id
    } = payload;

    return {
      paymentId: payment_id,
      paymentRequestId: payment_request_id,
      subscriptionId: subscription_id,
      billingId: billing_id,
      amount: parseFloat(amount),
      currency,
      status: status.toLowerCase(),
      reference: reference_number,
      webhookId: webhook_id,
      phone,
      rawData: payload
    };
  }

  /**
   * Process URL-encoded webhook data (like your example)
   */
  processUrlWebhook(urlData) {
    const params = new URLSearchParams(urlData);
    
    return {
      paymentId: params.get('payment_id'),
      paymentRequestId: params.get('payment_request_id'),
      referenceNumber: params.get('reference_number'),
      phone: params.get('phone') || '',
      amount: parseFloat(params.get('amount') || '0'),
      currency: params.get('currency') || 'SGD',
      status: params.get('status')?.toLowerCase() || 'pending',
      hmac: params.get('hmac'),
      rawData: urlData
    };
  }

  /**
   * Verify URL webhook HMAC (for payment-requests webhooks)
   */
  verifyUrlWebhookSignature(urlData) {
    try {
      const params = new URLSearchParams(urlData);
      const providedHmac = params.get('hmac');
      
      if (!providedHmac) {
        return false;
      }

      // Remove hmac from params for verification
      params.delete('hmac');
      
      // Sort parameters alphabetically and create signature string
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}${value}`)
        .join('');

      const calculatedHmac = crypto
        .createHmac('sha256', this.salt || this.webhookSecret)
        .update(sortedParams)
        .digest('hex');

      return calculatedHmac === providedHmac;
    } catch (error) {
      console.error('Error verifying URL webhook signature:', error);
      return false;
    }
  }

  /**
   * Get payment status mapping
   */
  getPaymentStatusMapping(hitpayStatus) {
    const statusMap = {
      'completed': 'PAID',
      'pending': 'PENDING',
      'failed': 'FAILED',
      'canceled': 'CANCELLED',
      'refunded': 'REFUNDED'
    };

    return statusMap[hitpayStatus] || 'PENDING';
  }

  /**
   * Validate recurring billing webhook
   */
  validateRecurringWebhook(payload, providedHmac) {
    try {
      const hmacSource = [];
      
      // Create HMAC source array according to HitPay documentation
      for (const [key, value] of Object.entries(payload)) {
        if (key !== 'hmac') { // Exclude hmac from calculation
          hmacSource[key] = `${key}${value}`;
        }
      }

      // Sort keys alphabetically and concatenate values
      const sortedKeys = Object.keys(hmacSource).sort();
      const signatureString = sortedKeys.map(key => hmacSource[key]).join('');
      
      // Generate HMAC signature
      const calculatedHmac = crypto
        .createHmac('sha256', this.salt)
        .update(signatureString)
        .digest('hex');

      return calculatedHmac === providedHmac;
    } catch (error) {
      console.error('Error validating recurring billing webhook:', error);
      return false;
    }
  }

  /**
   * Parse recurring billing webhook payload
   */
  parseRecurringWebhook(payload) {
    const {
      payment_id,
      recurring_billing_id,
      amount,
      currency,
      status,
      reference,
      hmac
    } = payload;

    return {
      paymentId: payment_id,
      recurringBillingId: recurring_billing_id,
      amount: parseFloat(amount),
      currency,
      status: status.toLowerCase(),
      reference,
      hmac,
      rawData: payload
    };
  }

  /**
   * Get subscription status mapping
   */
  getSubscriptionStatusMapping(hitpayStatus) {
    const statusMap = {
      'active': 'ACTIVE',
      'canceled': 'CANCELLED',
      'past_due': 'PAUSED',
      'unpaid': 'PAUSED',
      'trialing': 'ACTIVE'
    };

    return statusMap[hitpayStatus] || 'PENDING';
  }

  /**
   * Create membership payment (supports both one-time and recurring)
   */
  async createMembershipPayment(membershipData) {
    const {
      type = 'recurring', // 'recurring' or 'onetime'
      planName,
      amount,
      currency = 'SGD',
      customerEmail,
      customerName,
      cycle = 'monthly', // for recurring: weekly, monthly, yearly
      reference
    } = membershipData;

    if (type === 'onetime') {
      // Use payment-requests API for one-time payments
      return await this.createPayment({
        amount,
        currency,
        name: customerName,
        email: customerEmail,
        purpose: `${planName} Membership`,
        reference: reference || `membership_${Date.now()}`,
        redirectUrl: `${process.env.FRONTEND_URL}/membership/success`,
        sendEmail: true,
        paymentMethods: ['card', 'paynow']
      });
    } else {
      // Use recurring billing for subscriptions
      const plan = await this.createSubscriptionPlan({
        name: planName,
        description: `${planName} Membership Plan`,
        amount,
        currency,
        cycle,
        reference: reference || `plan_${Date.now()}`
      });

      return await this.createRecurringBilling({
        planId: plan.id,
        customerEmail,
        customerName,
        startDate: new Date().toISOString().split('T')[0], // Today
        redirectUrl: `${process.env.FRONTEND_URL}/membership/success`,
        reference: reference || `sub_${Date.now()}`,
        amount
      });
    }
  }
}

module.exports = new HitPayService();
