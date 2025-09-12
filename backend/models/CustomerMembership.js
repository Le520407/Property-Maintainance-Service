const mongoose = require('mongoose');

const membershipTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['HDB', 'CONDOMINIUM', 'LANDED_PROPERTY', 'COMMERCIAL'],
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  monthlyPrice: {
    type: Number,
    required: true
  },
  yearlyPrice: Number,
  features: {
    serviceRequestsPerMonth: { type: Number, default: 0 }, // -1 for unlimited
    responseTimeHours: { type: Number, default: 72 },
    materialDiscountPercent: { type: Number, default: 0 },
    annualInspections: { type: Number, default: 0 },
    emergencyService: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    dedicatedManager: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const customerMembershipSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipTier',
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'PENDING'],
    default: 'PENDING'
  },
  billingCycle: {
    type: String,
    enum: ['MONTHLY', 'YEARLY'],
    default: 'MONTHLY'
  },
  monthlyPrice: Number,
  yearlyPrice: Number,
  currentPrice: Number,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  nextBillingDate: Date,
  autoRenew: {
    type: Boolean,
    default: true
  },
  // Cancellation tracking
  cancelledAt: Date, // When the user requested cancellation
  willExpireAt: Date, // Explicit field showing when access will end
  expiredAt: Date, // When the membership actually expired (status changed to EXPIRED)
  cancellationReason: String, // Optional reason for cancellation
  paymentMethod: {
    type: String,
    enum: ['STRIPE', 'HITPAY', 'MANUAL'],
    default: 'HITPAY'
  },
  // Stripe fields (legacy)
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  // HitPay fields
  hitpayPlanId: String,
  hitpayRecurringBillingId: String,
  hitpaySubscriptionId: String, // Track active subscription for cancellation
  hitpayCustomerId: String,
  hitpayPaymentId: String, // Track individual payment IDs for refunds
  currentUsage: {
    month: String, // Format: 'YYYY-MM'
    serviceRequestsUsed: { type: Number, default: 0 },
    emergencyRequestsUsed: { type: Number, default: 0 },
    inspectionCreditsUsed: { type: Number, default: 0 },
    materialDiscountUsed: { type: Number, default: 0 },
    resetDate: Date
  }
}, {
  timestamps: true
});

// Indexes
customerMembershipSchema.index({ customer: 1, status: 1 });
customerMembershipSchema.index({ nextBillingDate: 1 });
customerMembershipSchema.index({ 'currentUsage.month': 1 });

// DUPLICATE PREVENTION: Ensure one active/pending membership per customer
// This allows only one membership per customer that is not CANCELLED or EXPIRED
customerMembershipSchema.index(
  { customer: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      status: { $in: ['ACTIVE', 'PENDING', 'SUSPENDED'] } 
    } 
  }
);

// Instance methods
customerMembershipSchema.methods.hasActiveAccess = function() {
  const now = new Date();
  
  // Active memberships have access
  if (this.status === 'ACTIVE') return true;
  
  // Cancelled memberships have access until the end date
  if (this.status === 'CANCELLED') {
    return this.endDate && now <= this.endDate;
  }
  
  // Expired, suspended, or pending memberships have no access
  return false;
};

customerMembershipSchema.methods.canCreateServiceRequest = function() {
  // First check if membership has active access
  if (!this.hasActiveAccess()) return false;
  
  const tierFeatures = this.tier.features;
  if (tierFeatures.serviceRequestsPerMonth === -1) return true; // Unlimited
  
  return this.currentUsage.serviceRequestsUsed < tierFeatures.serviceRequestsPerMonth;
};

customerMembershipSchema.methods.getAccessStatus = function() {
  const now = new Date();
  
  if (this.status === 'ACTIVE') {
    return {
      hasAccess: true,
      statusMessage: 'Active membership with full access',
      expiresAt: this.endDate
    };
  }
  
  if (this.status === 'CANCELLED') {
    const hasAccess = this.endDate && now <= this.endDate;
    return {
      hasAccess,
      statusMessage: hasAccess 
        ? `Cancelled - access until ${this.endDate.toLocaleDateString()}`
        : 'Cancelled and expired - no access',
      expiresAt: this.endDate,
      isCancelled: true
    };
  }
  
  if (this.status === 'EXPIRED') {
    return {
      hasAccess: false,
      statusMessage: 'Membership expired - no access',
      expiresAt: this.endDate
    };
  }
  
  return {
    hasAccess: false,
    statusMessage: `Membership ${this.status.toLowerCase()} - no access`,
    expiresAt: this.endDate
  };
};

customerMembershipSchema.methods.getResponseTime = function() {
  return this.tier.features.responseTimeHours;
};

customerMembershipSchema.methods.getMaterialDiscount = function() {
  return this.tier.features.materialDiscountPercent;
};

customerMembershipSchema.methods.resetMonthlyUsage = function() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  if (this.currentUsage.month !== currentMonth) {
    this.currentUsage = {
      month: currentMonth,
      serviceRequestsUsed: 0,
      emergencyRequestsUsed: 0,
      inspectionCreditsUsed: 0,
      materialDiscountUsed: 0,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1) // First day of next month
    };
    return this.save();
  }
  return Promise.resolve(this);
};

const MembershipTier = mongoose.model('MembershipTier', membershipTierSchema);
const CustomerMembership = mongoose.model('CustomerMembership', customerMembershipSchema);

module.exports = { MembershipTier, CustomerMembership };