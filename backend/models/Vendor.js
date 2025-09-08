const mongoose = require('mongoose');

const servicePackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['home-repairs', 'painting-services', 'electrical-services', 'plumbing-services', 'carpentry-services', 'flooring-services', 'appliance-installation', 'furniture-assembly', 'moving-services', 'renovation', 'safety-security', 'cleaning-services']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in hours
    required: true,
    min: 0.5
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const priceListSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['home-repairs', 'painting-services', 'electrical-services', 'plumbing-services', 'carpentry-services', 'flooring-services', 'appliance-installation', 'furniture-assembly', 'moving-services', 'renovation', 'safety-security', 'cleaning-services']
  },
  baseRate: {
    type: Number,
    required: true,
    min: 0
  },
  emergencyRate: {
    type: Number,
    required: true,
    min: 0
  },
  weekendRate: {
    type: Number,
    required: true,
    min: 0
  },
  nightRate: {
    type: Number,
    required: true,
    min: 0
  }
});

const availabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const monthlyRatingSchema = new mongoose.Schema({
  month: {
    type: Date,
    required: true
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
});

const vendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Company Information
  companyName: {
    type: String,
    trim: true
  },
  businessLicense: {
    type: String,
    trim: true
  },
  establishDate: {
    type: Date
  },
  address: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Service Information
  serviceCategories: [{
    type: String,
    enum: ['home-repairs', 'painting-services', 'electrical-services', 'plumbing-services', 'carpentry-services', 'flooring-services', 'appliance-installation', 'furniture-assembly', 'moving-services', 'renovation', 'safety-security', 'cleaning-services']
  }],
  serviceArea: {
    type: String,
    trim: true
  },
  teamSize: {
    type: String,
    enum: ['1-5', '6-10', '11-20', '21-50', '50+']
  },
  
  // Price Lists and Service Packages
  priceLists: [priceListSchema],
  servicePackages: [servicePackageSchema],
  
  // Availability Schedule
  availabilitySchedule: [availabilitySlotSchema],
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Rating and Performance
  currentRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  monthlyRatings: [monthlyRatingSchema],
  
  // Job Statistics
  totalJobsCompleted: {
    type: Number,
    default: 0
  },
  totalJobsAssigned: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  
  // Performance Metrics
  onTimePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 5,
    default: 5
  },
  customerSatisfactionScore: {
    type: Number,
    min: 0,
    max: 5,
    default: 5
  },
  
  // Portfolio
  portfolioImages: [{
    url: String,
    description: String,
    category: {
      type: String,
      enum: ['home-repairs', 'painting-services', 'electrical-services', 'plumbing-services', 'carpentry-services', 'flooring-services', 'appliance-installation', 'furniture-assembly', 'moving-services', 'renovation', 'safety-security', 'cleaning-services']
    }
  }],
  
  // Certificates and Documents
  certificates: [{
    name: String,
    url: String,
    issueDate: Date,
    expiryDate: Date
  }],
  
  // Verification Status
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING'
  },
  verificationNotes: {
    type: String,
    trim: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  
  // Emergency Service
  providesEmergencyService: {
    type: Boolean,
    default: false
  },
  emergencyContactNumber: {
    type: String,
    trim: true
  },
  
  // Membership Integration
  membershipTier: {
    type: String,
    enum: ['BASIC', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE'],
    default: 'BASIC'
  },
  membershipStatus: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'CANCELLED', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  membershipFeatures: {
    priorityAssignment: { type: Boolean, default: false },
    emergencyServiceEnabled: { type: Boolean, default: false },
    featuredListing: { type: Boolean, default: false },
    maxPortfolioImages: { type: Number, default: 5 },
    customPackagesAllowed: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    platformCommissionRate: { type: Number, default: 15 }
  },
  
  // Legacy field for backward compatibility
  subscriptionPlan: {
    type: String,
    enum: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
    default: 'BASIC'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
vendorSchema.index({ serviceCategories: 1 });
vendorSchema.index({ serviceArea: 1 });
vendorSchema.index({ currentRating: -1 });
vendorSchema.index({ verificationStatus: 1 });
vendorSchema.index({ isActive: 1 });

// Methods
vendorSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.totalRatings + 1;
  const currentTotal = this.currentRating * this.totalRatings;
  this.currentRating = (currentTotal + newRating) / totalRatings;
  this.totalRatings = totalRatings;
  
  // Update monthly rating
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  let monthlyRating = this.monthlyRatings.find(rating => 
    rating.month.getTime() === currentMonth.getTime()
  );
  
  if (!monthlyRating) {
    monthlyRating = {
      month: currentMonth,
      averageRating: newRating,
      totalRatings: 1,
      completedJobs: 0,
      totalEarnings: 0
    };
    this.monthlyRatings.push(monthlyRating);
  } else {
    const monthlyTotal = monthlyRating.averageRating * monthlyRating.totalRatings;
    monthlyRating.totalRatings += 1;
    monthlyRating.averageRating = (monthlyTotal + newRating) / monthlyRating.totalRatings;
  }
  
  return this.save();
};

vendorSchema.methods.addEarnings = function(amount) {
  this.totalEarnings += amount;
  
  // Update monthly earnings
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  let monthlyRating = this.monthlyRatings.find(rating => 
    rating.month.getTime() === currentMonth.getTime()
  );
  
  if (!monthlyRating) {
    monthlyRating = {
      month: currentMonth,
      averageRating: this.currentRating,
      totalRatings: 0,
      completedJobs: 0,
      totalEarnings: amount
    };
    this.monthlyRatings.push(monthlyRating);
  } else {
    monthlyRating.totalEarnings += amount;
  }
  
  return this.save();
};

vendorSchema.methods.completeJob = function() {
  this.totalJobsCompleted += 1;
  
  // Update monthly job count
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  let monthlyRating = this.monthlyRatings.find(rating => 
    rating.month.getTime() === currentMonth.getTime()
  );
  
  if (!monthlyRating) {
    monthlyRating = {
      month: currentMonth,
      averageRating: this.currentRating,
      totalRatings: 0,
      completedJobs: 1,
      totalEarnings: 0
    };
    this.monthlyRatings.push(monthlyRating);
  } else {
    monthlyRating.completedJobs += 1;
  }
  
  return this.save();
};

vendorSchema.methods.isAvailableAtTime = function(dayOfWeek, time) {
  const timeSlots = this.availabilitySchedule.filter(slot => 
    slot.dayOfWeek === dayOfWeek && slot.isAvailable
  );
  
  return timeSlots.some(slot => {
    const startTime = slot.startTime.replace(':', '');
    const endTime = slot.endTime.replace(':', '');
    const checkTime = time.replace(':', '');
    
    return checkTime >= startTime && checkTime <= endTime;
  });
};

// Membership-related methods
vendorSchema.methods.hasFeature = function(featureName) {
  return this.membershipFeatures[featureName] === true;
};

vendorSchema.methods.getCommissionRate = function() {
  return this.membershipFeatures.platformCommissionRate || 15;
};

vendorSchema.methods.canCreateCustomPackages = function() {
  return this.membershipFeatures.customPackagesAllowed;
};

vendorSchema.methods.getMaxPortfolioImages = function() {
  return this.membershipFeatures.maxPortfolioImages || 5;
};

vendorSchema.methods.isPriorityVendor = function() {
  return this.membershipFeatures.priorityAssignment;
};

vendorSchema.methods.upgradeMembership = function(newTier) {
  // This will be called by the membership service
  this.membershipTier = newTier;
  
  // Update features based on tier
  switch(newTier) {
    case 'PROFESSIONAL':
      this.membershipFeatures.maxPortfolioImages = 15;
      this.membershipFeatures.customPackagesAllowed = true;
      this.membershipFeatures.platformCommissionRate = 12;
      break;
    case 'PREMIUM':
      this.membershipFeatures.priorityAssignment = true;
      this.membershipFeatures.emergencyServiceEnabled = true;
      this.membershipFeatures.maxPortfolioImages = 30;
      this.membershipFeatures.customPackagesAllowed = true;
      this.membershipFeatures.advancedAnalytics = true;
      this.membershipFeatures.platformCommissionRate = 10;
      break;
    case 'ENTERPRISE':
      this.membershipFeatures.priorityAssignment = true;
      this.membershipFeatures.emergencyServiceEnabled = true;
      this.membershipFeatures.featuredListing = true;
      this.membershipFeatures.maxPortfolioImages = -1; // unlimited
      this.membershipFeatures.customPackagesAllowed = true;
      this.membershipFeatures.advancedAnalytics = true;
      this.membershipFeatures.prioritySupport = true;
      this.membershipFeatures.platformCommissionRate = 8;
      break;
    default: // BASIC
      this.membershipFeatures.priorityAssignment = false;
      this.membershipFeatures.emergencyServiceEnabled = false;
      this.membershipFeatures.featuredListing = false;
      this.membershipFeatures.maxPortfolioImages = 5;
      this.membershipFeatures.customPackagesAllowed = false;
      this.membershipFeatures.advancedAnalytics = false;
      this.membershipFeatures.prioritySupport = false;
      this.membershipFeatures.platformCommissionRate = 15;
  }
  
  return this.save();
};

// Virtual for completion rate
vendorSchema.virtual('completionRate').get(function() {
  if (this.totalJobsAssigned === 0) return 100;
  return (this.totalJobsCompleted / this.totalJobsAssigned) * 100;
});

// Ensure virtual fields are serialized
vendorSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Vendor', vendorSchema);