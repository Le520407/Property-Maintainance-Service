const { CustomerSubscription } = require('../models/CustomerSubscription');

class SocialImpactService {
  
  static async calculateGlobalImpact() {
    try {
      const globalStats = await CustomerSubscription.aggregate([
        { $match: { status: 'ACTIVE' } },
        {
          $group: {
            _id: null,
            totalActiveSubscriptions: { $sum: 1 },
            totalPaidServices: { $sum: '$socialImpactContribution.paidServicesCount' },
            totalFreeServicesEarned: { $sum: '$socialImpactContribution.freeServicesEarned' },
            totalFreeServicesUsed: { $sum: '$socialImpactContribution.freeServicesUsed' },
            totalMonthlyRevenue: { $sum: '$monthlyPrice' },
            totalContribution: { $sum: '$socialImpactContribution.totalContribution' }
          }
        }
      ]);

      const stats = globalStats[0] || {
        totalActiveSubscriptions: 0,
        totalPaidServices: 0,
        totalFreeServicesEarned: 0,
        totalFreeServicesUsed: 0,
        totalMonthlyRevenue: 0,
        totalContribution: 0
      };

      return {
        ...stats,
        availableFreeServices: stats.totalFreeServicesEarned - stats.totalFreeServicesUsed,
        impactRatio: stats.totalPaidServices > 0 ? (stats.totalFreeServicesEarned / stats.totalPaidServices) * 100 : 0,
        averageContributionPerSubscriber: stats.totalActiveSubscriptions > 0 ? 
          stats.totalContribution / stats.totalActiveSubscriptions : 0
      };
    } catch (error) {
      console.error('Error calculating global impact:', error);
      throw new Error('Failed to calculate global social impact');
    }
  }

  static async getSubscriptionImpactBreakdown() {
    try {
      const breakdown = await CustomerSubscription.aggregate([
        { $match: { status: 'ACTIVE' } },
        {
          $group: {
            _id: '$propertyType',
            count: { $sum: 1 },
            totalPaidServices: { $sum: '$socialImpactContribution.paidServicesCount' },
            totalFreeServicesEarned: { $sum: '$socialImpactContribution.freeServicesEarned' },
            totalFreeServicesUsed: { $sum: '$socialImpactContribution.freeServicesUsed' },
            totalRevenue: { $sum: '$socialImpactContribution.totalContribution' },
            averageMonthlyPrice: { $avg: '$monthlyPrice' }
          }
        },
        {
          $addFields: {
            availableFreeServices: { $subtract: ['$totalFreeServicesEarned', '$totalFreeServicesUsed'] },
            impactRatio: {
              $cond: {
                if: { $gt: ['$totalPaidServices', 0] },
                then: { $multiply: [{ $divide: ['$totalFreeServicesEarned', '$totalPaidServices'] }, 100] },
                else: 0
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return breakdown.map(item => ({
        propertyType: item._id,
        subscriptionCount: item.count,
        totalPaidServices: item.totalPaidServices,
        totalFreeServicesEarned: item.totalFreeServicesEarned,
        totalFreeServicesUsed: item.totalFreeServicesUsed,
        availableFreeServices: item.availableFreeServices,
        totalRevenue: item.totalRevenue,
        averageMonthlyPrice: Math.round(item.averageMonthlyPrice * 100) / 100,
        impactRatio: Math.round(item.impactRatio * 100) / 100
      }));
    } catch (error) {
      console.error('Error getting subscription impact breakdown:', error);
      throw new Error('Failed to get subscription impact breakdown');
    }
  }

  static async getUserSocialImpact(userId) {
    try {
      const subscription = await CustomerSubscription.findOne({
        customer: userId,
        status: 'ACTIVE'
      });

      if (!subscription) {
        return {
          hasSubscription: false,
          message: 'No active subscription found'
        };
      }

      const {
        paidServicesCount,
        freeServicesEarned,
        freeServicesUsed,
        totalContribution
      } = subscription.socialImpactContribution;

      return {
        hasSubscription: true,
        propertyType: subscription.propertyType,
        monthlyPrice: subscription.monthlyPrice,
        socialImpact: {
          paidServicesCount,
          freeServicesEarned,
          freeServicesUsed,
          availableFreeServices: freeServicesEarned - freeServicesUsed,
          totalContribution,
          nextFreeServiceAt: paidServicesCount + (10 - (paidServicesCount % 10)),
          progressToNextFree: paidServicesCount % 10,
          impactPercentage: paidServicesCount > 0 ? (freeServicesEarned / paidServicesCount) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Error getting user social impact:', error);
      throw new Error('Failed to get user social impact data');
    }
  }

  static async recordServiceUsage(subscriptionId, isPayment = true) {
    try {
      const subscription = await CustomerSubscription.findById(subscriptionId);
      
      if (!subscription || subscription.status !== 'ACTIVE') {
        throw new Error('Invalid or inactive subscription');
      }

      if (isPayment) {
        subscription.addPaidService();
        await subscription.save();
        
        return {
          success: true,
          message: 'Paid service recorded successfully',
          socialImpact: subscription.socialImpactContribution,
          newFreeServiceEarned: subscription.socialImpactContribution.paidServicesCount % 10 === 0
        };
      } else {
        const canUse = subscription.useFreeService();
        
        if (!canUse) {
          return {
            success: false,
            message: 'No free services available',
            socialImpact: subscription.socialImpactContribution
          };
        }
        
        await subscription.save();
        
        return {
          success: true,
          message: 'Free service used successfully',
          socialImpact: subscription.socialImpactContribution
        };
      }
    } catch (error) {
      console.error('Error recording service usage:', error);
      throw new Error('Failed to record service usage');
    }
  }

  static async getTopContributors(limit = 10) {
    try {
      const topContributors = await CustomerSubscription.aggregate([
        { $match: { status: 'ACTIVE' } },
        {
          $lookup: {
            from: 'users',
            localField: 'customer',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        { $unwind: '$customerInfo' },
        {
          $project: {
            customerName: '$customerInfo.name',
            customerEmail: '$customerInfo.email',
            propertyType: 1,
            monthlyPrice: 1,
            paidServicesCount: '$socialImpactContribution.paidServicesCount',
            freeServicesEarned: '$socialImpactContribution.freeServicesEarned',
            totalContribution: '$socialImpactContribution.totalContribution'
          }
        },
        { $sort: { totalContribution: -1 } },
        { $limit: limit }
      ]);

      return topContributors;
    } catch (error) {
      console.error('Error getting top contributors:', error);
      throw new Error('Failed to get top contributors');
    }
  }

  static async getMonthlyTrends(months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const trends = await CustomerSubscription.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate },
            status: 'ACTIVE'
          } 
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            newSubscriptions: { $sum: 1 },
            monthlyRevenue: { $sum: '$monthlyPrice' },
            totalPaidServices: { $sum: '$socialImpactContribution.paidServicesCount' },
            totalFreeServices: { $sum: '$socialImpactContribution.freeServicesEarned' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return trends.map(trend => ({
        year: trend._id.year,
        month: trend._id.month,
        monthName: new Date(trend._id.year, trend._id.month - 1).toLocaleString('default', { month: 'long' }),
        newSubscriptions: trend.newSubscriptions,
        monthlyRevenue: trend.monthlyRevenue,
        totalPaidServices: trend.totalPaidServices,
        totalFreeServices: trend.totalFreeServices,
        socialImpactRatio: trend.totalPaidServices > 0 ? 
          Math.round((trend.totalFreeServices / trend.totalPaidServices) * 100) : 0
      }));
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      throw new Error('Failed to get monthly trends');
    }
  }

}

module.exports = SocialImpactService;