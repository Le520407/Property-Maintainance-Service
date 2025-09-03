# HitPay Recurring Billing Integration

This document explains the HitPay recurring billing integration implemented in the Property Maintenance Service platform.

## Summary

✅ **Updated Header Format**: Changed from `X-BUSINESS-API-KEY` to `Authorization: Bearer {api_key}` 

The correct authentication header for HitPay API is:

```javascript
headers: {
  'Authorization': `Bearer ${your_api_key}`,
  'Content-Type': 'application/json'
}
```

This is the standard OAuth 2.0 Bearer token format that most modern APIs use, including HitPay.

### Pricing Structure
- **Monthly**: Regular monthly price
- **Yearly**: 10x monthly price (equivalent to 2 months free)

Example:
- Monthly: $129/month
- Yearly: $1,290/year (instead of $1,548) - **Save $258 (17% discount)**

## Features Implemented

### 1. Backend Integration

#### HitPay Service (`services/hitpayService.js`)
- Create recurring billing plans
- Subscribe customers to plans
- Handle one-time payments
- Manage subscription lifecycle (cancel, update)
- Webhook signature verification
- Payment status mapping

#### Models Updated
- **CustomerSubscription**: Added `billingCycle`, `actualPrice`, `hitpayData` fields
- **SubscriptionTier**: Added `yearlyPrice` field
- **Payment**: Added HitPay support and `hitpayData` fields

#### API Endpoints (`routes/hitpay.js`)
- `POST /api/hitpay/create-subscription` - Create HitPay subscription
- `POST /api/hitpay/create-payment` - Create one-time payment
- `POST /api/hitpay/cancel-subscription` - Cancel subscription
- `GET /api/hitpay/subscription/:id/status` - Get subscription status
- `POST /api/hitpay/webhook` - Handle HitPay webhooks

### 2. Frontend Integration

#### Subscription Plans Component (`components/SubscriptionPlans.jsx`)
- Monthly/Yearly billing cycle toggle
- Real-time pricing calculation
- Savings display for yearly plans
- Integration with HitPay payment flow

### 3. Database Schema

#### New Fields Added:

**SubscriptionTier Schema:**
```javascript
yearlyPrice: {
  type: Number,
  required: true,
  default: function() {
    return this.monthlyPrice * 10; // 10x monthly price (2 months free)
  }
}
```

**CustomerSubscription Schema:**
```javascript
billingCycle: {
  type: String,
  enum: ['MONTHLY', 'YEARLY'],
  required: true,
  default: 'MONTHLY'
},
actualPrice: {
  type: Number,
  required: true,
  default: function() {
    return this.billingCycle === 'YEARLY' ? this.monthlyPrice * 10 : this.monthlyPrice;
  }
},
hitpayData: {
  subscriptionId: String,
  planId: String,
  paymentRequestId: String,
  reference: String,
  webhookId: String
}
```

## Setup Instructions

### 1. Environment Configuration

Add to your `.env` file:
```env
HITPAY_API_KEY=your_hitpay_api_key_here
HITPAY_SALT=your_hitpay_salt_here
HITPAY_WEBHOOK_SECRET=your_webhook_secret_here
HITPAY_BASE_URL=https://api.hit-pay.com/v1
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### 2. Update Database Schema

Run the tier update script:
```bash
npm run update-tiers
```

### 3. HitPay Account Setup

1. Create HitPay merchant account
2. Get API credentials from dashboard
3. Configure webhook URL: `https://yourdomain.com/api/hitpay/webhook`
4. Set up payment methods in HitPay dashboard

## API Usage Examples

### Create Monthly Subscription
```javascript
POST /api/hitpay/create-subscription
{
  "propertyType": "CONDOMINIUM",
  "billingCycle": "MONTHLY"
}
```

### Create Yearly Subscription
```javascript
POST /api/hitpay/create-subscription
{
  "propertyType": "CONDOMINIUM",
  "billingCycle": "YEARLY"
}
```

### Create One-time Payment
```javascript
POST /api/hitpay/create-payment
{
  "amount": 199.99,
  "purpose": "Emergency Repair Service",
  "jobId": "64f9b123456789abcdef"
}
```

## Webhook Handling

The webhook endpoint (`/api/hitpay/webhook`) handles:

1. **Subscription Payments**
   - Payment completed → Activate subscription
   - Payment failed → Pause subscription
   - Subscription cancelled → Deactivate subscription

2. **One-time Payments**
   - Payment completed → Update job payment status
   - Payment failed → Mark payment as failed

## Security Features

- Webhook signature verification using HMAC-SHA256
- Input validation and sanitization
- Rate limiting on API endpoints
- Authentication required for all subscription operations

## Frontend Integration

```jsx
import SubscriptionPlans from './components/SubscriptionPlans';

function App() {
  return (
    <div>
      <SubscriptionPlans />
    </div>
  );
}
```

The component automatically:
- Fetches available plans
- Calculates yearly savings
- Handles billing cycle switching
- Redirects to HitPay payment page

## Testing

### Sandbox Mode
For testing, use HitPay sandbox:
```env
HITPAY_BASE_URL=https://api.sandbox.hit-pay.com/v1
```

### Test Cards
Use HitPay's test card numbers for sandbox testing.

## Production Checklist

- [ ] Set production HitPay API credentials
- [ ] Configure production webhook URL
- [ ] Test webhook signature verification
- [ ] Verify SSL certificate for webhook endpoint
- [ ] Set up monitoring for failed payments
- [ ] Configure email notifications for subscription events
- [ ] Test subscription lifecycle (create, renew, cancel)

## Monitoring and Analytics

Monitor the following metrics:
- Subscription conversion rates
- Monthly vs Yearly adoption
- Payment failure rates
- Churn rates by billing cycle
- Revenue by subscription tier

## Support

For HitPay-specific issues:
- HitPay Documentation: https://docs.hit-pay.com/
- HitPay Support: support@hit-pay.com

For integration issues, check:
1. Webhook logs in server console
2. HitPay dashboard for payment status
3. Database subscription records
4. API response logs
