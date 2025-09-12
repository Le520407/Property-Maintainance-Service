const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const PointsTransaction = require('./models/PointsTransaction');
const { Referral } = require('./models/Referral');
require('dotenv').config();

async function cleanupTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== CURRENT STATE ===');
    
    // Check current state
    const referrer = await User.findOne({ email: 'le520735@gmail.com' });
    const t3User = await User.findOne({ email: 't3@gmail.com' });
    
    console.log(`Referrer (${referrer.email}):`);
    console.log(`  Points Balance: ${referrer.pointsBalance}`);
    console.log(`  Total Points Earned: ${referrer.totalPointsEarned}`);
    
    if (t3User) {
      console.log(`\nT3 User (${t3User.email}):`);
      console.log(`  Has Completed First Order: ${t3User.hasCompletedFirstOrder}`);
      console.log(`  Created: ${t3User.createdAt}`);
    }

    // Count test data
    const testOrders = await Order.find({
      customer: t3User?._id
    });
    
    const testPointsTransactions = await PointsTransaction.find({
      user: referrer._id,
      type: 'EARNED_REFERRAL'
    });

    console.log(`\nTest Data Found:`);
    console.log(`  Test Orders: ${testOrders.length}`);
    console.log(`  Test Points Transactions: ${testPointsTransactions.length}`);

    // Ask what to clean up
    console.log('\n=== CLEANUP PLAN ===');
    console.log('1. Delete all test orders created for T3');
    console.log('2. Delete all test points transactions');
    console.log('3. Reset referrer points to 0');
    console.log('4. Remove T3 from referral record or delete T3 user entirely');
    console.log('5. Reset T3 hasCompletedFirstOrder to false');

    // Execute cleanup
    console.log('\n=== EXECUTING CLEANUP ===');

    // 1. Delete test orders
    if (testOrders.length > 0) {
      const deletedOrders = await Order.deleteMany({
        customer: t3User._id
      });
      console.log(`✅ Deleted ${deletedOrders.deletedCount} test orders`);
    }

    // 2. Delete test points transactions
    if (testPointsTransactions.length > 0) {
      const deletedTransactions = await PointsTransaction.deleteMany({
        user: referrer._id,
        type: 'EARNED_REFERRAL'
      });
      console.log(`✅ Deleted ${deletedTransactions.deletedCount} test points transactions`);
    }

    // 3. Reset referrer points
    referrer.pointsBalance = 0;
    referrer.totalPointsEarned = 0;
    referrer.totalPointsRedeemed = 0;
    await referrer.save();
    console.log(`✅ Reset referrer points to 0`);

    // 4. Handle T3 user and referral record
    if (t3User) {
      // Option A: Reset T3 but keep the user
      t3User.hasCompletedFirstOrder = false;
      t3User.firstOrderCompletedAt = null;
      t3User.totalSpent = 0;
      await t3User.save();
      console.log(`✅ Reset T3 user order status`);

      // Update referral record - reset T3's spending
      const referralRecord = await Referral.findOne({ referrer: referrer._id });
      if (referralRecord) {
        const t3ReferralUser = referralRecord.referredUsers.find(
          ru => ru.user && ru.user.toString() === t3User._id.toString()
        );
        if (t3ReferralUser) {
          t3ReferralUser.totalSpent = 0;
          t3ReferralUser.firstPurchaseAmount = 0;
          await referralRecord.save();
          console.log(`✅ Reset T3's spending in referral record`);
        }
      }
    }

    console.log('\n=== FINAL STATE ===');
    
    // Check final state
    const cleanReferrer = await User.findById(referrer._id);
    const cleanT3 = await User.findById(t3User._id);
    const remainingOrders = await Order.countDocuments({ customer: t3User._id });
    const remainingTransactions = await PointsTransaction.countDocuments({
      user: referrer._id,
      type: 'EARNED_REFERRAL'
    });

    console.log(`Referrer (${cleanReferrer.email}):`);
    console.log(`  Points Balance: ${cleanReferrer.pointsBalance} ✅`);
    console.log(`  Total Points Earned: ${cleanReferrer.totalPointsEarned} ✅`);
    
    console.log(`\nT3 User (${cleanT3.email}):`);
    console.log(`  Has Completed First Order: ${cleanT3.hasCompletedFirstOrder} ✅`);
    console.log(`  Total Spent: ${cleanT3.totalSpent} ✅`);
    
    console.log(`\nRemaining Test Data:`);
    console.log(`  Orders: ${remainingOrders} ✅`);
    console.log(`  Points Transactions: ${remainingTransactions} ✅`);

    console.log('\n🎉 DATABASE CLEANUP COMPLETE!');
    console.log('\nYour database is now in a clean production state:');
    console.log('- No test orders');
    console.log('- No test points transactions');  
    console.log('- Referrer points reset to 0');
    console.log('- T3 ready for real first order');
    console.log('- Referral system ready for production use');

  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupTestData();