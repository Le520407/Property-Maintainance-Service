const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Message identification
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  
  // Participants
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Message content
  messageType: {
    type: String,
    enum: [
      'TEXT',           // Regular text message
      'QUOTE',          // Price quote from vendor
      'QUOTE_UPDATE',   // Updated quote
      'QUOTE_ACCEPTED', // Customer accepted quote
      'QUOTE_REJECTED', // Customer rejected quote
      'CONTACT_INFO',   // Contact information exchange
      'SCHEDULE',       // Schedule coordination
      'PAYMENT_REQUEST',// Payment request
      'IMAGE',          // Image attachment
      'SYSTEM'          // System generated message
    ],
    default: 'TEXT'
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Quote-specific data (for QUOTE type messages)
  quoteData: {
    amount: {
      type: Number,
      min: 0
    },
    description: String,
    breakdown: [{
      item: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }],
    validUntil: Date,
    terms: String,
    includes: [String], // What's included in the quote
    excludes: [String], // What's excluded
    estimatedDuration: Number, // hours
    paymentTerms: String
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  
  // Contact information (for CONTACT_INFO type)
  contactInfo: {
    phone: String,
    email: String,
    preferredContactMethod: {
      type: String,
      enum: ['phone', 'email', 'message']
    },
    availableTimes: String
  },
  
  // Schedule information (for SCHEDULE type)
  scheduleInfo: {
    proposedDate: Date,
    proposedStartTime: String,
    proposedEndTime: String,
    duration: Number,
    notes: String
  },
  
  // Message status
  status: {
    type: String,
    enum: ['SENT', 'DELIVERED', 'READ'],
    default: 'SENT'
  },
  
  // Read status
  readAt: Date,
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Message priority
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL'
  },
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // System message metadata
  systemData: {
    action: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ jobId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for relative time
messageSchema.virtual('relativeTime').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId) {
  if (this.receiverId.toString() === userId.toString()) {
    this.status = 'READ';
    this.readAt = new Date();
    this.readBy = userId;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to create quote message
messageSchema.statics.createQuoteMessage = function(jobId, vendorId, customerId, quoteData) {
  const content = `Quote: $${quoteData.amount.toFixed(2)} - ${quoteData.description}`;
  
  return this.create({
    jobId,
    senderId: vendorId,
    receiverId: customerId,
    messageType: 'QUOTE',
    content,
    quoteData,
    priority: 'HIGH'
  });
};

// Method to create system message
messageSchema.statics.createSystemMessage = function(jobId, senderId, receiverId, action, details) {
  let content = '';
  
  switch (action) {
    case 'JOB_ASSIGNED':
      content = 'A vendor has been assigned to your job. They will contact you soon.';
      break;
    case 'VENDOR_ACCEPTED':
      content = 'The vendor has accepted your job and will contact you to discuss details.';
      break;
    case 'QUOTE_EXPIRED':
      content = 'The previous quote has expired. Please request a new quote.';
      break;
    case 'PAYMENT_RECEIVED':
      content = 'Payment has been received. Work can now begin.';
      break;
    default:
      content = `System notification: ${action}`;
  }
  
  return this.create({
    jobId,
    senderId,
    receiverId,
    messageType: 'SYSTEM',
    content,
    systemData: { action, details }
  });
};

// Method to get conversation summary
messageSchema.statics.getConversationSummary = async function(jobId) {
  const pipeline = [
    { $match: { jobId: new mongoose.Types.ObjectId(jobId), isDeleted: false } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: { $cond: [{ $ne: ['$status', 'READ'] }, 1, 0] }
        },
        hasQuote: {
          $sum: { $cond: [{ $eq: ['$messageType', 'QUOTE'] }, 1, 0] }
        },
        lastActivity: { $first: '$createdAt' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalMessages: 0,
    lastMessage: null,
    unreadCount: 0,
    hasQuote: 0,
    lastActivity: null
  };
};

// Ensure virtual fields are serialized
messageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Message', messageSchema);