#!/usr/bin/env node

/**
 * Test Environment Setup Script
 * Prepares the system for comprehensive testing
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestSetup {
  constructor() {
    this.testDir = __dirname;
    this.rootDir = path.dirname(this.testDir);
    this.backendDir = path.join(this.rootDir, 'backend');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runCommand(command, cwd = this.testDir) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async checkNode() {
    try {
      const { stdout } = await this.runCommand('node --version');
      this.log(`Node.js version: ${stdout.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log('Node.js is not installed or not in PATH', 'error');
      return false;
    }
  }

  async checkNpm() {
    try {
      const { stdout } = await this.runCommand('npm --version');
      this.log(`npm version: ${stdout.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log('npm is not installed or not in PATH', 'error');
      return false;
    }
  }

  async installTestDependencies() {
    this.log('Installing test dependencies...', 'info');
    
    try {
      await this.runCommand('npm install');
      this.log('Test dependencies installed successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to install test dependencies: ${error.message}`, 'error');
      return false;
    }
  }

  async checkBackendPackages() {
    this.log('Checking backend package.json...', 'info');
    
    const backendPackageJson = path.join(this.backendDir, 'package.json');
    
    if (!fs.existsSync(backendPackageJson)) {
      this.log('Backend package.json not found', 'error');
      return false;
    }

    try {
      const packageData = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
      const requiredDeps = ['express', 'mongoose', 'jsonwebtoken', 'bcryptjs'];
      const missingDeps = [];

      requiredDeps.forEach(dep => {
        if (!packageData.dependencies || !packageData.dependencies[dep]) {
          missingDeps.push(dep);
        }
      });

      if (missingDeps.length > 0) {
        this.log(`Missing backend dependencies: ${missingDeps.join(', ')}`, 'warning');
        return false;
      }

      this.log('Backend dependencies check passed', 'success');
      return true;
    } catch (error) {
      this.log(`Error reading backend package.json: ${error.message}`, 'error');
      return false;
    }
  }

  async checkBackendServer() {
    this.log('Checking if backend server is accessible...', 'info');
    
    try {
      const axios = require('axios');
      await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
      this.log('Backend server is running on port 5000', 'success');
      return true;
    } catch (error) {
      this.log('Backend server is not running on port 5000', 'warning');
      this.log('You may need to start the backend server before running tests', 'warning');
      return false;
    }
  }

  async checkFrontendServer() {
    this.log('Checking if frontend server is accessible...', 'info');
    
    try {
      const axios = require('axios');
      await axios.get('http://localhost:3000', { timeout: 5000 });
      this.log('Frontend server is running on port 3000', 'success');
      return true;
    } catch (error) {
      this.log('Frontend server is not running on port 3000', 'warning');
      this.log('Website tests will be skipped during test execution', 'warning');
      return false;
    }
  }

  async createTestData() {
    this.log('Creating test data configuration...', 'info');
    
    const testDataConfig = {
      testUser: {
        email: 'test@admin.com',
        password: 'test123',
        role: 'admin'
      },
      testVendor: {
        email: 'vendor@test.com',
        password: 'vendor123',
        role: 'vendor',
        skills: ['Plumbing', 'Electrical', 'Carpentry']
      },
      testCustomer: {
        email: 'customer@test.com',
        password: 'customer123',
        role: 'customer'
      },
      baseUrls: {
        backend: 'http://localhost:5000',
        frontend: 'http://localhost:3000'
      },
      testTimeouts: {
        api: 10000,
        page: 30000,
        element: 5000
      }
    };

    const configPath = path.join(this.testDir, 'test-config.json');
    fs.writeFileSync(configPath, JSON.stringify(testDataConfig, null, 2));
    this.log('Test configuration created successfully', 'success');
    
    return true;
  }

  async generateReadme() {
    const readmeContent = `# Property Maintenance Service - Testing Suite

## Overview
Comprehensive testing suite for the Property Maintenance Service to validate deployment readiness.

## Prerequisites
- Node.js and npm installed
- Backend server running on port 5000
- Frontend server running on port 3000 (optional, for website tests)

## Quick Start

### 1. Install Dependencies
\`\`\`bash
cd tests
npm install
\`\`\`

### 2. Start Servers
Before running tests, ensure both servers are running:

**Backend:**
\`\`\`bash
cd backend
npm start
\`\`\`

**Frontend:**
\`\`\`bash
npm start
\`\`\`

### 3. Run All Tests
\`\`\`bash
# Run complete test suite
node run-all-tests.js

# Or run specific test categories
npm run test:backend
npm run test:frontend
npm run test:integration
\`\`\`

## Test Categories

### API Tests (\`integration/api-tests.js\`)
- Authentication endpoints
- User management
- Rating system
- Admin functionality

### Website Tests (\`integration/website-tests.js\`)
- Page loading
- User interface
- Responsive design
- Performance metrics

### Backend Unit Tests (\`backend/\`)
- Authentication logic
- Admin functions
- Rating calculations

## Test Configuration
Test settings are stored in \`test-config.json\` and can be modified as needed.

## Interpreting Results
- ✅ All tests passed: Ready for deployment
- ⚠️ Minor failures: Review and fix issues
- ❌ Major failures: Not ready for deployment

## Troubleshooting
1. Ensure both servers are running
2. Check network connectivity
3. Verify database connection
4. Review test logs for specific errors

Generated on: ${new Date().toISOString()}
`;

    const readmePath = path.join(this.testDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);
    this.log('Test documentation created successfully', 'success');
  }

  async setup() {
    this.log('🔧 Setting up Property Maintenance Service Test Environment', 'info');
    this.log('='.repeat(70), 'info');

    const checks = {
      node: await this.checkNode(),
      npm: await this.checkNpm(),
      testDeps: false,
      backendDeps: await this.checkBackendPackages(),
      backend: false,
      frontend: false
    };

    if (checks.node && checks.npm) {
      checks.testDeps = await this.installTestDependencies();
    }

    // Only check servers if test dependencies are installed
    if (checks.testDeps) {
      checks.backend = await this.checkBackendServer();
      checks.frontend = await this.checkFrontendServer();
    }

    // Create test configuration and documentation
    await this.createTestData();
    await this.generateReadme();

    this.log('', 'info');
    this.log('='.repeat(70), 'info');
    this.log('SETUP SUMMARY:', 'info');
    this.log(`  ✅ Node.js: ${checks.node ? 'Ready' : 'Missing'}`, checks.node ? 'success' : 'error');
    this.log(`  ✅ npm: ${checks.npm ? 'Ready' : 'Missing'}`, checks.npm ? 'success' : 'error');
    this.log(`  ✅ Test Dependencies: ${checks.testDeps ? 'Installed' : 'Failed'}`, checks.testDeps ? 'success' : 'error');
    this.log(`  ✅ Backend Dependencies: ${checks.backendDeps ? 'Ready' : 'Issues'}`, checks.backendDeps ? 'success' : 'warning');
    this.log(`  ✅ Backend Server: ${checks.backend ? 'Running' : 'Not Running'}`, checks.backend ? 'success' : 'warning');
    this.log(`  ✅ Frontend Server: ${checks.frontend ? 'Running' : 'Not Running'}`, checks.frontend ? 'success' : 'warning');

    this.log('', 'info');
    
    if (checks.testDeps && checks.backend) {
      this.log('🎉 Setup complete! You can now run tests:', 'success');
      this.log('   node run-all-tests.js', 'info');
    } else {
      this.log('⚠️ Setup completed with warnings. Address the issues above before testing.', 'warning');
    }
    
    this.log('='.repeat(70), 'info');

    return checks;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new TestSetup();
  setup.setup()
    .then(results => {
      const allCritical = results.node && results.npm && results.testDeps;
      process.exit(allCritical ? 0 : 1);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = TestSetup;
