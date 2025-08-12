const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/User');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== USERS WITH ENCRYPTED PASSWORDS ===');
    const users = await User.find().select('firstName lastName email role password status');
    
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log(`Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'No password'}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUsers();