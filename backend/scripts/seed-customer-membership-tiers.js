require('dotenv').config();
const mongoose = require('mongoose');
const { MembershipTier } = require('../models/CustomerMembership');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const membershipTiers = [
  {
    name: 'HDB',
    displayName: 'HDB Plan',
    description: 'Monthly assessment, minor repair labor included, waived transport, parts billed separately',
    monthlyPrice: 25.00,
    yearlyPrice: 250.00, // 10 months pricing for yearly
    features: {
      serviceRequestsPerMonth: 1, // Monthly scheduled visit
      responseTimeHours: 72,
      materialDiscountPercent: 0, // Materials at cost (no markup)
      annualInspections: 12, // Monthly visits
      emergencyService: false,
      prioritySupport: false,
      dedicatedManager: false
    },
    isActive: true
  },
  {
    name: 'CONDOMINIUM',
    displayName: 'Condominium Plan',
    description: 'Same as HDB, with specialized focus on condominium facilities',
    monthlyPrice: 35.00,
    yearlyPrice: 350.00, // 10 months pricing for yearly
    features: {
      serviceRequestsPerMonth: 1, // Monthly scheduled visit
      responseTimeHours: 48,
      materialDiscountPercent: 0, // Materials at cost (no markup)
      annualInspections: 12, // Monthly visits
      emergencyService: false,
      prioritySupport: true,
      dedicatedManager: false
    },
    isActive: true
  },
  {
    name: 'LANDED_PROPERTY',
    displayName: 'Landed Property Plan',
    description: 'Tailored maintenance for landed homes with expanded coverage areas',
    monthlyPrice: 40.00,
    yearlyPrice: 400.00, // 10 months pricing for yearly
    features: {
      serviceRequestsPerMonth: 1, // Monthly scheduled visit
      responseTimeHours: 48,
      materialDiscountPercent: 0, // Materials at cost (no markup)
      annualInspections: 12, // Monthly visits
      emergencyService: true,
      prioritySupport: true,
      dedicatedManager: false
    },
    isActive: true
  },
  {
    name: 'COMMERCIAL',
    displayName: 'Commercial Plan',
    description: 'Comprehensive facility upkeep with customized maintenance schedules',
    monthlyPrice: 50.00,
    yearlyPrice: 500.00, // 10 months pricing for yearly
    features: {
      serviceRequestsPerMonth: 1, // Monthly scheduled visit + on-demand
      responseTimeHours: 24,
      materialDiscountPercent: 0, // Materials at cost (no markup)
      annualInspections: 12, // Monthly visits
      emergencyService: true,
      prioritySupport: true,
      dedicatedManager: true
    },
    isActive: true
  }
];

const seedCustomerMembershipTiers = async () => {
  try {
    await connectDB();
    
    console.log('Seeding customer membership tiers...');
    
    // Clear existing customer membership tiers
    await MembershipTier.deleteMany({});
    console.log('Cleared existing customer membership tiers');
    
    // Insert new tiers
    for (const tierData of membershipTiers) {
      const tier = new MembershipTier(tierData);
      await tier.save();
      console.log(`✅ Created tier: ${tier.displayName} (${tier.name})`);
    }
    
    console.log(`\n🎉 Successfully seeded ${membershipTiers.length} customer membership tiers`);
    console.log('\nCustomer Membership Tiers Created:');
    console.log('┌─────────────┬────────────┬─────────────┬──────────────────┐');
    console.log('│    Tier     │  Monthly   │   Yearly    │ Service Requests │');
    console.log('├─────────────┼────────────┼─────────────┼──────────────────┤');
    
    membershipTiers.forEach(tier => {
      const monthly = `$${tier.monthlyPrice}`;
      const yearly = `$${tier.yearlyPrice}`;
      const requests = tier.features.serviceRequestsPerMonth === -1 ? 'Unlimited' : `${tier.features.serviceRequestsPerMonth}/month`;
      
      console.log(`│ ${tier.displayName.padEnd(11)} │ ${monthly.padEnd(10)} │ ${yearly.padEnd(11)} │ ${requests.padEnd(16)} │`);
    });
    
    console.log('└─────────────┴────────────┴─────────────┴──────────────────┘');
    
  } catch (error) {
    console.error('❌ Error seeding customer membership tiers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Database disconnected');
  }
};

// Run the seed function
seedCustomerMembershipTiers();