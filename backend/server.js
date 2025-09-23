require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const jobRoutes = require('./routes/jobs');
const messageRoutes = require('./routes/messages');
const paymentRoutes = require('./routes/payments');
const cmsRoutes = require('./routes/cms');
const adminRoutes = require('./routes/admin');
const referralRoutes = require('./routes/referral');
const inviteCodeRoutes = require('./routes/inviteCodes');
const vendorRoutes = require('./routes/vendor');
const vendorMembershipRoutes = require('./routes/vendorMembership');
const customerSubscriptionRoutes = require('./routes/customerSubscriptions');
const announcementRoutes = require('./routes/announcements');
const membershipRoutes = require('./routes/membership');
const hitpayRoutes = require('./routes/hitpay');
const imageRoutes = require('./routes/images');
const cartRoutes = require('./routes/cart');
const tacRoutes = require('./routes/tacAuth');
const eventRoutes = require('./routes/events');

const app = express();

// Connect to MongoDB
connectDB();

// Rate limiting - Increased significantly for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs (greatly increased for dev)
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.set('trust proxy', 1); // Trust first proxy for rate limiting
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002', 
    'http://localhost:5001', 
    'http://localhost:5002',
    'https://www.swiftfixpro.com',
    'https://swiftfixpro.com',
    'http://www.swiftfixpro.com',
    'http://swiftfixpro.com'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file service - uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', tacRoutes);  // TAC routes (tac/request, tac/verify)
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/invite-codes', inviteCodeRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/vendor/membership', vendorMembershipRoutes);
app.use('/api/subscriptions', customerSubscriptionRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/hitpay', hitpayRoutes);
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', cartRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/events', eventRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 8052;

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize billing data retention service
  try {
    const retentionService = require('./scripts/billing-retention-service');
    retentionService.start();
    console.log('🗂️  Billing data retention service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize billing retention service:', error.message);
  }
});

module.exports = app;
