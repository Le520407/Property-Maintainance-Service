const { Referral, Commission, Payout, COMMISSION_RATES } = require('../models/Referral');
const { ReferralClick, ReferralLink, FraudDetection, ReferralAnalytics } = require('../models/ReferralTracking');
const User = require('../models/User');
const crypto = require('crypto');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

class ReferralService {
  
  // Generate a unique referral code for a user
  async generateReferralCode(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already has a referral code
      let existingReferral = await Referral.findOne({ referrer: userId });
      if (existingReferral) {
        return {
          success: true,
          referralCode: existingReferral.referralCode,
          isNew: false
        };
      }

      // Generate unique referral code
      let referralCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        // Generate different types of codes based on user type
        if (user.referralUserType === 'property_agent' || user.role === 'referral') {
          referralCode = this.generateAgentCode(user.firstName, user.lastName);
        } else {
          referralCode = this.generateCustomerCode(user.firstName, user.lastName);
        }
        
        const existing = await Referral.findOne({ referralCode });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique referral code');
      }

      // Create referral record
      const newReferral = new Referral({
        referralCode,
        referrer: userId,
        referralTier: 1,
        isActive: true
      });

      await newReferral.save();

      return {
        success: true,
        referralCode,
        isNew: true
      };

    } catch (error) {
      throw new Error(`Failed to generate referral code: ${error.message}`);
    }
  }

  // Generate referral links with tracking
  async generateReferralLink(userId, options = {}) {
    try {
      const referralData = await this.generateReferralCode(userId);
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Create tracking link
      const linkId = ReferralLink.generateLinkId();
      const shortUrl = ReferralLink.generateShortUrl();
      
      const campaignParams = new URLSearchParams();
      campaignParams.append('ref', referralData.referralCode);
      campaignParams.append('utm_source', options.source || 'referral');
      campaignParams.append('utm_medium', options.medium || 'direct');
      campaignParams.append('utm_campaign', options.campaign || 'referral_program');
      
      if (options.content) campaignParams.append('utm_content', options.content);
      if (options.term) campaignParams.append('utm_term', options.term);

      const originalUrl = `${baseUrl}/register?${campaignParams.toString()}`;
      const trackingUrl = `${baseUrl}/r/${shortUrl}`;

      const referralLink = new ReferralLink({
        referrerId: userId,
        referralCode: referralData.referralCode,
        linkId,
        originalUrl,
        shortUrl: trackingUrl,
        campaign: {
          name: options.campaign || 'referral_program',
          medium: options.medium || 'direct',
          source: options.source || 'referral',
          content: options.content,
          term: options.term
        },
        customParameters: options.customParams || {},
        expiresAt: options.expiresAt
      });

      await referralLink.save();

      return {
        success: true,
        linkId,
        originalUrl,
        trackingUrl,
        referralCode: referralData.referralCode,
        campaign: referralLink.campaign
      };

    } catch (error) {
      throw new Error(`Failed to generate referral link: ${error.message}`);
    }
  }

  // Track referral clicks
  async trackClick(shortUrl, req) {
    try {
      const referralLink = await ReferralLink.findOne({ shortUrl: { $regex: shortUrl, $options: 'i' } });
      if (!referralLink) {
        throw new Error('Referral link not found');
      }

      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const referer = req.headers.referer || '';
      
      // Parse user agent
      const parser = new UAParser(userAgent);
      const device = {
        type: parser.getDevice().type ? parser.getDevice().type.toUpperCase() : 'DESKTOP',
        browser: parser.getBrowser().name,
        os: parser.getOS().name,
        isMobile: parser.getDevice().type === 'mobile' || parser.getDevice().type === 'tablet'
      };

      // Get geographic data
      const geoData = geoip.lookup(ipAddress);
      const location = geoData ? {
        country: geoData.country,
        region: geoData.region,
        city: geoData.city,
        timezone: geoData.timezone,
        coordinates: {
          lat: geoData.ll[0],
          lng: geoData.ll[1]
        }
      } : {};

      // Generate session ID
      const sessionId = crypto.randomBytes(16).toString('hex');

      // Create click record
      const clickRecord = new ReferralClick({
        referralCode: referralLink.referralCode,
        referrerId: referralLink.referrerId,
        sessionId,
        ipAddress,
        userAgent,
        referer,
        source: this.determineSource(referer),
        device,
        location,
        clickedAt: new Date()
      });

      // Calculate initial risk score
      await this.performFraudCheck(clickRecord);
      
      await clickRecord.save();

      // Update link stats
      referralLink.totalClicks += 1;
      referralLink.lastClickedAt = new Date();
      await referralLink.save();

      return {
        success: true,
        sessionId,
        redirectUrl: referralLink.originalUrl,
        riskScore: clickRecord.riskScore
      };

    } catch (error) {
      throw new Error(`Failed to track click: ${error.message}`);
    }
  }

  // Track signup conversion
  async trackSignupConversion(referralCode, newUserId, sessionId = null) {
    try {
      const referral = await Referral.findOne({ referralCode, isActive: true });
      if (!referral) {
        return { success: false, message: 'Invalid referral code' };
      }

      const newUser = await User.findById(newUserId);
      if (!newUser) {
        throw new Error('New user not found');
      }

      // Check if user was already referred
      const existingRef = referral.referredUsers.find(ru => ru.user.toString() === newUserId.toString());
      if (existingRef) {
        return { success: false, message: 'User already referred' };
      }

      // Fraud check for self-referral
      if (referral.referrer.toString() === newUserId.toString()) {
        await this.flagFraud({
          type: 'SELF_REFERRAL',
          severity: 'HIGH',
          affectedUsers: [
            { userId: referral.referrer, role: 'REFERRER' },
            { userId: newUserId, role: 'REFERRED' }
          ],
          referralCode,
          description: 'User attempted to refer themselves',
          riskScore: 90
        });
        return { success: false, message: 'Self-referral not allowed' };
      }

      // Add referred user
      referral.referredUsers.push({
        user: newUserId,
        joinedAt: new Date(),
        tier: 1,
        status: 'ACTIVE'
      });

      referral.totalReferrals += 1;
      referral.activeReferrals += 1;

      // Update tier if needed
      await referral.updateTier();
      await referral.save();

      // Update click record if session exists
      if (sessionId) {
        await ReferralClick.updateOne(
          { sessionId },
          {
            converted: true,
            convertedAt: new Date(),
            convertedUserId: newUserId,
            conversionType: 'SIGNUP'
          }
        );
      }

      // Create signup bonus if configured
      await this.createSignupBonus(referral.referrer, newUserId, referralCode);

      return {
        success: true,
        referrerId: referral.referrer,
        newTier: referral.referralTier
      };

    } catch (error) {
      throw new Error(`Failed to track signup conversion: ${error.message}`);
    }
  }

  // Track purchase conversion and create commission
  async trackPurchaseConversion(orderId, orderAmount, customerId) {
    try {
      // Find if customer was referred
      const referral = await Referral.findOne({
        'referredUsers.user': customerId,
        'referredUsers.status': 'ACTIVE'
      }).populate('referrer');

      if (!referral) {
        return { success: false, message: 'Customer not referred' };
      }

      const referredUser = referral.referredUsers.find(ru => ru.user.toString() === customerId.toString());
      if (!referredUser) {
        return { success: false, message: 'Referred user record not found' };
      }

      // Calculate commission with enhanced rates for referral agents
      const commissionData = await this.calculateEnhancedCommission(referral, orderAmount);
      
      // Handle rewards - all users now get points instead of money
      let commission = null;
      if (commissionData.rewardType === 'points' && commissionData.pointsAmount > 0) {
        // Award points to customer referrers - BUT ONLY FOR FIRST ORDER
        const referrerUser = await User.findById(referral.referrer._id);
        const referredUserData = await User.findById(customerId);
        
        if (referrerUser && referredUserData) {
          // Check if this is the referred user's first completed order
          if (!referredUserData.hasCompletedFirstOrder) {
            // Award points only for first order
            await referrerUser.addPoints(
              commissionData.pointsAmount,
              `Referral bonus: ${referredUserData.firstName} ${referredUserData.lastName} completed first order`,
              {
                type: 'EARNED_REFERRAL',
                relatedId: orderId,
                relatedModel: 'Order',
                metadata: {
                  referralLevel: commissionData.tier,
                  referredUser: customerId,
                  orderAmount: orderAmount
                }
              }
            );
            
            // Mark the referred user as having completed their first order
            referredUserData.hasCompletedFirstOrder = true;
            referredUserData.firstOrderCompletedAt = new Date();
            await referredUserData.save();
            
            console.log(`✅ Awarded ${commissionData.pointsAmount} points to customer referrer: ${referrerUser.firstName} ${referrerUser.lastName} (first order by ${referredUserData.firstName})`);
          } else {
            console.log(`⏭️ Skipped points award: ${referredUserData.firstName} ${referredUserData.lastName} has already completed their first order`);
          }
        }
      }

      // Update referred user stats
      referredUser.totalSpent += orderAmount;
      if (!referredUser.firstPurchaseAmount) {
        referredUser.firstPurchaseAmount = orderAmount;
      }

      await referral.save();

      // Track conversion in analytics
      await this.updateAnalytics(referral.referrer, 'PURCHASE', {
        revenue: orderAmount,
        commission: commissionData.amount
      });

      return {
        success: true,
        commissionId: commission ? commission._id : null,
        commissionAmount: commissionData.amount,
        commissionRate: commissionData.rate,
        tier: commissionData.tier,
        rewardType: commissionData.rewardType,
        pointsAmount: commissionData.pointsAmount || 0
      };

    } catch (error) {
      throw new Error(`Failed to track purchase conversion: ${error.message}`);
    }
  }

  // Fraud detection
  async performFraudCheck(clickRecord) {
    let riskScore = 0;
    const fraudFlags = [];

    try {
      // Check for multiple clicks from same IP
      const recentClicks = await ReferralClick.find({
        ipAddress: clickRecord.ipAddress,
        clickedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      if (recentClicks.length > 10) {
        riskScore += 30;
        fraudFlags.push({
          type: 'MULTIPLE_CLICKS_SAME_IP',
          reason: `${recentClicks.length} clicks from same IP in 24 hours`,
          severity: 'MEDIUM'
        });
      }

      // Check for suspicious user agent patterns
      if (!clickRecord.userAgent || clickRecord.userAgent.length < 20) {
        riskScore += 20;
        fraudFlags.push({
          type: 'SUSPICIOUS_USER_AGENT',
          reason: 'Suspicious or missing user agent',
          severity: 'MEDIUM'
        });
      }

      // Check for bot-like behavior
      const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /headless/i, /phantom/i, /selenium/i
      ];
      
      if (botPatterns.some(pattern => pattern.test(clickRecord.userAgent))) {
        riskScore += 40;
        fraudFlags.push({
          type: 'BOT_DETECTION',
          reason: 'User agent matches bot patterns',
          severity: 'HIGH'
        });
      }

      // Check for velocity abuse (too many clicks too quickly)
      const veryRecentClicks = await ReferralClick.find({
        referrerId: clickRecord.referrerId,
        clickedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      });

      if (veryRecentClicks.length > 5) {
        riskScore += 25;
        fraudFlags.push({
          type: 'VELOCITY_ABUSE',
          reason: `${veryRecentClicks.length} clicks in last hour`,
          severity: 'MEDIUM'
        });
      }

      clickRecord.riskScore = Math.min(riskScore, 100);
      clickRecord.fraudFlags = fraudFlags;

      // Create fraud detection record if high risk
      if (riskScore >= 70) {
        await this.flagFraud({
          type: 'SUSPICIOUS_CLICK_PATTERN',
          severity: riskScore >= 90 ? 'CRITICAL' : 'HIGH',
          affectedUsers: [{ userId: clickRecord.referrerId, role: 'REFERRER' }],
          referralCode: clickRecord.referralCode,
          description: `High risk click pattern detected. Risk Score: ${riskScore}`,
          evidence: fraudFlags.map(flag => ({
            type: flag.type,
            data: flag,
            timestamp: new Date()
          })),
          riskScore
        });
      }

    } catch (error) {
      console.error('Fraud check failed:', error);
    }
  }

  // Flag fraud
  async flagFraud(fraudData) {
    try {
      const fraudRecord = new FraudDetection(fraudData);
      await fraudRecord.save();

      // Notify admin for high-risk cases
      if (fraudData.severity === 'CRITICAL' || fraudData.severity === 'HIGH') {
        await fraudRecord.notifyAdmin();
      }

      return fraudRecord;
    } catch (error) {
      console.error('Failed to flag fraud:', error);
    }
  }

  // Create signup bonus
  async createSignupBonus(referrerId, newUserId, referralCode) {
    try {
      const signupBonusAmount = process.env.REFERRAL_SIGNUP_BONUS || 5; // $5 default

      if (signupBonusAmount > 0) {
        const bonus = new Commission({
          referral: null, // Will be populated when we find the referral
          referrer: referrerId,
          referredUser: newUserId,
          orderId: null,
          orderAmount: 0,
          commissionRate: 0,
          commissionAmount: parseFloat(signupBonusAmount),
          tier: 1,
          status: 'APPROVED', // Auto-approve signup bonuses
          approvedAt: new Date(),
          paymentMethod: 'STORE_CREDIT'
        });

        // Find and link referral
        const referral = await Referral.findOne({ referrer: referrerId });
        if (referral) {
          bonus.referral = referral._id;
          referral.totalCommissionEarned += parseFloat(signupBonusAmount);
          referral.pendingCommission += parseFloat(signupBonusAmount);
          await referral.save();
        }

        await bonus.save();

        return bonus;
      }
    } catch (error) {
      console.error('Failed to create signup bonus:', error);
    }
  }

  // Update analytics
  async updateAnalytics(referrerId, eventType, data = {}) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let analytics = await ReferralAnalytics.findOne({
        referrerId,
        period: 'DAILY',
        periodDate: today
      });

      if (!analytics) {
        analytics = new ReferralAnalytics({
          referrerId,
          period: 'DAILY',
          periodDate: today,
          metrics: {}
        });
      }

      switch (eventType) {
        case 'CLICK':
          analytics.metrics.totalClicks += 1;
          break;
        case 'SIGNUP':
          analytics.metrics.signups += 1;
          break;
        case 'PURCHASE':
          analytics.metrics.conversions += 1;
          analytics.metrics.revenue += data.revenue || 0;
          analytics.metrics.commissionEarned += data.commission || 0;
          break;
      }

      // Calculate conversion rate
      if (analytics.metrics.totalClicks > 0) {
        analytics.metrics.conversionRate = 
          (analytics.metrics.conversions / analytics.metrics.totalClicks) * 100;
      }

      // Calculate average order value
      if (analytics.metrics.conversions > 0) {
        analytics.metrics.avgOrderValue = 
          analytics.metrics.revenue / analytics.metrics.conversions;
      }

      await analytics.save();
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  }

  // Get user referral stats
  async getUserReferralStats(userId) {
    try {
      const referral = await Referral.findOne({ referrer: userId })
        .populate('referredUsers.user', 'firstName lastName email createdAt');

      if (!referral) {
        return {
          referralCode: null,
          stats: {
            totalReferrals: 0,
            activeReferrals: 0,
            totalEarnings: 0,
            pendingEarnings: 0,
            tier: 1,
            conversionRate: 0
          },
          referredUsers: [],
          recentActivity: []
        };
      }

      // Get commission stats
      const commissionStats = await Commission.aggregate([
        { $match: { referrer: userId } },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$commissionAmount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const totalEarnings = referral.totalCommissionEarned || 0;
      const pendingEarnings = referral.pendingCommission || 0;

      // Get recent activity
      const recentCommissions = await Commission.find({ referrer: userId })
        .populate('referredUser', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10);

      // Get click analytics
      const clickStats = await ReferralClick.aggregate([
        { $match: { referrerId: userId } },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            conversions: { $sum: { $cond: ['$converted', 1, 0] } }
          }
        }
      ]);

      const clicks = clickStats[0] || { totalClicks: 0, conversions: 0 };
      const conversionRate = clicks.totalClicks > 0 ? 
        (clicks.conversions / clicks.totalClicks) * 100 : 0;

      return {
        referralCode: referral.referralCode,
        stats: {
          totalReferrals: referral.totalReferrals,
          activeReferrals: referral.activeReferrals,
          totalEarnings,
          pendingEarnings,
          tier: referral.referralTier,
          tierName: COMMISSION_RATES[referral.referralTier].name,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalClicks: clicks.totalClicks,
          totalConversions: clicks.conversions
        },
        referredUsers: referral.referredUsers,
        recentActivity: recentCommissions,
        commissionBreakdown: commissionStats
      };

    } catch (error) {
      throw new Error(`Failed to get user referral stats: ${error.message}`);
    }
  }

  // Calculate enhanced commission using fixed reward amounts
  async calculateEnhancedCommission(referral, orderAmount) {
    const { REFERRAL_REWARDS } = require('../models/Referral');
    const referrer = referral.referrer;
    
    // Determine referrer type and get appropriate reward
    let referrerType = 'customer'; // default
    let rewardConfig = null;
    
    if (referrer.role === 'referral' || referrer.referralUserType === 'property_agent') {
      referrerType = 'property_agent';
      rewardConfig = REFERRAL_REWARDS.property_agent.tier1; // Direct referral = tier1
    } else {
      referrerType = 'customer';
      rewardConfig = REFERRAL_REWARDS.customer.tier1; // Direct referral = tier1
    }
    
    if (!rewardConfig) {
      throw new Error(`No reward configuration found for referrer type: ${referrerType}`);
    }
    
    // All users now get points instead of direct money
    return {
      rate: 0,
      amount: 0, // No money commission - everyone gets points
      tier: 1,
      tierName: 'Direct Referral',
      isAgentCommission: false,
      rewardType: 'points',
      pointsAmount: rewardConfig.amount,
      description: rewardConfig.description
    };
  }

  // updateAgentTier method removed - no tier system for agents

  // Helper methods
  generateUniqueCode(firstName, lastName, userType = 'customer') {
    const namePrefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Different prefixes based on user type
    let typePrefix = '';
    if (userType === 'property_agent' || userType === 'referral') {
      typePrefix = 'PA'; // Property Agent
    } else {
      typePrefix = 'CU'; // Customer
    }
    
    return `${typePrefix}${namePrefix}${randomSuffix}`;
  }

  // Generate agent-specific referral code (for property agents)
  generateAgentCode(firstName, lastName) {
    const namePrefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    
    return `AGENT${namePrefix}${timestamp}${randomSuffix}`;
  }

  // Generate customer-specific invite code (for customers)
  generateCustomerCode(firstName, lastName) {
    const namePrefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `INVITE${namePrefix}${randomSuffix}`;
  }

  determineSource(referer) {
    if (!referer) return 'DIRECT';
    
    const socialPlatforms = {
      'facebook.com': 'SOCIAL',
      'instagram.com': 'SOCIAL',
      'twitter.com': 'SOCIAL',
      'linkedin.com': 'SOCIAL',
      'tiktok.com': 'SOCIAL',
      'whatsapp.com': 'SOCIAL',
      'telegram.org': 'SOCIAL'
    };

    for (const [platform, source] of Object.entries(socialPlatforms)) {
      if (referer.includes(platform)) {
        return source;
      }
    }

    if (referer.includes('mail') || referer.includes('email')) {
      return 'EMAIL';
    }

    return 'OTHER';
  }

  // Admin methods
  async getAdminReferralStats() {
    try {
      const totalStats = await Referral.aggregate([
        {
          $group: {
            _id: null,
            totalReferrers: { $sum: 1 },
            totalReferrals: { $sum: '$totalReferrals' },
            totalEarnings: { $sum: '$totalCommissionEarned' },
            activeReferrers: { $sum: { $cond: ['$isActive', 1, 0] } }
          }
        }
      ]);

      const tierBreakdown = await Referral.aggregate([
        {
          $group: {
            _id: '$referralTier',
            count: { $sum: 1 },
            totalEarnings: { $sum: '$totalCommissionEarned' }
          }
        }
      ]);

      const fraudStats = await FraudDetection.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        overview: totalStats[0] || {
          totalReferrers: 0,
          totalReferrals: 0,
          totalEarnings: 0,
          activeReferrers: 0
        },
        tierBreakdown,
        fraudStats,
        commissionRates: COMMISSION_RATES
      };

    } catch (error) {
      throw new Error(`Failed to get admin stats: ${error.message}`);
    }
  }

  async processPayouts() {
    try {
      // Find approved commissions ready for payout
      const readyCommissions = await Commission.find({
        status: 'APPROVED',
        paidAt: null
      }).populate('referrer');

      const payoutGroups = {};

      // Group by referrer
      readyCommissions.forEach(commission => {
        const referrerId = commission.referrer._id.toString();
        if (!payoutGroups[referrerId]) {
          payoutGroups[referrerId] = {
            referrer: commission.referrer,
            commissions: [],
            totalAmount: 0
          };
        }
        payoutGroups[referrerId].commissions.push(commission);
        payoutGroups[referrerId].totalAmount += commission.commissionAmount;
      });

      const payouts = [];
      const minimumPayout = process.env.MINIMUM_PAYOUT_AMOUNT || 50;

      for (const [referrerId, group] of Object.entries(payoutGroups)) {
        if (group.totalAmount >= minimumPayout) {
          // Create payout record
          const payout = new Payout({
            referrer: referrerId,
            commissions: group.commissions.map(c => c._id),
            totalAmount: group.totalAmount,
            paymentMethod: 'BANK_TRANSFER', // Default, should be user's preference
            status: 'PENDING'
          });

          await payout.save();
          payouts.push(payout);

          // Update commission status
          await Commission.updateMany(
            { _id: { $in: group.commissions.map(c => c._id) } },
            { 
              status: 'PAID',
              paidAt: new Date(),
              paymentMethod: 'BANK_TRANSFER'
            }
          );

          // Update referral pending commission
          await Referral.updateOne(
            { referrer: referrerId },
            { 
              $inc: { 
                pendingCommission: -group.totalAmount,
                totalCommissionPaid: group.totalAmount
              }
            }
          );
        }
      }

      return {
        success: true,
        payoutsCreated: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.totalAmount, 0)
      };

    } catch (error) {
      throw new Error(`Failed to process payouts: ${error.message}`);
    }
  }
}

module.exports = new ReferralService();