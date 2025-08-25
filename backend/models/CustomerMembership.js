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
    enum: ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'],
    default: 'ACTIVE'
  },
  billingCycle: {
    type: String,
    enum: ['MONTHLY', 'YEARLY'],
    default: 'MONTHLY'
  },
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
  stripeCustomerId: String,
  stripeSubscriptionId: String,
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

// Instance methods
customerMembershipSchema.methods.canCreateServiceRequest = function() {
  const tierFeatures = this.tier.features;
  if (tierFeatures.serviceRequestsPerMonth === -1) return true; // Unlimited
  
  return this.currentUsage.serviceRequestsUsed < tierFeatures.serviceRequestsPerMonth;
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