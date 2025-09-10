#!/usr/bin/env node

/**
 * Test script for subscription cancellation status flow
 * 
 * This script tests the new cancellation logic:
 * 1. Active -> Cancelled (with access until period end)
 * 2. Cancelled -> Expired (when period ends)
 * 
 * Usage: node scripts/test-cancellation-flow.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { CustomerMembership, MembershipTier } = require('../models/CustomerMembership');
const { User } = require('../models/User');
const membershipService = require('../services/membershipService');
const MembershipExpirationService = require('../services/membershipExpirationService');

async function testCancellationFlow() {
  try {
    console.log('🧪 Testing subscription cancellation status flow...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find or create a test user
    let testUser = await User.findOne({ email: 'test.cancellation@example.com' });
    if (!testUser) {
      testUser = new User({
        email: 'test.cancellation@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword123',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });
      await testUser.save();
      console.log('✅ Created test user');
    }
    
    // Find or create a test tier
    let testTier = await MembershipTier.findOne({ name: 'HDB' });
    if (!testTier) {
      testTier = new MembershipTier({
        name: 'HDB',
        displayName: 'HDB Package',
        description: 'Basic package for HDB units',
        monthlyPrice: 50,
        yearlyPrice: 500,
        features: {
          serviceRequestsPerMonth: 3,
          responseTimeHours: 48,
          materialDiscountPercent: 5,
          annualInspections: 1,
          emergencyService: false,
          prioritySupport: false,
          dedicatedManager: false
        }
      });
      await testTier.save();
      console.log('✅ Created test tier');
    }
    
    // Clean up any existing test membership
    await CustomerMembership.deleteMany({ customer: testUser._id });
    
    // Create a test membership
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days from now
    
    const testMembership = new CustomerMembership({
      customer: testUser._id,
      tier: testTier._id,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      monthlyPrice: testTier.monthlyPrice,
      currentPrice: testTier.monthlyPrice,
      startDate: new Date(),
      endDate: endDate,
      nextBillingDate: endDate,
      autoRenew: true,
      paymentMethod: 'HITPAY',
      hitpayRecurringBillingId: 'test_billing_123',
      hitpayPlanId: 'test_plan_123'
    });
    
    await testMembership.save();
    console.log('✅ Created test membership with ACTIVE status');
    
    // Test 1: Check initial access
    console.log('\n🔍 Test 1: Initial access check');
    console.log('   Status:', testMembership.status);
    console.log('   Has Active Access:', testMembership.hasActiveAccess());
    console.log('   Can Create Service:', testMembership.canCreateServiceRequest());
    
    const accessStatus = testMembership.getAccessStatus();
    console.log('   Access Status:', accessStatus);
    
    // Test 2: Cancel membership (end of period)
    console.log('\n🔍 Test 2: Cancel membership (end of period)');
    const cancelledMembership = await membershipService.cancelMembership(testUser._id, false);
    
    console.log('   Status after cancellation:', cancelledMembership.status);
    console.log('   Has Active Access:', cancelledMembership.hasActiveAccess());
    console.log('   Can Create Service:', cancelledMembership.canCreateServiceRequest());
    console.log('   Cancelled At:', cancelledMembership.cancelledAt);
    console.log('   Will Expire At:', cancelledMembership.willExpireAt);
    console.log('   Auto Renew:', cancelledMembership.autoRenew);
    
    const cancelledAccessStatus = cancelledMembership.getAccessStatus();
    console.log('   Access Status:', cancelledAccessStatus);
    
    // Test 3: Simulate time passing (set end date to past)
    console.log('\n🔍 Test 3: Simulate period expiration');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // 1 day ago
    
    cancelledMembership.endDate = pastDate;
    cancelledMembership.willExpireAt = pastDate;
    await cancelledMembership.save();
    
    console.log('   End date set to:', pastDate);
    console.log('   Has Active Access (after period end):', cancelledMembership.hasActiveAccess());
    console.log('   Can Create Service (after period end):', cancelledMembership.canCreateServiceRequest());
    
    const expiredAccessStatus = cancelledMembership.getAccessStatus();
    console.log('   Access Status (after period end):', expiredAccessStatus);
    
    // Test 4: Run expiration service
    console.log('\n🔍 Test 4: Run expiration service');
    const expirationResult = await MembershipExpirationService.processExpiredMemberships();
    console.log('   Expiration result:', expirationResult);
    
    // Check final status
    const finalMembership = await CustomerMembership.findById(cancelledMembership._id);
    console.log('   Final status:', finalMembership.status);
    console.log('   Expired at:', finalMembership.expiredAt);
    console.log('   Has Active Access (final):', finalMembership.hasActiveAccess());
    console.log('   Can Create Service (final):', finalMembership.canCreateServiceRequest());
    
    const finalAccessStatus = finalMembership.getAccessStatus();
    console.log('   Final Access Status:', finalAccessStatus);
    
    // Test 5: Test immediate cancellation
    console.log('\n🔍 Test 5: Test immediate cancellation');
    
    // Create another test membership for immediate cancellation
    const immediateMembership = new CustomerMembership({
      customer: testUser._id,
      tier: testTier._id,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      monthlyPrice: testTier.monthlyPrice,
      currentPrice: testTier.monthlyPrice,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      paymentMethod: 'HITPAY',
      hitpayRecurringBillingId: 'test_billing_456',
      hitpayPlanId: 'test_plan_456'
    });
    
    await immediateMembership.save();
    
    // Cancel immediately
    const immediatelyCancelled = await membershipService.cancelMembership(testUser._id, true);
    
    console.log('   Status after immediate cancellation:', immediatelyCancelled.status);
    console.log('   Has Active Access:', immediatelyCancelled.hasActiveAccess());
    console.log('   Can Create Service:', immediatelyCancelled.canCreateServiceRequest());
    console.log('   End date:', immediatelyCancelled.endDate);
    
    const immediateAccessStatus = immediatelyCancelled.getAccessStatus();
    console.log('   Access Status:', immediateAccessStatus);
    
    console.log('\n🎯 All cancellation flow tests completed successfully!');
    
    // Cleanup
    await CustomerMembership.deleteMany({ customer: testUser._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('🧹 Cleanup completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
if (require.main === module) {
  testCancellationFlow();
}

module.exports = { testCancellationFlow };
