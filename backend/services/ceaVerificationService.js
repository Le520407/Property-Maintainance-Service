/**
 * CEA Verification Service
 * Since CEA doesn't provide a public API, this service provides utilities
 * for manual verification and validation of CEA registration numbers
 */
class CEAVerificationService {
  constructor() {
    this.ceaPublicRegisterUrl = 'https://eservices.cea.gov.sg/aceas/public-register/';
    this.ceaRegistrationPattern = /^[A-Z]{1,2}\d{6,8}[A-Z]?$/; // Common CEA registration pattern
  }

  /**
   * Validate CEA registration number format
   * @param {string} registrationNumber - CEA registration number
   * @returns {object} Validation result
   */
  validateRegistrationFormat(registrationNumber) {
    if (!registrationNumber || typeof registrationNumber !== 'string') {
      return {
        isValid: false,
        error: 'Registration number is required'
      };
    }

    const cleanNumber = registrationNumber.trim().toUpperCase();
    
    // Basic format validation (adjust pattern based on actual CEA format)
    if (!this.ceaRegistrationPattern.test(cleanNumber)) {
      return {
        isValid: false,
        error: 'Invalid CEA registration number format. Expected format: R123456A'
      };
    }

    return {
      isValid: true,
      formattedNumber: cleanNumber
    };
  }

  /**
   * Create verification record for manual checking
   * @param {object} agentData - Agent data including CEA number
   * @returns {object} Verification record
   */
  createVerificationRecord(agentData) {
    const { registrationNumber, agentName, email, phone } = agentData;
    
    return {
      ceaRegistrationNumber: registrationNumber,
      agentName,
      email,
      phone,
      verificationStatus: 'PENDING_MANUAL_VERIFICATION',
      verificationUrl: this.ceaPublicRegisterUrl,
      verificationInstructions: [
        '1. Visit CEA Public Register: ' + this.ceaPublicRegisterUrl,
        '2. Search for agent using registration number: ' + registrationNumber,
        '3. CRITICAL: Verify agent name EXACTLY matches: ' + agentName,
        '4. Check license status is ACTIVE and NOT EXPIRED',
        '5. Verify license type matches property sales',
        '6. Check for any disciplinary actions or suspensions',
        '7. Cross-reference contact details if available',
        '8. Update verification status in admin panel with detailed notes'
      ],
      securityChecks: [
        'Name verification against CEA register',
        'License status confirmation',
        'Disciplinary record check',
        'Contact detail cross-reference'
      ],
      createdAt: new Date(),
      verifiedAt: null,
      verifiedBy: null,
      notes: '',
      warningFlags: []
    };
  }

  /**
   * Generate verification link for manual checking
   * @param {string} registrationNumber - CEA registration number
   * @returns {string} Verification URL
   */
  getVerificationLink(registrationNumber) {
    // Note: CEA website doesn't support direct search URLs
    // Admin will need to manually search
    return this.ceaPublicRegisterUrl;
  }

  /**
   * Generate comprehensive verification checklist for admins
   * @param {object} agentData - Agent registration data
   * @returns {object} Verification checklist and tools
   */
  generateVerificationTools(agentData) {
    const { registrationNumber, agentName } = agentData;
    
    return {
      verificationSteps: [
        {
          step: 1,
          title: 'CEA Register Search',
          description: 'Search for the CEA registration number on official register',
          action: 'Visit CEA Public Register and search for: ' + registrationNumber,
          url: this.ceaPublicRegisterUrl,
          critical: true,
          checkpoints: [
            'Registration number exists in CEA database',
            'Registration is currently ACTIVE',
            'License has not expired',
            'No suspension or disciplinary actions'
          ]
        },
        {
          step: 2,
          title: 'Name Verification',
          description: 'Verify the registered name matches exactly',
          action: 'Compare CEA registered name with: ' + agentName,
          critical: true,
          checkpoints: [
            'First name matches exactly (case-sensitive)',
            'Last name matches exactly (case-sensitive)',
            'No spelling variations or nicknames used'
          ]
        },
        {
          step: 3,
          title: 'License Type Verification',
          description: 'Confirm license permits property transactions',
          action: 'Check license category and permissions',
          critical: true,
          checkpoints: [
            'License type permits property sales',
            'License includes residential properties',
            'License covers intended service area'
          ]
        },
        {
          step: 4,
          title: 'Contact Verification',
          description: 'Cross-reference contact information',
          action: 'Verify contact details where available',
          critical: false,
          checkpoints: [
            'Email domain matches professional standards',
            'Phone number matches Singapore format',
            'Contact details seem legitimate'
          ]
        },
        {
          step: 5,
          title: 'Background Check',
          description: 'Check for any red flags or concerns',
          action: 'Review disciplinary history and complaints',
          critical: false,
          checkpoints: [
            'No recent disciplinary actions',
            'No ongoing investigations',
            'Good standing with CEA'
          ]
        }
      ],
      verificationForms: {
        ceaLookupForm: {
          url: this.ceaPublicRegisterUrl,
          searchTerm: registrationNumber,
          instructions: 'Copy and paste the registration number into the CEA search'
        },
        identityVerification: {
          requiredDocuments: [
            'Government-issued photo ID (NRIC/Passport)',
            'CEA license certificate (if available)',
            'Business card or company letterhead'
          ],
          verificationMethods: [
            'Video call identity verification',
            'Document verification',
            'Professional reference check'
          ]
        }
      },
      riskIndicators: this.detectFraudIndicators(agentData),
      recommendations: this.getVerificationRecommendations(agentData)
    };
  }

  /**
   * Get verification recommendations based on risk assessment
   * @param {object} agentData - Agent data
   * @returns {array} Recommendations
   */
  getVerificationRecommendations(agentData) {
    const fraudCheck = this.detectFraudIndicators(agentData);
    const baseRecommendations = [
      {
        priority: 'HIGH',
        action: 'Verify CEA registration exists',
        description: 'Confirm the registration number exists in CEA database',
        required: true
      },
      {
        priority: 'HIGH', 
        action: 'Confirm name match',
        description: 'Verify registered name matches application exactly',
        required: true
      },
      {
        priority: 'MEDIUM',
        action: 'Check license status',
        description: 'Ensure license is active and not expired',
        required: true
      }
    ];

    if (fraudCheck.riskLevel === 'HIGH') {
      return [
        ...baseRecommendations,
        {
          priority: 'CRITICAL',
          action: 'Request photo ID verification',
          description: 'MANDATORY: Verify identity through government-issued photo ID',
          required: true
        },
        {
          priority: 'CRITICAL',
          action: 'Conduct video verification',
          description: 'MANDATORY: Video call to confirm identity matches documents',
          required: true
        },
        {
          priority: 'HIGH',
          action: 'Contact CEA directly',
          description: 'Call CEA to verify registration if suspicious',
          required: false
        }
      ];
    }

    if (fraudCheck.riskLevel === 'MEDIUM') {
      return [
        ...baseRecommendations,
        {
          priority: 'HIGH',
          action: 'Request additional documentation',
          description: 'Ask for additional proof of identity and credentials',
          required: true
        },
        {
          priority: 'MEDIUM',
          action: 'Professional reference check',
          description: 'Verify with previous employer or agency',
          required: false
        }
      ];
    }

    return baseRecommendations;
  }

  /**
   * Detect potential fraud indicators
   * @param {object} agentData - Agent registration data
   * @param {object} existingUser - Any existing user with same details
   * @returns {object} Fraud detection result
   */
  detectFraudIndicators(agentData, existingUser = null) {
    const warnings = [];
    const riskLevel = { low: 0, medium: 0, high: 0 };

    // Check for suspicious patterns in name
    const namePattern = /^[A-Za-z\s'-]+$/;
    if (!namePattern.test(agentData.firstName + agentData.lastName)) {
      warnings.push('SUSPICIOUS: Non-standard characters in name');
      riskLevel.medium++;
    }

    // Check for common fraud patterns
    const commonFraudPatterns = [
      /test/i, /fake/i, /admin/i, /null/i, /undefined/i
    ];
    
    const fullName = `${agentData.firstName} ${agentData.lastName}`.toLowerCase();
    if (commonFraudPatterns.some(pattern => pattern.test(fullName))) {
      warnings.push('HIGH RISK: Name contains suspicious keywords');
      riskLevel.high++;
    }

    // Check email pattern
    const emailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const emailDomain = agentData.email.split('@')[1]?.toLowerCase();
    if (emailDomains.includes(emailDomain)) {
      warnings.push('MEDIUM RISK: Using personal email domain (expected professional)');
      riskLevel.medium++;
    }

    // Check if existing user found with same CEA number
    if (existingUser) {
      warnings.push('HIGH RISK: CEA number already registered to another user');
      riskLevel.high++;
    }

    // Calculate overall risk
    let overallRisk = 'LOW';
    if (riskLevel.high > 0) overallRisk = 'HIGH';
    else if (riskLevel.medium > 1) overallRisk = 'MEDIUM';

    return {
      riskLevel: overallRisk,
      warnings,
      requiresManualReview: riskLevel.high > 0 || riskLevel.medium > 1,
      recommendations: this.getFraudPreventionRecommendations(overallRisk)
    };
  }

  /**
   * Get fraud prevention recommendations
   * @param {string} riskLevel - Risk level (LOW/MEDIUM/HIGH)
   * @returns {array} Recommendations
   */
  getFraudPreventionRecommendations(riskLevel) {
    const baseRecommendations = [
      'Verify agent name exactly matches CEA register',
      'Check license status and expiry date',
      'Confirm license type permits property sales'
    ];

    if (riskLevel === 'MEDIUM') {
      return [...baseRecommendations,
        'Request additional identification documents',
        'Verify contact details independently',
        'Check for disciplinary actions on CEA register'
      ];
    }

    if (riskLevel === 'HIGH') {
      return [...baseRecommendations,
        'MANDATORY: Request government-issued photo ID',
        'MANDATORY: Verify identity through Real Time Photo',
        'Check for multiple registrations with same details',
        'Contact CEA directly if suspicious',
        'Consider temporary suspension pending verification'
      ];
    }

    return baseRecommendations;
  }

  /**
   * Validate agent data before verification
   * @param {object} agentData - Agent registration data
   * @returns {object} Validation result
   */
  validateAgentData(agentData) {
    const requiredFields = ['ceaRegistrationNumber', 'firstName', 'lastName', 'email', 'phone'];
    const errors = [];

    for (const field of requiredFields) {
      if (!agentData[field]) {
        errors.push(`${field} is required`);
      }
    }

    // Validate CEA registration format
    if (agentData.ceaRegistrationNumber) {
      const formatValidation = this.validateRegistrationFormat(agentData.ceaRegistrationNumber);
      if (!formatValidation.isValid) {
        errors.push(formatValidation.error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? {
        ...agentData,
        ceaRegistrationNumber: agentData.ceaRegistrationNumber?.trim().toUpperCase()
      } : null
    };
  }

  /**
   * Check if agent verification is expired
   * @param {Date} verificationDate - Date of last verification
   * @param {number} expiryMonths - Months before re-verification needed (default: 12)
   * @returns {boolean} True if verification needs renewal
   */
  isVerificationExpired(verificationDate, expiryMonths = 12) {
    if (!verificationDate) return true;
    
    const expiryDate = new Date(verificationDate);
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    
    return new Date() > expiryDate;
  }

  /**
   * Get verification status display text
   * @param {string} status - Verification status
   * @returns {object} Status display information
   */
  getVerificationStatusDisplay(status) {
    const statusMap = {
      'PENDING_MANUAL_VERIFICATION': {
        text: 'Pending Verification',
        color: 'orange',
        description: 'CEA registration requires manual verification'
      },
      'VERIFIED': {
        text: 'Verified',
        color: 'green',
        description: 'CEA registration verified and active'
      },
      'FAILED': {
        text: 'Verification Failed',
        color: 'red',
        description: 'CEA registration could not be verified'
      },
      'EXPIRED': {
        text: 'Expired',
        color: 'red',
        description: 'CEA registration has expired'
      },
      'SUSPENDED': {
        text: 'Suspended',
        color: 'red',
        description: 'CEA registration is suspended'
      }
    };

    return statusMap[status] || {
      text: 'Unknown',
      color: 'gray',
      description: 'Unknown verification status'
    };
  }
}

module.exports = new CEAVerificationService();