const mongoose = require('mongoose');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
require('dotenv').config();

const createTestVendor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find or create a test vendor user
    let user = await User.findOne({ email: 'vendor@test.com' });
    if (!user) {
      user = await User.create({
        firstName: 'Test',
        lastName: 'Vendor',
        fullName: 'Test Vendor',
        email: 'vendor@test.com',
        password: 'password123',
        phone: '+1234567890',
        city: 'Singapore',
        country: 'Singapore',
        role: 'vendor',
        status: 'ACTIVE'
      });
      console.log('✅ Created test vendor user');
    } else {
      console.log('ℹ️ Test vendor user already exists');
    }
    
    // Check if vendor profile exists
    let vendor = await Vendor.findOne({ userId: user._id });
    if (!vendor) {
      vendor = await Vendor.create({
        userId: user._id,
        companyName: 'Test Vendor Company',
        description: 'Test vendor for development',
        serviceCategories: ['plumbing', 'electrical'],
        serviceArea: 'Singapore',
        teamSize: '1-5',
        verificationStatus: 'VERIFIED',
        isActive: true
      });
      console.log('✅ Created vendor profile');
    } else {
      console.log('ℹ️ Vendor profile already exists');
    }
    
    console.log('🎉 Test vendor ready!');
    console.log('📧 Email: vendor@test.com');
    console.log('🔑 Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestVendor();