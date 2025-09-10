const mongoose = require('mongoose');
require('dotenv').config();

async function checkUser1Status() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('../models/User');
    const { CustomerMembership } = require('../models/CustomerMembership');
    
    console.log('🔍 SEARCHING FOR USER1...');
    console.log('==========================');
    
    // Search for user1 by different possible identifiers
    const searchQueries = [
      { email: 'user1@gmail.com' },
      { email: 'user1@example.com' },
      { username: 'user1' },
      { email: { $regex: /^user1/i } },
      { name: { $regex: /user1/i } }
    ];
    
    let user = null;
    for (const query of searchQueries) {
      user = await User.findOne(query);
      if (user) {
        console.log(`✅ Found user with query:`, query);
        break;
      }
    }
    
    if (!user) {
      console.log('❌ User1 not found with common identifiers');
      console.log('');
      console.log('🔍 Let me search for users with similar names...');
      
      const similarUsers = await User.find({
        $or: [
          { email: { $regex: /user/i } },
          { name: { $regex: /user/i } },
          { username: { $regex: /user/i } }
        ]
      }).select('_id email name username role createdAt').limit(10);
      
      if (similarUsers.length > 0) {
        console.log('📋 Found similar users:');
        similarUsers.forEach((u, i) => {
          console.log(`${i + 1}. ID: ${u._id}`);
          console.log(`   Email: ${u.email}`);
          console.log(`   Name: ${u.name || 'N/A'}`);
          console.log(`   Username: ${u.username || 'N/A'}`);
          console.log(`   Role: ${u.role}`);
          console.log(`   Created: ${u.createdAt}`);
          console.log('   ---');
        });
      } else {
        console.log('❌ No users found with "user" in their details');
      }
      
      await mongoose.disconnect();
      return;
    }
    
    console.log('👤 USER DETAILS:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Username: ${user.username || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('');
    
    // Find all memberships for this user
    const memberships = await CustomerMembership.find({ customer: user._id })
      .populate('tier', 'name displayName')
      .select('status hitpayRecurringBillingId hitpayPlanId paymentMethod cancelledAt endDate startDate createdAt billingCycle autoRenew')
      .sort({ createdAt: -1 });
    
    console.log('📊 SUBSCRIPTION STATUS:');
    console.log('========================');
    
    if (memberships.length === 0) {
      console.log('❌ No memberships found for this user');
      console.log('💡 This user has never subscribed to any plan');
    } else {
      console.log(`✅ Found ${memberships.length} membership(s):`);
      console.log('');
      
      memberships.forEach((membership, i) => {
        console.log(`${i + 1}. MEMBERSHIP #${i + 1}:`);
        console.log(`   Status: ${membership.status}`);
        console.log(`   Tier: ${membership.tier?.displayName || membership.tier?.name || 'Unknown'}`);
        console.log(`   Payment Method: ${membership.paymentMethod}`);
        console.log(`   Billing Cycle: ${membership.billingCycle}`);
        console.log(`   Auto Renew: ${membership.autoRenew}`);
        console.log(`   Start Date: ${membership.startDate || 'N/A'}`);
        console.log(`   End Date: ${membership.endDate || 'N/A'}`);
        console.log(`   Cancelled At: ${membership.cancelledAt || 'N/A'}`);
        console.log(`   HitPay Billing ID: ${membership.hitpayRecurringBillingId || 'N/A'}`);
        console.log(`   HitPay Plan ID: ${membership.hitpayPlanId || 'N/A'}`);
        console.log(`   Created: ${membership.createdAt}`);
        
        // Determine current status
        if (membership.status === 'ACTIVE') {
          console.log(`   🟢 CURRENT STATUS: ACTIVE - User has full access`);
        } else if (membership.status === 'CANCELLED') {
          const now = new Date();
          const endDate = new Date(membership.endDate);
          if (now < endDate) {
            console.log(`   🟠 CURRENT STATUS: CANCELLED - User still has access until ${endDate.toLocaleDateString()}`);
          } else {
            console.log(`   🔴 CURRENT STATUS: CANCELLED & EXPIRED - No access since ${endDate.toLocaleDateString()}`);
          }
        } else if (membership.status === 'EXPIRED') {
          console.log(`   🔴 CURRENT STATUS: EXPIRED - No access`);
        } else if (membership.status === 'PENDING') {
          console.log(`   🔵 CURRENT STATUS: PENDING - Waiting for activation`);
        } else {
          console.log(`   ⚪ CURRENT STATUS: ${membership.status}`);
        }
        
        console.log('   ---');
      });
      
      // Show current active membership
      const activeMembership = memberships.find(m => m.status === 'ACTIVE');
      const cancelledWithAccess = memberships.find(m => 
        m.status === 'CANCELLED' && 
        m.endDate && 
        new Date() < new Date(m.endDate)
      );
      
      console.log('🎯 SUMMARY:');
      if (activeMembership) {
        console.log(`✅ User1 has an ACTIVE ${activeMembership.tier?.displayName || 'membership'}`);
        console.log(`📅 Next billing: ${activeMembership.endDate ? new Date(activeMembership.endDate).toLocaleDateString() : 'N/A'}`);
      } else if (cancelledWithAccess) {
        console.log(`⚠️ User1 has a CANCELLED membership but still has access until ${new Date(cancelledWithAccess.endDate).toLocaleDateString()}`);
        console.log(`🚫 No more charges will be taken`);
      } else {
        console.log(`❌ User1 has NO ACTIVE subscription`);
        const latestMembership = memberships[0];
        if (latestMembership) {
          console.log(`📅 Last membership: ${latestMembership.status} (${latestMembership.tier?.displayName || 'Unknown'})`);
        }
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser1Status();
