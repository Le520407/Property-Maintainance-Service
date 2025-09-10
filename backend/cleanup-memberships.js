const mongoose = require('mongoose');
require('./config/database');
const { CustomerMembership } = require('./models/CustomerMembership');
const dotenv = require('dotenv');

dotenv.config();

async function cleanupMemberships() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swift-fix-pro');
    console.log('✅ Connected to MongoDB');

    // Get all users with memberships
    const allMemberships = await CustomerMembership.find({})
      .populate('customer', 'email firstName lastName')
      .populate('tier')
      .sort({ customer: 1, createdAt: -1 }); // Sort by customer, then newest first

    console.log(`📋 Found ${allMemberships.length} total memberships`);

    // Group memberships by user
    const membershipsByUser = {};
    for (const membership of allMemberships) {
      const userEmail = membership.customer.email;
      if (!membershipsByUser[userEmail]) {
        membershipsByUser[userEmail] = [];
      }
      membershipsByUser[userEmail].push(membership);
    }

    console.log(`👥 Found ${Object.keys(membershipsByUser).length} unique users with memberships`);

    let totalCleaned = 0;
    let totalKept = 0;

    for (const [userEmail, memberships] of Object.entries(membershipsByUser)) {
      console.log(`\n👤 Processing ${userEmail} (${memberships.length} memberships)`);
      
      // Sort memberships: ACTIVE first, then PENDING, then by creation date (newest first)
      const sortedMemberships = memberships.sort((a, b) => {
        // Priority order: ACTIVE > PENDING > CANCELLED
        const statusPriority = { 'ACTIVE': 3, 'PENDING': 2, 'CANCELLED': 1 };
        const aPriority = statusPriority[a.status] || 0;
        const bPriority = statusPriority[b.status] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        // If same status, newest first
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // Keep the highest priority membership (first in sorted list)
      const membershipToKeep = sortedMemberships[0];
      const membershipsToRemove = sortedMemberships.slice(1);

      // If the membership to keep is CANCELLED, make it ACTIVE
      if (membershipToKeep.status === 'CANCELLED') {
        console.log(`🔄 Reactivating ${membershipToKeep.tier.displayName} for ${userEmail}`);
        membershipToKeep.status = 'ACTIVE';
        await membershipToKeep.save();
      }

      console.log(`✅ Keeping: ${membershipToKeep.tier.displayName} (${membershipToKeep.billingCycle}) - Status: ${membershipToKeep.status} - Created: ${membershipToKeep.createdAt.toISOString().split('T')[0]}`);
      totalKept++;

      // Remove all other memberships
      for (const membership of membershipsToRemove) {
        console.log(`❌ Removing: ${membership.tier.displayName} (${membership.billingCycle}) - Status: ${membership.status} - Created: ${membership.createdAt.toISOString().split('T')[0]}`);
        await CustomerMembership.findByIdAndDelete(membership._id);
        totalCleaned++;
      }
    }

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`✅ Kept: ${totalKept} memberships (1 per user)`);
    console.log(`❌ Removed: ${totalCleaned} duplicate memberships`);
    console.log(`👥 Total users: ${Object.keys(membershipsByUser).length}`);

    // Verify the cleanup
    console.log('\n🔍 Verification - Final membership state:');
    const finalMemberships = await CustomerMembership.find({})
      .populate('customer', 'email')
      .populate('tier')
      .sort({ 'customer.email': 1 });

    finalMemberships.forEach(membership => {
      console.log(`- ${membership.customer.email}: ${membership.tier.displayName} (${membership.billingCycle}) - Status: ${membership.status}`);
    });

    // Check for any users with multiple memberships
    const finalMembershipsByUser = {};
    for (const membership of finalMemberships) {
      const userEmail = membership.customer.email;
      if (!finalMembershipsByUser[userEmail]) {
        finalMembershipsByUser[userEmail] = 0;
      }
      finalMembershipsByUser[userEmail]++;
    }

    const usersWithMultiple = Object.entries(finalMembershipsByUser).filter(([email, count]) => count > 1);
    if (usersWithMultiple.length > 0) {
      console.log('\n⚠️ Users still with multiple memberships:');
      usersWithMultiple.forEach(([email, count]) => {
        console.log(`- ${email}: ${count} memberships`);
      });
    } else {
      console.log('\n✅ SUCCESS: All users now have exactly one membership!');
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('💥 Error:', error);
    await mongoose.disconnect();
  }
}

cleanupMemberships();
