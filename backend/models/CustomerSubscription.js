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
  actualPrice: {
    type: Number,
    required: true,
    default: function() {
      return this.billingCycle === 'YEARLY' ? this.monthlyPrice * 10 : this.monthlyPrice;
    }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'CANCELLED', 'PENDING'],
    default: 'ACTIVE'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  nextBillingDate: {
    type: Date,
    required: true
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
    subscriptionId: String,
    planId: String,
    paymentRequestId: String,
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
      enum: ['PAID', 'FAILED', 'PENDING', 'REFUNDED'],
      default: 'PAID'
    },
    paymentMethod: String,
    transactionId: String,
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
  },
  cancelledAt: Date,
  cancelReason: String,
  isActive: {
    type: Boolean,
    default: true
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

const SubscriptionTier = mongoose.model('SubscriptionTier', subscriptionTierSchema);
const CustomerSubscription = mongoose.model('CustomerSubscription', customerSubscriptionSchema);

module.exports = {
  SubscriptionTier,
  CustomerSubscription
};