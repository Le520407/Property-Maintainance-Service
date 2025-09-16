const PropertyMaintenanceAPITester = require('./integration/api-tests');
const PropertyMaintenanceWebsiteTester = require('./integration/website-tests');

/**
 * Master Test Runner for Property Maintenance Service
 * Coordinates and runs all test suites
 */

class MasterTestRunner {
  constructor() {
    this.results = {
      api: null,
      website: null,
      overall: {
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...');
    
    const axios = require('axios');
    
    // Check if backend is running
    try {
      const backendResponse = await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
      if (backendResponse.status === 200) {
        this.log('✅ Backend server is running on port 5000');
      } else {
        throw new Error(`Backend health check returned status: ${backendResponse.status}`);
      }
    } catch (error) {
      this.log('❌ Backend server is not accessible on port 5000', 'error');
      this.log('Please ensure the backend server is running before running tests', 'error');
      throw new Error('Backend server prerequisite failed');
    }

    // Check if frontend is running
    try {
      const frontendResponse = await axios.get('http://localhost:3000', { timeout: 10000 });
      if (frontendResponse.status === 200) {
        this.log('✅ Frontend server is running on port 3000');
      } else {
        throw new Error(`Frontend returned status: ${frontendResponse.status}`);
      }
    } catch (error) {
      this.log('⚠️ Frontend server is not accessible on port 3000', 'warning');
      this.log('Website tests will be skipped', 'warning');
      return { frontend: false, backend: true };
    }

    return { frontend: true, backend: true };
  }

  async runAPITests() {
    this.log('Starting API Test Suite...', 'info');
    const apiTester = new PropertyMaintenanceAPITester();
    this.results.api = await apiTester.runAllTests();
    return this.results.api;
  }

  async runWebsiteTests() {
    this.log('Starting Website Test Suite...', 'info');
    const websiteTester = new PropertyMaintenanceWebsiteTester();
    this.results.website = await websiteTester.runAllTests();
    return this.results.website;
  }

  generateReport() {
    this.log('', 'info');
    this.log('='.repeat(80), 'info');
    this.log('PROPERTY MAINTENANCE SERVICE - COMPLETE TEST REPORT', 'info');
    this.log('='.repeat(80), 'info');

    // API Test Results
    if (this.results.api) {
      this.log('', 'info');
      this.log('📡 API TESTS:', 'info');
      this.log(`   Passed: ${this.results.api.passed}`, 'success');
      this.log(`   Failed: ${this.results.api.failed}`, this.results.api.failed > 0 ? 'error' : 'info');
      
      if (this.results.api.failed > 0) {
        this.log('   Failed API Tests:', 'error');
        this.results.api.tests
          .filter(test => test.status === 'FAILED')
          .forEach(test => {
            this.log(`     - ${test.name}: ${test.error}`, 'error');
          });
      }
    }

    // Website Test Results
    if (this.results.website) {
      this.log('', 'info');
      this.log('🌐 WEBSITE TESTS:', 'info');
      this.log(`   Passed: ${this.results.website.passed}`, 'success');
      this.log(`   Failed: ${this.results.website.failed}`, this.results.website.failed > 0 ? 'error' : 'info');
      
      if (this.results.website.failed > 0) {
        this.log('   Failed Website Tests:', 'error');
        this.results.website.tests
          .filter(test => test.status === 'FAILED')
          .forEach(test => {
            this.log(`     - ${test.name}: ${test.error}`, 'error');
          });
      }
    }

    // Overall Results
    this.results.overall.passed = (this.results.api?.passed || 0) + (this.results.website?.passed || 0);
    this.results.overall.failed = (this.results.api?.failed || 0) + (this.results.website?.failed || 0);

    this.log('', 'info');
    this.log('📊 OVERALL RESULTS:', 'info');
    this.log(`   Total Tests: ${this.results.overall.passed + this.results.overall.failed}`, 'info');
    this.log(`   Passed: ${this.results.overall.passed}`, 'success');
    this.log(`   Failed: ${this.results.overall.failed}`, this.results.overall.failed > 0 ? 'error' : 'success');
    this.log(`   Success Rate: ${this.results.overall.passed + this.results.overall.failed > 0 ? 
      Math.round((this.results.overall.passed / (this.results.overall.passed + this.results.overall.failed)) * 100) : 0}%`, 
      this.results.overall.failed === 0 ? 'success' : 'warning');
    this.log(`   Duration: ${this.results.overall.duration}ms`, 'info');

    // Deployment Readiness Assessment
    this.log('', 'info');
    this.log('🚀 DEPLOYMENT READINESS ASSESSMENT:', 'info');
    
    if (this.results.overall.failed === 0) {
      this.log('   Status: ✅ READY FOR DEPLOYMENT', 'success');
      this.log('   All critical systems are functioning correctly', 'success');
    } else if (this.results.overall.failed <= 2 && this.results.overall.passed >= 5) {
      this.log('   Status: ⚠️ CONDITIONALLY READY', 'warning');
      this.log('   Minor issues detected, review failed tests', 'warning');
    } else {
      this.log('   Status: ❌ NOT READY FOR DEPLOYMENT', 'error');
      this.log('   Critical issues detected, address failed tests', 'error');
    }

    this.log('='.repeat(80), 'info');
  }

  async runAllTests() {
    const startTime = Date.now();
    
    this.log('🧪 Property Maintenance Service - Complete Test Suite', 'info');
    this.log('Starting comprehensive testing for deployment readiness...', 'info');
    
    try {
      // Check prerequisites
      const prerequisites = await this.checkPrerequisites();
      
      // Run API tests (always required)
      await this.runAPITests();
      
      // Run website tests if frontend is available
      if (prerequisites.frontend) {
        await this.runWebsiteTests();
      } else {
        this.log('Skipping website tests due to frontend not being accessible', 'warning');
      }
      
      this.results.overall.duration = Date.now() - startTime;
      
      // Generate final report
      this.generateReport();
      
      return this.results;
      
    } catch (error) {
      this.log(`Test suite execution failed: ${error.message}`, 'error');
      this.results.overall.failed = 999; // Indicate critical failure
      return this.results;
    }
  }
}

// Export for use in other files
module.exports = MasterTestRunner;

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.runAllTests()
    .then(results => {
      const exitCode = results.overall.failed === 0 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Master test runner failed:', error);
      process.exit(1);
    });
}
