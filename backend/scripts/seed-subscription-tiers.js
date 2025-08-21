require('dotenv').config();
const mongoose = require('mongoose');
const { SubscriptionTier } = require('../models/CustomerSubscription');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swift-fix-pro');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const subscriptionTiers = [
  {
    propertyType: 'HDB',
    displayName: 'HDB Plan',
    monthlyPrice: 25,
    description: 'Affordable maintenance service for HDB residents',
    services: [
      'Monthly property inspection',
      'Basic plumbing services',
      'Electrical maintenance',
      'Air conditioning servicing',
      'General repairs',
      'Emergency support'
    ],
    isActive: true
  },
  {
    propertyType: 'CONDOMINIUM',
    displayName: 'Condominium Plan',
    monthlyPrice: 35,
    description: 'Comprehensive maintenance for condominium units',
    services: [
      'Bi-weekly property inspection',
      'Advanced plumbing services',
      'Electrical system maintenance',
      'Air conditioning servicing',
      'Appliance maintenance',
      'Interior repairs',
      'Priority emergency support'
    ],
    isActive: true
  },
  {
    propertyType: 'LANDED',
    displayName: 'Landed Property Plan',
    monthlyPrice: 40,
    description: 'Premium maintenance service for landed properties',
    services: [
      'Weekly property inspection',
      'Complete plumbing system care',
      'Electrical system maintenance',
      'HVAC system servicing',
      'Garden and exterior maintenance',
      'Roof and gutter cleaning',
      'Appliance maintenance',
      'Priority emergency support',
      'Seasonal deep cleaning'
    ],
    isActive: true
  },
  {
    propertyType: 'COMMERCIAL',
    displayName: 'Commercial Property Plan',
    monthlyPrice: 50,
    description: 'Professional maintenance for commercial properties',
    services: [
      'Daily property monitoring',
      'Commercial plumbing services',
      'Industrial electrical maintenance',
      'Commercial HVAC servicing',
      'Fire safety system checks',
      'Security system maintenance',
      'Facility deep cleaning',
      '24/7 emergency support',
      'Compliance reporting',
      'Equipment maintenance logs'
    ],
    isActive: true
  }
];

const seedSubscriptionTiers = async () => {
  try {
    await connectDB();
    
    console.log('Seeding customer subscription tiers...');
    
    await SubscriptionTier.deleteMany({});
    console.log('Cleared existing subscription tiers');
    
    for (const tierData of subscriptionTiers) {
      const tier = new SubscriptionTier(tierData);
      await tier.save();
      console.log(`✅ Created tier: ${tier.displayName} ($${tier.monthlyPrice}/month)`);
    }
    
    console.log(`\n🎉 Successfully seeded ${subscriptionTiers.length} subscription tiers`);
    console.log('\nCustomer Subscription Tiers Created:');
    console.log('┌─────────────────────┬─────────────┬──────────────────────────────────┐');
    console.log('│    Property Type    │   Monthly   │            Description           │');
    console.log('├─────────────────────┼─────────────┼──────────────────────────────────┤');
    
    subscriptionTiers.forEach(tier => {
      const type = tier.displayName.padEnd(19);
      const price = `$${tier.monthlyPrice}`.padEnd(11);
      const description = tier.description.padEnd(32);
      
      console.log(`│ ${type} │ ${price} │ ${description} │`);
    });
    
    console.log('└─────────────────────┴─────────────┴──────────────────────────────────┘');
    console.log('\n🌱 Social Impact: 1 free service for every 10 paid subscriptions');
    
  } catch (error) {
    console.error('❌ Error seeding subscription tiers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Database disconnected');
  }
};

seedSubscriptionTiers();