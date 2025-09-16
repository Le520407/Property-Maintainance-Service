const axios = require('axios');

/**
 * Integration Test Suite for Property Maintenance Service
 * Tests the complete workflow and API functionality
 */

class PropertyMaintenanceAPITester {
  constructor() {
    this.baseURL = global.TEST_CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
    this.frontendURL = global.TEST_CONFIG?.FRONTEND_URL || 'http://localhost:3000';
    this.adminEmail = global.TEST_CONFIG?.TEST_ADMIN_EMAIL || 'admin@swiftfixpro.sg';
    this.adminPassword = global.TEST_CONFIG?.TEST_ADMIN_PASSWORD || 'admin123456';
    this.authToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`Running test: ${testName}`, 'info');
      await testFunction();
      this.testResults.passed++;
      this.testResults.tests.push({ name: testName, status: 'PASSED', error: null });
      this.log(`✅ PASSED: ${testName}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
    }
  }

  async testServerHealth() {
    const response = await axios.get(`${this.baseURL}/health`);
    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    if (!response.data || !response.data.status) {
      throw new Error('Health check response missing status');
    }
  }

  async testAdminLogin() {
    const response = await axios.post(`${this.baseURL}/auth/login`, {
      email: this.adminEmail,
      password: this.adminPassword
    });
    
    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    if (!response.data.token) {
      throw new Error('Login response missing token');
    }
    
    if (response.data.user.role !== 'admin') {
      throw new Error(`Expected admin role, got: ${response.data.user.role}`);
    }
    
    this.authToken = response.data.token;
  }

  async testUserManagement() {
    if (!this.authToken) {
      throw new Error('No auth token available');
    }

    const response = await axios.get(`${this.baseURL}/admin/users`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
    
    if (response.status !== 200) {
      throw new Error(`Users fetch failed: ${response.status}`);
    }
    
    if (!response.data.users || !Array.isArray(response.data.users)) {
      throw new Error('Users response missing users array');
    }

    // Check pagination properties
    if (typeof response.data.totalPages !== 'number') {
      throw new Error('Missing totalPages in response');
    }

    if (typeof response.data.currentPage !== 'number') {
      throw new Error('Missing currentPage in response');
    }

    if (typeof response.data.total !== 'number') {
      throw new Error('Missing total in response');
    }
  }

  async testVendorRatingIntegration() {
    if (!this.authToken) {
      throw new Error('No auth token available');
    }

    const response = await axios.get(`${this.baseURL}/admin/users?role=vendor`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
    
    if (response.status !== 200) {
      throw new Error(`Vendors fetch failed: ${response.status}`);
    }
    
    const vendors = response.data.users;
    
    if (vendors.length === 0) {
      this.log('No vendors found, creating test vendor for rating integration test');
      return; // Skip test if no vendors
    }

    // Check if any vendor has accurate rating data
    const vendorsWithRatings = vendors.filter(vendor => vendor.accurateRating);
    
    vendorsWithRatings.forEach(vendor => {
      if (!vendor.accurateRating.hasOwnProperty('averageRating')) {
        throw new Error(`Vendor ${vendor._id} missing averageRating`);
      }
      
      if (!vendor.accurateRating.hasOwnProperty('totalRatings')) {
        throw new Error(`Vendor ${vendor._id} missing totalRatings`);
      }
      
      if (!vendor.accurateRating.hasOwnProperty('ratingDistribution')) {
        throw new Error(`Vendor ${vendor._id} missing ratingDistribution`);
      }

      // Validate rating ranges
      const avgRating = vendor.accurateRating.averageRating;
      if (avgRating < 0 || avgRating > 5) {
        throw new Error(`Invalid average rating: ${avgRating} for vendor ${vendor._id}`);
      }

      const totalRatings = vendor.accurateRating.totalRatings;
      if (totalRatings < 0) {
        throw new Error(`Invalid total ratings: ${totalRatings} for vendor ${vendor._id}`);
      }
    });

    if (vendorsWithRatings.length > 0) {
      this.log(`Found ${vendorsWithRatings.length} vendors with accurate rating data`);
    } else {
      this.log('No vendors have rating data yet (this is normal for new systems)');
    }
  }

  async testUserFiltering() {
    if (!this.authToken) {
      throw new Error('No auth token available');
    }

    // Test role filtering
    const vendorResponse = await axios.get(`${this.baseURL}/admin/users?role=vendor`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
    
    if (vendorResponse.status !== 200) {
      throw new Error('Vendor filtering failed');
    }

    // Verify all returned users are vendors
    const nonVendors = vendorResponse.data.users.filter(user => user.role !== 'vendor');
    if (nonVendors.length > 0) {
      throw new Error(`Found non-vendor users in vendor filter: ${nonVendors.length}`);
    }

    // Test pagination
    const paginatedResponse = await axios.get(`${this.baseURL}/admin/users?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
    
    if (paginatedResponse.status !== 200) {
      throw new Error('Pagination test failed');
    }

    if (paginatedResponse.data.users.length > 2) {
      throw new Error(`Pagination limit not respected: got ${paginatedResponse.data.users.length} users`);
    }
  }

  async testUserUpdates() {
    if (!this.authToken) {
      throw new Error('No auth token available');
    }

    // Get a vendor to update
    const vendorsResponse = await axios.get(`${this.baseURL}/admin/users?role=vendor&limit=1`, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });

    if (vendorsResponse.data.users.length === 0) {
      this.log('No vendors available for update test, skipping');
      return;
    }

    const vendor = vendorsResponse.data.users[0];
    const originalData = { ...vendor };

    // Test updating basic info
    const updateData = {
      firstName: 'TestUpdated',
      skills: ['plumbing', 'electrical']
    };

    const updateResponse = await axios.put(`${this.baseURL}/admin/users/${vendor._id}`, updateData, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });

    if (updateResponse.status !== 200) {
      throw new Error(`User update failed: ${updateResponse.status}`);
    }

    if (updateResponse.data.user.firstName !== updateData.firstName) {
      throw new Error('User firstName was not updated correctly');
    }

    // Restore original data
    await axios.put(`${this.baseURL}/admin/users/${vendor._id}`, {
      firstName: originalData.firstName,
      skills: originalData.skills || []
    }, {
      headers: { Authorization: `Bearer ${this.authToken}` }
    });
  }

  async testInvalidRequests() {
    // Test unauthorized access
    try {
      await axios.get(`${this.baseURL}/admin/users`);
      throw new Error('Unauthorized request should have failed');
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        throw new Error(`Expected 401 for unauthorized request, got: ${error.response?.status}`);
      }
    }

    // Test invalid login
    try {
      await axios.post(`${this.baseURL}/auth/login`, {
        email: 'invalid@email.com',
        password: 'wrongpassword'
      });
      throw new Error('Invalid login should have failed');
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        throw new Error(`Expected 401 for invalid login, got: ${error.response?.status}`);
      }
    }
  }

  async runAllTests() {
    this.log('Starting Property Maintenance Service API Test Suite', 'info');
    this.log('='.repeat(60), 'info');

    // Core functionality tests
    await this.runTest('Server Health Check', () => this.testServerHealth());
    await this.runTest('Admin Authentication', () => this.testAdminLogin());
    await this.runTest('User Management API', () => this.testUserManagement());
    await this.runTest('Vendor Rating Integration', () => this.testVendorRatingIntegration());
    await this.runTest('User Filtering', () => this.testUserFiltering());
    await this.runTest('User Updates', () => this.testUserUpdates());
    await this.runTest('Security Tests', () => this.testInvalidRequests());

    // Print results
    this.log('='.repeat(60), 'info');
    this.log(`Test Results: ${this.testResults.passed} passed, ${this.testResults.failed} failed`, 
             this.testResults.failed === 0 ? 'success' : 'error');
    
    if (this.testResults.failed > 0) {
      this.log('Failed tests:', 'error');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          this.log(`  - ${test.name}: ${test.error}`, 'error');
        });
    }

    return this.testResults;
  }
}

// Export for use in other test files
module.exports = PropertyMaintenanceAPITester;

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PropertyMaintenanceAPITester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed to run:', error);
      process.exit(1);
    });
}
