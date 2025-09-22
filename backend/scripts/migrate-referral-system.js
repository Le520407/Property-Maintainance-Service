const mongoose = require('mongoose');
const User = require('../models/User');
const { REFERRAL_REWARDS } = require('../models/Referral');

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

const migrateReferralSystem = async () => {
  try {
    console.log('🔄 Starting referral system migration...');

    // Find all users who are property agents or have role 'referral'
    const propertyAgents = await User.find({
      $or: [
        { role: 'referral' },
        { referralUserType: 'property_agent' }
      ]
    });

    console.log(`🔍 Found ${propertyAgents.length} property agents to migrate`);

    for (const agent of propertyAgents) {
      const updates = {};
      let needsUpdate = false;

      // Ensure they have the canExchangePointsForMoney field set to true
      if (agent.canExchangePointsForMoney === undefined) {
        updates.canExchangePointsForMoney = true;
        needsUpdate = true;
      }

      // Ensure rewardType is set to 'points'
      if (agent.rewardType !== 'points') {
        updates.rewardType = 'points';
        needsUpdate = true;
      }

      // Convert any existing commission earnings to points
      // Using the conversion rate: $1 = 100 points
      if (agent.totalCommissionEarned > 0) {
        const pointsFromCommissions = agent.totalCommissionEarned * 100; // $1 = 100 points

        if (agent.pointsBalance === 0) {
          updates.pointsBalance = pointsFromCommissions;
          updates.totalPointsEarned = pointsFromCommissions;
          needsUpdate = true;
          console.log(`💰 Converting $${agent.totalCommissionEarned} to ${pointsFromCommissions} points for agent ${agent.email}`);
        }
      }

      // Update tier rewards to use higher point values for property agents
      if (agent.tier1PointsReward < 500 || agent.tier2PointsReward < 200) {
        updates.tier1PointsReward = 500; // 500 points for direct referrals (equivalent to $5)
        updates.tier2PointsReward = 200; // 200 points for indirect referrals (equivalent to $2)
        needsUpdate = true;
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(agent._id, updates);
        console.log(`✅ Updated agent: ${agent.email}`);
      }
    }

    // Find all regular customer users and ensure they have the correct settings
    const customers = await User.find({
      role: { $ne: 'referral' },
      referralUserType: { $ne: 'property_agent' }
    });

    console.log(`🔍 Found ${customers.length} regular customers to check`);

    for (const customer of customers) {
      const updates = {};
      let needsUpdate = false;

      // Ensure they cannot exchange points for money
      if (customer.canExchangePointsForMoney === true) {
        updates.canExchangePointsForMoney = false;
        needsUpdate = true;
      }

      // Ensure rewardType is set to 'points'
      if (customer.rewardType !== 'points') {
        updates.rewardType = 'points';
        needsUpdate = true;
      }

      // Ensure referralUserType is 'customer'
      if (customer.referralUserType !== 'customer') {
        updates.referralUserType = 'customer';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await User.findByIdAndUpdate(customer._id, updates);
        console.log(`✅ Updated customer: ${customer.email}`);
      }
    }

    console.log('🎉 Migration completed successfully!');

    // Print summary
    const totalUsers = await User.countDocuments();
    const agentsWithExchangeRights = await User.countDocuments({ canExchangePointsForMoney: true });
    const usersWithPoints = await User.countDocuments({ rewardType: 'points' });

    console.log('\n📊 Migration Summary:');
    console.log(`📍 Total users: ${totalUsers}`);
    console.log(`💱 Users who can exchange points for money: ${agentsWithExchangeRights}`);
    console.log(`🏆 Users with points reward type: ${usersWithPoints}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const main = async () => {
  await connectDB();
  await migrateReferralSystem();
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