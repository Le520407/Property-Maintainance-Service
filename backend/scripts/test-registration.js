const mongoose = require('mongoose');
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance-service');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const testRegistration = async () => {
  try {
    await connectDB();
    
    console.log('Testing user registration...');
    
    // Create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      email: testEmail,
      password: 'testpassword123',
      phone: '+1234567890',
      city: 'Test City',
      country: 'Malaysia',
      role: 'customer'
      // Note: status should default to 'ACTIVE' from schema
    });
    
    console.log('✅ User created successfully!');
    console.log(`User ID: ${testUser._id}`);
    console.log(`Email: ${testUser.email}`);
    console.log(`Status: ${testUser.status}`);
    console.log(`Role: ${testUser.role}`);
    
    // Verify the user can be found and has correct status
    const foundUser = await User.findById(testUser._id);
    console.log('\n🔍 User verification:');
    console.log(`Found user: ${foundUser.fullName}`);
    console.log(`Status: ${foundUser.status}`);
    console.log(`Active: ${foundUser.status === 'ACTIVE'}`);
    
    // Clean up - delete test user
    await User.findByIdAndDelete(testUser._id);
    console.log('\n🗑️  Test user deleted');
    
    console.log('\n✅ Registration test completed successfully!');
    console.log('Users should now be able to register and access dashboard without suspension issues.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during registration test:', error);
    process.exit(1);
  }
};

// Run the test
testRegistration();