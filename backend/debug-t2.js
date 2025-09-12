const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const { Commission, Referral } = require('./models/Referral');
require('dotenv').config();

async function debugT2User() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('✅ Connected to MongoDB');

    console.log('=== SEARCHING FOR T2 USER ===');
    
    // Search for user with firstName T2
    const t2User = await User.findOne({firstName: 'T2'});
    
    if (t2User) {
      console.log('👤 T2 User Found:');
      console.log('- Name:', t2User.firstName, t2User.lastName);
      console.log('- Email:', t2User.email);
      console.log('- Was Referred:', t2User.referredBy ? 'YES ✅' : 'NO ❌');
      
      if (t2User.referredBy) {
        const referrer = await User.findById(t2User.referredBy);
        console.log('- Referred By:', referrer?.firstName, referrer?.lastName, '(' + referrer?.email + ')');
      }
      console.log('- Registration Date:', t2User.createdAt);
      
      console.log('\n📦 T2 Jobs:');
      const t2Jobs = await Job.find({customerId: t2User._id}).sort({createdAt: -1});
      console.log('Total jobs:', t2Jobs.length);
      
      t2Jobs.forEach(job => {
        console.log('- Job:', job.jobNumber || job._id.toString().slice(-6));
        console.log('  Status:', job.status);
        console.log('  Amount:', job.totalAmount);
        console.log('  Created:', job.createdAt);
        console.log('---');
      });
      
      // Check for commissions created for this user
      console.log('\n💰 Commissions for T2:');
      const t2Commissions = await Commission.find({referredUser: t2User._id});
      console.log('Found commissions:', t2Commissions.length);
      t2Commissions.forEach(comm => {
        console.log('- Amount:', comm.commissionAmount);
        console.log('  Status:', comm.status);
        console.log('  Created:', comm.createdAt);
      });
      
    } else {
      console.log('❌ T2 user not found. Let me search recent users...');
      const recentUsers = await User.find().sort({createdAt: -1}).limit(5);
      console.log('\n📋 5 Most Recent Users:');
      recentUsers.forEach(user => {
        console.log('- ' + user.firstName + ' ' + user.lastName + ' (' + user.email + ')');
        console.log('  Referred:', user.referredBy ? 'YES' : 'NO');
        console.log('  Created:', user.createdAt);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

debugT2User();