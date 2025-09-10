const mongoose = require('mongoose');
require('dotenv').config();

async function fixCancelledMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const { CustomerMembership } = require('../models/CustomerMembership');
    
    console.log('🛠️  FIXING CANCELLED MEMBERSHIPS');
    console.log('=================================');
    console.log('');
    
    // Find memberships that have cancelledAt but status is still ACTIVE
    const membershipsToFix = await CustomerMembership.find({
      cancelledAt: { $exists: true },
      status: 'ACTIVE'
    });
    
    console.log(`🔍 Found ${membershipsToFix.length} memberships to fix`);
    console.log('');
    
    for (const membership of membershipsToFix) {
      console.log(`🔧 Fixing membership for customer: ${membership.customer}`);
      console.log(`   Current status: ${membership.status}`);
      console.log(`   Cancelled at: ${membership.cancelledAt}`);
      console.log(`   End date: ${membership.endDate}`);
      
      // Update to CANCELLED status with proper fields
      membership.status = 'CANCELLED';
      membership.autoRenew = false;
      membership.willExpireAt = membership.endDate;
      membership.cancellationReason = 'Retrospective status fix - was cancelled but status not updated';
      
      await membership.save();
      
      console.log(`   ✅ Updated status to: ${membership.status}`);
      console.log(`   ✅ Will expire at: ${membership.willExpireAt}`);
      console.log('');
    }
    
    console.log(`✅ Fixed ${membershipsToFix.length} memberships`);
    console.log('🎯 All cancelled memberships now show CANCELLED status');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCancelledMemberships();
