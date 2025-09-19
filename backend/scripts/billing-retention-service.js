/**
 * Billing Data Retention Service
 * 
 * This service automatically runs billing data cleanup at scheduled intervals
 * to maintain the 2-year retention policy for billing records.
 * 
 * Can be used with:
 * - Node.js cron jobs
 * - System cron jobs
 * - Docker scheduled containers
 * - Cloud scheduling services (AWS CloudWatch Events, etc.)
 */

const cron = require('node-cron');
const { main: runCleanup } = require('./cleanup-old-billing-data');

class BillingRetentionService {
  constructor() {
    this.isRunning = false;
    this.lastRunTime = null;
    this.runCount = 0;
  }

  async executeCleanup() {
    if (this.isRunning) {
      console.log('⚠️  Cleanup already in progress, skipping this run');
      return;
    }

    try {
      this.isRunning = true;
      this.runCount++;
      
      console.log(`\n🧹 SCHEDULED BILLING CLEANUP #${this.runCount}`);
      console.log(`📅 Started at: ${new Date().toISOString()}`);
      
      // Set environment to ensure live deletion (not dry run)
      process.env.DRY_RUN = 'false';
      
      await runCleanup();
      
      this.lastRunTime = new Date();
      console.log(`✅ Scheduled cleanup completed at: ${this.lastRunTime.toISOString()}`);
      
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  startScheduledCleanup() {
    console.log('🚀 Starting Billing Data Retention Service');
    console.log('📅 Schedule: Monthly on the 1st at 2:00 AM');
    
    // Run monthly on the 1st day at 2:00 AM
    // Cron format: minute hour day month dayOfWeek
    cron.schedule('0 2 1 * *', async () => {
      await this.executeCleanup();
    });

    // Optional: Run weekly for testing (commented out)
    // cron.schedule('0 2 * * 0', async () => {  // Every Sunday at 2 AM
    //   await this.executeCleanup();
    // });

    console.log('✅ Billing retention service started');
    console.log('📊 Status endpoint available at: /api/billing-retention/status');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      runCount: this.runCount,
      nextScheduledRun: this.getNextScheduledRun(),
      retentionPeriod: '2 years',
      schedule: 'Monthly on 1st at 2:00 AM'
    };
  }

  getNextScheduledRun() {
    const now = new Date();
    const nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0);
    
    // If we're past this month's run, move to next month
    if (now.getDate() > 1 || (now.getDate() === 1 && now.getHours() >= 2)) {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }
    
    return nextRun.toISOString();
  }

  // Manual trigger for admin use
  async triggerManualCleanup() {
    console.log('🔧 Manual cleanup triggered by admin');
    await this.executeCleanup();
  }
}

// Create singleton instance
const retentionService = new BillingRetentionService();

// Export for use in server
module.exports = retentionService;

// If run directly, start the service
if (require.main === module) {
  retentionService.startScheduledCleanup();
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Billing Retention Service...');
    process.exit(0);
  });
  
  // Log status every hour for monitoring
  setInterval(() => {
    const status = retentionService.getStatus();
    console.log(`📊 Service Status: Running=${status.isRunning}, Last Run=${status.lastRunTime || 'Never'}, Next=${status.nextScheduledRun}`);
  }, 60 * 60 * 1000); // Every hour
}