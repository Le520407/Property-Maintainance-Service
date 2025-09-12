const mongoose = require('mongoose');
const referralService = require('./services/referralService');
const Job = require('./models/Job');
const User = require('./models/User');
require('dotenv').config();

async function testCommissionCreation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('✅ Connected to MongoDB');

    // Find the completed job from referred user T1
    const job = await Job.findOne({ 
      jobNumber: 'JOB175756223180142FW' 
    });
    
    if (!job) {
      console.log('❌ Job not found');
      return;
    }

    console.log('🔍 Found job:', job.jobNumber);
    console.log('   Customer ID:', job.customerId);
    console.log('   Total Amount:', job.totalAmount);
    console.log('   Status:', job.status);

    // Get customer info
    const customer = await User.findById(job.customerId);
    console.log('👤 Customer:', customer.firstName, customer.lastName);
    console.log('   Was Referred:', customer.referredBy ? 'YES' : 'NO');
    
    if (customer.referredBy) {
      const referrer = await User.findById(customer.referredBy);
      console.log('   Referrer:', referrer.firstName, referrer.lastName);
    }

    // Test commission creation
    console.log('\n🧪 Testing commission creation...');
    const commissionResult = await referralService.trackPurchaseConversion(
      job._id, 
      job.totalAmount, 
      job.customerId
    );
    
    console.log('📊 Commission Result:', commissionResult);

    // Check if commission was created
    const { Commission } = require('./models/Referral');
    const commissions = await Commission.find({ referrer: customer.referredBy });
    console.log('\n💰 Total commissions for referrer:', commissions.length);
    commissions.forEach(comm => {
      console.log('  - Amount:', comm.commissionAmount, 'Status:', comm.status);
    });

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testCommissionCreation();