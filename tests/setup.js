// Test setup file
require('dotenv').config();

// Global test configuration
global.TEST_CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  TEST_ADMIN_EMAIL: 'admin@swiftfixpro.sg',
  TEST_ADMIN_PASSWORD: 'admin123456',
  TEST_TIMEOUT: 30000
};

// Jest configuration
jest.setTimeout(global.TEST_CONFIG.TEST_TIMEOUT);

// Console warnings configuration
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings during testing
  if (args[0] && args[0].includes && args[0].includes('ReactDOM.render is deprecated')) {
    return;
  }
  originalWarn.apply(console, args);
};
