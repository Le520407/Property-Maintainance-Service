const mongoose = require('mongoose');
const User = require('./models/User');
const PointsTransaction = require('./models/PointsTransaction');
const { Referral } = require('./models/Referral');
require('dotenv').config();

async function checkUserPoints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find your account
    const user = await User.findOne({ email: 'le520735@gmail.com' });
    if (!user) {
      console.log('❌ User not found with email le520735@gmail.com');
      return;
    }

    console.log('\n=== User Account Details ===');
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Referral User Type: ${user.referralUserType}`);
    console.log(`Reward Type: ${user.rewardType}`);
    console.log(`Points Balance: ${user.pointsBalance}`);
    console.log(`Total Points Earned: ${user.totalPointsEarned}`);
    console.log(`Total Points Redeemed: ${user.totalPointsRedeemed}`);

    // Check referral record
    console.log('\n=== Referral Record ===');
    const referral = await Referral.findOne({ referrer: user._id })
      .populate('referredUsers.user', 'firstName lastName email');
    
    if (referral) {
      console.log(`Referral Code: ${referral.referralCode}`);
      console.log(`Total Referrals: ${referral.totalReferrals}`);
      console.log(`Active Referrals: ${referral.activeReferrals}`);
      console.log(`Referred Users:`);
      referral.referredUsers.forEach((refUser, idx) => {
        if (refUser.user) {
          console.log(`  ${idx + 1}. ${refUser.user.firstName} ${refUser.user.lastName} (${refUser.user.email})`);
          console.log(`     Status: ${refUser.status}, Total Spent: $${refUser.totalSpent}`);
        }
      });
    } else {
      console.log('No referral record found');
    }

    // Check points transactions
    console.log('\n=== Points Transactions ===');
    const pointsTransactions = await PointsTransaction.find({ user: user._id })
      .sort({ createdAt: -1 });
    
    console.log(`Total Transactions: ${pointsTransactions.length}`);
    pointsTransactions.forEach((txn, idx) => {
      console.log(`${idx + 1}. ${txn.type}: ${txn.points} points`);
      console.log(`   Description: ${txn.description}`);
      console.log(`   Balance: ${txn.previousBalance} → ${txn.newBalance}`);
      console.log(`   Date: ${txn.createdAt}`);
      console.log(`   Status: ${txn.status}`);
      console.log('');
    });

    // Test dashboard endpoint simulation
    console.log('\n=== Dashboard Data Simulation ===');
    const dashboardReferral = await Referral.findOne({ referrer: user._id })
      .populate('referredUsers.user', 'firstName lastName email createdAt totalSpent');
    
    if (dashboardReferral) {
      const isPropertyAgent = user.referralUserType === 'property_agent' || user.role === 'referral';
      console.log(`User Type: ${isPropertyAgent ? 'property_agent' : 'customer'}`);
      
      if (!isPropertyAgent) {
        // Simulate customer dashboard logic
        const referralPointsTransactions = await PointsTransaction.find({ 
          user: user._id,
          type: 'EARNED_REFERRAL'
        });
        
        const referralPoints = referralPointsTransactions.reduce((sum, txn) => sum + txn.points, 0);
        
        console.log('Customer Dashboard Data:');
        console.log(`  Total Referrals: ${dashboardReferral.totalReferrals}`);
        console.log(`  Active Referrals: ${dashboardReferral.activeReferrals}`);
        console.log(`  Total Earned (referral points): ${referralPoints}`);
        console.log(`  Points Balance: ${user.pointsBalance}`);
        console.log(`  Total Points Earned: ${user.totalPointsEarned}`);
        console.log(`  Reward Type: points`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserPoints();