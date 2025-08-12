const mongoose = require('mongoose');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
require('dotenv').config();

const fixVendorProfiles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all vendor users
    const vendorUsers = await User.find({ role: 'vendor' });
    console.log('Found vendor users:', vendorUsers.length);
    
    for (const user of vendorUsers) {
      console.log('Checking user:', user.email, user._id);
      
      // Check if vendor profile exists
      let vendor = await Vendor.findOne({ userId: user._id });
      if (!vendor) {
        console.log('Creating vendor profile for:', user.email);
        
        vendor = await Vendor.create({
          userId: user._id,
          companyName: (user.firstName + ' ' + user.lastName + ' Services') || 'Professional Services',
          description: 'Professional maintenance services',
          serviceCategories: ['plumbing', 'electrical'],
          serviceArea: user.city || 'Singapore',
          teamSize: '1-5',
          verificationStatus: 'VERIFIED',
          isActive: true,
          servicePackages: [],
          priceLists: [],
          availabilitySchedule: []
        });
        
        console.log('✅ Created vendor profile:', vendor._id);
      } else {
        console.log('✅ Vendor profile already exists:', vendor._id);
      }
    }
    
    console.log('🎉 All vendor profiles are ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixVendorProfiles();