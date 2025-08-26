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

const fixUserStatus = async () => {
  try {
    await connectDB();
    
    // Find users without status or with null/undefined status
    const usersWithoutStatus = await User.find({
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: undefined },
        { status: '' }
      ]
    });
    
    console.log(`Found ${usersWithoutStatus.length} users without proper status`);
    
    // Update all users without status to ACTIVE
    const result = await User.updateMany(
      {
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: undefined },
          { status: '' }
        ]
      },
      {
        $set: { status: 'ACTIVE' }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users to ACTIVE status`);
    
    // Display updated users
    const updatedUsers = await User.find({ status: 'ACTIVE' }, 'firstName lastName email status').limit(10);
    console.log('\nFirst 10 users with ACTIVE status:');
    updatedUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}): ${user.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user status:', error);
    process.exit(1);
  }
};

// Run the script
fixUserStatus();