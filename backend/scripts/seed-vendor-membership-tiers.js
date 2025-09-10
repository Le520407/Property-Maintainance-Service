const mongoose = require('mongoose');
require('dotenv').config();
const { VendorMembershipTier } = require('../models/VendorMembership');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedVendorMembershipTiers = async () => {
  try {
    console.log('🌱 Seeding vendor membership tiers...');

    // Check if tiers already exist
    const existingTiers = await VendorMembershipTier.find();
    if (existingTiers.length > 0) {
      console.log('✅ Vendor membership tiers already exist:', existingTiers.length);
      return;
    }

    const tiers = [
      {
        name: 'BASIC',
        displayName: 'Basic',
        description: 'Perfect for getting started with essential features',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: {
          maxPortfolioImages: 5,
          platformCommissionRate: 15,
          customServicePackages: false,
          prioritySupport: false,
          promotionalBanners: false,
          advancedAnalytics: false,
          dedicatedAccountManager: false,
          maxMonthlyJobs: 10,
          maxConcurrentJobs: 2,
          priorityAssignment: false,
          emergencyServiceEligible: false,
          featuredListingEligible: false
        },
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'PROFESSIONAL',
        displayName: 'Professional',
        description: 'For growing businesses with enhanced features',
        monthlyPrice: 29.90,
        yearlyPrice: 299.00,
        features: {
          maxPortfolioImages: 15,
          platformCommissionRate: 12,
          customServicePackages: true,
          prioritySupport: true,
          promotionalBanners: true,
          advancedAnalytics: true,
          dedicatedAccountManager: false,
          maxMonthlyJobs: 50,
          maxConcurrentJobs: 5,
          priorityAssignment: true,
          emergencyServiceEligible: true,
          featuredListingEligible: false
        },
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'PREMIUM',
        displayName: 'Premium',
        description: 'For established businesses with advanced tools',
        monthlyPrice: 79.90,
        yearlyPrice: 799.00,
        features: {
          maxPortfolioImages: 30,
          platformCommissionRate: 10,
          customServicePackages: true,
          prioritySupport: true,
          promotionalBanners: true,
          advancedAnalytics: true,
          dedicatedAccountManager: true,
          maxMonthlyJobs: 150,
          maxConcurrentJobs: 10,
          priorityAssignment: true,
          emergencyServiceEligible: true,
          featuredListingEligible: true
        },
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'ENTERPRISE',
        displayName: 'Enterprise',
        description: 'For large operations with unlimited features',
        monthlyPrice: 149.90,
        yearlyPrice: 1499.00,
        features: {
          maxPortfolioImages: -1, // Unlimited
          platformCommissionRate: 8,
          customServicePackages: true,
          prioritySupport: true,
          promotionalBanners: true,
          advancedAnalytics: true,
          dedicatedAccountManager: true,
          maxMonthlyJobs: -1, // Unlimited
          maxConcurrentJobs: -1, // Unlimited
          priorityAssignment: true,
          emergencyServiceEligible: true,
          featuredListingEligible: true
        },
        sortOrder: 4,
        isActive: true
      }
    ];

    const createdTiers = await VendorMembershipTier.insertMany(tiers);
    console.log('✅ Successfully created vendor membership tiers:', createdTiers.length);
    
    createdTiers.forEach(tier => {
      console.log(`   - ${tier.displayName}: $${tier.monthlyPrice}/month`);
    });

  } catch (error) {
    console.error('❌ Error seeding vendor membership tiers:', error);
  } finally {
    mongoose.connection.close();
    console.log('📄 Database connection closed');
  }
};

// Run the seeder
if (require.main === module) {
  seedVendorMembershipTiers();
}

module.exports = { seedVendorMembershipTiers };
