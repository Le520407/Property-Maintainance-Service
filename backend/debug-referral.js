const mongoose = require('mongoose');
const { Referral, Commission } = require('./models/Referral');
const User = require('./models/User');
require('dotenv').config();

async function debugReferralSystem() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('✅ Connected to MongoDB');

    // 1. Check all referrals
    const referrals = await Referral.find().populate('referrer', 'firstName lastName email');
    console.log(`\n📊 Found ${referrals.length} referral records:`);
    
    referrals.forEach(ref => {
      console.log(`  - Referral Code: ${ref.referralCode}`);
      console.log(`    Referrer: ${ref.referrer?.firstName} ${ref.referrer?.lastName} (${ref.referrer?.email})`);
      console.log(`    Referred Users: ${ref.referredUsers.length}`);
      console.log(`    Total Earned: $${ref.totalCommissionEarned || 0}`);
      console.log(`    Pending: $${ref.pendingCommission || 0}`);
      console.log('---');
    });

    // 2. Check all commissions
    const commissions = await Commission.find().populate('referrer referredUser', 'firstName lastName email');
    console.log(`\n💰 Found ${commissions.length} commission records:`);
    
    commissions.forEach(comm => {
      console.log(`  - Commission ID: ${comm._id}`);
      console.log(`    Referrer: ${comm.referrer?.firstName} ${comm.referrer?.lastName}`);
      console.log(`    Referred User: ${comm.referredUser?.firstName} ${comm.referredUser?.lastName}`);
      console.log(`    Amount: $${comm.commissionAmount}`);
      console.log(`    Status: ${comm.status}`);
      console.log(`    Created: ${comm.createdAt}`);
      console.log('---');
    });

    // 3. Check recently registered users with referral codes
    const usersWithReferrals = await User.find({ 
      referredBy: { $ne: null } 
    }).populate('referredBy', 'firstName lastName email');
    
    console.log(`\n👥 Found ${usersWithReferrals.length} users registered with referral codes:`);
    usersWithReferrals.forEach(user => {
      console.log(`  - User: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`    Referred By: ${user.referredBy?.firstName} ${user.referredBy?.lastName}`);
      console.log(`    Registered: ${user.createdAt}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

debugReferralSystem();