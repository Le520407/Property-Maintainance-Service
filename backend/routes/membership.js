const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Validation middleware
const subscriptionValidation = [
  body('tierId')
    .isMongoId()
    .withMessage('Valid tier ID is required'),
  body('billingCycle')
    .isIn(['MONTHLY', 'YEARLY'])
    .withMessage('Billing cycle must be MONTHLY or YEARLY'),
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required')
];

const changePlanValidation = [
  body('newTierId')
    .isMongoId()
    .withMessage('Valid new tier ID is required'),
  body('billingCycle')
    .optional()
    .isIn(['MONTHLY', 'YEARLY'])
    .withMessage('Billing cycle must be MONTHLY or YEARLY'),
  body('immediate')
    .optional()
    .isBoolean()
    .withMessage('Immediate must be a boolean')
];

// Public routes
router.get('/tiers', membershipController.getTiers);

// Protected routes (require authentication)
router.use(authenticateToken);
router.use(requireRole(['customer'])); // Only customers can access membership features

// Membership management
router.get('/my-membership', membershipController.getMyMembership);
router.post('/subscribe', (req, res, next) => {
  console.log('POST /api/membership/subscribe - Request received:', req.body);
  next();
}, subscriptionValidation, membershipController.subscribe);
router.put('/change-plan', (req, res, next) => {
  console.log('PUT /api/membership/change-plan - Request received:', {
    body: req.body,
    user: req.user?.email,
    userId: req.user?._id
  });
  next();
}, changePlanValidation, membershipController.changePlan);
router.put('/cancel', membershipController.cancel);

// Membership benefits and usage
router.get('/eligibility', membershipController.checkServiceEligibility);
router.get('/benefits', membershipController.getBenefits);
router.get('/analytics', membershipController.getAnalytics);

// Stripe webhook (public endpoint)
router.post('/webhook', express.raw({type: 'application/json'}), membershipController.webhookHandler);

module.exports = router;