require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const VendorAssignmentService = require('./services/vendorAssignment');

async function testAutoAssign() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/property-maintenance');
    console.log('✅ Connected to MongoDB');

    // Find a pending job
    console.log('🔍 Looking for pending jobs...');
    const pendingJobs = await Job.find({ status: 'PENDING' }).limit(1);
    
    if (pendingJobs.length === 0) {
      console.log('❌ No pending jobs found');
      return;
    }

    const job = pendingJobs[0];
    console.log(`📋 Found pending job: ${job.jobNumber}, Category: ${job.category}`);

    // Check active vendors
    console.log('👥 Checking active vendors...');
    const activeVendors = await Vendor.find({ isActive: true }).populate('userId', 'firstName lastName');
    console.log(`📊 Found ${activeVendors.length} active vendors`);
    
    if (activeVendors.length > 0) {
      console.log('Vendors:');
      activeVendors.forEach((v, i) => {
        console.log(`  ${i+1}. ${v.userId?.firstName} ${v.userId?.lastName} - Categories: ${v.serviceCategories?.join(', ')}`);
      });
    }

    // Test auto-assignment
    console.log('🤖 Testing auto-assignment...');
    const result = await VendorAssignmentService.autoAssignJob(job._id);
    
    console.log('✅ Auto-assignment successful!');
    console.log(`👤 Assigned to: ${result.assignedVendor.userId?.firstName} ${result.assignedVendor.userId?.lastName}`);
    console.log(`📈 Score: ${result.assignedVendor.totalScore}`);
    console.log(`💡 Reason: ${result.assignedVendor.recommendationReason}`);

  } catch (error) {
    console.error('❌ Error during auto-assignment test:', error);
    console.error('Full error:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAutoAssign();