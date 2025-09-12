const mongoose = require('mongoose');
const { Commission, Referral } = require('./models/Referral');
require('dotenv').config();

async function cleanupIncorrectCommissions() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-maintenance');
    console.log('✅ Connected to MongoDB');

    // Find and remove the incorrect high-amount commissions
    const incorrectCommissions = await Commission.find({
      commissionAmount: { $gt: 10 } // Remove commissions greater than $10
    });

    console.log(`🗑️ Found ${incorrectCommissions.length} incorrect commission records to remove:`);
    incorrectCommissions.forEach(comm => {
      console.log(`  - Commission: $${comm.commissionAmount} (should be $5)`);
    });

    if (incorrectCommissions.length > 0) {
      // Remove incorrect commissions
      await Commission.deleteMany({
        commissionAmount: { $gt: 10 }
      });
      console.log('✅ Removed incorrect commission records');

      // Update referral earnings to reflect only correct commissions
      const referral = await Referral.findOne({ referralCode: 'REUS33CE' });
      if (referral) {
        // Recalculate totals based on remaining commissions
        const remainingCommissions = await Commission.find({ 
          referrer: referral.referrer 
        });
        
        const totalEarned = remainingCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
        const pendingEarned = remainingCommissions
          .filter(comm => comm.status === 'PENDING')
          .reduce((sum, comm) => sum + comm.commissionAmount, 0);

        referral.totalCommissionEarned = totalEarned;
        referral.pendingCommission = pendingEarned;
        await referral.save();

        console.log(`💰 Updated referral earnings: Total=$${totalEarned}, Pending=$${pendingEarned}`);
      }
    }

    // Show final state
    const finalCommissions = await Commission.find({}).populate('referrer referredUser', 'firstName lastName');
    console.log(`\n📊 Final commission records (${finalCommissions.length}):`);
    finalCommissions.forEach(comm => {
      console.log(`  - $${comm.commissionAmount} from ${comm.referredUser?.firstName} to ${comm.referrer?.firstName}`);
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

cleanupIncorrectCommissions();