require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📄 MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkUser = async () => {
  try {
    await connectDB();

    // Find the specific user
    const user = await User.findOne({ email: 'Le520735@gmail.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found with email: Le520735@gmail.com');
      return;
    }

    console.log('✅ User found:');
    console.log('ID:', user._id);
    console.log('Name:', user.fullName);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Password Hash:', user.password ? 'Present' : 'Missing');
    console.log('Created:', user.createdAt);
    console.log('Updated:', user.updatedAt);

    // Test password comparison
    const testPassword = 'Le030407010735';
    console.log('\n🔐 Testing password comparison...');
    console.log('Testing password:', testPassword);
    
    const isValid = await user.comparePassword(testPassword);
    console.log('Password matches:', isValid ? '✅ YES' : '❌ NO');

    // If password doesn't match, let's check if it's plaintext
    const isPlaintext = user.password === testPassword;
    console.log('Is plaintext password:', isPlaintext ? '✅ YES' : '❌ NO');

  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
};

checkUser();