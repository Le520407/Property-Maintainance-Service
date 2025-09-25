const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Test endpoint for email functionality
router.post('/test-email', async (req, res) => {
  try {
    const { type, email, ...data } = req.body;

    let result;
    switch(type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(email, data.name, data.userType);
        break;
      case 'verification':
        result = await emailService.sendVerificationCode(email, data.code);
        break;
      case 'job':
        result = await emailService.sendJobNotification(email, data.jobDetails);
        break;
      case 'order':
        result = await emailService.sendOrderConfirmation(email, data.orderDetails);
        break;
      case 'reset':
        result = await emailService.sendPasswordReset(email, data.resetToken);
        break;
      default:
        result = await emailService.sendEmail({
          to: email,
          subject: data.subject || 'Test Email',
          text: data.text || 'Test email content',
          html: data.html || '<p>Test email content</p>'
        });
    }

    res.json({
      success: result.success,
      message: result.success ? 'Email sent successfully' : 'Email failed',
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Connection test endpoint
router.get('/test-email/connection', async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;