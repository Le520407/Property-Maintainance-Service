const mongoose = require('mongoose');

const HomepageBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    trim: true
  },
  buttonLink: {
    type: String,
    trim: true
  },
  backgroundImage: {
    type: String,
    trim: true
  },
  backgroundType: {
    type: String,
    enum: ['image', 'gradient', 'video'],
    default: 'image'
  },
  gradientColors: [{
    type: String,
    trim: true
  }],
  textColor: {
    type: String,
    default: '#ffffff',
    trim: true
  },
  position: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'center'
  },
  animation: {
    type: String,
    enum: ['fade', 'slide', 'zoom', 'none'],
    default: 'fade'
  },
  displayDuration: {
    type: Number,
    default: 5000 // milliseconds
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  location: {
    type: String,
    enum: ['homepage', 'services', 'about', 'global'],
    default: 'homepage'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    lastViewed: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
HomepageBannerSchema.index({ location: 1, isActive: 1, order: 1 });
HomepageBannerSchema.index({ startDate: 1, endDate: 1 });
HomepageBannerSchema.index({ createdBy: 1 });

// Virtual for checking if banner is currently active (within date range)
HomepageBannerSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  const isActiveStatus = this.isActive;
  const withinDateRange = (!this.startDate || this.startDate <= now) && 
                         (!this.endDate || this.endDate >= now);
  return isActiveStatus && withinDateRange;
});

// Static method to get active banners for a location
HomepageBannerSchema.statics.getActiveBanners = function(location = 'homepage', limit = null) {
  const now = new Date();
  const query = {
    location,
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: { $exists: false } },
          { startDate: { $lte: now } }
        ]
      },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: now } }
        ]
      }
    ]
  };

  let queryBuilder = this.find(query).sort({ order: 1, createdAt: 1 });
  
  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  return queryBuilder;
};

// Method to increment view count
HomepageBannerSchema.methods.incrementView = function() {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Method to increment click count
HomepageBannerSchema.methods.incrementClick = function() {
  this.analytics.clicks += 1;
  return this.save();
};

module.exports = mongoose.model('HomepageBanner', HomepageBannerSchema);