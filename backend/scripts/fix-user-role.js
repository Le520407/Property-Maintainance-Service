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

const fixUserRole = async () => {
  try {
    await connectDB();

    // Find and fix users with uppercase roles
    const users = await User.find({
      role: { $in: ['CUSTOMER', 'VENDOR', 'ADMIN'] }
    });

    console.log(`Found ${users.length} users with uppercase roles`);

    for (const user of users) {
      const oldRole = user.role;
      const newRole = user.role.toLowerCase();
      
      console.log(`Fixing user ${user.email}: ${oldRole} -> ${newRole}`);
      
      // Update using direct MongoDB query to bypass validation
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            role: newRole,
            updatedAt: new Date()
          }
        }
      );
    }

    // Verify the fix
    console.log('\n✅ Verification:');
    const fixedUser = await User.findOne({ email: 'le520735@gmail.com' });
    console.log(`User ${fixedUser.email} role is now: ${fixedUser.role}`);

    // Test login simulation again
    console.log('\n🧪 Testing login process...');
    const testUser = await User.findOne({ email: 'le520735@gmail.com' }).select('+password');
    
    const isPasswordValid = await testUser.comparePassword('Le030407010735');
    console.log('Password valid:', isPasswordValid);
    
    // Test updateLastLogin
    await testUser.updateLastLogin();
    console.log('✅ updateLastLogin successful');

  } catch (error) {
    console.error('❌ Error fixing user role:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
};

fixUserRole();