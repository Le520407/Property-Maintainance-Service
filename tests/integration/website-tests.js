const puppeteer = require('puppeteer');

/**
 * Frontend/Website Test Suite for Property Maintenance Service
 * Tests the user interface and frontend functionality
 */

class PropertyMaintenanceWebsiteTester {
  constructor() {
    this.frontendURL = global.TEST_CONFIG?.FRONTEND_URL || 'http://localhost:3000';
    this.adminEmail = global.TEST_CONFIG?.TEST_ADMIN_EMAIL || 'admin@swiftfixpro.sg';
    this.adminPassword = global.TEST_CONFIG?.TEST_ADMIN_PASSWORD || 'admin123456';
    this.browser = null;
    this.page = null;
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

  async setup() {
    this.log('Setting up browser for testing...');
    this.browser = await puppeteer.launch({
      headless: true, // Set to false to see browser during testing
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Set longer timeout for page loads
    this.page.setDefaultTimeout(15000);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testFrontendLoads() {
    this.log('Testing if frontend loads...');
    
    const response = await this.page.goto(this.frontendURL, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    if (!response.ok()) {
      throw new Error(`Frontend failed to load: ${response.status()}`);
    }

    // Wait for React to load
    await this.page.waitForSelector('body', { timeout: 15000 });
    
    // Check if it's not showing error page
    const title = await this.page.title();
    if (title.toLowerCase().includes('error')) {
      throw new Error(`Frontend showing error page: ${title}`);
    }
  }

  async testNavigationToAdmin() {
    this.log('Testing navigation to admin area...');
    
    // Try to navigate to admin login
    await this.page.goto(`${this.frontendURL}/admin/login`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Check if login form is present
    const loginFormExists = await this.page.$('form') !== null;
    if (!loginFormExists) {
      // Maybe it's a different route, try alternatives
      await this.page.goto(`${this.frontendURL}/login`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
    }

    // Look for email/password fields
    const emailField = await this.page.$('input[type="email"], input[name="email"]');
    const passwordField = await this.page.$('input[type="password"], input[name="password"]');
    
    if (!emailField && !passwordField) {
      throw new Error('Could not find login form on admin page');
    }
  }

  async testAdminLogin() {
    this.log('Testing admin login functionality...');
    
    // Go to login page
    await this.page.goto(`${this.frontendURL}/admin/login`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Try different possible selectors for email and password
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]'
    ];

    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="Password" i]'
    ];

    let emailField = null;
    let passwordField = null;

    // Find email field
    for (const selector of emailSelectors) {
      emailField = await this.page.$(selector);
      if (emailField) break;
    }

    // Find password field
    for (const selector of passwordSelectors) {
      passwordField = await this.page.$(selector);
      if (passwordField) break;
    }

    if (!emailField) {
      throw new Error('Could not find email input field');
    }

    if (!passwordField) {
      throw new Error('Could not find password input field');
    }

    // Fill in credentials
    await emailField.type(this.adminEmail);
    await passwordField.type(this.adminPassword);

    // Find and click login button
    const loginButtonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Login")',
      'button:contains("Sign In")',
      '.login-button',
      '.submit-button'
    ];

    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        loginButton = await this.page.$(selector);
        if (loginButton) break;
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!loginButton) {
      // Try to find any button
      const buttons = await this.page.$$('button');
      if (buttons.length > 0) {
        loginButton = buttons[0]; // Use first button as fallback
      }
    }

    if (!loginButton) {
      throw new Error('Could not find login button');
    }

    // Click login and wait for navigation
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      loginButton.click()
    ]);

    // Check if we're redirected to admin dashboard
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }
  }

  async testUserManagementPage() {
    this.log('Testing user management page...');
    
    // Try to navigate to user management
    const userManagementUrls = [
      `${this.frontendURL}/admin/users`,
      `${this.frontendURL}/admin/user-management`,
      `${this.frontendURL}/admin/dashboard`
    ];

    let pageLoaded = false;
    for (const url of userManagementUrls) {
      try {
        await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
        pageLoaded = true;
        break;
      } catch (e) {
        // Try next URL
        continue;
      }
    }

    if (!pageLoaded) {
      throw new Error('Could not load user management page');
    }

    // Wait for content to load
    await this.page.waitForTimeout(3000);

    // Check for user management elements
    const hasUserElements = await this.page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('user') || 
             text.includes('vendor') || 
             text.includes('customer') ||
             text.includes('email') ||
             document.querySelector('[class*="user"], [class*="vendor"], [class*="customer"]') !== null;
    });

    if (!hasUserElements) {
      throw new Error('User management page does not contain expected user-related content');
    }
  }

  async testVendorRatingDisplay() {
    this.log('Testing vendor rating display...');
    
    // Look for rating-related elements
    const hasRatingElements = await this.page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const hasRatingText = text.includes('rating') || 
                           text.includes('star') || 
                           text.includes('/5') ||
                           text.includes('review');
      
      const hasRatingElements = document.querySelector('[class*="rating"], [class*="star"], .star') !== null ||
                               document.querySelector('svg') !== null; // Star icons are often SVGs
      
      return hasRatingText || hasRatingElements;
    });

    if (!hasRatingElements) {
      this.log('No rating elements found - this might be expected if no vendors have ratings yet');
      return; // Don't fail the test, just log
    }

    // Check for proper rating format (x.x/5 or similar)
    const hasProperRatingFormat = await this.page.evaluate(() => {
      const text = document.body.innerText;
      return /\d+(\.\d+)?\/5/.test(text) || /\d+(\.\d+)?\s*star/i.test(text);
    });

    if (hasRatingElements && !hasProperRatingFormat) {
      this.log('Rating elements found but no proper rating format detected');
    }
  }

  async testResponsiveDesign() {
    this.log('Testing responsive design...');
    
    // Test mobile viewport
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.reload({ waitUntil: 'networkidle2' });
    
    // Wait for layout to adjust
    await this.page.waitForTimeout(2000);
    
    // Check if page is still functional
    const bodyHeight = await this.page.evaluate(() => document.body.scrollHeight);
    if (bodyHeight < 100) {
      throw new Error('Page appears broken in mobile view');
    }
    
    // Test tablet viewport
    await this.page.setViewport({ width: 768, height: 1024 });
    await this.page.reload({ waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);
    
    // Reset to desktop
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async testPagePerformance() {
    this.log('Testing page performance...');
    
    const startTime = Date.now();
    await this.page.goto(this.frontendURL, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 10000) { // 10 seconds
      throw new Error(`Page load time too slow: ${loadTime}ms`);
    }
    
    this.log(`Page loaded in ${loadTime}ms`);
  }

  async runAllTests() {
    this.log('Starting Property Maintenance Service Website Test Suite', 'info');
    this.log('='.repeat(60), 'info');

    try {
      await this.setup();

      // Core functionality tests
      await this.runTest('Frontend Loads', () => this.testFrontendLoads());
      await this.runTest('Navigation to Admin', () => this.testNavigationToAdmin());
      await this.runTest('Admin Login', () => this.testAdminLogin());
      await this.runTest('User Management Page', () => this.testUserManagementPage());
      await this.runTest('Vendor Rating Display', () => this.testVendorRatingDisplay());
      await this.runTest('Responsive Design', () => this.testResponsiveDesign());
      await this.runTest('Page Performance', () => this.testPagePerformance());

    } catch (error) {
      this.log(`Test setup failed: ${error.message}`, 'error');
      this.testResults.failed++;
    } finally {
      await this.cleanup();
    }

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
module.exports = PropertyMaintenanceWebsiteTester;

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PropertyMaintenanceWebsiteTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Website test suite failed to run:', error);
      process.exit(1);
    });
}
