const membershipService = require('../services/membershipService');
const { CustomerMembership } = require('../models/CustomerMembership');

class MembershipUpgradeService {
  
  /**
   * Calculate refund amount for unused time on current membership
   */
  static calculateRefund(currentMembership) {
    const now = new Date();
    const endDate = new Date(currentMembership.endDate || currentMembership.nextBillingDate);
    const startDate = new Date(currentMembership.startDate);
    
    if (endDate <= now) {
      return 0; // No refund if membership already expired
    }
    
    // Calculate total period in days
    const totalPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Calculate unused period in days
    const unusedDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    // Calculate refund amount
    const paidAmount = currentMembership.currentPrice || currentMembership.monthlyPrice;
    const refundAmount = Math.round((paidAmount * unusedDays / totalPeriodDays) * 100) / 100;
    
    return Math.max(0, refundAmount);
  }
  
  /**
   * Calculate the net amount to charge for plan change
   */
  static calculatePlanChangeAmount(currentMembership, newTier, billingCycle) {
    const refundAmount = this.calculateRefund(currentMembership);
    const newAmount = billingCycle === 'YEARLY' ? newTier.yearlyPrice : newTier.monthlyPrice;
    
    // Net amount = New plan cost - Refund from old plan
    const netAmount = Math.max(0, newAmount - refundAmount);
    
    return {
      newPlanAmount: newAmount,
      refundAmount: refundAmount,
      netAmount: netAmount,
      isUpgrade: newAmount > (currentMembership.currentPrice || currentMembership.monthlyPrice),
      needsPayment: netAmount > 0,
      refundToCustomer: netAmount < 0 ? Math.abs(netAmount) : 0
    };
  }
  
  /**
   * Cancel existing membership and clean up
   */
  static async cancelExistingMembership(userId, reason = 'PLAN_CHANGE') {
    try {
      // Find all active/pending memberships for user
      const existingMemberships = await CustomerMembership.find({
        customer: userId,
        status: { $in: ['ACTIVE', 'PENDING', 'SUSPENDED'] }
      });
      
      const results = [];
      
      for (const membership of existingMemberships) {
        // Calculate refund if membership is ACTIVE
        const refundAmount = membership.status === 'ACTIVE' 
          ? this.calculateRefund(membership) 
          : 0;
        
        // Update membership status
        membership.status = 'CANCELLED';
        membership.cancellationReason = reason;
        membership.cancellationDate = new Date();
        membership.refundAmount = refundAmount;
        membership.endDate = new Date(); // End immediately
        
        await membership.save();
        
        results.push({
          membershipId: membership._id,
          refundAmount: refundAmount,
          originalAmount: membership.currentPrice || membership.monthlyPrice,
          tier: membership.tier
        });
        
        console.log(`✅ Cancelled membership ${membership._id}, refund: $${refundAmount}`);
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Error cancelling existing memberships:', error);
      throw error;
    }
  }
  
  /**
   * Process payment refund (placeholder for actual refund logic)
   */
  static async processRefund(membership, refundAmount) {
    // TODO: Implement actual refund logic with HitPay or payment processor
    console.log(`💰 Processing refund of $${refundAmount} for membership ${membership._id}`);
    
    // For now, just log the refund
    // In production, you would:
    // 1. Call HitPay refund API
    // 2. Create refund record
    // 3. Send notification to customer
    
    return {
      success: true,
      refundId: `refund_${Date.now()}`,
      amount: refundAmount,
      status: 'PROCESSED'
    };
  }
}

module.exports = MembershipUpgradeService;
