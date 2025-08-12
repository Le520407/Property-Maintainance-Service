const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Delete existing test user if any
    await User.deleteOne({ email: 'test@example.com' });
    
    // Create test user with known password
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'customer',
      status: 'ACTIVE',
      phone: '1234567890',
      city: 'Test City',
      country: 'Test Country'
    });
    
    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('User ID:', testUser._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestUser();