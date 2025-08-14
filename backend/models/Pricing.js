const mongoose = require('mongoose');

// 价格方案数据模型
const pricingSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'SGD',
    enum: ['SGD', 'USD', 'EUR']
  },
  billingPeriod: {
    type: String,
    enum: ['hour', 'day', 'week', 'month', 'year', 'one-time'],
    default: 'hour'
  },
  category: {
    type: String,
    required: true,
    enum: ['plumbing', 'electrical', 'cleaning', 'maintenance', 'aircon', 'painting', 'carpentry', 'locksmith', 'appliance']
  },
  features: [{
    name: {
      type: String,
      required: true
    },
    included: {
      type: Boolean,
      default: true
    },
    description: {
      type: String
    }
  }],
  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  // 最小和最大价格范围（用于范围定价）
  priceRange: {
    min: {
      type: Number
    },
    max: {
      type: Number
    }
  },
  // 服务包含的项目
  inclusions: [{
    type: String,
    trim: true
  }],
  // 不包含的项目
  exclusions: [{
    type: String,
    trim: true
  }],
  // 折扣信息
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    validUntil: {
      type: Date
    },
    description: {
      type: String
    }
  }
}, {
  timestamps: true
});

// 创建索引
pricingSchema.index({ vendorId: 1, category: 1, isActive: 1 });
pricingSchema.index({ category: 1, isActive: 1, order: 1 });
pricingSchema.index({ isPopular: 1, isActive: 1 });

module.exports = mongoose.model('Pricing', pricingSchema);