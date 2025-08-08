require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📄 MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const debugLogin = async () => {
  try {
    await connectDB();

    // Find all users with similar email
    const users = await User.find({
      email: { $regex: /le520735/i }
    }).select('email fullName role status');

    console.log('Found users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.fullName}, ${user.role}, ${user.status})`);
    });

    // Test exact login simulation
    const testEmail = 'le520735@gmail.com';
    const testPassword = 'Le030407010735';

    console.log(`\n🧪 Testing login with: ${testEmail}`);

    // Step 1: Find user
    const user = await User.findOne({ email: testEmail }).select('+password');
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log('✅ User found');

    // Step 2: Check password
    const isPasswordValid = await user.comparePassword(testPassword);
    console.log('✅ Password valid:', isPasswordValid);

    // Step 3: Check status
    console.log('✅ Status check:', user.status);
    if (user.status !== 'ACTIVE') {
      console.log('❌ Account status issue:', user.status);
      return;
    }

    // Step 4: Test updateLastLogin method
    console.log('🔄 Testing updateLastLogin...');
    try {
      await user.updateLastLogin();
      console.log('✅ updateLastLogin successful');
    } catch (error) {
      console.error('❌ updateLastLogin error:', error.message);
    }

    console.log('✅ All login steps completed successfully');

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
};

debugLogin();