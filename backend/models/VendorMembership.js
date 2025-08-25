const mongoose = require('mongoose');

const membershipTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['BASIC', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  yearlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  features: {
    // Job assignment limits
    maxMonthlyJobs: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    maxConcurrentJobs: {
      type: Number,
      default: -1
    },
    
    // Platform features
    priorityAssignment: {
      type: Boolean,
      default: false
    },
    emergencyServiceEligible: {
      type: Boolean,
      default: false
    },
    featuredListingEligible: {
      type: Boolean,
      default: false
    },
    customPortfolioPages: {
      type: Boolean,
      default: false
    },
    
    // Marketing benefits
    maxPortfolioImages: {
      type: Number,
      default: 5
    },
    customServicePackages: {
      type: Boolean,
      default: false
    },
    promotionalBanners: {
      type: Boolean,
      default: false
    },
    socialMediaIntegration: {
      type: Boolean,
      default: false
    },
    
    // Analytics and insights
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    customerInsights: {
      type: Boolean,
      default: false
    },
    revenueReporting: {
      type: Boolean,
      default: false
    },
    
    // Support benefits
    prioritySupport: {
      type: Boolean,
      default: false
    },
    dedicatedAccountManager: {
      type: Boolean,
      default: false
    },
    trainingResources: {
      type: Boolean,
      default: false
    },
    
    // Commission and fees
    platformCommissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    paymentProcessingDiscount: {
      type: Number,
      default: 0
    },
    
    // Additional perks
    badgeEligibility: {
      verified: { type: Boolean, default: true },
      premium: { type: Boolean, default: false },
      professional: { type: Boolean, default: false },
      trusted: { type: Boolean, default: false }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const vendorMembershipSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    unique: true
  },
  currentTier: {
    type: String,
    enum: ['BASIC', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE'],
    default: 'BASIC'
  },
  subscriptionStatus: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  billingCycle: {
    type: String,
    enum: ['MONTHLY', 'YEARLY'],
    default: 'MONTHLY'
  },
  
  // Subscription dates
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: {
    type: Date,
    required: function() {
      return this.currentTier !== 'BASIC';
    }
  },
  nextBillingDate: {
    type: Date,
    required: function() {
      return this.currentTier !== 'BASIC';
    }
  },
  
  // Payment information
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  
  // Usage tracking
  monthlyUsage: {
    jobsCompleted: { type: Number, default: 0 },
    jobsAssigned: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    period: { type: Date, default: Date.now }
  },
  
  // Feature usage
  featureUsage: {
    portfolioImagesUsed: { type: Number, default: 0 },
    customPackagesCreated: { type: Number, default: 0 },
    promotionalBannersUsed: { type: Number, default: 0 }
  },
  
  // Membership benefits tracking
  benefitsEarned: {
    totalCommissionSaved: { type: Number, default: 0 },
    priorityJobsReceived: { type: Number, default: 0 },
    featuredListingDays: { type: Number, default: 0 }
  },
  
  // Upgrade/downgrade history
  membershipHistory: [{
    fromTier: String,
    toTier: String,
    changeDate: { type: Date, default: Date.now },
    reason: String,
    initiatedBy: {
      type: String,
      enum: ['VENDOR', 'ADMIN', 'SYSTEM']
    }
  }],
  
  // Trial information
  trialEndDate: Date,
  isOnTrial: { type: Boolean, default: false },
  trialTier: String,
  
  // Cancellation
  cancellationDate: Date,
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['VENDOR', 'ADMIN', 'SYSTEM']
  },
  
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true
  },
  
  // Special offers
  appliedDiscounts: [{
    code: String,
    description: String,
    discountAmount: Number,
    discountPercentage: Number,
    appliedDate: Date,
    validUntil: Date
  }]
}, {
  timestamps: true
});

// Indexes
vendorMembershipSchema.index({ currentTier: 1 });
vendorMembershipSchema.index({ subscriptionStatus: 1 });
vendorMembershipSchema.index({ nextBillingDate: 1 });

// Methods
vendorMembershipSchema.methods.isFeatureAvailable = function(featureName) {
  // This will be implemented to check if a feature is available for current tier
  return true; // Placeholder
};

vendorMembershipSchema.methods.getRemainingUsage = function(usageType) {
  // Calculate remaining usage for the current billing period
  return { remaining: -1, total: -1 }; // Placeholder
};

vendorMembershipSchema.methods.upgradeToTier = function(newTier, reason = 'VENDOR_REQUEST') {
  this.membershipHistory.push({
    fromTier: this.currentTier,
    toTier: newTier,
    reason: reason,
    initiatedBy: 'VENDOR'
  });
  this.currentTier = newTier;
  return this.save();
};

vendorMembershipSchema.methods.cancelSubscription = function(reason) {
  this.subscriptionStatus = 'CANCELLED';
  this.cancellationDate = new Date();
  this.cancellationReason = reason;
  this.cancelledBy = 'VENDOR';
  this.autoRenew = false;
  return this.save();
};

// Virtual for days remaining in subscription
vendorMembershipSchema.virtual('daysRemaining').get(function() {
  if (!this.subscriptionEndDate) return null;
  const now = new Date();
  const diffTime = this.subscriptionEndDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
vendorMembershipSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const VendorMembershipTier = mongoose.model('VendorMembershipTier', membershipTierSchema);
const VendorMembership = mongoose.model('VendorMembership', vendorMembershipSchema);

module.exports = { VendorMembershipTier, VendorMembership };