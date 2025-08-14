const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment identification
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  
  // Related entities
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Payment amounts
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  platformCommission: {
    type: Number,
    required: true,
    min: 0,
    default: function() {
      return this.totalAmount * 0.10; // 10% commission
    }
  },
  vendorAmount: {
    type: Number,
    required: true,
    min: 0,
    default: function() {
      return this.totalAmount - this.platformCommission;
    }
  },
  commissionRate: {
    type: Number,
    default: 0.10, // 10%
    min: 0,
    max: 1
  },
  
  // Payment method and gateway
  paymentMethod: {
    type: String,
    enum: [
      'CREDIT_CARD',
      'DEBIT_CARD', 
      'PAYPAL',
      'BANK_TRANSFER',
      'WALLET',
      'CRYPTO'
    ],
    required: true
  },
  paymentGateway: {
    type: String,
    enum: ['STRIPE', 'PAYPAL', 'RAZORPAY', 'SQUARE', 'MOCK'], // MOCK for testing
    required: true
  },
  
  // Payment status
  status: {
    type: String,
    enum: [
      'PENDING',           // Payment initiated but not completed
      'PROCESSING',        // Payment being processed by gateway
      'COMPLETED',         // Payment successful
      'FAILED',           // Payment failed
      'CANCELLED',        // Payment cancelled by user
      'REFUNDED',         // Payment refunded
      'PARTIALLY_REFUNDED', // Partial refund issued
      'DISPUTED',         // Payment disputed/chargeback
      'EXPIRED'           // Payment link/session expired
    ],
    default: 'PENDING'
  },
  
  // Gateway response data
  gatewayResponse: {
    paymentIntentId: String,
    sessionId: String,
    chargeId: String,
    receiptUrl: String,
    gatewayFee: Number,
    gatewayStatus: String,
    failureReason: String,
    rawResponse: mongoose.Schema.Types.Mixed
  },
  
  // Commission distribution
  commissionDistribution: {
    platformAmount: {
      type: Number,
      default: function() { return this.platformCommission; }
    },
    vendorAmount: {
      type: Number,
      default: function() { return this.vendorAmount; }
    },
    referralCommission: {
      type: Number,
      default: 0
    },
    distributedAt: Date,
    distributionStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    }
  },
  
  // Vendor payout
  vendorPayout: {
    amount: Number,
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING'
    },
    scheduledDate: Date,
    processedDate: Date,
    payoutMethod: {
      type: String,
      enum: ['BANK_TRANSFER', 'PAYPAL', 'WALLET', 'CHECK']
    },
    payoutReference: String,
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      accountType: String,
      bankName: String
    },
    failureReason: String
  },
  
  // Refund information
  refunds: [{
    refundId: String,
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gatewayRefundId: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    notes: String
  }],
  
  // Customer payment details
  customerPaymentInfo: {
    cardLast4: String,
    cardBrand: String,
    expiryMonth: Number,
    expiryYear: Number,
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    source: String, // web, mobile, api
    campaignId: String
  },
  
  // Internal notes
  notes: String,
  adminNotes: String,
  
  // Fraud detection
  riskScore: {
    type: Number,
    min: 0,
    max: 100
  },
  fraudFlags: [String],
  
  // Compliance
  taxAmount: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  invoiceNumber: String,
  receiptNumber: String

}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ jobId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ vendorId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ 'vendorPayout.status': 1 });
paymentSchema.index({ 'commissionDistribution.distributionStatus': 1 });

// Generate unique payment ID
paymentSchema.pre('save', async function(next) {
  if (!this.paymentId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the last payment for today
    const lastPayment = await this.constructor
      .findOne({ paymentId: { $regex: `^PAY-${year}${month}${day}` } })
      .sort({ paymentId: -1 });
    
    let sequence = 1;
    if (lastPayment) {
      const lastSequence = parseInt(lastPayment.paymentId.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.paymentId = `PAY-${year}${month}${day}-${String(sequence).padStart(6, '0')}`;
  }
  
  // Auto-calculate commission amounts
  if (this.isModified('totalAmount') || this.isModified('commissionRate')) {
    this.platformCommission = Math.round(this.totalAmount * this.commissionRate * 100) / 100;
    this.vendorAmount = Math.round((this.totalAmount - this.platformCommission) * 100) / 100;
    
    // Update commission distribution
    this.commissionDistribution.platformAmount = this.platformCommission;
    this.commissionDistribution.vendorAmount = this.vendorAmount;
  }
  
  next();
});

// Virtual for total refunded amount
paymentSchema.virtual('totalRefunded').get(function() {
  return this.refunds
    .filter(refund => refund.status === 'COMPLETED')
    .reduce((sum, refund) => sum + refund.amount, 0);
});

// Virtual for net amount (after refunds)
paymentSchema.virtual('netAmount').get(function() {
  return this.totalAmount - this.totalRefunded;
});

// Virtual for payment age in days
paymentSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffInMs = now - this.createdAt;
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
});

// Method to mark payment as completed
paymentSchema.methods.markAsCompleted = function(transactionId, gatewayResponse = {}) {
  this.status = 'COMPLETED';
  this.completedAt = new Date();
  this.transactionId = transactionId;
  this.gatewayResponse = { ...this.gatewayResponse, ...gatewayResponse };
  
  // Schedule vendor payout (typically after a hold period)
  const payoutDate = new Date();
  payoutDate.setDate(payoutDate.getDate() + 3); // 3-day hold period
  
  this.vendorPayout = {
    ...this.vendorPayout,
    amount: this.vendorAmount,
    scheduledDate: payoutDate,
    status: 'PENDING'
  };
  
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason, requestedBy) {
  const refund = {
    refundId: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: amount,
    reason: reason,
    status: 'PENDING',
    requestedBy: requestedBy,
    requestedAt: new Date()
  };
  
  this.refunds.push(refund);
  
  // Update status if full refund
  if (amount >= this.totalAmount) {
    this.status = 'REFUNDED';
  } else if (this.totalRefunded + amount > 0) {
    this.status = 'PARTIALLY_REFUNDED';
  }
  
  return this.save();
};

// Method to calculate fees breakdown
paymentSchema.methods.getFeesBreakdown = function() {
  return {
    totalAmount: this.totalAmount,
    platformCommission: this.platformCommission,
    vendorAmount: this.vendorAmount,
    commissionRate: (this.commissionRate * 100).toFixed(1) + '%',
    gatewayFee: this.gatewayResponse?.gatewayFee || 0,
    taxAmount: this.taxAmount,
    netToVendor: this.vendorAmount - (this.gatewayResponse?.gatewayFee || 0)
  };
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(dateRange = 30) {
  const fromDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalCommission: { $sum: '$platformCommission' },
        totalVendorPayouts: { $sum: '$vendorAmount' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        avgTransactionAmount: { $avg: '$totalAmount' },
        paymentMethods: {
          $push: '$paymentMethod'
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    totalCommission: 0,
    totalVendorPayouts: 0,
    successfulPayments: 0,
    failedPayments: 0,
    avgTransactionAmount: 0
  };
};

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    // Remove sensitive information
    if (ret.customerPaymentInfo) {
      delete ret.customerPaymentInfo.cardNumber;
    }
    return ret;
  }
});

module.exports = mongoose.model('Payment', paymentSchema);