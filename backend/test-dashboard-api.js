const mongoose = require('mongoose');
const User = require('./models/User');
const { Referral, Commission } = require('./models/Referral');
const PointsTransaction = require('./models/PointsTransaction');
require('dotenv').config();

async function testDashboardAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Simulate the dashboard API call for your user
    const userId = await User.findOne({ email: 'le520735@gmail.com' }).select('_id');
    
    console.log('\n=== Testing Dashboard API Logic ===');
    
    // This is the exact logic from routes/referral.js dashboard endpoint
    const referral = await Referral.findOne({ referrer: userId._id })
      .populate('referredUsers.user', 'firstName lastName email createdAt totalSpent');
    
    if (!referral) {
      console.log('❌ No referral found - would return hasReferralCode: false');
      return;
    }

    // Get current user to check type
    const currentUser = await User.findById(userId._id);
    const isPropertyAgent = currentUser.referralUserType === 'property_agent' || currentUser.role === 'referral';
    
    console.log(`User Type Check: isPropertyAgent = ${isPropertyAgent}`);
    console.log(`  referralUserType: ${currentUser.referralUserType}`);
    console.log(`  role: ${currentUser.role}`);
    
    let statistics, recentTransactions;
    
    if (isPropertyAgent) {
      console.log('Following PROPERTY AGENT path...');
      // For property agents: show money commissions
      const commissions = await Commission.find({ referrer: userId._id });
      const totalEarned = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
      const pendingEarnings = commissions
        .filter(comm => comm.status === 'PENDING' || comm.status === 'APPROVED')
        .reduce((sum, comm) => sum + comm.commissionAmount, 0);
      
      recentTransactions = await Commission.find({ referrer: userId._id })
        .populate('referredUser', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);
      
      statistics = {
        totalReferrals: referral.totalReferrals,
        activeReferrals: referral.activeReferrals,
        totalEarned,
        pendingEarnings,
        totalPaid: referral.totalCommissionPaid,
        rewardType: 'money'
      };
    } else {
      console.log('Following CUSTOMER path...');
      // For customers: show points
      
      // Get recent points transactions
      recentTransactions = await PointsTransaction.find({ 
        user: userId._id,
        type: 'EARNED_REFERRAL'
      })
        .populate('metadata.referredUser', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);
      
      console.log(`Found ${recentTransactions.length} referral point transactions`);
      
      // Calculate points earned from referrals
      const referralPoints = recentTransactions.reduce((sum, txn) => sum + txn.points, 0);
      console.log(`Referral points calculated: ${referralPoints}`);
      
      statistics = {
        totalReferrals: referral.totalReferrals,
        activeReferrals: referral.activeReferrals,
        totalEarned: referralPoints,
        pendingEarnings: 0,
        totalPaid: 0,
        pointsBalance: currentUser.pointsBalance,
        totalPointsEarned: currentUser.totalPointsEarned,
        rewardType: 'points'
      };
    }

    console.log('\n=== API Response Would Be ===');
    const response = {
      hasReferralCode: true,
      referralCode: referral.referralCode,
      userType: isPropertyAgent ? 'property_agent' : 'customer',
      statistics,
      referredUsers: referral.referredUsers,
      recentTransactions
    };

    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDashboardAPI();