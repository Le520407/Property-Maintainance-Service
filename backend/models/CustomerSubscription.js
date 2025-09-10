const mongoose = require('mongoose');

const subscriptionTierSchema = new mongoose.Schema({
  propertyType: {
    type: String,
    required: true,
    enum: ['HDB', 'CONDOMINIUM', 'LANDED', 'COMMERCIAL'],
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true
  },
  yearlyPrice: {
    type: Number,
    required: true,
    default: function() {
      return this.monthlyPrice * 10; // 10x monthly price (2 months free)
    }
  },
  description: {
    type: String,
    required: true
  },
  services: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const customerSubscriptionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['HDB', 'CONDOMINIUM', 'LANDED', 'COMMERCIAL']
  },
  billingCycle: {
    type: String,
    enum: ['MONTHLY', 'YEARLY'],
    required: true,
    default: 'MONTHLY'
  },
  monthlyPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true,
    default: function() {
      return this.billingCycle === 'YEARLY' ? this.monthlyPrice * 12 * 0.9 : this.monthlyPrice;
    }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'CANCELLED', 'PENDING', 'CANCELLING'],
    default: 'PENDING'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  lastBillingDate: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  willCancelAt: {
    type: Date
  },
  cancelReason: {
    type: String
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['CARD', 'BANK_TRANSFER', 'PAYPAL', 'HITPAY'],
      required: true
    },
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  // HitPay specific fields
  hitpayData: {
    planId: String,
    recurringBillingId: String,
    subscriptionId: String,
    paymentRequestId: String,
    checkoutUrl: String,
    reference: String,
    webhookId: String
  },
  // Payment gateway used
  paymentGateway: {
    type: String,
    enum: ['STRIPE', 'HITPAY', 'MOCK'],
    default: 'STRIPE'
  },
  billingHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PAID', 'FAILED', 'PENDING', 'REFUNDED', 'CANCELLED', 'CREDIT', 'REFUND_PENDING', 'SCHEDULED_CANCELLATION'],
      default: 'PAID'
    },
    type: {
      type: String,
      enum: ['SUBSCRIPTION', 'PRORATION', 'CANCELLATION', 'REFUND', 'RENEWAL'],
      default: 'SUBSCRIPTION'
    },
    description: {
      type: String,
      default: 'Subscription payment'
    },
    paymentMethod: String,
    transactionId: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    // HitPay specific fields
    hitpayPaymentId: String,
    hitpayReference: String,
    paymentGateway: {
      type: String,
      enum: ['STRIPE', 'HITPAY', 'MOCK'],
      default: 'STRIPE'
    }
  }],
  usageStats: {
    servicesUsed: {
      type: Number,
      default: 0
    },
    lastServiceDate: Date,
    monthlyServicesUsed: {
      type: Number,
      default: 0
    },
    monthlyResetDate: {
      type: Date,
      default: Date.now
    }
  },
  socialImpactContribution: {
    paidServicesCount: {
      type: Number,
      default: 0
    },
    freeServicesEarned: {
      type: Number,
      default: 0
    },
    freeServicesUsed: {
      type: Number,
      default: 0
    },
    totalContribution: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

customerSubscriptionSchema.index({ customer: 1 });
customerSubscriptionSchema.index({ status: 1 });
customerSubscriptionSchema.index({ nextBillingDate: 1 });

customerSubscriptionSchema.methods.calculateSocialImpact = function() {
  const freeServicesEarned = Math.floor(this.socialImpactContribution.paidServicesCount / 10);
  this.socialImpactContribution.freeServicesEarned = freeServicesEarned;
  return freeServicesEarned;
};

customerSubscriptionSchema.methods.canUseFreeService = function() {
  return this.socialImpactContribution.freeServicesEarned > this.socialImpactContribution.freeServicesUsed;
};

customerSubscriptionSchema.methods.useFreeService = function() {
  if (this.canUseFreeService()) {
    this.socialImpactContribution.freeServicesUsed += 1;
    return true;
  }
  return false;
};

customerSubscriptionSchema.methods.addPaidService = function() {
  this.socialImpactContribution.paidServicesCount += 1;
  this.socialImpactContribution.totalContribution += this.monthlyPrice;
  this.usageStats.servicesUsed += 1;
  this.usageStats.monthlyServicesUsed += 1;
  this.usageStats.lastServiceDate = new Date();
  this.calculateSocialImpact();
};

customerSubscriptionSchema.methods.resetMonthlyUsage = function() {
  this.usageStats.monthlyServicesUsed = 0;
  this.usageStats.monthlyResetDate = new Date();
};

customerSubscriptionSchema.methods.isOverdue = function() {
  return new Date() > this.nextBillingDate && this.status === 'ACTIVE';
};

customerSubscriptionSchema.methods.updateNextBillingDate = function() {
  const currentDate = new Date();
  const nextBilling = new Date(this.nextBillingDate);
  
  if (this.billingCycle === 'YEARLY') {
    nextBilling.setFullYear(nextBilling.getFullYear() + 1);
  } else {
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  }
  
  this.nextBillingDate = nextBilling;
};

// Referral rewards trigger - when subscription becomes active
customerSubscriptionSchema.post('save', async function(doc, next) {
  try {
    // Check if this is the first time the subscription is being activated
    if (this.isModified('status') && this.status === 'ACTIVE' && this.isActive) {
      console.log(`Subscription for customer ${this.customer} activated, checking for referral rewards...`);
      
      // Import referral service (inside function to avoid circular dependencies)
      const referralRewardService = require('../services/referralRewardService');
      
      // Process referral rewards for this activated subscription
      await referralRewardService.processReferralRewards(
        this.customer,
        this._id,
        this.currentPrice,
        'subscription'
      );
    }
  } catch (error) {
    console.error('Error processing referral rewards for subscription:', error);
    // Don't fail the subscription save if referral processing fails
  }
  next();
});

// Method to manually trigger referral processing (for testing/admin use)
customerSubscriptionSchema.methods.triggerReferralRewards = async function() {
  const referralRewardService = require('../services/referralRewardService');
  return await referralRewardService.processReferralRewards(
    this.customer,
    this._id,
    this.currentPrice,
    'subscription'
  );
};

const SubscriptionTier = mongoose.model('SubscriptionTier', subscriptionTierSchema);
const CustomerSubscription = mongoose.model('CustomerSubscription', customerSubscriptionSchema);

module.exports = {
  SubscriptionTier,
  CustomerSubscription
};