const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true,
    maxlength: 300
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  },
  
  // Target audience
  targetAudience: {
    type: String,
    enum: ['all', 'customers', 'vendors', 'admins'],
    default: 'all'
  },
  
  // Category
  category: {
    type: String,
    enum: [
      'service-update',
      'maintenance',
      'policy-change', 
      'new-service',
      'pricing',
      'system',
      'emergency',
      'general'
    ],
    default: 'general'
  },
  
  // Service area targeting (if location-specific)
  serviceAreas: [{
    type: String,
    trim: true
  }],
  
  // Publishing details
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  
  // Expiration
  expiresAt: {
    type: Date
  },
  
  // Pinning (show at top)
  isPinned: {
    type: Boolean,
    default: false
  },
  
  // Author
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Engagement tracking
  views: {
    type: Number,
    default: 0
  },
  
  // Acknowledgment tracking (for important announcements)
  acknowledgments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notification settings
  sendNotification: {
    type: Boolean,
    default: false
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  
  // Optional image/attachment
  imageUrl: {
    type: String
  },
  
  // SEO and metadata
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Display order
  order: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

// Indexes for performance
announcementSchema.index({ isPublished: 1, createdAt: -1 });
announcementSchema.index({ targetAudience: 1, isPublished: 1 });
announcementSchema.index({ priority: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ category: 1, isPublished: 1 });
announcementSchema.index({ expiresAt: 1 });

// Virtual for checking if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for checking if announcement is active
announcementSchema.virtual('isActive').get(function() {
  return this.isPublished && (!this.expiresAt || this.expiresAt > new Date());
});

// Pre-save middleware
announcementSchema.pre('save', async function(next) {
  // Auto-generate slug if not provided
  if (!this.slug && this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    // Ensure slug is unique by appending timestamp or counter if needed
    let slug = baseSlug;
    let counter = 1;
    
    try {
      // Check if slug exists
      while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      this.slug = slug;
    } catch (error) {
      // Fallback to timestamp-based slug if there's an error
      this.slug = `${baseSlug}-${Date.now()}`;
    }
  }
  
  // Set publishedAt when first published
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Method to increment view count
announcementSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to add acknowledgment
announcementSchema.methods.addAcknowledgment = function(userId) {
  // Check if user already acknowledged
  const existingAck = this.acknowledgments.find(
    ack => ack.userId.toString() === userId.toString()
  );
  
  if (!existingAck) {
    this.acknowledgments.push({ userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to get active announcements for user
announcementSchema.statics.getActiveForUser = function(userRole, serviceArea = null) {
  const query = {
    isPublished: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ],
    $or: [
      { targetAudience: 'all' },
      { targetAudience: userRole }
    ]
  };
  
  // Filter by service area if provided
  if (serviceArea) {
    query.$or.push(
      { serviceAreas: { $size: 0 } }, // No specific areas (applies to all)
      { serviceAreas: serviceArea }
    );
  }
  
  return this.find(query)
    .populate('authorId', 'firstName lastName')
    .sort({ isPinned: -1, priority: -1, createdAt: -1 });
};

// Static method to get announcement statistics
announcementSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        published: { $sum: { $cond: ['$isPublished', 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
        important: { $sum: { $cond: [{ $eq: ['$priority', 'important'] }, 1, 0] } },
        expired: { 
          $sum: { 
            $cond: [
              { 
                $and: [
                  { $ne: ['$expiresAt', null] },
                  { $lt: ['$expiresAt', new Date()] }
                ]
              }, 
              1, 
              0
            ] 
          } 
        }
      }
    }
  ]);
};

// Ensure virtual fields are serialized
announcementSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Announcement', announcementSchema);