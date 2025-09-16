# Property Maintenance Service - Testing Suite

## Overview
Comprehensive testing suite for the Property Maintenance Service to validate deployment readiness.

## Prerequisites
- Node.js and npm installed
- Backend server running on port 5000
- Frontend server running on port 3000 (optional, for website tests)

## Quick Start

### 1. Install Dependencies
```bash
cd tests
npm install
```

### 2. Start Servers
Before running tests, ensure both servers are running:

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npm start
```

### 3. Run All Tests
```bash
# Run complete test suite
node run-all-tests.js

# Or run specific test categories
npm run test:backend
npm run test:frontend
npm run test:integration
```

## Test Categories

### API Tests (`integration/api-tests.js`)
- Authentication endpoints
- User management
- Rating system
- Admin functionality

### Website Tests (`integration/website-tests.js`)
- Page loading
- User interface
- Responsive design
- Performance metrics

### Backend Unit Tests (`backend/`)
- Authentication logic
- Admin functions
- Rating calculations

## Test Configuration
Test settings are stored in `test-config.json` and can be modified as needed.

## Interpreting Results
- ✅ All tests passed: Ready for deployment
- ⚠️ Minor failures: Review and fix issues
- ❌ Major failures: Not ready for deployment

## Troubleshooting
1. Ensure both servers are running
2. Check network connectivity
3. Verify database connection
4. Review test logs for specific errors

Generated on: 2025-09-12T04:07:54.141Z
