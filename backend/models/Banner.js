const mongoose = require('mongoose');

// 横幅广告数据模型
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  linkUrl: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    default: 'Learn More'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  // 显示位置：homepage, services, about等
  displayLocation: {
    type: String,
    enum: ['homepage', 'services', 'about', 'global'],
    default: 'homepage'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

// 按显示顺序排序的索引
bannerSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('Banner', bannerSchema);