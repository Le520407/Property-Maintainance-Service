const { CustomerMembership } = require('../models/CustomerMembership');

/**
 * Background job to automatically expire cancelled memberships
 * This should be run periodically (e.g., daily) to check for memberships that have passed their end date
 */
class MembershipExpirationService {
  
  /**
   * Find and expire cancelled memberships that have reached their end date
   */
  static async processExpiredMemberships() {
    try {
      const now = new Date();
      console.log('🔍 Checking for expired cancelled memberships...');
      
      // Find cancelled memberships where the end date has passed
      const expiredMemberships = await CustomerMembership.find({
        status: 'CANCELLED',
        endDate: { $lte: now }
      }).populate('tier customer');
      
      console.log(`📊 Found ${expiredMemberships.length} cancelled memberships to expire`);
      
      let expiredCount = 0;
      
      for (const membership of expiredMemberships) {
        try {
          // Update status to EXPIRED
          membership.status = 'EXPIRED';
          membership.autoRenew = false;
          
          // Add expiration tracking
          if (!membership.expiredAt) {
            membership.expiredAt = now;
          }
          
          await membership.save();
          
          console.log(`✅ Expired membership for customer ${membership.customer.email} - ${membership.tier.displayName}`);
          console.log(`   - Was cancelled on: ${membership.cancelledAt?.toLocaleDateString()}`);
          console.log(`   - Period ended on: ${membership.endDate.toLocaleDateString()}`);
          console.log(`   - Now expired: ${now.toLocaleDateString()}`);
          
          expiredCount++;
          
        } catch (membershipError) {
          console.error(`❌ Failed to expire membership ${membership._id}:`, membershipError.message);
        }
      }
      
      if (expiredCount > 0) {
        console.log(`🎯 Successfully expired ${expiredCount} memberships`);
      } else {
        console.log('✅ No memberships needed expiration');
      }
      
      return {
        success: true,
        processed: expiredMemberships.length,
        expired: expiredCount
      };
      
    } catch (error) {
      console.error('❌ Error processing membership expirations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Find memberships that will expire soon (for notifications)
   */
  static async findMembershipsExpiringSoon(daysAhead = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      const expiringSoon = await CustomerMembership.find({
        status: 'CANCELLED',
        endDate: { 
          $gte: new Date(), // Not yet expired
          $lte: futureDate  // Will expire within specified days
        }
      }).populate('tier customer');
      
      return expiringSoon;
      
    } catch (error) {
      console.error('❌ Error finding expiring memberships:', error);
      return [];
    }
  }
  
  /**
   * Get membership expiration statistics
   */
  static async getExpirationStats() {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      
      const [
        activeMemberships,
        cancelledWithAccess,
        cancelledExpired,
        expiringSoon
      ] = await Promise.all([
        CustomerMembership.countDocuments({ status: 'ACTIVE' }),
        CustomerMembership.countDocuments({ 
          status: 'CANCELLED', 
          endDate: { $gt: now } 
        }),
        CustomerMembership.countDocuments({ 
          status: 'CANCELLED', 
          endDate: { $lte: now } 
        }),
        CustomerMembership.countDocuments({ 
          status: 'CANCELLED',
          endDate: { $gte: now, $lte: oneWeekFromNow }
        })
      ]);
      
      return {
        active: activeMemberships,
        cancelledWithAccess: cancelledWithAccess,
        cancelledExpired: cancelledExpired,
        expiringSoon: expiringSoon,
        total: activeMemberships + cancelledWithAccess + cancelledExpired
      };
      
    } catch (error) {
      console.error('❌ Error getting expiration stats:', error);
      return null;
    }
  }
}

module.exports = MembershipExpirationService;
