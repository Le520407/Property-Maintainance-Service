const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Job = require('../models/Job');
const Rating = require('../models/Rating');

class VendorAssignmentService {
  /**
   * Map job categories to acceptable vendor service categories
   * This allows for flexibility in matching jobs to vendors
   */
  static getAcceptableCategoriesForJob(jobCategory) {
    const categoryMap = {
      // Map job categories to actual vendor serviceCategories (enum values)
      'furniture-assembly': ['furniture-assembly', 'home-repairs'], // Home-repairs acts as "general"
      'home-repairs': ['home-repairs'],
      'painting-services': ['painting-services', 'home-repairs'],
      'electrical-services': ['electrical-services', 'home-repairs'], 
      'plumbing-services': ['plumbing-services', 'home-repairs'],
      'carpentry-services': ['carpentry-services', 'home-repairs'],
      'flooring-services': ['flooring-services', 'home-repairs'],
      'appliance-installation': ['appliance-installation', 'electrical-services', 'home-repairs'],
      'moving-services': ['moving-services', 'home-repairs'],
      'cleaning-services': ['cleaning-services', 'home-repairs'],
      'safety-security': ['safety-security', 'home-repairs'],
      'renovation': ['renovation', 'home-repairs'],
      
      // Single word categories (fallback) - map to actual vendor categories
      'assembly': ['assembly', 'home-repairs', 'general'],
      'maintenance': ['maintenance', 'home-repairs', 'general'],
      'painting': ['painting', 'home-repairs', 'general'],
      'electrical': ['electrical', 'home-repairs', 'general'],
      'plumbing': ['plumbing', 'home-repairs', 'general'],
      'flooring': ['flooring', 'home-repairs', 'general'],
      'installation': ['installation', 'home-repairs', 'general'],
      'moving': ['moving', 'home-repairs', 'general'],
      'cleaning': ['cleaning', 'home-repairs', 'general'],
      'security': ['security', 'home-repairs', 'general'],
      'gardening': ['gardening', 'renovation', 'general'],
      'hvac': ['electrical', 'home-repairs', 'general'],
      'carpentry': ['carpentry', 'home-repairs', 'general'],
      'general': ['general', 'home-repairs']
    };

    // Return mapped categories or fallback to home-repairs (acts as general)
    return categoryMap[jobCategory] || ['home-repairs'];
  }

  /**
   * Find the best vendors for a job based on multiple criteria
   * @param {Object} job - The job object
   * @param {Object} options - Assignment options
   * @returns {Array} Sorted array of recommended vendors
   */
  static async findBestVendors(job, options = {}) {
    try {
      const {
        limit = 10,
        includeUnavailable = false,
        prioritizeRating = true,
        prioritizeExperience = true,
        maxDistance = 50 // km
      } = options;

      // Add timeout to prevent hanging requests
      const OPERATION_TIMEOUT = 30000; // 30 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), OPERATION_TIMEOUT);
      });

      // Wrap the main operation in a race with timeout
      const findVendorsOperation = async () => {
        // Step 1: Get all active vendors who can handle this service category
        // First, normalize the job category and create a list of acceptable categories
        const jobCategory = job.category;
        const acceptableCategories = this.getAcceptableCategoriesForJob(jobCategory);

        // Step 2: Build base query for vendor search

        const baseQuery = {
          isActive: true,
          // Remove verification requirement for now - let all active vendors be eligible
          // verificationStatus: 'VERIFIED',
          serviceCategories: { $in: acceptableCategories }
        };

        // Add location filter if job has location - make it more flexible
        // For now, skip location filtering to focus on category matching
        // This can be re-enabled once we have more vendors with proper service areas
        /*
        if (job.location?.city) {
          // Improved city validation: check for real city names vs test/dummy data
          const city = job.location.city;
          const isAllDigits = /^\d+$/.test(city);
          const hasRandomPattern = /^[a-z0-9]{5,}$/.test(city); // matches "eo3r483" pattern
          const isTooShort = city.length <= 2;
          const cityIsValid = !isAllDigits && !hasRandomPattern && !isTooShort;
          
          if (cityIsValid) {
            baseQuery.serviceArea = new RegExp(city, 'i');
          }
        }
        */

        console.log(`🔍 VendorAssignment: Searching vendors with query:`, baseQuery);
        
        const vendors = await Vendor.find(baseQuery)
          .populate('userId', 'firstName lastName email phone')
          .limit(50) // Limit initial query to prevent memory issues
          .lean();

        console.log(`📊 VendorAssignment: Found ${vendors.length} vendors from database`);

        // Filter out vendors without valid userId
        const validVendors = vendors.filter(vendor => vendor.userId);
        console.log(`✅ VendorAssignment: ${validVendors.length} vendors have valid userId`);

        // Step 1.5: Priority filtering based on membership tiers
        const priorityVendors = validVendors.filter(vendor => vendor.membershipFeatures?.priorityAssignment === true);
        const regularVendors = validVendors.filter(vendor => vendor.membershipFeatures?.priorityAssignment !== true);
        
        if (validVendors.length === 0) {
          return [];
        }

        // Step 2: Calculate scores for each vendor with concurrent limit
        const CONCURRENCY_LIMIT = 5;
        const scoredVendors = [];
        
        console.log(`🧮 VendorAssignment: Calculating scores for ${validVendors.length} vendors`);
        
        for (let i = 0; i < validVendors.length; i += CONCURRENCY_LIMIT) {
          const batch = validVendors.slice(i, i + CONCURRENCY_LIMIT);
          console.log(`⚙️ VendorAssignment: Processing batch ${Math.floor(i/CONCURRENCY_LIMIT) + 1}, vendors ${i+1}-${Math.min(i+CONCURRENCY_LIMIT, validVendors.length)}`);
          
          const batchResults = await Promise.allSettled(
            batch.map(vendor => this.calculateVendorScore(vendor, job))
          );
          
          // Only include successful results and log failures
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              scoredVendors.push(result.value);
            } else {
              console.error(`❌ VendorAssignment: Failed to score vendor ${batch[index].userId?._id}:`, result.reason);
            }
          });
        }
        
        console.log(`📊 VendorAssignment: Successfully scored ${scoredVendors.length} vendors`);

        // Step 3: Filter out unavailable vendors if required
        let filteredVendors = scoredVendors;
        if (!includeUnavailable) {
          filteredVendors = await this.filterAvailableVendors(scoredVendors, job);
        }

        // Step 4: Sort by total score (highest first)
        filteredVendors.sort((a, b) => b.totalScore - a.totalScore);

        // Step 5: Return top vendors with detailed scoring
        const topVendors = filteredVendors.slice(0, limit);
        
        return topVendors;
      };

      // Race the operation against the timeout
      return await Promise.race([findVendorsOperation(), timeoutPromise]);

    } catch (error) {
      console.error('Error in findBestVendors:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive score for a vendor based on multiple factors
   * @param {Object} vendor - The vendor object
   * @param {Object} job - The job object
   * @returns {Object} Vendor with calculated scores
   */
  static async calculateVendorScore(vendor, job) {
    try {
      // Get vendor statistics
      const vendorStats = await this.getVendorStatistics(vendor.userId._id);
      
      // Calculate individual scores (0-100 scale)
      const ratingScore = this.calculateRatingScore(vendorStats);
      const experienceScore = this.calculateExperienceScore(vendorStats);
      const availabilityScore = await this.calculateAvailabilityScore(vendor, job);
      const locationScore = this.calculateLocationScore(vendor, job);
      const categoryExpertiseScore = this.calculateCategoryExpertiseScore(vendor, job);
      const recentActivityScore = this.calculateRecentActivityScore(vendorStats);
      const priceCompatibilityScore = this.calculatePriceCompatibilityScore(vendor, job);
      const membershipScore = this.calculateMembershipScore(vendor);

      // Weight factors (total should equal 1.0)
      const weights = {
        rating: 0.22,        // 22% - Customer satisfaction is crucial
        experience: 0.18,    // 18% - Experience with similar jobs
        availability: 0.15,  // 15% - Can they do the job when needed
        location: 0.15,      // 15% - Geographic proximity
        categoryExpertise: 0.10, // 10% - Specialization in job category
        recentActivity: 0.10,    // 10% - Recent engagement
        priceCompatibility: 0.05, // 5% - Price range compatibility
        membership: 0.05     // 5% - Membership tier bonus
      };

      // Calculate weighted total score
      const totalScore = 
        (ratingScore * weights.rating) +
        (experienceScore * weights.experience) +
        (availabilityScore * weights.availability) +
        (locationScore * weights.location) +
        (categoryExpertiseScore * weights.categoryExpertise) +
        (recentActivityScore * weights.recentActivity) +
        (priceCompatibilityScore * weights.priceCompatibility) +
        (membershipScore * weights.membership);

      // Add scoring breakdown for transparency
      const scoreBreakdown = {
        rating: { score: ratingScore, weight: weights.rating, weighted: ratingScore * weights.rating },
        experience: { score: experienceScore, weight: weights.experience, weighted: experienceScore * weights.experience },
        availability: { score: availabilityScore, weight: weights.availability, weighted: availabilityScore * weights.availability },
        location: { score: locationScore, weight: weights.location, weighted: locationScore * weights.location },
        categoryExpertise: { score: categoryExpertiseScore, weight: weights.categoryExpertise, weighted: categoryExpertiseScore * weights.categoryExpertise },
        recentActivity: { score: recentActivityScore, weight: weights.recentActivity, weighted: recentActivityScore * weights.recentActivity },
        priceCompatibility: { score: priceCompatibilityScore, weight: weights.priceCompatibility, weighted: priceCompatibilityScore * weights.priceCompatibility },
        membership: { score: membershipScore, weight: weights.membership, weighted: membershipScore * weights.membership }
      };

      return {
        ...vendor,
        vendorStats,
        totalScore,
        scoreBreakdown,
        recommendationReason: this.generateRecommendationReason(scoreBreakdown, vendorStats)
      };

    } catch (error) {
      console.error(`Error calculating score for vendor ${vendor.userId._id}:`, error);
      return {
        ...vendor,
        totalScore: 0,
        scoreBreakdown: {},
        recommendationReason: 'Error calculating score'
      };
    }
  }

  /**
   * Get comprehensive statistics for a vendor
   */
  static async getVendorStatistics(vendorUserId) {
    try {
      // Set timeout for aggregation queries
      const QUERY_TIMEOUT = 10000; // 10 seconds
      
      // Get job statistics with timeout
      const jobStatsPromise = Job.aggregate([
        { $match: { vendorId: vendorUserId } },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completedJobs: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
            cancelledJobs: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } },
            avgJobValue: { $avg: '$totalAmount' },
            totalRevenue: { $sum: '$totalAmount' },
            recentJobs: { 
              $sum: { 
                $cond: [
                  { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }, 
                  1, 
                  0 
                ] 
              } 
            }
          }
        }
      ]);

      // Get rating statistics with timeout
      const ratingStatsPromise = Rating.aggregate([
        { $match: { vendorId: vendorUserId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$overallRating' },
            totalRatings: { $sum: 1 },
            recentRatings: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1,
                  0
                ]
              }
            },
            ratingDistribution: {
              $push: '$overallRating'
            }
          }
        }
      ]);

      // Execute both queries with timeout protection
      const [jobStats, ratingStats] = await Promise.allSettled([
        jobStatsPromise,
        ratingStatsPromise
      ]);

      // Extract results from settled promises
      const stats = (jobStats.status === 'fulfilled' && jobStats.value[0]) || {};
      const ratings = (ratingStats.status === 'fulfilled' && ratingStats.value[0]) || {};

      // Log any failed queries
      if (jobStats.status === 'rejected') {
        console.warn(`Failed to get job stats for vendor ${vendorUserId}:`, jobStats.reason);
      }
      if (ratingStats.status === 'rejected') {
        console.warn(`Failed to get rating stats for vendor ${vendorUserId}:`, ratingStats.reason);
      }

      return {
        // Job statistics
        totalJobs: stats.totalJobs || 0,
        completedJobs: stats.completedJobs || 0,
        cancelledJobs: stats.cancelledJobs || 0,
        completionRate: stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs * 100) : 0,
        avgJobValue: stats.avgJobValue || 0,
        totalRevenue: stats.totalRevenue || 0,
        recentJobs: stats.recentJobs || 0,

        // Rating statistics
        averageRating: ratings.averageRating || 0,
        totalRatings: ratings.totalRatings || 0,
        recentRatings: ratings.recentRatings || 0,
        ratingDistribution: ratings.ratingDistribution || [],

        // Calculated metrics
        experienceLevel: this.calculateExperienceLevel(stats.totalJobs || 0),
        recentActivity: (stats.recentJobs || 0) + (ratings.recentRatings || 0),
        reliability: this.calculateReliability(stats.completedJobs || 0, stats.cancelledJobs || 0)
      };

    } catch (error) {
      console.error('Error getting vendor statistics:', error);
      return {
        totalJobs: 0,
        completedJobs: 0,
        cancelledJobs: 0,
        completionRate: 0,
        averageRating: 0,
        totalRatings: 0,
        experienceLevel: 'Beginner',
        recentActivity: 0,
        reliability: 0
      };
    }
  }

  /**
   * Calculate rating score (0-100)
   */
  static calculateRatingScore(stats) {
    if (stats.totalRatings === 0) return 50; // Neutral score for new vendors
    
    // Base score from average rating (0-5 scale to 0-100)
    let score = (stats.averageRating / 5) * 100;
    
    // Boost for having many ratings (reliability indicator)
    if (stats.totalRatings >= 10) score += 5;
    if (stats.totalRatings >= 50) score += 5;
    if (stats.totalRatings >= 100) score += 5;
    
    // Recent ratings boost (shows current performance)
    if (stats.recentRatings >= 3) score += 3;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate experience score (0-100)
   */
  static calculateExperienceScore(stats) {
    let score = 0;
    
    // Base score from total jobs
    if (stats.totalJobs >= 1) score += 20;
    if (stats.totalJobs >= 5) score += 20;
    if (stats.totalJobs >= 15) score += 20;
    if (stats.totalJobs >= 50) score += 20;
    if (stats.totalJobs >= 100) score += 20;
    
    // Completion rate bonus
    if (stats.completionRate >= 90) score += 10;
    else if (stats.completionRate >= 80) score += 5;
    
    // Recent activity bonus
    if (stats.recentJobs >= 2) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate availability score (0-100)
   */
  static async calculateAvailabilityScore(vendor, job) {
    try {
      // Check if vendor has availability schedule
      if (!vendor.availabilitySchedule || vendor.availabilitySchedule.length === 0) {
        return 60; // Neutral score if no schedule set
      }

      // Get requested day of week (ensuring proper date parsing)
      const requestedDate = new Date(job.requestedTimeSlot?.date);
      const requestedDayOfWeek = requestedDate.getDay();
      
      // Find availability for requested day
      const dayAvailability = vendor.availabilitySchedule.find(
        slot => slot.dayOfWeek === requestedDayOfWeek && slot.isAvailable
      );
      
      if (!dayAvailability) {
        return 20; // Low score if not available on requested day
      }
      
      // Check time overlap
      const requestedStart = job.requestedTimeSlot?.startTime || '09:00';
      const requestedEnd = job.requestedTimeSlot?.endTime || '17:00';
      
      const hasTimeOverlap = this.checkTimeOverlap(
        dayAvailability.startTime,
        dayAvailability.endTime,
        requestedStart,
        requestedEnd
      );
      
      if (!hasTimeOverlap) {
        return 40; // Medium score if time doesn't match perfectly
      }
      
      // Check current workload with timeout
      const currentJobs = await Job.countDocuments({
        vendorId: vendor.userId._id,
        status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
        'requestedTimeSlot.date': {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      }).maxTimeMS(5000); // 5 second timeout
      
      // Lower score if vendor is very busy
      let workloadMultiplier = 1;
      if (currentJobs >= 5) workloadMultiplier = 0.7;
      else if (currentJobs >= 3) workloadMultiplier = 0.85;
      
      return Math.round(90 * workloadMultiplier);
      
    } catch (error) {
      console.error('Error calculating availability score:', error);
      return 50;
    }
  }

  /**
   * Calculate location score (0-100) based on proximity
   */
  static calculateLocationScore(vendor, job) {
    // Simple city matching for now
    // In a real implementation, you'd use geolocation coordinates
    
    if (!job.location?.city || !vendor.serviceArea) return 50;
    
    const jobCity = job.location.city.toLowerCase();
    const vendorAreas = vendor.serviceArea.toLowerCase();
    
    // Exact city match
    if (vendorAreas.includes(jobCity)) return 100;
    
    // Partial match (state/region)
    if (job.location.state && vendorAreas.includes(job.location.state.toLowerCase())) {
      return 70;
    }
    
    // Default score for different locations
    return 30;
  }

  /**
   * Calculate category expertise score (0-100)
   */
  static calculateCategoryExpertiseScore(vendor, job) {
    if (!vendor.serviceCategories) return 0;
    
    // Check if vendor specializes in this category
    const hasCategory = vendor.serviceCategories.includes(job.category);
    if (!hasCategory) return 0;
    
    let score = 80; // Base score for having the category
    
    // Bonus for having fewer categories (specialization)
    if (vendor.serviceCategories.length === 1) score += 20;
    else if (vendor.serviceCategories.length <= 3) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate recent activity score (0-100)
   */
  static calculateRecentActivityScore(stats) {
    const recentActivity = stats.recentActivity || 0;
    
    if (recentActivity >= 5) return 100;
    if (recentActivity >= 3) return 80;
    if (recentActivity >= 1) return 60;
    return 30; // Low activity
  }

  /**
   * Calculate price compatibility score (0-100)
   */
  static calculatePriceCompatibilityScore(vendor, job) {
    // This would compare vendor's typical pricing with job budget
    // For now, return neutral score
    return 70;
  }

  /**
   * Filter vendors based on availability
   */
  static async filterAvailableVendors(vendors, job) {
    // For now, return all vendors
    // In a real implementation, you'd check detailed availability
    return vendors.filter(vendor => vendor.scoreBreakdown?.availability?.score > 30);
  }

  /**
   * Helper function to check time overlap
   */
  static checkTimeOverlap(availStart, availEnd, reqStart, reqEnd) {
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const availStartMin = parseTime(availStart);
    const availEndMin = parseTime(availEnd);
    const reqStartMin = parseTime(reqStart);
    const reqEndMin = parseTime(reqEnd);
    
    return !(reqEndMin <= availStartMin || reqStartMin >= availEndMin);
  }

  /**
   * Calculate experience level based on total jobs
   */
  static calculateExperienceLevel(totalJobs) {
    if (totalJobs >= 100) return 'Expert';
    if (totalJobs >= 50) return 'Advanced';
    if (totalJobs >= 15) return 'Experienced';
    if (totalJobs >= 5) return 'Intermediate';
    return 'Beginner';
  }

  /**
   * Calculate reliability score
   */
  static calculateReliability(completed, cancelled) {
    const total = completed + cancelled;
    if (total === 0) return 100; // New vendor gets benefit of doubt
    return Math.round((completed / total) * 100);
  }

  /**
   * Generate human-readable recommendation reason
   */
  static generateRecommendationReason(scoreBreakdown, stats) {
    const reasons = [];
    
    // Highest scoring factors
    const sortedScores = Object.entries(scoreBreakdown)
      .sort(([,a], [,b]) => b.weighted - a.weighted)
      .slice(0, 3);
    
    sortedScores.forEach(([factor, data]) => {
      if (data.score >= 80) {
        switch (factor) {
          case 'rating':
            reasons.push(`Excellent customer ratings (${stats.averageRating?.toFixed(1)}/5)`);
            break;
          case 'experience':
            reasons.push(`Highly experienced (${stats.totalJobs} jobs completed)`);
            break;
          case 'availability':
            reasons.push('Available during requested time');
            break;
          case 'location':
            reasons.push('Located in your service area');
            break;
          case 'categoryExpertise':
            reasons.push('Specializes in this service category');
            break;
          case 'recentActivity':
            reasons.push('Recently active on platform');
            break;
        }
      }
    });
    
    if (reasons.length === 0) {
      reasons.push('Available vendor in your area');
    }
    
    return reasons.join(', ');
  }

  /**
   * Calculate membership tier bonus score
   */
  static calculateMembershipScore(vendor) {
    try {
      const membershipTier = vendor.membershipTier || 'BASIC';
      const membershipFeatures = vendor.membershipFeatures || {};
      
      // Base scores for different membership tiers
      const tierScores = {
        'BASIC': 0,
        'PROFESSIONAL': 25,
        'PREMIUM': 50,
        'ENTERPRISE': 75
      };
      
      let score = tierScores[membershipTier] || 0;
      
      // Bonus points for specific features
      if (membershipFeatures.priorityAssignment) score += 15;
      if (membershipFeatures.emergencyServiceEnabled) score += 10;
      if (membershipFeatures.featuredListing) score += 10;
      if (membershipFeatures.advancedAnalytics) score += 5;
      if (membershipFeatures.prioritySupport) score += 5;
      
      // Cap at 100
      return Math.min(score, 100);
    } catch (error) {
      console.error('Error calculating membership score:', error);
      return 0;
    }
  }

  /**
   * Auto-assign job to best vendor (for emergency or auto-assignment)
   */
  static async autoAssignJob(jobId, options = {}) {
    try {
      console.log(`🔍 VendorAssignmentService: Starting auto-assign for job ${jobId}`);
      
      const job = await Job.findById(jobId);
      if (!job) {
        console.log(`❌ VendorAssignmentService: Job ${jobId} not found`);
        throw new Error('Job not found');
      }
      
      console.log(`📋 VendorAssignmentService: Job ${job.jobNumber} found, status: ${job.status}`);
      
      if (!['PENDING', 'ASSIGNED'].includes(job.status)) {
        console.log(`❌ VendorAssignmentService: Invalid status ${job.status} for assignment`);
        throw new Error(`Job is not available for assignment. Current status: ${job.status}`);
      }

      console.log(`🔍 VendorAssignmentService: Finding best vendors for job ${job.jobNumber}, category: ${job.category}`);
      const bestVendors = await this.findBestVendors(job, { limit: 1 });
      
      console.log(`📊 VendorAssignmentService: Found ${bestVendors.length} suitable vendors`);
      
      let bestVendor;
      
      if (bestVendors.length === 0) {
        console.log(`❌ VendorAssignmentService: No vendors found for job ${job.jobNumber}`);
        // Try to find any active vendors as a fallback
        console.log(`🔄 VendorAssignmentService: Attempting fallback search for any active vendors`);
        const fallbackVendors = await Vendor.find({ isActive: true })
          .populate('userId', 'firstName lastName email phone')
          .limit(1)
          .lean();
        
        if (fallbackVendors.length > 0 && fallbackVendors[0].userId) {
          console.log(`🆘 VendorAssignmentService: Using fallback vendor: ${fallbackVendors[0].userId.firstName} ${fallbackVendors[0].userId.lastName}`);
          bestVendor = {
            ...fallbackVendors[0],
            totalScore: 50,
            recommendationReason: 'Fallback assignment - no specific matches found'
          };
        } else {
          throw new Error('No suitable vendors found');
        }
      } else {
        bestVendor = bestVendors[0];
        console.log(`👤 VendorAssignmentService: Best vendor found: ${bestVendor.userId?.firstName} ${bestVendor.userId?.lastName}, Score: ${bestVendor.totalScore}`);
      }
      
      // Assign the job
      console.log(`🔄 VendorAssignmentService: Assigning job to vendor ${bestVendor.userId._id}`);
      await job.assignToVendor(bestVendor.userId._id);
      
      console.log(`✅ VendorAssignmentService: Job ${job.jobNumber} successfully assigned`);
      
      return {
        job,
        assignedVendor: bestVendor,
        autoAssigned: true
      };
      
    } catch (error) {
      console.error('❌ VendorAssignmentService: Error in auto-assignment:', error);
      console.error('Full error details:', error.stack);
      throw error;
    }
  }
}

module.exports = VendorAssignmentService;