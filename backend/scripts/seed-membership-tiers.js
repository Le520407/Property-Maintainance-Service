require('dotenv').config();
const mongoose = require('mongoose');
const { MembershipTier } = require('../models/VendorMembership');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swift-fix-pro');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const membershipTiers = [
  {
    name: 'BASIC',
    displayName: 'Basic',
    description: 'Perfect for getting started as a service provider',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      maxMonthlyJobs: 10,
      maxConcurrentJobs: 2,
      priorityAssignment: false,
      emergencyServiceEligible: false,
      featuredListingEligible: false,
      customPortfolioPages: false,
      maxPortfolioImages: 5,
      customServicePackages: false,
      promotionalBanners: false,
      socialMediaIntegration: false,
      advancedAnalytics: false,
      customerInsights: false,
      revenueReporting: false,
      prioritySupport: false,
      dedicatedAccountManager: false,
      trainingResources: false,
      platformCommissionRate: 15,
      paymentProcessingDiscount: 0,
      badgeEligibility: {
        verified: true,
        premium: false,
        professional: false,
        trusted: false
      }
    },
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'PROFESSIONAL',
    displayName: 'Professional',
    description: 'Ideal for established service providers looking to grow',
    monthlyPrice: 29.90,
    yearlyPrice: 299.00,
    features: {
      maxMonthlyJobs: 30,
      maxConcurrentJobs: 5,
      priorityAssignment: false,
      emergencyServiceEligible: true,
      featuredListingEligible: false,
      customPortfolioPages: true,
      maxPortfolioImages: 15,
      customServicePackages: true,
      promotionalBanners: false,
      socialMediaIntegration: true,
      advancedAnalytics: false,
      customerInsights: true,
      revenueReporting: true,
      prioritySupport: false,
      dedicatedAccountManager: false,
      trainingResources: true,
      platformCommissionRate: 12,
      paymentProcessingDiscount: 10,
      badgeEligibility: {
        verified: true,
        premium: false,
        professional: true,
        trusted: false
      }
    },
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'PREMIUM',
    displayName: 'Premium',
    description: 'Perfect for high-volume service providers',
    monthlyPrice: 79.90,
    yearlyPrice: 799.00,
    features: {
      maxMonthlyJobs: 100,
      maxConcurrentJobs: 10,
      priorityAssignment: true,
      emergencyServiceEligible: true,
      featuredListingEligible: true,
      customPortfolioPages: true,
      maxPortfolioImages: 30,
      customServicePackages: true,
      promotionalBanners: true,
      socialMediaIntegration: true,
      advancedAnalytics: true,
      customerInsights: true,
      revenueReporting: true,
      prioritySupport: true,
      dedicatedAccountManager: false,
      trainingResources: true,
      platformCommissionRate: 10,
      paymentProcessingDiscount: 15,
      badgeEligibility: {
        verified: true,
        premium: true,
        professional: true,
        trusted: true
      }
    },
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'ENTERPRISE',
    displayName: 'Enterprise',
    description: 'For large service companies and franchise operations',
    monthlyPrice: 149.90,
    yearlyPrice: 1499.00,
    features: {
      maxMonthlyJobs: -1, // unlimited
      maxConcurrentJobs: -1, // unlimited
      priorityAssignment: true,
      emergencyServiceEligible: true,
      featuredListingEligible: true,
      customPortfolioPages: true,
      maxPortfolioImages: -1, // unlimited
      customServicePackages: true,
      promotionalBanners: true,
      socialMediaIntegration: true,
      advancedAnalytics: true,
      customerInsights: true,
      revenueReporting: true,
      prioritySupport: true,
      dedicatedAccountManager: true,
      trainingResources: true,
      platformCommissionRate: 8,
      paymentProcessingDiscount: 20,
      badgeEligibility: {
        verified: true,
        premium: true,
        professional: true,
        trusted: true
      }
    },
    isActive: true,
    sortOrder: 4
  }
];

const seedMembershipTiers = async () => {
  try {
    await connectDB();
    
    console.log('Seeding membership tiers...');
    
    // Clear existing tiers
    await MembershipTier.deleteMany({});
    console.log('Cleared existing membership tiers');
    
    // Insert new tiers
    for (const tierData of membershipTiers) {
      const tier = new MembershipTier(tierData);
      await tier.save();
      console.log(`✅ Created tier: ${tier.displayName} (${tier.name})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${membershipTiers.length} membership tiers`);
    console.log('\nMembership Tiers Created:');
    console.log('┌─────────────┬────────────┬─────────────┬──────────────┐');
    console.log('│    Tier     │  Monthly   │   Yearly    │ Commission % │');
    console.log('├─────────────┼────────────┼─────────────┼──────────────┤');
    
    membershipTiers.forEach(tier => {
      const monthly = tier.monthlyPrice === 0 ? 'Free' : `$${tier.monthlyPrice}`;
      const yearly = tier.yearlyPrice === 0 ? 'Free' : `$${tier.yearlyPrice}`;
      const commission = `${tier.features.platformCommissionRate}%`;
      
      console.log(`│ ${tier.displayName.padEnd(11)} │ ${monthly.padEnd(10)} │ ${yearly.padEnd(11)} │ ${commission.padEnd(12)} │`);
    });
    
    console.log('└─────────────┴────────────┴─────────────┴──────────────┘');
    
  } catch (error) {
    console.error('❌ Error seeding membership tiers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Database disconnected');
  }
};

// Run the seed function
seedMembershipTiers();