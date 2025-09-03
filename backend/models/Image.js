const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['service', 'banner', 'blog', 'profile', 'other'],
    default: 'other'
  },
  tags: [{
    type: String
  }],
  altText: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  dimensions: {
    width: Number,
    height: Number
  },
  data: {
    type: Buffer,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
imageSchema.index({ category: 1, isActive: 1 });
imageSchema.index({ filename: 1 });
imageSchema.index({ tags: 1 });

// Method to increment usage count
imageSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Static method to get images by category
imageSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).select('-data');
};

// Virtual for image URL
imageSchema.virtual('url').get(function() {
  return `/api/images/${this.filename}`;
});

// Transform function to exclude sensitive data
imageSchema.methods.toJSON = function() {
  const image = this.toObject();
  delete image.data; // Don't include binary data in JSON responses
  return image;
};

module.exports = mongoose.model('Image', imageSchema);
