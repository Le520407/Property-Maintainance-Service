const mongoose = require('mongoose');

const pointsTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'EARNED_REFERRAL', 
      'EARNED_SIGNUP', 
      'EARNED_ORDER', 
      'EARNED_SUBSCRIPTION',
      'REDEEMED_DISCOUNT',
      'REDEEMED_SERVICE',
      'REDEEMED_CASH',
      'ADMIN_ADJUSTMENT',
      'BONUS',
      'PENALTY'
    ],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  previousBalance: {
    type: Number,
    required: true,
    min: 0
  },
  newBalance: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null // Can reference Order, Subscription, Referral, etc.
  },
  relatedModel: {
    type: String,
    enum: ['Order', 'Subscription', 'Referral', 'User', 'Voucher'],
    default: null
  },
  metadata: {
    // Additional data about the transaction
    referralLevel: {
      type: Number,
      min: 1,
      max: 2
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    orderAmount: Number,
    promotionCode: String,
    adminNotes: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'],
    default: 'COMPLETED'
  },
  expiresAt: {
    type: Date,
    default: null // For promotional points that expire
  }
}, {
  timestamps: true
});

// Indexes for better performance
pointsTransactionSchema.index({ user: 1, createdAt: -1 });
pointsTransactionSchema.index({ type: 1 });
pointsTransactionSchema.index({ status: 1 });
pointsTransactionSchema.index({ expiresAt: 1 });

// Static method to create points transaction
pointsTransactionSchema.statics.createTransaction = async function(data) {
  const { user, type, points, description, relatedId, relatedModel, metadata } = data;
  
  // Get current user to calculate balances
  const User = mongoose.model('User');
  const currentUser = await User.findById(user);
  
  if (!currentUser) {
    throw new Error('User not found');
  }
  
  const previousBalance = currentUser.pointsBalance;
  const newBalance = previousBalance + points;
  
  if (newBalance < 0) {
    throw new Error('Insufficient points balance');
  }
  
  // Create the transaction
  const transaction = new this({
    user,
    type,
    points,
    previousBalance,
    newBalance,
    description,
    relatedId,
    relatedModel,
    metadata
  });
  
  await transaction.save();
  
  // Update user's points balance
  await User.findByIdAndUpdate(user, {
    pointsBalance: newBalance,
    $inc: {
      totalPointsEarned: points > 0 ? points : 0,
      totalPointsRedeemed: points < 0 ? Math.abs(points) : 0
    }
  });
  
  return transaction;
};

// Method to get user's transaction history
pointsTransactionSchema.statics.getUserHistory = async function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    type = null,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { user: userId };
  
  if (type) {
    query.type = type;
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('relatedId')
    .populate('metadata.referredUser', 'firstName lastName email');
};

// Method to get points summary for a user
pointsTransactionSchema.statics.getUserSummary = async function(userId) {
  const summary = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalPoints: { $sum: '$points' },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  return {
    currentBalance: user.pointsBalance,
    totalEarned: user.totalPointsEarned,
    totalRedeemed: user.totalPointsRedeemed,
    breakdown: summary
  };
};

const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);

module.exports = PointsTransaction;