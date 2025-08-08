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

const createTestUser = async () => {
  try {
    await connectDB();

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@swiftfixpro.sg' });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Status:', existingUser.status);
      return;
    }

    // Create test user
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      email: 'test@swiftfixpro.sg',
      password: 'password123',
      phone: '+65 9123 4567',
      city: 'Singapore',
      country: 'Singapore',
      role: 'customer',
      status: 'ACTIVE'
    });

    console.log('✅ Test user created successfully!');
    console.log('Email:', testUser.email);
    console.log('Password: password123');
    console.log('Role:', testUser.role);
    console.log('Status:', testUser.status);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
};

createTestUser();