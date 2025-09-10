const User = require('../models/User');
const PointsTransaction = require('../models/PointsTransaction');
const { Referral, Commission, REFERRAL_REWARDS } = require('../models/Referral');

class ReferralRewardService {
  
  /**
   * Process referral rewards when a user completes their first order/subscription
   * @param {string} userId - The user who completed the order/subscription
   * @param {string} orderId - The order/subscription ID
   * @param {number} orderAmount - The order amount
   * @param {string} eventType - 'order' or 'subscription'
   */
  async processReferralRewards(userId, orderId, orderAmount, eventType = 'order') {
    try {
      const user = await User.findById(userId).populate('referralChain.referrer');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if this is the user's first qualifying event
      const isFirstEvent = eventType === 'order' 
        ? !user.hasCompletedFirstOrder 
        : !user.hasCompletedFirstSubscription;
      
      if (!isFirstEvent) {
        console.log(`User ${userId} has already completed their first ${eventType}, no referral rewards`);
        return { processed: false, reason: 'Not first event' };
      }
      
      // Mark the user's first event as completed
      if (eventType === 'order') {
        await user.markFirstOrderCompleted();
      } else {
        await user.markFirstSubscriptionCompleted();
      }
      
      // Give welcome bonus to the new user (invited user gets points)
      await this.giveWelcomeBonus(user, orderId, eventType);
      
      // Process referral chain rewards (up to 2 tiers)
      const rewards = await this.processReferralChain(user, orderId, orderAmount, eventType);
      
      return {
        processed: true,
        welcomeBonus: true,
        rewards: rewards,
        eventType: eventType
      };
      
    } catch (error) {
      console.error('Error processing referral rewards:', error);
      throw error;
    }
  }
  
  /**
   * Give welcome bonus to new user
   */
  async giveWelcomeBonus(user, orderId, eventType) {
    const welcomeBonus = REFERRAL_REWARDS.welcome_bonus;
    
    await user.addPoints(welcomeBonus.amount, welcomeBonus.description, {
      type: 'EARNED_SIGNUP',
      relatedId: orderId,
      relatedModel: eventType === 'order' ? 'Order' : 'Subscription',
      metadata: {
        eventType: eventType,
        welcomeBonus: true
      }
    });
    
    console.log(`Gave welcome bonus of ${welcomeBonus.amount} points to user ${user._id}`);
  }
  
  /**
   * Process rewards for referral chain (up to 2 tiers)
   */
  async processReferralChain(user, orderId, orderAmount, eventType) {
    const rewards = [];
    
    // Process each tier in the referral chain
    for (const referralInfo of user.referralChain) {
      const referrer = await User.findById(referralInfo.referrer);
      
      if (!referrer) {
        console.log(`Referrer ${referralInfo.referrer} not found, skipping`);
        continue;
      }
      
      const reward = await this.calculateAndGiveReward(
        referrer, 
        user, 
        referralInfo.level, 
        orderId, 
        orderAmount, 
        eventType
      );
      
      rewards.push(reward);
    }
    
    return rewards;
  }
  
  /**
   * Calculate and give reward to a specific referrer
   */
  async calculateAndGiveReward(referrer, referredUser, tier, orderId, orderAmount, eventType) {
    const rewardConfig = REFERRAL_REWARDS[referrer.referralUserType]?.[`tier${tier}`];
    
    if (!rewardConfig) {
      console.log(`No reward config for ${referrer.referralUserType} tier ${tier}`);
      return null;
    }
    
    const reward = {
      referrerId: referrer._id,
      referrerType: referrer.referralUserType,
      referredUserId: referredUser._id,
      tier: tier,
      rewardType: rewardConfig.type,
      amount: rewardConfig.amount,
      description: rewardConfig.description,
      orderId: orderId,
      orderAmount: orderAmount,
      eventType: eventType
    };
    
    if (rewardConfig.type === 'money') {
      // Property agent gets money commission
      await this.giveMoneyCommission(referrer, referredUser, reward);
    } else {
      // Customer gets points
      await this.givePointsReward(referrer, referredUser, reward);
    }
    
    console.log(`Gave ${rewardConfig.type} reward of ${rewardConfig.amount} to ${referrer.referralUserType} ${referrer._id} for tier ${tier} referral`);
    
    return reward;
  }
  
  /**
   * Give money commission to property agent
   */
  async giveMoneyCommission(referrer, referredUser, reward) {
    // Create commission record
    const commission = new Commission({
      referrer: referrer._id,
      referredUser: referredUser._id,
      orderId: reward.orderId,
      orderAmount: reward.orderAmount,
      commissionRate: 0, // Fixed amount, not percentage
      commissionAmount: reward.amount,
      tier: reward.tier,
      status: 'PENDING', // Will be approved by admin
      metadata: {
        eventType: reward.eventType,
        referralTier: reward.tier,
        isFixedAmount: true
      }
    });
    
    await commission.save();
    
    // Update referrer's pending commission
    referrer.pendingCommission += reward.amount;
    await referrer.save();
    
    return commission;
  }
  
  /**
   * Give points reward to customer
   */
  async givePointsReward(referrer, referredUser, reward) {
    await referrer.addPoints(reward.amount, reward.description, {
      type: 'EARNED_REFERRAL',
      relatedId: reward.orderId,
      relatedModel: reward.eventType === 'order' ? 'Order' : 'Subscription',
      metadata: {
        referralLevel: reward.tier,
        referredUser: referredUser._id,
        orderAmount: reward.orderAmount,
        eventType: reward.eventType
      }
    });
    
    return true;
  }
  
  /**
   * Build referral chain when user registers with referral code
   * @param {Object} newUser - The newly registered user
   * @param {string} referralCode - The referral code used
   */
  async buildReferralChain(newUser, referralCode) {
    try {
      // Find the direct referrer - check all possible code fields
      const directReferrer = await User.findOne({ 
        $or: [
          { referralCode: referralCode },
          { agentCode: referralCode },
          { inviteCode: referralCode }
        ]
      });
      
      if (!directReferrer) {
        console.log(`No referrer found for code: ${referralCode}`);
        return { success: false, reason: 'Invalid referral code' };
      }
      
      // Add direct referrer to chain (Tier 1)
      newUser.addToReferralChain(directReferrer, 1);
      newUser.referredBy = directReferrer._id;
      
      // Check if direct referrer was also referred (for Tier 2)
      if (directReferrer.referredBy) {
        const indirectReferrer = await User.findById(directReferrer.referredBy);
        
        if (indirectReferrer && indirectReferrer.referralUserType === 'property_agent') {
          // Add indirect referrer to chain (Tier 2) - only if they're a property agent
          newUser.addToReferralChain(indirectReferrer, 2);
        }
      }
      
      await newUser.save();
      
      return {
        success: true,
        directReferrer: directReferrer._id,
        indirectReferrer: indirectReferrer?._id || null,
        chainLength: newUser.referralChain.length
      };
      
    } catch (error) {
      console.error('Error building referral chain:', error);
      throw error;
    }
  }
  
  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const stats = {
      userType: user.referralUserType,
      rewardType: user.rewardType,
      currentBalance: user.rewardType === 'points' ? user.pointsBalance : user.pendingCommission,
      totalEarned: user.rewardType === 'points' ? user.totalPointsEarned : user.totalCommissionEarned,
      totalRedeemed: user.rewardType === 'points' ? user.totalPointsRedeemed : user.totalCommissionPaid,
      referralChainLength: user.referralChain.length,
      hasCompletedFirstOrder: user.hasCompletedFirstOrder,
      hasCompletedFirstSubscription: user.hasCompletedFirstSubscription
    };
    
    // Get referral count (how many people this user referred)
    const referredCount = await User.countDocuments({ referredBy: userId });
    stats.totalReferrals = referredCount;
    
    return stats;
  }
}

module.exports = new ReferralRewardService();