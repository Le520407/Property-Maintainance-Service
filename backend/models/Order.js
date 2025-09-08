const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String, // Changed from ObjectId to String to support service IDs
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const shippingAddressSchema = new mongoose.Schema({
  recipientName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
    // Will be auto-generated in pre-save hook
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 10
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['hitpay', 'credit-card', 'paypal', 'bank-transfer'],
    default: 'hitpay'
  },
  // HitPay payment details
  paymentId: {
    type: String,
    sparse: true
  },
  paymentUrl: {
    type: String
  },
  paymentReference: {
    type: String
  },
  // Tracking information
  trackingNumber: {
    type: String
  },
  estimatedDelivery: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Generate unique order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${date}-${random}`;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isNew) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.total = this.subtotal + this.shippingCost;
  }
  next();
});

// Indexes for better query performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentId: 1 }, { sparse: true });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
