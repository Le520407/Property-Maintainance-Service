# Billing Data Retention System

## Overview
The Billing Data Retention System automatically manages and cleans up old billing records to comply with a 2-year data retention policy. This system ensures that billing data older than 2 years is automatically deleted while preserving recent and active records.

## Components

### 1. Cleanup Script (`cleanup-old-billing-data.js`)
- **Purpose**: Removes billing records older than 2 years from the database
- **Target Models**: CustomerMembership, CustomerSubscription, Order, Job
- **Safety Features**: 
  - DRY_RUN mode for testing without actual deletion
  - Detailed logging and reporting
  - Only deletes completed/cancelled records
  - Preserves active/pending records regardless of age

### 2. Retention Service (`billing-retention-service.js`)
- **Purpose**: Automated scheduler for monthly cleanup operations
- **Schedule**: 1st of each month at 2:00 AM
- **Features**:
  - Cron-based automation
  - Status tracking and monitoring
  - Manual trigger capability
  - Graceful start/stop functionality

### 3. Admin API Endpoints
- **GET** `/api/customer-subscriptions/billing-retention/status` - Get service status
- **POST** `/api/customer-subscriptions/billing-retention/cleanup` - Trigger manual cleanup
- **GET** `/api/customer-subscriptions/billing-retention/stats` - Get retention statistics

### 4. Admin Dashboard Component (`BillingRetentionManager.jsx`)
- **Purpose**: React component for managing retention system via admin interface
- **Features**:
  - Real-time service status monitoring
  - Data statistics and cleanup impact preview
  - Manual cleanup triggers (dry-run and live)
  - Comprehensive reporting and confirmation dialogs

## Data Retention Policy

### Retention Period: 2 Years
- All billing records are kept for exactly 2 years from creation date
- After 2 years, eligible records are automatically deleted

### Record Types Cleaned
1. **CustomerMembership**: Status must be 'EXPIRED' or 'CANCELLED'
2. **Order**: Status must be 'COMPLETED', 'CANCELLED', or 'REFUNDED'
3. **Job**: Status must be 'COMPLETED', 'CANCELLED', or 'PAID'
4. **CustomerSubscription**: Old billing history entries (preserves main record)

### Protected Records
- Active memberships (regardless of age)
- Pending/processing orders (regardless of age)
- Active/ongoing jobs (regardless of age)
- Current subscription records (only old billing history is cleaned)

## Installation & Setup

### 1. Server Integration
The retention service is automatically initialized when the server starts:

```javascript
// In server.js - already integrated
const retentionService = require('./scripts/billing-retention-service');
retentionService.start();
```

### 2. Admin Dashboard Integration
Add the BillingRetentionManager component to your admin dashboard:

```jsx
import BillingRetentionManager from '../components/admin/BillingRetentionManager';

// In your admin dashboard
<BillingRetentionManager />
```

### 3. Environment Variables
- `DRY_RUN=true` - Enable dry-run mode for testing
- Standard MongoDB connection variables

## Usage Guide

### Testing Before Deployment
1. Run the test suite:
```bash
cd backend/scripts
node test-retention-system.js
```

### Manual Operations via Admin Dashboard
1. **View Status**: Check if the service is running and view statistics
2. **Dry Run**: Test cleanup without deleting data
3. **Live Cleanup**: Permanently delete old records (requires confirmation)
4. **Refresh Data**: Update statistics and status information

### Command Line Operations
```bash
# Test cleanup (dry run)
cd backend/scripts
DRY_RUN=true node cleanup-old-billing-data.js

# Live cleanup (permanent deletion)
cd backend/scripts
DRY_RUN=false node cleanup-old-billing-data.js
```

## Monitoring & Maintenance

### Automatic Operations
- **Monthly Cleanup**: Runs automatically on the 1st of each month at 2:00 AM
- **Status Tracking**: Service maintains cleanup history and statistics
- **Error Handling**: Failed cleanups are logged with error details

### Manual Monitoring
- Check service status via admin dashboard
- Review cleanup logs in server console
- Monitor database size and record counts
- Verify data retention compliance

### Troubleshooting
1. **Service Not Running**: Check server logs for initialization errors
2. **Cleanup Failures**: Review error logs and database connectivity
3. **Unexpected Deletions**: Verify record status filtering logic
4. **Performance Issues**: Monitor cleanup duration and database load

## Security & Compliance

### Access Control
- Admin-only API endpoints (requires admin authentication)
- Confirmation dialogs for destructive operations
- Audit logging of all manual cleanup operations

### Data Safety
- Dry-run mode for safe testing
- Status-based filtering to protect active records
- Comprehensive logging for audit trails
- No cascade deletions (only direct record removal)

### Compliance Features
- Configurable retention period (currently 2 years)
- Automated compliance with minimal manual intervention
- Complete audit trail of all retention operations
- Statistics for compliance reporting

## Technical Details

### Database Queries
```javascript
// Example cleanup query for old memberships
const cutoffDate = new Date();
cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

await CustomerMembership.deleteMany({
  createdAt: { $lt: cutoffDate },
  status: { $in: ['EXPIRED', 'CANCELLED'] }
});
```

### Cron Schedule
```javascript
// Monthly cleanup on 1st at 2:00 AM
'0 2 1 * *'
```

### API Response Format
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "nextCleanup": "2024-02-01T02:00:00.000Z",
    "lastCleanup": "2024-01-01T02:00:00.000Z",
    "cleanupCount": 5
  },
  "message": "Billing retention service status retrieved"
}
```

## Future Enhancements

### Potential Improvements
1. **Configurable Retention Period**: Allow admins to modify retention period
2. **Granular Controls**: Different retention periods for different record types
3. **Backup Integration**: Automatic backup before deletion
4. **Advanced Reporting**: Detailed analytics and compliance reports
5. **Notification System**: Email alerts for cleanup operations
6. **Data Export**: Export old data before deletion

### Scalability Considerations
- Batch processing for large datasets
- Background job queuing for high-load environments
- Distributed cleanup for multi-server deployments
- Performance monitoring and optimization

## Support

For issues or questions regarding the billing retention system:
1. Check server logs for error messages
2. Review admin dashboard status and statistics
3. Run test suite to validate system health
4. Consult this documentation for usage guidance

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Compatibility**: Node.js 14+, MongoDB 4.4+