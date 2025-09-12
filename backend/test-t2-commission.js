const mongoose = require('mongoose');
const referralService = require('./services/referralService');
const Job = require('./models/Job');
const User = require('./models/User');
require('dotenv').config();

async function testT2Commission() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('✅ Connected to MongoDB');

    // Find T2's job
    const t2Job = await Job.findOne({ jobNumber: 'JOB1757573761693ULZ8' });
    if (!t2Job) {
      console.log('❌ T2 job not found');
      return;
    }

    console.log('🔍 Found T2 job:', t2Job.jobNumber);
    console.log('   Customer ID:', t2Job.customerId);
    console.log('   Total Amount:', t2Job.totalAmount);
    console.log('   Status:', t2Job.status);

    // Get customer info
    const customer = await User.findById(t2Job.customerId);
    console.log('👤 Customer:', customer.firstName, customer.lastName);
    console.log('   Was Referred:', customer.referredBy ? 'YES' : 'NO');
    
    if (customer.referredBy) {
      const referrer = await User.findById(customer.referredBy);
      console.log('   Referrer:', referrer.firstName, referrer.lastName);
    }

    // Test commission creation
    console.log('\n🧪 Testing commission creation...');
    try {
      const commissionResult = await referralService.trackPurchaseConversion(
        t2Job._id, 
        t2Job.totalAmount, 
        t2Job.customerId
      );
      
      console.log('📊 Commission Result:', commissionResult);
    } catch (error) {
      console.log('❌ Commission creation failed:', error.message);
      console.log('Full error:', error);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testT2Commission();