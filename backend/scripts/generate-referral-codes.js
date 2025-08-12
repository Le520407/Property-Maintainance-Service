const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
const { Referral } = require('../models/Referral');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const generateReferralCodes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all non-vendor users without referral codes
    const users = await User.find({ role: { $ne: 'vendor' } });
    console.log(`Found ${users.length} users`);
    
    let generated = 0;
    
    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      
      // Check if user already has a referral profile
      let referral = await Referral.findOne({ referrer: user._id });
      
      if (!referral) {
        // Generate unique referral code
        let referralCode;
        let isUnique = false;
        
        while (!isUnique) {
          referralCode = Referral.generateReferralCode();
          const existing = await Referral.findOne({ referralCode });
          if (!existing) isUnique = true;
        }
        
        // Create referral profile
        referral = await Referral.create({
          referralCode,
          referrer: user._id,
          totalReferrals: 0,
          activeReferrals: 0,
          totalCommissionEarned: 0,
          totalCommissionPaid: 0,
          pendingCommission: 0,
          referralTier: 1,
          isActive: true
        });
        
        console.log(`✅ Generated referral code for ${user.email}: ${referralCode}`);
        generated++;
      } else {
        console.log(`⏭️  User ${user.email} already has referral code: ${referral.referralCode}`);
      }
    }
    
    console.log(`\n🎉 Generated referral codes for ${generated} users!`);
    console.log('✅ All users now have referral codes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

generateReferralCodes();