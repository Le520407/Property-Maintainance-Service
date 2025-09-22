const mongoose = require('mongoose');
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swift-fix-pro');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateCEASystem = async () => {
  try {
    console.log('🔄 Starting CEA system migration...');

    // Find all referral users who don't have CEA fields set up
    const referralUsers = await User.find({
      role: 'referral',
      $or: [
        { ceaNumberStatus: { $exists: false } },
        { ceaNumberStatus: null }
      ]
    });

    console.log(`🔍 Found ${referralUsers.length} referral users to migrate`);

    for (const user of referralUsers) {
      const updates = {};
      let needsUpdate = false;

      // Set default CEA number status
      if (!user.ceaNumberStatus) {
        // If user is already active, assume they were approved before CEA system
        if (user.status === 'ACTIVE' && user.isAgentActive) {
          updates.ceaNumberStatus = 'APPROVED';
          updates.approvedAt = user.createdAt; // Use creation date as approval date
        } else {
          updates.ceaNumberStatus = 'PENDING';
        }
        needsUpdate = true;
      }

      // Ensure referral user type is set
      if (!user.referralUserType) {
        updates.referralUserType = 'property_agent';
        needsUpdate = true;
      }

      // Ensure they can exchange points for money
      if (user.canExchangePointsForMoney === undefined) {
        updates.canExchangePointsForMoney = true;
        needsUpdate = true;
      }

      // Ensure reward type is points
      if (user.rewardType !== 'points') {
        updates.rewardType = 'points';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`✅ Updated referral user: ${user.email} - CEA Status: ${updates.ceaNumberStatus || user.ceaNumberStatus}`);
      }
    }

    // Get summary statistics
    const totalReferralUsers = await User.countDocuments({ role: 'referral' });
    const pendingApprovals = await User.countDocuments({
      role: 'referral',
      ceaNumberStatus: 'PENDING'
    });
    const approvedUsers = await User.countDocuments({
      role: 'referral',
      ceaNumberStatus: 'APPROVED'
    });

    console.log('\n📊 Migration Summary:');
    console.log(`📍 Total referral users: ${totalReferralUsers}`);
    console.log(`⏳ Pending CEA approvals: ${pendingApprovals}`);
    console.log(`✅ Approved CEA numbers: ${approvedUsers}`);

    if (pendingApprovals > 0) {
      console.log('\n⚠️  IMPORTANT: There are pending CEA approvals that require admin attention.');
      console.log('   Admins should review these at: /admin/cea-approvals');
    }

    console.log('🎉 CEA system migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const main = async () => {
  await connectDB();
  await migrateCEASystem();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

main();