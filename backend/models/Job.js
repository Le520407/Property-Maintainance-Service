const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const jobLocationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  }
});

const jobTimeSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
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
  }
});

const jobItemSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['plumbing', 'electrical', 'cleaning', 'gardening', 'painting', 'security', 'hvac', 'general', 'Support']
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const jobStatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'PENDING', 'ASSIGNED', 'IN_DISCUSSION', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 
      'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED', 'SUPPORT_PENDING'
    ],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  }
});

const jobSchema = new mongoose.Schema({
  // Job Identification
  jobNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Customer Information
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Vendor Information
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vendorDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  
  // Job Details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Customer uploaded attachments
  images: [String], // Array of uploaded image filenames
  videos: [String], // Array of uploaded video filenames
  
  category: {
    type: String,
    required: true,
    enum: ['plumbing', 'electrical', 'cleaning', 'gardening', 'painting', 'security', 'hvac', 'general', 'Support']
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
    default: 'MEDIUM'
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  
  // Location
  location: jobLocationSchema,
  
  // Timing
  requestedTimeSlot: jobTimeSlotSchema,
  assignedTimeSlot: jobTimeSlotSchema,
  actualStartTime: Date,
  actualEndTime: Date,
  estimatedDuration: {
    type: Number, // in hours
    min: 0.5
  },
  
  // Items and Pricing
  items: [jobItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Customer's budget estimate
  estimatedBudget: {
    type: Number,
    min: 0
  },
  
  // Vendor's quote
  vendorQuote: {
    amount: {
      type: Number,
      min: 0
    },
    description: String,
    validUntil: Date,
    quotedAt: Date,
    quotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Status and Progress
  status: {
    type: String,
    enum: [
      'PENDING',        // Customer submitted, waiting for admin review
      'ASSIGNED',       // Admin assigned to vendor
      'IN_DISCUSSION',  // Vendor contacted customer, discussing details/price
      'QUOTE_SENT',     // Vendor sent price quote to customer
      'QUOTE_ACCEPTED', // Customer accepted quote
      'PAID',           // Customer paid, ready to start work
      'IN_PROGRESS',    // Work is being done
      'COMPLETED',      // Work finished
      'SUPPORT_PENDING', // Customer support request
      'CANCELLED',      // Job cancelled
      'REJECTED'        // Vendor rejected assignment
    ],
    default: 'PENDING'
  },
  statusHistory: [jobStatusHistorySchema],
  
  // Assignment Logic
  assignmentCriteria: {
    location: String,
    skills: [String],
    minRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    preferredVendors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  assignmentAttempts: [{
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    response: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED']
    },
    responseAt: Date,
    rejectionReason: String
  }],
  
  // Work Progress
  workProgress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestones: [{
      name: String,
      description: String,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }],
    workNotes: String,
    imagesBeforeWork: [String], // URLs to images
    imagesAfterWork: [String], // URLs to images
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['CASH', 'CARD', 'ONLINE', 'BANK_TRANSFER']
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'],
      default: 'PENDING'
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    paidAt: Date,
    transactionId: String
  },

  // Commission Structure (Platform Revenue)
  commission: {
    platformRate: {
      type: Number,
      default: 0.10, // 10% platform commission
      min: 0,
      max: 1
    },
    platformAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    vendorAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    commissionPaid: {
      type: Boolean,
      default: false
    },
    commissionPaidAt: Date
  },
  
  // Quality Assurance
  qualityCheck: {
    isRequired: {
      type: Boolean,
      default: false
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedAt: Date,
    status: {
      type: String,
      enum: ['PENDING', 'PASSED', 'FAILED']
    },
    notes: String
  },
  
  // Customer Requirements
  specialInstructions: {
    type: String,
    trim: true
  },
  accessInstructions: {
    type: String,
    trim: true
  },
  customerContactNumber: {
    type: String,
    trim: true
  },
  
  // Internal Notes
  adminNotes: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  
  // Cancellation
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  
  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  
  // Support conversation flag
  isSupport: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ customerId: 1 });
jobSchema.index({ vendorId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ priority: 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ 'requestedTimeSlot.date': 1 });

// Generate unique job number and calculate commission
jobSchema.pre('save', async function(next) {
  // Generate job number if new
  if (!this.jobNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the last job number for today
    const lastJob = await this.constructor
      .findOne({ jobNumber: { $regex: `^JOB-${year}${month}${day}` } })
      .sort({ jobNumber: -1 });
    
    let sequence = 1;
    if (lastJob) {
      const lastSequence = parseInt(lastJob.jobNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.jobNumber = `JOB-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
  }
  
  // Auto-calculate commission when totalAmount changes
  if (this.isModified('totalAmount') && this.totalAmount > 0) {
    this.commission.platformAmount = Math.round(this.totalAmount * this.commission.platformRate * 100) / 100;
    this.commission.vendorAmount = Math.round((this.totalAmount - this.commission.platformAmount) * 100) / 100;
  }
  
  next();
});

// Methods
jobSchema.methods.updateStatus = function(newStatus, updatedBy, notes) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updatedBy,
    notes: notes
  });
  
  // Set specific timestamps based on status
  switch (newStatus) {
    case 'IN_PROGRESS':
      this.actualStartTime = new Date();
      break;
    case 'COMPLETED':
      this.actualEndTime = new Date();
      this.workProgress.percentage = 100;
      break;
  }
  
  return this.save();
};

jobSchema.methods.assignToVendor = function(vendorId) {
  this.vendorId = vendorId;
  this.status = 'ASSIGNED';
  
  this.statusHistory.push({
    status: 'ASSIGNED',
    timestamp: new Date(),
    notes: `Assigned to vendor ${vendorId}`
  });
  
  this.assignmentAttempts.push({
    vendorId: vendorId,
    assignedAt: new Date(),
    response: 'PENDING'
  });
  
  return this.save();
};

jobSchema.methods.vendorResponse = function(vendorId, response, reason) {
  console.log('vendorResponse method called - vendorId:', vendorId, 'response:', response);
  
  const attempt = this.assignmentAttempts.find(
    attempt => attempt.vendorId.toString() === vendorId.toString() && 
               attempt.response === 'PENDING'
  );
  
  console.log('Assignment attempt found:', !!attempt);
  
  if (attempt) {
    attempt.response = response;
    attempt.responseAt = new Date();
    if (reason) attempt.rejectionReason = reason;
    
    // Update job status based on response
    if (response === 'ACCEPTED') {
      this.status = 'IN_DISCUSSION'; // Vendor accepted, now they can discuss with customer
    } else if (response === 'REJECTED') {
      this.status = 'PENDING'; // Back to pending for reassignment
      this.vendorId = null; // Remove vendor assignment
    }
    
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: vendorId,
      notes: response === 'ACCEPTED' ? 'Job accepted by vendor' : `Job rejected: ${reason || 'No reason provided'}`
    });
    
    console.log('Job status updated to:', this.status);
  } else {
    console.log('No matching assignment attempt found');
  }
  
  return this.save();
};

jobSchema.methods.updateProgress = function(percentage, notes, images) {
  this.workProgress.percentage = Math.min(100, Math.max(0, percentage));
  if (notes) this.workProgress.workNotes = notes;
  if (images && images.length > 0) {
    this.workProgress.imagesAfterWork.push(...images);
  }
  
  return this.save();
};

jobSchema.methods.calculateDuration = function() {
  if (this.actualStartTime && this.actualEndTime) {
    const duration = (this.actualEndTime - this.actualStartTime) / (1000 * 60 * 60); // in hours
    return Math.round(duration * 100) / 100; // round to 2 decimal places
  }
  return null;
};

jobSchema.methods.calculateCommission = function() {
  if (this.totalAmount && this.commission.platformRate) {
    this.commission.platformAmount = Math.round(this.totalAmount * this.commission.platformRate * 100) / 100;
    this.commission.vendorAmount = Math.round((this.totalAmount - this.commission.platformAmount) * 100) / 100;
  }
  return this.save();
};

// Virtual for total duration
jobSchema.virtual('actualDuration').get(function() {
  return this.calculateDuration();
});

// Virtual for is overdue
jobSchema.virtual('isOverdue').get(function() {
  if (this.status === 'COMPLETED' || this.status === 'CANCELLED') return false;
  if (!this.requestedTimeSlot || !this.requestedTimeSlot.date) return false;
  
  const now = new Date();
  const scheduledEnd = new Date(this.requestedTimeSlot.date);
  const [endHours, endMinutes] = this.requestedTimeSlot.endTime.split(':');
  scheduledEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
  
  return now > scheduledEnd;
});

// Add pagination plugin
jobSchema.plugin(mongoosePaginate);

// Ensure virtual fields are serialized
jobSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Job', jobSchema);