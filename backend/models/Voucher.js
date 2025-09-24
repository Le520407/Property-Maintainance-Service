const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maximumDiscountAmount: {
    type: Number,
    default: null // For percentage discounts, cap the max discount
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: 1
  },
  usageCount: {
    type: Number,
    default: 0
  },
  pointsCost: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    required: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['ALL', 'PLUMBING', 'ELECTRICAL', 'CLEANING', 'HANDYMAN', 'HVAC', 'OTHER'],
    default: 'ALL'
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    discountAmount: {
      type: Number,
      required: true
    }
  }],
  metadata: {
    createdFromPoints: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
voucherSchema.index({ code: 1 });
voucherSchema.index({ owner: 1 });
voucherSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
voucherSchema.index({ category: 1 });

// Virtual for remaining uses
voucherSchema.virtual('remainingUses').get(function() {
  return this.usageLimit - this.usageCount;
});

// Virtual for expiry status
voucherSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil;
});

// Virtual for is usable
voucherSchema.virtual('isUsable').get(function() {
  return this.isActive && !this.isExpired && this.remainingUses > 0;
});

// Method to check if voucher can be applied to an order
voucherSchema.methods.canApplyToOrder = function(orderAmount, userId = null, category = 'ALL') {
  // Check basic validity
  if (!this.isUsable) return { valid: false, reason: 'Voucher is not usable' };

  // Check minimum order amount
  if (orderAmount < this.minimumOrderAmount) {
    return {
      valid: false,
      reason: `Minimum order amount is $${this.minimumOrderAmount}`
    };
  }

  // Check category match
  if (this.category !== 'ALL' && this.category !== category) {
    return {
      valid: false,
      reason: `Voucher only applies to ${this.category} services`
    };
  }

  // Check if user has already used this voucher (if userId provided)
  if (userId) {
    const userUsage = this.usedBy.find(usage => usage.user.toString() === userId.toString());
    if (userUsage && this.usageLimit === 1) {
      return {
        valid: false,
        reason: 'You have already used this voucher'
      };
    }
  }

  return { valid: true, reason: null };
};

// Method to calculate discount amount
voucherSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0;

  if (this.type === 'PERCENTAGE') {
    discountAmount = (orderAmount * this.value) / 100;
    // Apply maximum discount limit if set
    if (this.maximumDiscountAmount && discountAmount > this.maximumDiscountAmount) {
      discountAmount = this.maximumDiscountAmount;
    }
  } else if (this.type === 'FIXED_AMOUNT') {
    discountAmount = Math.min(this.value, orderAmount);
  }

  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

// Method to apply voucher to an order
voucherSchema.methods.applyToOrder = async function(orderId, userId, orderAmount, category = 'ALL') {
  const validation = this.canApplyToOrder(orderAmount, userId, category);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const discountAmount = this.calculateDiscount(orderAmount);

  // Add usage record
  this.usedBy.push({
    user: userId,
    order: orderId,
    usedAt: new Date(),
    discountAmount
  });

  // Increment usage count
  this.usageCount += 1;

  // Deactivate if usage limit reached
  if (this.usageCount >= this.usageLimit) {
    this.isActive = false;
  }

  await this.save();

  return {
    discountAmount,
    finalAmount: orderAmount - discountAmount,
    voucherCode: this.code
  };
};

// Static method to generate unique voucher code
voucherSchema.statics.generateCode = function(prefix = 'SWIFT') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Static method to create voucher from points
voucherSchema.statics.createFromPoints = async function(userId, pointsCost, voucherOptions) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');
  if (user.pointsBalance < pointsCost) throw new Error('Insufficient points');

  // Generate unique code
  let code;
  let attempts = 0;
  do {
    code = this.generateCode();
    attempts++;
  } while (await this.findOne({ code }) && attempts < 10);

  if (attempts >= 10) throw new Error('Failed to generate unique voucher code');

  // Create voucher first (without transaction reference)
  const voucher = new this({
    code,
    owner: userId,
    pointsCost,
    type: voucherOptions.type,
    value: voucherOptions.value,
    minimumOrderAmount: voucherOptions.minimumOrderAmount,
    maximumDiscountAmount: voucherOptions.maximumDiscountAmount,
    description: voucherOptions.description,
    validUntil: voucherOptions.validUntil,
    category: voucherOptions.category,
    usageLimit: voucherOptions.usageLimit,
    metadata: {
      createdFromPoints: true
    }
  });

  await voucher.save();

  // Deduct points from user
  const deductResult = await user.deductPoints(pointsCost, `Exchanged for voucher ${code}`, {
    type: 'REDEEMED_DISCOUNT',
    relatedId: voucher._id,
    relatedModel: 'Voucher',
    metadata: {
      voucherCode: code,
      voucherValue: voucherOptions.value,
      voucherType: voucherOptions.type
    }
  });

  // Note: We'll skip setting originalTransactionId for now to avoid validation issues
  // The voucher creation and points deduction is working properly without it

  return voucher;
};

// Ensure virtual fields are serialized
voucherSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Voucher = mongoose.model('Voucher', voucherSchema);

module.exports = Voucher;