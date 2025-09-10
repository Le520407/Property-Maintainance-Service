const mongoose = require('mongoose');
require('dotenv').config();

async function checkMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const { CustomerMembership } = require('../models/CustomerMembership');
    
    const memberships = await CustomerMembership.find({})
      .populate('tier', 'name')
      .select('customer status hitpayRecurringBillingId hitpayPlanId paymentMethod cancelledAt endDate createdAt')
      .sort({ createdAt: -1 });
    
    console.log('🔍 Current memberships:');
    memberships.forEach((m, i) => {
      console.log(`${i+1}. Customer: ${m.customer}`);
      console.log(`   Status: ${m.status}`);
      console.log(`   Payment Method: ${m.paymentMethod}`);
      console.log(`   HitPay Billing ID: ${m.hitpayRecurringBillingId || 'N/A'}`);
      console.log(`   HitPay Plan ID: ${m.hitpayPlanId || 'N/A'}`);
      console.log(`   Cancelled At: ${m.cancelledAt || 'N/A'}`);
      console.log(`   End Date: ${m.endDate}`);
      console.log(`   Created: ${m.createdAt}`);
      console.log('   ---');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMemberships();
