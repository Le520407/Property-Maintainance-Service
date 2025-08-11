const mongoose = require('mongoose');

const ratingCriteriaSchema = new mongoose.Schema({
  quality: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  timeliness: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  professionalism: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  communication: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  cleanliness: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
});

const ratingSchema = new mongoose.Schema({
  // Core References
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Rating Details
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  criteria: ratingCriteriaSchema,
  
  // Review Content
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Images (before/after photos)
  images: [{
    url: String,
    caption: String,
    type: {
      type: String,
      enum: ['BEFORE', 'AFTER', 'ISSUE', 'GENERAL']
    }
  }],
  
  // Recommendation
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  
  // Additional Feedback
  positiveAspects: [{
    type: String,
    enum: [
      'ON_TIME',
      'PROFESSIONAL',
      'GOOD_QUALITY',
      'FAIR_PRICING',
      'CLEAN_WORK',
      'GOOD_COMMUNICATION',
      'PROBLEM_SOLVER',
      'COURTEOUS',
      'WELL_EQUIPPED',
      'KNOWLEDGEABLE'
    ]
  }],
  
  negativeAspects: [{
    type: String,
    enum: [
      'LATE',
      'UNPROFESSIONAL',
      'POOR_QUALITY',
      'OVERPRICED',
      'MESSY_WORK',
      'POOR_COMMUNICATION',
      'INCOMPLETE_WORK',
      'RUDE_BEHAVIOR',
      'LACK_OF_TOOLS',
      'INEXPERIENCED'
    ]
  }],
  
  // Response from Vendor
  vendorResponse: {
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    respondedAt: Date,
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  
  // Admin Review
  adminReview: {
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED'],
      default: 'PENDING'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    notes: String,
    flagReason: {
      type: String,
      enum: [
        'INAPPROPRIATE_CONTENT',
        'SPAM',
        'FAKE_REVIEW',
        'OFFENSIVE_LANGUAGE',
        'IRRELEVANT',
        'DUPLICATE',
        'OTHER'
      ]
    }
  },
  
  // Visibility and Status
  isPublic: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Helpful votes
  helpfulVotes: {
    up: {
      type: Number,
      default: 0
    },
    down: {
      type: Number,
      default: 0
    },
    voters: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: {
        type: String,
        enum: ['UP', 'DOWN']
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Follow-up tracking
  followUpRequested: {
    type: Boolean,
    default: false
  },
  issueResolved: {
    type: Boolean,
    default: true
  },
  resolutionNotes: String,
  
  // Metadata
  deviceInfo: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  
  // Seasonal/Contextual data
  seasonSubmitted: {
    type: String,
    enum: ['SPRING', 'SUMMER', 'FALL', 'WINTER']
  },
  weekday: {
    type: String,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ratingSchema.index({ vendorId: 1, createdAt: -1 });
ratingSchema.index({ customerId: 1 });
ratingSchema.index({ jobId: 1 });
ratingSchema.index({ overallRating: -1 });
ratingSchema.index({ isPublic: 1, 'adminReview.status': 1 });
ratingSchema.index({ createdAt: -1 });

// Compound indexes
ratingSchema.index({ vendorId: 1, overallRating: -1, createdAt: -1 });
ratingSchema.index({ vendorId: 1, isPublic: 1, 'adminReview.status': 1 });

// Calculate season and weekday before saving
ratingSchema.pre('save', function(next) {
  if (!this.seasonSubmitted) {
    const month = this.createdAt.getMonth();
    if (month >= 2 && month <= 4) this.seasonSubmitted = 'SPRING';
    else if (month >= 5 && month <= 7) this.seasonSubmitted = 'SUMMER';
    else if (month >= 8 && month <= 10) this.seasonSubmitted = 'FALL';
    else this.seasonSubmitted = 'WINTER';
  }
  
  if (!this.weekday) {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    this.weekday = days[this.createdAt.getDay()];
  }
  
  next();
});

// Static methods for analytics
ratingSchema.statics.getVendorStats = async function(vendorId, options = {}) {
  const { startDate, endDate } = options;
  
  const matchStage = {
    vendorId: new mongoose.Types.ObjectId(vendorId),
    isPublic: true,
    'adminReview.status': { $ne: 'REJECTED' }
  };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: '$overallRating' },
        averageQuality: { $avg: '$criteria.quality' },
        averageTimeliness: { $avg: '$criteria.timeliness' },
        averageProfessionalism: { $avg: '$criteria.professionalism' },
        averageCommunication: { $avg: '$criteria.communication' },
        averageCleanliness: { $avg: '$criteria.cleanliness' },
        recommendationRate: { 
          $avg: { $cond: [{ $eq: ['$wouldRecommend', true] }, 1, 0] } 
        },
        ratingDistribution: {
          $push: '$overallRating'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalRatings: 0,
      averageRating: 0,
      criteria: {},
      recommendationRate: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  const result = stats[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });
  
  return {
    totalRatings: result.totalRatings,
    averageRating: Math.round(result.averageRating * 100) / 100,
    criteria: {
      quality: Math.round(result.averageQuality * 100) / 100,
      timeliness: Math.round(result.averageTimeliness * 100) / 100,
      professionalism: Math.round(result.averageProfessionalism * 100) / 100,
      communication: Math.round(result.averageCommunication * 100) / 100,
      cleanliness: Math.round(result.averageCleanliness * 100) / 100
    },
    recommendationRate: Math.round(result.recommendationRate * 100),
    ratingDistribution: distribution
  };
};

ratingSchema.statics.getMonthlyStats = async function(vendorId, year) {
  const stats = await this.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        isPublic: true,
        'adminReview.status': { $ne: 'REJECTED' },
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        averageRating: { $avg: '$overallRating' },
        totalRatings: { $sum: 1 },
        recommendationRate: { 
          $avg: { $cond: [{ $eq: ['$wouldRecommend', true] }, 1, 0] } 
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  // Fill missing months with zeros
  const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    averageRating: 0,
    totalRatings: 0,
    recommendationRate: 0
  }));
  
  stats.forEach(stat => {
    const monthIndex = stat._id - 1;
    monthlyStats[monthIndex] = {
      month: stat._id,
      averageRating: Math.round(stat.averageRating * 100) / 100,
      totalRatings: stat.totalRatings,
      recommendationRate: Math.round(stat.recommendationRate * 100)
    };
  });
  
  return monthlyStats;
};

// Instance methods
ratingSchema.methods.addHelpfulVote = function(userId, voteType) {
  // Remove existing vote from this user
  this.helpfulVotes.voters = this.helpfulVotes.voters.filter(
    voter => voter.userId.toString() !== userId.toString()
  );
  
  // Add new vote
  this.helpfulVotes.voters.push({
    userId: userId,
    vote: voteType,
    votedAt: new Date()
  });
  
  // Recalculate counts
  this.helpfulVotes.up = this.helpfulVotes.voters.filter(v => v.vote === 'UP').length;
  this.helpfulVotes.down = this.helpfulVotes.voters.filter(v => v.vote === 'DOWN').length;
  
  return this.save();
};

ratingSchema.methods.addVendorResponse = function(comment, isPublic = true) {
  this.vendorResponse = {
    comment: comment,
    respondedAt: new Date(),
    isPublic: isPublic
  };
  
  return this.save();
};

// Virtual for net helpful score
ratingSchema.virtual('helpfulScore').get(function() {
  return this.helpfulVotes.up - this.helpfulVotes.down;
});

// Virtual for criteria average
ratingSchema.virtual('criteriaAverage').get(function() {
  if (!this.criteria) return 0;
  
  const { quality, timeliness, professionalism, communication, cleanliness } = this.criteria;
  return Math.round(((quality + timeliness + professionalism + communication + cleanliness) / 5) * 100) / 100;
});

// Ensure virtual fields are serialized
ratingSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Rating', ratingSchema);