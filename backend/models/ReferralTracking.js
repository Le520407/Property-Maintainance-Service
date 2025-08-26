const mongoose = require('mongoose');

// Referral Click Tracking Schema - for detailed analytics
const referralClickSchema = new mongoose.Schema({
  referralCode: {
    type: String,
    required: true,
    uppercase: true
  },
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  referer: String,
  source: {
    type: String,
    enum: ['DIRECT', 'SOCIAL', 'EMAIL', 'SMS', 'QR_CODE', 'OTHER'],
    default: 'DIRECT'
  },
  device: {
    type: {
      type: String,
      enum: ['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN']
    },
    browser: String,
    os: String,
    isMobile: Boolean
  },
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  clickedAt: {
    type: Date,
    default: Date.now
  },
  converted: {
    type: Boolean,
    default: false
  },
  convertedAt: Date,
  convertedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  conversionType: {
    type: String,
    enum: ['SIGNUP', 'FIRST_PURCHASE', 'SUBSCRIPTION']
  },
  fraudFlags: [{
    type: String,
    reason: String,
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    detectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Referral Link Schema - for managing different referral links
const referralLinkSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    uppercase: true
  },
  linkId: {
    type: String,
    required: true,
    unique: true
  },
  originalUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true
  },
  campaign: {
    name: String,
    medium: String, // email, social, sms, etc.
    source: String, // facebook, instagram, email_newsletter
    content: String,
    term: String
  },
  customParameters: {
    type: Map,
    of: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date,
  totalClicks: {
    type: Number,
    default: 0
  },
  uniqueClicks: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  lastClickedAt: Date
}, {
  timestamps: true
});

// Fraud Detection Schema - for tracking suspicious activities
const fraudDetectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'MULTIPLE_SIGNUPS_SAME_IP',
      'MULTIPLE_SIGNUPS_SAME_DEVICE',
      'SUSPICIOUS_CLICK_PATTERN',
      'FAKE_EMAIL',
      'DUPLICATE_PHONE',
      'GEOGRAPHIC_ANOMALY',
      'VELOCITY_ABUSE',
      'SELF_REFERRAL',
      'REFERRAL_FARMING'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  affectedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['REFERRER', 'REFERRED']
    }
  }],
  referralCode: String,
  description: {
    type: String,
    required: true
  },
  evidence: [{
    type: String,
    data: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  status: {
    type: String,
    enum: ['DETECTED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'],
    default: 'DETECTED'
  },
  resolution: {
    action: {
      type: String,
      enum: ['BLOCK_USER', 'SUSPEND_REFERRAL', 'WARNING_ISSUED', 'NO_ACTION']
    },
    reason: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  notificationsSent: {
    admin: {
      type: Boolean,
      default: false
    },
    user: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Referral Analytics Schema - for aggregated data
const referralAnalyticsSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
    required: true
  },
  periodDate: {
    type: Date,
    required: true
  },
  metrics: {
    totalClicks: {
      type: Number,
      default: 0
    },
    uniqueClicks: {
      type: Number,
      default: 0
    },
    signups: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    commissionEarned: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    avgOrderValue: {
      type: Number,
      default: 0
    }
  },
  topSources: [{
    source: String,
    clicks: Number,
    conversions: Number
  }],
  deviceBreakdown: {
    desktop: Number,
    mobile: Number,
    tablet: Number
  },
  geographicData: [{
    country: String,
    clicks: Number,
    conversions: Number
  }]
}, {
  timestamps: true
});

// Indexes for performance
referralClickSchema.index({ referralCode: 1, clickedAt: -1 });
referralClickSchema.index({ referrerId: 1, clickedAt: -1 });
referralClickSchema.index({ ipAddress: 1, clickedAt: -1 });
referralClickSchema.index({ sessionId: 1 });
referralClickSchema.index({ converted: 1, convertedAt: -1 });
referralClickSchema.index({ riskScore: -1 });

referralLinkSchema.index({ referrerId: 1, isActive: 1 });
referralLinkSchema.index({ referralCode: 1 });
referralLinkSchema.index({ shortUrl: 1 });
referralLinkSchema.index({ linkId: 1 });

fraudDetectionSchema.index({ type: 1, severity: 1, createdAt: -1 });
fraudDetectionSchema.index({ 'affectedUsers.userId': 1 });
fraudDetectionSchema.index({ referralCode: 1 });
fraudDetectionSchema.index({ status: 1, createdAt: -1 });
fraudDetectionSchema.index({ riskScore: -1 });

referralAnalyticsSchema.index({ referrerId: 1, period: 1, periodDate: -1 });
referralAnalyticsSchema.index({ period: 1, periodDate: -1 });

// Static methods
referralLinkSchema.statics.generateShortUrl = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

referralLinkSchema.statics.generateLinkId = function() {
  return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Instance methods
referralClickSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // Check for multiple clicks from same IP in short time
  if (this.fraudFlags && this.fraudFlags.length > 0) {
    score += this.fraudFlags.length * 20;
  }
  
  // Add other risk factors
  const now = new Date();
  const hoursDiff = Math.abs(now - this.clickedAt) / 36e5;
  
  if (hoursDiff < 1) score += 10; // Very recent clicks are slightly more risky
  
  // Cap at 100
  this.riskScore = Math.min(score, 100);
  return this.riskScore;
};

fraudDetectionSchema.methods.notifyAdmin = async function() {
  // This would typically send an email/notification to admin
  console.log(`Fraud detected: ${this.type} - Risk Score: ${this.riskScore}`);
  this.notificationsSent.admin = true;
  await this.save();
};

const ReferralClick = mongoose.model('ReferralClick', referralClickSchema);
const ReferralLink = mongoose.model('ReferralLink', referralLinkSchema);
const FraudDetection = mongoose.model('FraudDetection', fraudDetectionSchema);
const ReferralAnalytics = mongoose.model('ReferralAnalytics', referralAnalyticsSchema);

module.exports = {
  ReferralClick,
  ReferralLink,
  FraudDetection,
  ReferralAnalytics
};