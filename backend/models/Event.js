const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['physical', 'virtual', 'hybrid'],
      default: 'physical'
    },
    address: String,
    virtualLink: String,
    instructions: String
  },
  category: {
    type: String,
    enum: ['training', 'workshop', 'networking', 'community', 'product_launch', 'awards', 'certification'],
    required: true
  },
  visibility: {
    type: String,
    enum: ['public', 'vendor_only', 'agent_only', 'customer_only', 'admin_only'],
    default: 'public'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  pricing: {
    isFree: {
      type: Boolean,
      default: true
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'SGD'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  materials: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['document', 'video', 'image', 'link']
    }
  }],
  prerequisites: [String],
  cpdPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    attended: {
      type: Boolean,
      default: false
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentId: String,
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    }
  }],
  waitlist: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  analytics: {
    totalRegistrations: {
      type: Number,
      default: 0
    },
    totalAttendance: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  imageUrl: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly']
    },
    interval: Number,
    endDate: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ category: 1, visibility: 1 });
eventSchema.index({ 'attendees.user': 1 });

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  return this.attendees.length >= this.capacity;
});

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.capacity - this.attendees.length);
});

// Virtual for checking if registration is open
eventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return now < this.registrationDeadline && this.status === 'published' && !this.isFull;
});

// Method to register a user for the event
eventSchema.methods.registerUser = async function(userId) {
  // Check if user is already registered
  const existingRegistration = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );

  if (existingRegistration) {
    throw new Error('User is already registered for this event');
  }

  // Check if event is full
  if (this.isFull) {
    // Add to waitlist
    const existingWaitlist = this.waitlist.find(
      wait => wait.user.toString() === userId.toString()
    );

    if (!existingWaitlist) {
      this.waitlist.push({ user: userId });
      await this.save();
    }
    throw new Error('Event is full. Added to waitlist.');
  }

  // Check if registration is still open
  if (!this.isRegistrationOpen) {
    throw new Error('Registration is closed for this event');
  }

  // Register the user
  this.attendees.push({
    user: userId,
    paymentStatus: this.pricing.isFree ? 'paid' : 'pending'
  });

  this.analytics.totalRegistrations += 1;
  await this.save();

  return this;
};

// Method to cancel registration
eventSchema.methods.cancelRegistration = async function(userId) {
  const attendeeIndex = this.attendees.findIndex(
    attendee => attendee.user.toString() === userId.toString()
  );

  if (attendeeIndex === -1) {
    throw new Error('User is not registered for this event');
  }

  this.attendees.splice(attendeeIndex, 1);
  this.analytics.totalRegistrations -= 1;

  // Move someone from waitlist if available
  if (this.waitlist.length > 0) {
    const nextUser = this.waitlist.shift();
    this.attendees.push({
      user: nextUser.user,
      paymentStatus: this.pricing.isFree ? 'paid' : 'pending'
    });
    this.analytics.totalRegistrations += 1;
  }

  await this.save();
  return this;
};

// Method to mark attendance
eventSchema.methods.markAttendance = async function(userId, attended = true) {
  const attendee = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );

  if (!attendee) {
    throw new Error('User is not registered for this event');
  }

  const wasAttended = attendee.attended;
  attendee.attended = attended;

  // Update analytics
  if (attended && !wasAttended) {
    this.analytics.totalAttendance += 1;
  } else if (!attended && wasAttended) {
    this.analytics.totalAttendance -= 1;
  }

  await this.save();
  return this;
};

// Method to add feedback
eventSchema.methods.addFeedback = async function(userId, rating, comment) {
  const attendee = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );

  if (!attendee) {
    throw new Error('User is not registered for this event');
  }

  if (!attendee.attended) {
    throw new Error('User must have attended the event to leave feedback');
  }

  attendee.feedback = {
    rating,
    comment,
    submittedAt: new Date()
  };

  // Recalculate average rating
  const feedbacks = this.attendees.filter(a => a.feedback && a.feedback.rating);
  if (feedbacks.length > 0) {
    const totalRating = feedbacks.reduce((sum, a) => sum + a.feedback.rating, 0);
    this.analytics.averageRating = totalRating / feedbacks.length;
  }

  await this.save();
  return this;
};

// Static method to get events by user role
eventSchema.statics.getEventsByRole = function(userRole, filters = {}) {
  let visibilityFilter;
  let statusFilter;

  switch (userRole) {
    case 'admin':
      visibilityFilter = {}; // Admin can see all events
      statusFilter = {}; // Admin can see all statuses
      break;
    case 'vendor':
    case 'technician':
      visibilityFilter = { visibility: { $in: ['public', 'vendor_only'] } };
      statusFilter = { status: 'published' };
      break;
    case 'referral':
      visibilityFilter = { visibility: { $in: ['public', 'agent_only'] } };
      statusFilter = { status: 'published' };
      break;
    case 'customer':
      visibilityFilter = { visibility: { $in: ['public', 'customer_only'] } };
      statusFilter = { status: 'published' };
      break;
    default:
      visibilityFilter = { visibility: 'public' };
      statusFilter = { status: 'published' };
  }

  return this.find({ ...visibilityFilter, ...statusFilter, ...filters })
    .populate('organizer', 'firstName lastName email')
    .sort({ startDate: 1 });
};

module.exports = mongoose.model('Event', eventSchema);