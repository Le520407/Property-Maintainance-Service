const mongoose = require('mongoose');
require('dotenv').config();
const { SubscriptionTier } = require('../models/CustomerSubscription');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const updateSubscriptionTiers = async () => {
  try {
    await connectDB();

    // Update existing tiers to include yearly pricing
    const tiers = await SubscriptionTier.find();
    
    for (const tier of tiers) {
      if (!tier.yearlyPrice) {
        tier.yearlyPrice = tier.monthlyPrice * 10; // 10x monthly price (2 months free)
        await tier.save();
        console.log(`Updated ${tier.propertyType} tier with yearly price: $${tier.yearlyPrice}`);
      }
    }

    // If no tiers exist, create sample tiers
    if (tiers.length === 0) {
      const sampleTiers = [
        {
          propertyType: 'HDB',
          displayName: 'HDB Maintenance',
          monthlyPrice: 89,
          yearlyPrice: 890, // 10x monthly (2 months free)
          description: 'Comprehensive maintenance for HDB flats',
          services: [
            'Monthly HVAC check',
            'Plumbing inspection',
            'Electrical safety check',
            'General repairs',
            'Emergency support'
          ],
          isActive: true
        },
        {
          propertyType: 'CONDOMINIUM',
          displayName: 'Condominium Care',
          monthlyPrice: 129,
          yearlyPrice: 1290,
          description: 'Premium maintenance for condominiums',
          services: [
            'Bi-weekly HVAC service',
            'Advanced plumbing maintenance',
            'Electrical system monitoring',
            'Appliance servicing',
            'Priority emergency support',
            'Pest control'
          ],
          isActive: true
        },
        {
          propertyType: 'LANDED',
          displayName: 'Landed Property Pro',
          monthlyPrice: 199,
          yearlyPrice: 1990,
          description: 'Complete care for landed properties',
          services: [
            'Weekly property inspection',
            'Garden maintenance',
            'Pool maintenance',
            'Security system checks',
            'Full electrical & plumbing service',
            'HVAC optimization',
            'Emergency response'
          ],
          isActive: true
        },
        {
          propertyType: 'COMMERCIAL',
          displayName: 'Commercial Solutions',
          monthlyPrice: 349,
          yearlyPrice: 3490,
          description: 'Professional maintenance for commercial spaces',
          services: [
            'Daily facility checks',
            'Commercial HVAC service',
            'Fire safety compliance',
            'Electrical maintenance',
            'Cleaning coordination',
            'Equipment servicing',
            '24/7 support'
          ],
          isActive: true
        }
      ];

      await SubscriptionTier.insertMany(sampleTiers);
      console.log('Created sample subscription tiers with yearly pricing');
    }

    console.log('Subscription tiers updated successfully!');
    
    // Display current tiers
    const updatedTiers = await SubscriptionTier.find().sort({ monthlyPrice: 1 });
    console.log('\nCurrent Subscription Tiers:');
    updatedTiers.forEach(tier => {
      const savings = (tier.monthlyPrice * 12) - tier.yearlyPrice;
      const discount = Math.round((savings / (tier.monthlyPrice * 12)) * 100);
      console.log(`${tier.propertyType}: Monthly $${tier.monthlyPrice}, Yearly $${tier.yearlyPrice} (Save $${savings} - ${discount}% discount)`);
    });

  } catch (error) {
    console.error('Error updating subscription tiers:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
updateSubscriptionTiers();
