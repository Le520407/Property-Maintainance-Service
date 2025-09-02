const mongoose = require('mongoose');

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['referral', 'vendor', 'customer'],
    required: true
  },
  maxUses: {
    type: Number,
    default: 1
  },
  currentUses: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'EXHAUSTED', 'DISABLED'],
    default: 'ACTIVE'
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  restrictions: {
    emailDomains: [String],
    countries: [String],
    maxPerUser: {
      type: Number,
      default: 1
    }
  },
  metadata: {
    description: String,
    tags: [String],
    campaign: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate a unique invite code
inviteCodeSchema.statics.generateCode = function(prefix = 'AGENT') {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${timestamp}-${randomPart}`;
};

// Check if code is valid and can be used
inviteCodeSchema.methods.isValid = function() {
  const now = new Date();
  
  if (!this.isActive || this.status !== 'ACTIVE') {
    return { valid: false, reason: 'Code is inactive or disabled' };
  }
  
  if (this.expiresAt < now) {
    return { valid: false, reason: 'Code has expired' };
  }
  
  if (this.currentUses >= this.maxUses) {
    return { valid: false, reason: 'Code has been exhausted' };
  }
  
  return { valid: true };
};

// Use the invite code
inviteCodeSchema.methods.useCode = async function(userId, metadata = {}) {
  const validation = this.isValid();
  if (!validation.valid) {
    throw new Error(validation.reason);
  }
  
  // Check if user already used this code
  const alreadyUsed = this.usedBy.find(u => u.user.toString() === userId.toString());
  if (alreadyUsed && this.restrictions.maxPerUser === 1) {
    throw new Error('Code already used by this user');
  }
  
  // Add usage record
  this.usedBy.push({
    user: userId,
    usedAt: new Date(),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent
  });
  
  this.currentUses += 1;
  
  // Update status if exhausted
  if (this.currentUses >= this.maxUses) {
    this.status = 'EXHAUSTED';
  }
  
  await this.save();
  return true;
};

// Update expired codes
inviteCodeSchema.statics.updateExpiredCodes = async function() {
  const now = new Date();
  await this.updateMany(
    { 
      expiresAt: { $lt: now },
      status: 'ACTIVE'
    },
    { 
      status: 'EXPIRED',
      isActive: false
    }
  );
};

// Get usage statistics
inviteCodeSchema.methods.getStats = function() {
  return {
    code: this.code,
    totalUses: this.currentUses,
    maxUses: this.maxUses,
    remainingUses: Math.max(0, this.maxUses - this.currentUses),
    status: this.status,
    expiresAt: this.expiresAt,
    isExpired: this.expiresAt < new Date(),
    usageRate: this.maxUses > 0 ? (this.currentUses / this.maxUses) * 100 : 0
  };
};

// Indexes for better performance
inviteCodeSchema.index({ code: 1 });
inviteCodeSchema.index({ generatedBy: 1 });
inviteCodeSchema.index({ userType: 1, status: 1 });
inviteCodeSchema.index({ expiresAt: 1 });
inviteCodeSchema.index({ 'usedBy.user': 1 });

module.exports = mongoose.model('InviteCode', inviteCodeSchema);