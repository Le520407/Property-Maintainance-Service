const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
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
  country: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Customer specific fields
  totalSpent: {
    type: Number,
    default: 0
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  
  // Vendor/Technician specific fields
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  subscriptionPlan: {
    type: String,
    enum: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
    default: 'BASIC'
  },
  
  // Admin specific fields
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_content', 'manage_services', 'manage_payments', 'view_analytics', 'manage_system']
  }],
  lastLogin: {
    type: Date
  },
  isSuper: {
    type: Boolean,
    default: false
  },
  
  // Referral fields
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Role checking methods
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

userSchema.methods.isVendor = function() {
  return this.role === 'vendor';
};

userSchema.methods.isCustomer = function() {
  return this.role === 'customer';
};

userSchema.methods.hasPermission = function(permission) {
  return this.isAdmin() && (this.isSuper || this.permissions.includes(permission));
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Add virtual id field
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);