#!/usr/bin/env node

/**
 * Membership Expiration Cron Job
 * 
 * This script should be run daily to automatically expire cancelled memberships
 * that have passed their end date.
 * 
 * Usage:
 *   node scripts/expire-memberships.js
 * 
 * Cron job example (run daily at 2 AM):
 *   0 2 * * * cd /path/to/project && node scripts/expire-memberships.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const MembershipExpirationService = require('../services/membershipExpirationService');

async function runExpirationJob() {
  try {
    console.log('🚀 Starting membership expiration job...');
    console.log('📅 Date:', new Date().toISOString());
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get current stats
    console.log('\n📊 Current membership statistics:');
    const statsBefore = await MembershipExpirationService.getExpirationStats();
    if (statsBefore) {
      console.log(`   Active: ${statsBefore.active}`);
      console.log(`   Cancelled (with access): ${statsBefore.cancelledWithAccess}`);
      console.log(`   Cancelled (expired): ${statsBefore.cancelledExpired}`);
      console.log(`   Expiring soon (7 days): ${statsBefore.expiringSoon}`);
      console.log(`   Total: ${statsBefore.total}`);
    }
    
    // Process expirations
    console.log('\n🔄 Processing membership expirations...');
    const result = await MembershipExpirationService.processExpiredMemberships();
    
    if (result.success) {
      console.log(`✅ Job completed successfully`);
      console.log(`   Memberships checked: ${result.processed}`);
      console.log(`   Memberships expired: ${result.expired}`);
    } else {
      console.error(`❌ Job failed: ${result.error}`);
      process.exit(1);
    }
    
    // Get updated stats
    console.log('\n📊 Updated membership statistics:');
    const statsAfter = await MembershipExpirationService.getExpirationStats();
    if (statsAfter) {
      console.log(`   Active: ${statsAfter.active}`);
      console.log(`   Cancelled (with access): ${statsAfter.cancelledWithAccess}`);
      console.log(`   Cancelled (expired): ${statsAfter.cancelledExpired}`);
      console.log(`   Expiring soon (7 days): ${statsAfter.expiringSoon}`);
      console.log(`   Total: ${statsAfter.total}`);
    }
    
    // Show upcoming expirations
    console.log('\n🔮 Memberships expiring in the next 7 days:');
    const expiringSoon = await MembershipExpirationService.findMembershipsExpiringSoon(7);
    if (expiringSoon.length > 0) {
      expiringSoon.forEach(membership => {
        const daysLeft = Math.ceil((membership.endDate - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`   ${membership.customer.email} - ${membership.tier.displayName} (${daysLeft} days left)`);
      });
    } else {
      console.log('   No memberships expiring soon');
    }
    
    console.log('\n🎯 Membership expiration job completed!');
    
  } catch (error) {
    console.error('❌ Membership expiration job failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the job
if (require.main === module) {
  runExpirationJob();
}

module.exports = { runExpirationJob };
