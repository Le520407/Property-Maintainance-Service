const mongoose = require('mongoose');
const { Referral, Commission, REFERRAL_REWARDS } = require('./models/Referral');
const User = require('./models/User');
const Order = require('./models/Order');
const referralService = require('./services/referralService');
require('dotenv').config();

async function debugNormalUserReferral() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a normal user's referral record
    console.log('\n=== Finding Customer Referral Records ===');
    const customerReferrals = await Referral.find({})
      .populate('referrer', 'firstName lastName email role referralUserType')
      .populate('referredUsers.user', 'firstName lastName email role referralUserType hasCompletedFirstOrder');

    customerReferrals.forEach((referral, index) => {
      console.log(`\n--- Referral Record ${index + 1} ---`);
      console.log(`Referral Code: ${referral.referralCode}`);
      if (referral.referrer) {
        console.log(`Referrer: ${referral.referrer.firstName} ${referral.referrer.lastName} (${referral.referrer.email})`);
        console.log(`Referrer Role: ${referral.referrer.role}`);
        console.log(`Referrer Type: ${referral.referrer.referralUserType}`);
      } else {
        console.log(`Referrer: User data missing (deleted user?)`);
      }
      console.log(`Total Referrals: ${referral.totalReferrals}`);
      console.log(`Active Referrals: ${referral.activeReferrals}`);
      console.log(`Referred Users: ${referral.referredUsers.length}`);
      
      referral.referredUsers.forEach((refUser, idx) => {
        if (refUser.user) {
          console.log(`  ${idx + 1}. ${refUser.user.firstName} ${refUser.user.lastName} (${refUser.user.email})`);
          console.log(`     Status: ${refUser.status}, First Order: ${refUser.user.hasCompletedFirstOrder}`);
          console.log(`     Total Spent: $${refUser.totalSpent}`);
        } else {
          console.log(`  ${idx + 1}. User data missing (deleted user?)`);
        }
      });
    });

    // Test reward calculation for customer referrers
    console.log('\n=== Testing Customer Reward Calculation ===');
    const customerReferrer = await User.findOne({ 
      role: 'customer', 
      referralUserType: 'customer' 
    });
    
    if (customerReferrer) {
      console.log(`\nTesting rewards for customer: ${customerReferrer.firstName} ${customerReferrer.lastName}`);
      console.log(`User Type: ${customerReferrer.referralUserType}`);
      console.log(`Reward Type: ${customerReferrer.rewardType}`);
      console.log(`Points Balance: ${customerReferrer.pointsBalance}`);
      
      // Test the reward configuration
      const tier1Reward = REFERRAL_REWARDS.customer.tier1;
      const tier2Reward = REFERRAL_REWARDS.customer.tier2;
      
      console.log(`\nReward Configuration:`);
      console.log(`Tier 1: ${tier1Reward.amount} ${tier1Reward.type} - ${tier1Reward.description}`);
      console.log(`Tier 2: ${tier2Reward.amount} ${tier2Reward.type} - ${tier2Reward.description}`);
    }

    // Check for completed orders by referred users
    console.log('\n=== Checking Completed Orders ===');
    const completedOrders = await Order.find({ 
      paymentStatus: 'paid',
      status: 'confirmed'
    }).populate('customer', 'firstName lastName email referralUserType hasCompletedFirstOrder');

    console.log(`Found ${completedOrders.length} completed orders`);
    
    for (const order of completedOrders.slice(0, 3)) { // Check first 3 orders
      console.log(`\n--- Order ${order.orderNumber} ---`);
      console.log(`Customer: ${order.customer.firstName} ${order.customer.lastName}`);
      console.log(`Customer Email: ${order.customer.email}`);
      console.log(`Order Total: $${order.total}`);
      console.log(`Order Status: ${order.status}`);
      console.log(`Payment Status: ${order.paymentStatus}`);
      
      // Check if customer was referred
      const customerReferral = await Referral.findOne({
        'referredUsers.user': order.customer._id,
        'referredUsers.status': 'ACTIVE'
      }).populate('referrer', 'firstName lastName email role referralUserType pointsBalance');
      
      if (customerReferral) {
        console.log(`✅ Customer was referred by: ${customerReferral.referrer.firstName} ${customerReferral.referrer.lastName}`);
        console.log(`Referrer Type: ${customerReferral.referrer.referralUserType}`);
        console.log(`Referrer Points Balance: ${customerReferral.referrer.pointsBalance}`);
        
        // Test the commission tracking
        console.log('\n--- Testing Commission Tracking ---');
        try {
          const result = await referralService.trackPurchaseConversion(
            order._id,
            order.total,
            order.customer._id
          );
          console.log('Commission Result:', result);
        } catch (error) {
          console.error('Commission Error:', error.message);
        }
      } else {
        console.log('❌ Customer was not referred');
      }
    }

    // Check commissions created
    console.log('\n=== Checking Created Commissions ===');
    const commissions = await Commission.find({})
      .populate('referrer', 'firstName lastName email role referralUserType')
      .populate('referredUser', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`Found ${commissions.length} commission records`);
    commissions.forEach((comm, index) => {
      console.log(`\n--- Commission ${index + 1} ---`);
      console.log(`Referrer: ${comm.referrer.firstName} ${comm.referrer.lastName} (${comm.referrer.referralUserType})`);
      console.log(`Referred User: ${comm.referredUser.firstName} ${comm.referredUser.lastName}`);
      console.log(`Order Amount: $${comm.orderAmount}`);
      console.log(`Commission Amount: $${comm.commissionAmount}`);
      console.log(`Status: ${comm.status}`);
    });

    console.log('\n=== Debug Complete ===');

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugNormalUserReferral();