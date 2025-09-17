const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin', 'referral'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Customer specific fields
  totalSpent: {
    type: Number,
    default: 0
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  customerTier: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    default: 'BRONZE'
  },
  
  // Vendor/Technician specific fields
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  subscriptionPlan: {
    type: String,
    enum: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
    default: 'BASIC'
  },
  
  // Admin specific fields
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_content', 'manage_services', 'manage_payments', 'view_analytics', 'manage_system']
  }],
  lastLogin: {
    type: Date
  },
  isSuper: {
    type: Boolean,
    default: false
  },
  
  // Referral fields
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralCode: {
    type: String,
    default: null
  },
  
  // Referral agent specific fields
  agentCode: {
    type: String,
    unique: true,
    sparse: true
  },
  inviteCode: {
    type: String,
    trim: true
  },
  commissionRate: {
    type: Number,
    default: 15.0,
    min: 0,
    max: 50
  },
  totalCommissionEarned: {
    type: Number,
    default: 0
  },
  totalCommissionPaid: {
    type: Number,
    default: 0
  },
  pendingCommission: {
    type: Number,
    default: 0
  },
  // agentTier: removed - no tier system for referral agents
  isAgentActive: {
    type: Boolean,
    default: true
  },
  
  // New referral system fields
  referralUserType: {
    type: String,
    enum: ['property_agent', 'customer'],
    default: function() {
      return this.role === 'referral' ? 'property_agent' : 'customer';
    }
  },
  rewardType: {
    type: String,
    enum: ['money', 'points'],
    default: function() {
      return this.referralUserType === 'property_agent' ? 'money' : 'points';
    }
  },
  pointsBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPointsRedeemed: {
    type: Number,
    default: 0,
    min: 0
  },
  tier1MoneyReward: {
    type: Number,
    default: 5, // $5 for property agents direct referrals
    min: 0
  },
  tier2MoneyReward: {
    type: Number,
    default: 2, // $2 for property agents indirect referrals
    min: 0
  },
  tier1PointsReward: {
    type: Number,
    default: 100, // 100 points for customer direct referrals
    min: 0
  },
  tier2PointsReward: {
    type: Number,
    default: 50, // 50 points for customer indirect referrals
    min: 0
  },
  welcomePointsReward: {
    type: Number,
    default: 20, // 20 points for new user welcome bonus
    min: 0
  },
  hasCompletedFirstOrder: {
    type: Boolean,
    default: false
  },
  hasCompletedFirstSubscription: {
    type: Boolean,
    default: false
  },
  firstOrderCompletedAt: {
    type: Date,
    default: null
  },
  firstSubscriptionCompletedAt: {
    type: Date,
    default: null
  },
  referralChain: [{
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 2 // Only 2 tiers
    },
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    referrerType: {
      type: String,
      enum: ['property_agent', 'customer'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Security preferences
  tacEnabled: {
    type: Boolean,
    default: false // Disabled by default, users can enable in profile
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate referral codes based on user type
userSchema.pre('save', async function(next) {
  try {
    // Only generate codes for new users or when referralUserType changes
    if (this.isNew || this.isModified('referralUserType')) {
      // Generate appropriate referral code based on user type
      if (this.referralUserType === 'property_agent' || this.role === 'referral') {
        // Property agents get agent codes and invite codes
        if (!this.agentCode) {
          this.agentCode = this.generateAgentCode();
        }
        if (!this.referralCode) {
          this.referralCode = this.generateAgentReferralCode();
        }
      } else {
        // Customers get invite codes
        if (!this.inviteCode) {
          this.inviteCode = this.generateCustomerInviteCode();
        }
        if (!this.referralCode) {
          this.referralCode = this.generateCustomerReferralCode();
        }
      }
    }
  } catch (error) {
    console.error('Error generating referral codes:', error);
    // Don't fail user creation if code generation fails
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Role checking methods
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

userSchema.methods.isVendor = function() {
  return this.role === 'vendor';
};

userSchema.methods.isCustomer = function() {
  return this.role === 'customer';
};

userSchema.methods.isReferralAgent = function() {
  return this.role === 'referral';
};

// New referral system methods
userSchema.methods.isPropertyAgent = function() {
  return this.referralUserType === 'property_agent';
};

userSchema.methods.isReferralCustomer = function() {
  return this.referralUserType === 'customer';
};

userSchema.methods.getRewardType = function() {
  return this.rewardType;
};

userSchema.methods.getRewardAmount = function(tier = 1) {
  if (this.rewardType === 'money') {
    return tier === 1 ? this.tier1MoneyReward : this.tier2MoneyReward;
  } else {
    return tier === 1 ? this.tier1PointsReward : this.tier2PointsReward;
  }
};

userSchema.methods.addPoints = async function(points, description = 'Points earned', transactionData = {}) {
  const PointsTransaction = require('./PointsTransaction');
  
  const transaction = await PointsTransaction.createTransaction({
    user: this._id,
    type: transactionData.type || 'BONUS',
    points: points,
    description: description,
    relatedId: transactionData.relatedId || null,
    relatedModel: transactionData.relatedModel || null,
    metadata: transactionData.metadata || {}
  });
  
  return {
    newBalance: transaction.newBalance,
    pointsAdded: points,
    description,
    transactionId: transaction._id
  };
};

userSchema.methods.deductPoints = async function(points, description = 'Points redeemed', transactionData = {}) {
  if (this.pointsBalance < points) {
    throw new Error('Insufficient points balance');
  }
  
  const PointsTransaction = require('./PointsTransaction');
  
  const transaction = await PointsTransaction.createTransaction({
    user: this._id,
    type: transactionData.type || 'REDEEMED_DISCOUNT',
    points: -points, // Negative for deduction
    description: description,
    relatedId: transactionData.relatedId || null,
    relatedModel: transactionData.relatedModel || null,
    metadata: transactionData.metadata || {}
  });
  
  return {
    newBalance: transaction.newBalance,
    pointsDeducted: points,
    description,
    transactionId: transaction._id
  };
};

userSchema.methods.markFirstOrderCompleted = async function() {
  if (!this.hasCompletedFirstOrder) {
    this.hasCompletedFirstOrder = true;
    this.firstOrderCompletedAt = new Date();
    await this.save();
    return true; // First order completed
  }
  return false; // Already completed before
};

userSchema.methods.markFirstSubscriptionCompleted = async function() {
  if (!this.hasCompletedFirstSubscription) {
    this.hasCompletedFirstSubscription = true;
    this.firstSubscriptionCompletedAt = new Date();
    await this.save();
    return true; // First subscription completed
  }
  return false; // Already completed before
};

userSchema.methods.addToReferralChain = function(referrer, level) {
  this.referralChain.push({
    level,
    referrer: referrer._id,
    referrerType: referrer.referralUserType,
    joinedAt: new Date()
  });
};

// Referral code generation methods
userSchema.methods.generateAgentCode = function() {
  const namePrefix = (this.firstName.substring(0, 2) + this.lastName.substring(0, 2)).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  
  return `AGENT${namePrefix}${timestamp}${randomSuffix}`;
};

userSchema.methods.generateAgentReferralCode = function() {
  const namePrefix = (this.firstName.substring(0, 2) + this.lastName.substring(0, 2)).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `PA${namePrefix}${randomSuffix}`;
};

userSchema.methods.generateCustomerInviteCode = function() {
  const namePrefix = (this.firstName.substring(0, 2) + this.lastName.substring(0, 2)).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `INVITE${namePrefix}${randomSuffix}`;
};

userSchema.methods.generateCustomerReferralCode = function() {
  const namePrefix = (this.firstName.substring(0, 2) + this.lastName.substring(0, 2)).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `CU${namePrefix}${randomSuffix}`;
};

// Get the appropriate referral code for sharing based on user type
userSchema.methods.getShareableReferralCode = function() {
  if (this.referralUserType === 'property_agent' || this.role === 'referral') {
    return this.agentCode || this.referralCode;
  } else {
    return this.inviteCode || this.referralCode;
  }
};

userSchema.methods.hasPermission = function(permission) {
  return this.isAdmin() && (this.isSuper || this.permissions.includes(permission));
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Add virtual id field
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);