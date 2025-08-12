const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
const { Referral } = require('./models/Referral');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkReferrals = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== USERS ===');
    const users = await User.find().select('firstName lastName email role');
    users.forEach(user => {
      console.log(`${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role} - ID: ${user._id}`);
    });
    
    console.log('\n=== REFERRALS ===');
    const referrals = await Referral.find().populate('referrer', 'firstName lastName email');
    referrals.forEach(referral => {
      console.log(`Code: ${referral.referralCode} - Owner: ${referral.referrer.email} (${referral.referrer.firstName} ${referral.referrer.lastName}) - ID: ${referral.referrer._id}`);
      console.log(`  Total Refs: ${referral.totalReferrals}, Active: ${referral.activeReferrals}, Tier: ${referral.referralTier}`);
      console.log(`  Created: ${referral.createdAt}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkReferrals();