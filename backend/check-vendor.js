const mongoose = require('mongoose');
require('./config/database');
const User = require('./models/User');
const Vendor = require('./models/Vendor');

mongoose.connection.once('open', async () => {
    try {
        const user = await User.findOne({email: 'testvendor@test.com'});
        console.log('User:', user ? {id: user._id, email: user.email, role: user.role} : 'Not found');
        
        if (user) {
            const vendor = await Vendor.findOne({userId: user._id});
            console.log('Vendor profile:', vendor ? 'Found' : 'Not found');
            
            if (!vendor) {
                console.log('Creating vendor profile...');
                const newVendor = new Vendor({
                    userId: user._id,
                    serviceCategories: ['maintenance'],
                    serviceArea: 'Singapore',
                    companyName: 'Test Vendor Services',
                    description: 'Test vendor for development',
                    verificationStatus: 'VERIFIED'
                });
                await newVendor.save();
                console.log('✅ Vendor profile created');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
});
