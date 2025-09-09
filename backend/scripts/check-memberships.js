const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const CustomerMembership = require('../models/CustomerMembership');
const User = require('../models/User');

async function checkCurrentMemberships() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('🔗 Connected to MongoDB');

    // Find all customer memberships
    const memberships = await CustomerMembership.find({})
      .populate('customer', 'name email')
      .populate('tier', 'name displayName monthlyPrice')
      .sort({ createdAt: -1 });

    console.log(`\n📊 Found ${memberships.length} customer memberships:\n`);

    if (memberships.length === 0) {
      console.log('✅ No customer memberships found!');
      return;
    }

    memberships.forEach((membership, index) => {
      console.log(`${index + 1}. 👤 Customer: ${membership.customer?.name || 'Unknown'} (${membership.customer?.email || 'No email'})`);
      console.log(`   📅 Created: ${membership.createdAt?.toLocaleDateString()}`);
      console.log(`   🏆 Tier: ${membership.tier?.displayName || membership.tier?.name || 'Unknown'}`);
      console.log(`   💰 Price: $${membership.tier?.monthlyPrice || 'Unknown'}/month`);
      console.log(`   📊 Status: ${membership.status} (Active: ${membership.isActive})`);
      console.log(`   🔄 Auto Renew: ${membership.autoRenew}`);
      
      if (membership.startDate) {
        console.log(`   🚀 Start Date: ${membership.startDate.toLocaleDateString()}`);
      }
      if (membership.endDate) {
        console.log(`   🏁 End Date: ${membership.endDate.toLocaleDateString()}`);
      }
      if (membership.cancelledAt) {
        console.log(`   ❌ Cancelled: ${membership.cancelledAt.toLocaleDateString()}`);
      }
      
      console.log(`   🔗 Membership ID: ${membership._id}`);
      console.log('   ─────────────────────────────────────\n');
    });

    // Count by status
    const statusCounts = {};
    memberships.forEach(m => {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
    });

    console.log('\n📈 Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} memberships`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Function to manually activate a membership (for testing)
async function activateMembership(membershipId) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    
    const membership = await CustomerMembership.findById(membershipId);
    if (!membership) {
      console.log('❌ Membership not found');
      return;
    }

    if (membership.status === 'ACTIVE') {
      console.log(`✅ Membership is already ACTIVE`);
      return;
    }

    console.log(`🔄 Changing status from ${membership.status} to ACTIVE...`);

    // Manually activate membership
    membership.status = 'ACTIVE';
    membership.isActive = true;
    membership.startDate = new Date();
    
    // Set end date based on billing cycle (default 1 month)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    membership.endDate = endDate;

    await membership.save();
    console.log('✅ Membership manually activated!');
    console.log(`   Start Date: ${membership.startDate.toLocaleDateString()}`);
    console.log(`   End Date: ${membership.endDate.toLocaleDateString()}`);
    
  } catch (error) {
    console.error('❌ Error activating membership:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Check command line arguments
const command = process.argv[2];
const membershipId = process.argv[3];

if (command === 'activate' && membershipId) {
  activateMembership(membershipId);
} else {
  checkCurrentMemberships();
}
