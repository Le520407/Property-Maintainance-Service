const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    tier: {
      type: Number,
      enum: [1, 2, 3],
      default: 1
    },
    firstPurchaseAmount: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'INACTIVE'],
      default: 'PENDING'
    }
  }],
  totalReferrals: {
    type: Number,
    default: 0
  },
  activeReferrals: {
    type: Number,
    default: 0
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
  referralTier: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const commissionSchema = new mongoose.Schema({
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    required: true
  },
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  orderAmount: {
    type: Number,
    required: true
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  tier: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PAID', 'CANCELLED'],
    default: 'PENDING'
  },
  approvedAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'MANUAL'],
    default: 'BANK_TRANSFER'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const payoutSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commission'
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'MANUAL'],
    required: true
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    routingNumber: String,
    swiftCode: String
  },
  paypalEmail: String,
  stripeAccountId: String,
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  transactionId: String,
  failureReason: String,
  notes: String
}, {
  timestamps: true
});

// New referral reward configuration
const REFERRAL_REWARDS = {
  property_agent: {
    tier1: {
      type: 'money',
      amount: 5, // $5 for direct referrals
      description: 'Direct referral commission'
    },
    tier2: {
      type: 'money', 
      amount: 2, // $2 for indirect referrals
      description: 'Indirect referral commission'
    }
  },
  customer: {
    tier1: {
      type: 'points',
      amount: 100, // 100 points for direct referrals
      description: 'Referral bonus points'
    },
    tier2: {
      type: 'points',
      amount: 50, // 50 points for indirect referrals  
      description: 'Indirect referral bonus points'
    }
  },
  welcome_bonus: {
    type: 'points',
    amount: 20, // 20 points for new users
    description: 'Welcome bonus points'
  }
};

// Legacy commission rates (kept for backward compatibility)
const COMMISSION_RATES = {
  1: {
    name: 'Bronze',
    rate: 5.0,
    minReferrals: 0,
    maxReferrals: 9,
    bonusRate: 0
  },
  2: {
    name: 'Silver', 
    rate: 7.5,
    minReferrals: 10,
    maxReferrals: 24,
    bonusRate: 0.5
  },
  3: {
    name: 'Gold',
    rate: 10.0,
    minReferrals: 25,
    maxReferrals: Infinity,
    bonusRate: 1.0
  }
};

// Generate unique referral code
referralSchema.statics.generateReferralCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Calculate commission tier based on active referrals
referralSchema.methods.calculateTier = function() {
  const activeReferrals = this.activeReferrals;
  
  if (activeReferrals >= COMMISSION_RATES[3].minReferrals) {
    return 3;
  } else if (activeReferrals >= COMMISSION_RATES[2].minReferrals) {
    return 2;
  } else {
    return 1;
  }
};

// Calculate commission amount (legacy method)
referralSchema.methods.calculateCommission = function(orderAmount, tier = null) {
  const currentTier = tier || this.calculateTier();
  const rateConfig = COMMISSION_RATES[currentTier];
  
  let commissionRate = rateConfig.rate;
  
  // Add bonus rate for higher tiers
  if (currentTier > 1) {
    commissionRate += rateConfig.bonusRate;
  }
  
  return {
    rate: commissionRate,
    amount: (orderAmount * commissionRate) / 100,
    tier: currentTier,
    tierName: rateConfig.name
  };
};

// New method: Calculate referral reward based on user type and tier
referralSchema.methods.calculateReferralReward = function(referrerUserType, referralTier = 1) {
  const rewardConfig = REFERRAL_REWARDS[referrerUserType];
  
  if (!rewardConfig) {
    throw new Error(`Invalid referrer user type: ${referrerUserType}`);
  }
  
  const tierKey = `tier${referralTier}`;
  const tierConfig = rewardConfig[tierKey];
  
  if (!tierConfig) {
    throw new Error(`Invalid referral tier: ${referralTier}`);
  }
  
  return {
    type: tierConfig.type,
    amount: tierConfig.amount,
    description: tierConfig.description,
    tier: referralTier,
    referrerType: referrerUserType
  };
};

// New static method: Get reward configuration
referralSchema.statics.getRewardConfig = function(userType, tier = 1) {
  return REFERRAL_REWARDS[userType]?.[`tier${tier}`] || null;
};

// New static method: Get welcome bonus
referralSchema.statics.getWelcomeBonus = function() {
  return REFERRAL_REWARDS.welcome_bonus;
};

// Update referral tier
referralSchema.methods.updateTier = async function() {
  const newTier = this.calculateTier();
  if (this.referralTier !== newTier) {
    this.referralTier = newTier;
    await this.save();
  }
  return newTier;
};

// Add indexes for better performance (referralCode index is already created by unique: true)
referralSchema.index({ referrer: 1 });
referralSchema.index({ 'referredUsers.user': 1 });

commissionSchema.index({ referrer: 1, status: 1 });
commissionSchema.index({ referredUser: 1 });
commissionSchema.index({ orderId: 1 });
commissionSchema.index({ createdAt: -1 });

payoutSchema.index({ referrer: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

const Referral = mongoose.model('Referral', referralSchema);
const Commission = mongoose.model('Commission', commissionSchema);
const Payout = mongoose.model('Payout', payoutSchema);

module.exports = {
  Referral,
  Commission,
  Payout,
  COMMISSION_RATES,
  REFERRAL_REWARDS
};