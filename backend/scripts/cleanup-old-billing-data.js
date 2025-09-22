/**
 * Billing Data Cleanup Script
 * 
 * This script removes billing records older than 2 years from the database
 * to keep billing history manageable and comply with data retention policies.
 * 
 * Data sources cleaned:
 * - CustomerMembership records
 * - CustomerSubscription billing history entries
 * - Order records (service payments)
 * - Job records (service payments)
 * 
 * Usage: node cleanup-old-billing-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { CustomerMembership } = require('../models/CustomerMembership');
const { CustomerSubscription } = require('../models/CustomerSubscription');
const Order = require('../models/Order');
const Job = require('../models/Job');

// Configuration
const RETENTION_YEARS = 2;
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set DRY_RUN=true to preview without deleting

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

function getRetentionCutoffDate() {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - RETENTION_YEARS);
  return cutoffDate;
}

async function cleanupCustomerMemberships(cutoffDate) {
  console.log('\n📋 Cleaning up CustomerMembership records...');
  
  try {
    // Find old membership records
    const oldMemberships = await CustomerMembership.find({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['EXPIRED', 'CANCELLED'] } // Only remove expired/cancelled memberships
    });

    console.log(`Found ${oldMemberships.length} old membership records to remove`);
    
    if (oldMemberships.length > 0) {
      for (const membership of oldMemberships) {
        console.log(`  - Membership ${membership._id} (${membership.tier?.name || 'Unknown'}) created: ${membership.createdAt.toDateString()}`);
      }

      if (!DRY_RUN) {
        const result = await CustomerMembership.deleteMany({
          _id: { $in: oldMemberships.map(m => m._id) }
        });
        console.log(`✅ Deleted ${result.deletedCount} old membership records`);
      } else {
        console.log('🔍 DRY RUN: Would delete these membership records');
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up CustomerMembership records:', error);
  }
}

async function cleanupSubscriptionBillingHistory(cutoffDate) {
  console.log('\n📋 Cleaning up CustomerSubscription billing history...');
  
  try {
    // Find subscriptions with old billing history entries
    const subscriptions = await CustomerSubscription.find({
      'billingHistory.createdAt': { $lt: cutoffDate }
    });

    console.log(`Found ${subscriptions.length} subscriptions with old billing history`);
    
    let totalEntriesRemoved = 0;

    for (const subscription of subscriptions) {
      const originalCount = subscription.billingHistory.length;
      
      // Filter out old billing history entries
      subscription.billingHistory = subscription.billingHistory.filter(
        entry => new Date(entry.createdAt) >= cutoffDate
      );
      
      const removedCount = originalCount - subscription.billingHistory.length;
      totalEntriesRemoved += removedCount;
      
      if (removedCount > 0) {
        console.log(`  - Subscription ${subscription._id}: Removing ${removedCount} old billing entries`);
        
        if (!DRY_RUN) {
          await subscription.save();
        }
      }
    }

    if (!DRY_RUN) {
      console.log(`✅ Removed ${totalEntriesRemoved} old billing history entries from subscriptions`);
    } else {
      console.log(`🔍 DRY RUN: Would remove ${totalEntriesRemoved} billing history entries`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up subscription billing history:', error);
  }
}

async function cleanupOrderRecords(cutoffDate) {
  console.log('\n📋 Cleaning up Order records...');
  
  try {
    // Find old order records
    const oldOrders = await Order.find({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['COMPLETED', 'CANCELLED', 'REFUNDED'] } // Only remove completed/cancelled orders
    });

    console.log(`Found ${oldOrders.length} old order records to remove`);
    
    if (oldOrders.length > 0) {
      for (const order of oldOrders) {
        console.log(`  - Order ${order.orderNumber || order._id} (${order.status}) created: ${order.createdAt.toDateString()}, Amount: $${order.total || order.totalAmount || 0}`);
      }

      if (!DRY_RUN) {
        const result = await Order.deleteMany({
          _id: { $in: oldOrders.map(o => o._id) }
        });
        console.log(`✅ Deleted ${result.deletedCount} old order records`);
      } else {
        console.log('🔍 DRY RUN: Would delete these order records');
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up Order records:', error);
  }
}

async function cleanupJobRecords(cutoffDate) {
  console.log('\n📋 Cleaning up Job records...');
  
  try {
    // Find old job records
    const oldJobs = await Job.find({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['COMPLETED', 'CANCELLED', 'PAID'] } // Only remove completed/cancelled/paid jobs
    });

    console.log(`Found ${oldJobs.length} old job records to remove`);
    
    if (oldJobs.length > 0) {
      for (const job of oldJobs) {
        console.log(`  - Job ${job.jobNumber || job._id} (${job.status}) created: ${job.createdAt.toDateString()}, Amount: $${job.totalAmount || 0}`);
      }

      if (!DRY_RUN) {
        const result = await Job.deleteMany({
          _id: { $in: oldJobs.map(j => j._id) }
        });
        console.log(`✅ Deleted ${result.deletedCount} old job records`);
      } else {
        console.log('🔍 DRY RUN: Would delete these job records');
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning up Job records:', error);
  }
}

async function generateCleanupReport(cutoffDate) {
  console.log('\n📊 CLEANUP SUMMARY REPORT');
  console.log('='.repeat(50));
  console.log(`📅 Retention Period: ${RETENTION_YEARS} years`);
  console.log(`📅 Cutoff Date: ${cutoffDate.toDateString()}`);
  console.log(`📅 Current Date: ${new Date().toDateString()}`);
  console.log(`🔧 Mode: ${DRY_RUN ? 'DRY RUN (Preview Only)' : 'LIVE DELETION'}`);
  
  try {
    // Count records that would be affected
    const oldMemberships = await CustomerMembership.countDocuments({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['EXPIRED', 'CANCELLED'] }
    });

    const subscriptionsWithOldHistory = await CustomerSubscription.countDocuments({
      'billingHistory.createdAt': { $lt: cutoffDate }
    });

    const oldOrders = await Order.countDocuments({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['COMPLETED', 'CANCELLED', 'REFUNDED'] }
    });

    const oldJobs = await Job.countDocuments({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['COMPLETED', 'CANCELLED', 'PAID'] }
    });

    console.log(`\n📈 Records to be cleaned:`);
    console.log(`   • CustomerMembership: ${oldMemberships} records`);
    console.log(`   • CustomerSubscription billing entries: ${subscriptionsWithOldHistory} subscriptions affected`);
    console.log(`   • Order records: ${oldOrders} records`);
    console.log(`   • Job records: ${oldJobs} records`);
    
    const totalRecords = oldMemberships + oldOrders + oldJobs;
    console.log(`\n🗃️  Total individual records to be removed: ${totalRecords}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no data was actually deleted');
      console.log('   To perform actual cleanup, run: DRY_RUN=false node cleanup-old-billing-data.js');
    } else {
      console.log('\n✅ Cleanup completed successfully');
    }
  } catch (error) {
    console.error('❌ Error generating cleanup report:', error);
  }
}

async function main() {
  console.log('🧹 BILLING DATA CLEANUP SCRIPT');
  console.log('='.repeat(50));
  console.log(`Starting ${DRY_RUN ? 'DRY RUN' : 'LIVE'} cleanup of billing data older than ${RETENTION_YEARS} years...`);
  
  await connectToDatabase();
  
  const cutoffDate = getRetentionCutoffDate();
  console.log(`📅 Cutoff date: ${cutoffDate.toDateString()}`);
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE: No data will be deleted, preview only');
  } else {
    console.log('\n⚠️  LIVE MODE: Data will be permanently deleted!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Perform cleanup operations
  await cleanupCustomerMemberships(cutoffDate);
  await cleanupSubscriptionBillingHistory(cutoffDate);
  await cleanupOrderRecords(cutoffDate);
  await cleanupJobRecords(cutoffDate);
  
  // Generate summary report
  await generateCleanupReport(cutoffDate);
  
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run the cleanup
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });
}

module.exports = { main, getRetentionCutoffDate };