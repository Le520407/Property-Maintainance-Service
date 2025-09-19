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
        '3. Verify agent name matches: ' + agentName,
        '4. Check license status is active',
        '5. Update verification status in admin panel'
      ],
      createdAt: new Date(),
      verifiedAt: null,
      verifiedBy: null,
      notes: ''
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