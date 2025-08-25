const membershipService = require('../services/membershipService');

// Middleware to check membership eligibility for service requests
const checkServiceEligibility = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eligibility = await membershipService.canCreateServiceRequest(userId);
    
    if (!eligibility.allowed) {
      return res.status(403).json({
        success: false,
        message: eligibility.reason,
        membership: eligibility.membership
      });
    }

    // Add membership info to request for later use
    req.membership = eligibility.membership;
    next();
  } catch (error) {
    console.error('Membership eligibility check failed:', error);
    next(); // Allow request to proceed for non-members
  }
};

// Middleware to apply membership benefits to jobs
const applyMembershipBenefits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const benefits = await membershipService.getMembershipBenefits(userId);
    
    if (benefits) {
      req.membershipBenefits = benefits;
      
      // Set job priority based on membership
      if (req.body) {
        if (benefits.emergencyServiceAllowed && req.body.priority === 'emergency') {
          req.body.membershipPriority = 'EMERGENCY';
        } else if (benefits.responseTimeHours <= 24) {
          req.body.membershipPriority = 'PRIORITY';
        } else {
          req.body.membershipPriority = 'STANDARD';
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Failed to apply membership benefits:', error);
    next(); // Continue without benefits for non-members
  }
};

// Middleware to track membership usage
const trackMembershipUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isEmergency = req.body?.priority === 'emergency';
    
    // Use service request from membership quota
    await membershipService.useServiceRequest(userId, isEmergency);
    
    next();
  } catch (error) {
    if (error.message === 'Service request limit exceeded') {
      return res.status(403).json({
        success: false,
        message: 'Monthly service request limit exceeded. Please upgrade your plan or wait for next billing cycle.'
      });
    }
    
    console.error('Failed to track membership usage:', error);
    next(); // Continue for non-members
  }
};

// Middleware to calculate membership discounts
const calculateMembershipDiscount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const benefits = await membershipService.getMembershipBenefits(userId);
    
    if (benefits && benefits.materialDiscountPercent > 0 && req.jobTotal) {
      const discountAmount = (req.jobTotal * benefits.materialDiscountPercent) / 100;
      req.membershipDiscount = {
        percentage: benefits.materialDiscountPercent,
        amount: discountAmount,
        finalTotal: req.jobTotal - discountAmount
      };
    }
    
    next();
  } catch (error) {
    console.error('Failed to calculate membership discount:', error);
    next();
  }
};

module.exports = {
  checkServiceEligibility,
  applyMembershipBenefits,
  trackMembershipUsage,
  calculateMembershipDiscount
};