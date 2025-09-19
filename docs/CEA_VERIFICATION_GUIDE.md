# CEA Verification Implementation Guide

## Overview

This document outlines the implementation of CEA (Council for Estate Agencies) verification for property agents in Singapore. Since CEA does not provide a public API, we've implemented a manual verification system with proper validation and admin management.

## What is CEA?

The Council for Estate Agencies (CEA) is Singapore's regulatory body for real estate agents and property agencies. All property agents operating in Singapore must be registered with CEA and possess a valid CEA registration number.

## Key Features

### 1. Agent Registration with CEA Fields
- CEA registration number validation during agent signup
- Automatic format validation (e.g., R123456A)
- Unique registration number enforcement
- Mandatory for property agents

### 2. Manual Verification System
- Admin interface for verifying CEA registrations
- Integration with CEA Public Register website
- Status tracking and history
- Expiry date management

### 3. Verification Status Management
- **PENDING_MANUAL_VERIFICATION**: Initial status after registration
- **VERIFIED**: CEA registration confirmed by admin
- **FAILED**: Registration could not be verified
- **EXPIRED**: Registration has expired
- **SUSPENDED**: Registration is suspended

## Implementation Details

### Database Schema (User Model)

```javascript
// CEA-specific fields added to User model
ceaRegistrationNumber: {
  type: String,
  trim: true,
  uppercase: true,
  sparse: true,
  validate: {
    validator: function(v) {
      if (!v || this.referralUserType !== 'property_agent') return true;
      return /^[A-Z]{1,2}\d{6,8}[A-Z]?$/.test(v);
    },
    message: 'Invalid CEA registration number format'
  }
},
ceaVerificationStatus: {
  type: String,
  enum: ['PENDING_MANUAL_VERIFICATION', 'VERIFIED', 'FAILED', 'EXPIRED', 'SUSPENDED'],
  default: function() {
    return this.ceaRegistrationNumber ? 'PENDING_MANUAL_VERIFICATION' : undefined;
  }
},
ceaVerificationDate: Date,
ceaVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
ceaExpiryDate: Date,
ceaVerificationNotes: String
```

### Frontend Components

#### 1. Agent Registration Form
Location: `src/pages/auth/AgentRegisterPage.jsx`

Enhanced registration form with CEA fields:
- CEA registration number input with format validation
- Real-time format checking
- Information about CEA verification process
- Link to CEA Public Register

#### 2. Admin Verification Interface
Location: `src/pages/admin/CEAVerificationManagement.jsx`

Features:
- List all agents with CEA status
- Search and filter capabilities
- Manual verification workflow
- Status update with notes
- Expiry date management
- Bulk operations for expired registrations

#### 3. Verification Badge Component
Location: `src/components/admin/CEAVerificationBadge.jsx`

Reusable component for displaying CEA status:
- Color-coded status badges
- Detailed verification information
- Expiry warnings
- Link to CEA website

### Backend Services

#### 1. CEA Verification Service
Location: `backend/services/ceaVerificationService.js`

Utilities for:
- Registration number format validation
- Verification record creation
- Status management
- Expiry checking

#### 2. Admin Routes
Location: `backend/routes/ceaVerification.js`

API endpoints:
- `GET /admin/agents/cea-verification` - List all agents
- `PUT /admin/agents/:id/cea-verification` - Update verification status
- `GET /admin/cea-verification/stats` - Get verification statistics
- `POST /admin/cea-verification/update-expired` - Bulk update expired

## Manual Verification Process

### For Admins:

1. **Access Admin Panel**
   - Navigate to CEA Verification Management
   - View list of pending verifications

2. **Verify Registration**
   - Click "Verify" button for an agent
   - Visit CEA Public Register: https://eservices.cea.gov.sg/aceas/public-register/
   - Search for agent using their CEA registration number
   - Verify details match the agent's information

3. **Update Status**
   - Set appropriate verification status
   - Add verification notes
   - Set expiry date if available
   - Submit verification

4. **Monitor Expiry**
   - System highlights expiring registrations
   - Use bulk update for expired registrations
   - Send notifications to agents for renewal

## API Usage Examples

### Register Agent with CEA
```javascript
const response = await api.post('/auth/register-agent', {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'securepassword',
  phone: '+65 9123 4567',
  address: '123 Main Street, Singapore',
  inviteCode: 'AGENT123',
  ceaRegistrationNumber: 'R123456A'
});
```

### Update CEA Verification (Admin Only)
```javascript
const response = await api.put('/admin/agents/12345/cea-verification', {
  status: 'VERIFIED',
  notes: 'Verified through CEA public register on 2025-09-18',
  expiryDate: '2026-09-18'
});
```

### Get CEA Statistics (Admin Only)
```javascript
const stats = await api.get('/admin/cea-verification/stats');
// Returns: { total: 50, pending: 10, verified: 35, failed: 2, expired: 3 }
```

## Security Considerations

1. **Access Control**
   - Only admins can verify CEA registrations
   - Agents cannot modify their own verification status
   - All verification actions are logged

2. **Data Validation**
   - Registration number format validation
   - Unique registration number enforcement
   - Input sanitization and validation

3. **Audit Trail**
   - Track who verified each registration
   - Store verification dates and notes
   - Monitor status changes

## Integration with Business Logic

### Agent Activation
- Agents with unverified CEA status may have limited functionality
- Commission payouts can be restricted for unverified agents
- Customer notifications about agent verification status

### Automated Processes
- Daily checks for expired registrations
- Email notifications for expiring registrations
- Automatic deactivation of expired agents

## Best Practices

1. **Regular Verification**
   - Review pending verifications daily
   - Set reminders for expiry date reviews
   - Maintain verification notes for audit purposes

2. **Communication**
   - Notify agents about verification status changes
   - Provide clear instructions for registration renewal
   - Maintain help documentation for agents

3. **Monitoring**
   - Track verification metrics
   - Monitor failed verifications for patterns
   - Regular review of verification process efficiency

## Troubleshooting

### Common Issues:

1. **Invalid Format Error**
   - Check CEA registration number format
   - Ensure proper case (uppercase)
   - Verify no special characters

2. **Duplicate Registration**
   - Check if agent already exists in system
   - Verify registration number accuracy
   - Contact CEA if disputes arise

3. **Verification Failures**
   - Double-check registration number on CEA website
   - Verify agent name matches exactly
   - Check if registration is active

## Future Enhancements

1. **API Integration**
   - Monitor for CEA API availability
   - Implement automated verification when possible
   - Maintain backward compatibility

2. **Enhanced Notifications**
   - Email alerts for status changes
   - SMS notifications for critical updates
   - Dashboard notifications for admins

3. **Reporting**
   - Detailed verification reports
   - Compliance dashboards
   - Export capabilities for audits

## Contact Information

For technical support or questions about CEA verification:
- **Development Team**: dev@swiftfixpro.sg
- **Admin Support**: admin@swiftfixpro.sg
- **CEA Official Website**: https://www.cea.gov.sg/
- **CEA Public Register**: https://eservices.cea.gov.sg/aceas/public-register/

---

**Note**: This implementation provides a robust manual verification system while maintaining the flexibility to integrate with future CEA APIs if they become available.