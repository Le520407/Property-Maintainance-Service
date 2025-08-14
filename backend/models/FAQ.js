const mongoose = require('mongoose');

// 常见问题数据模型
const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'services', 'pricing', 'booking', 'technical', 'billing']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  // 搜索关键词，便于用户搜索
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // 点击统计，了解哪些问题最常被查看
  views: {
    type: Number,
    default: 0
  },
  // 是否有帮助的统计
  helpful: {
    yes: {
      type: Number,
      default: 0
    },
    no: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// 创建索引
faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ keywords: 1 });

module.exports = mongoose.model('FAQ', faqSchema);