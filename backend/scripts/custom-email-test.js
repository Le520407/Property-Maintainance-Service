const dotenv = require('dotenv');
dotenv.config({ path: '.env.production' });

const emailService = require('../services/emailService');

async function customTest() {
  console.log('🧪 Custom Email Testing Menu\n');

  const args = process.argv.slice(2);
  const testType = args[0] || 'help';

  switch(testType) {
    case 'connection':
      console.log('Testing SMTP connection...');
      const result = await emailService.testConnection();
      console.log(result.success ? '✅ Connected' : '❌ Failed:', result.error || result.message);
      break;

    case 'welcome':
      console.log('Testing welcome email...');
      const welcome = await emailService.sendWelcomeEmail(
        'test@example.com',
        'Test User',
        'customer'
      );
      console.log(welcome.success ? '✅ Welcome email sent' : '❌ Failed:', welcome.error);
      break;

    case 'verification':
      console.log('Testing verification code email...');
      const code = await emailService.sendVerificationCode(
        'test@example.com',
        Math.floor(100000 + Math.random() * 900000).toString()
      );
      console.log(code.success ? '✅ Verification code sent' : '❌ Failed:', code.error);
      break;

    case 'job':
      console.log('Testing job notification email...');
      const jobNotif = await emailService.sendJobNotification('vendor@example.com', {
        title: 'Test Plumbing Job',
        description: 'Fix leaky faucet in kitchen',
        location: '123 Test Street, Singapore',
        customerName: 'John Doe',
        estimatedCost: 150
      });
      console.log(jobNotif.success ? '✅ Job notification sent' : '❌ Failed:', jobNotif.error);
      break;

    case 'order':
      console.log('Testing order confirmation email...');
      const order = await emailService.sendOrderConfirmation('customer@example.com', {
        orderId: 'ORD-' + Date.now(),
        serviceName: 'Plumbing Service',
        amount: 150,
        status: 'Confirmed',
        estimatedCompletion: '2024-01-15'
      });
      console.log(order.success ? '✅ Order confirmation sent' : '❌ Failed:', order.error);
      break;

    case 'reset':
      console.log('Testing password reset email...');
      const reset = await emailService.sendPasswordReset(
        'user@example.com',
        'test-reset-token-' + Date.now()
      );
      console.log(reset.success ? '✅ Password reset sent' : '❌ Failed:', reset.error);
      break;

    case 'basic':
      console.log('Testing basic email...');
      const basic = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<h1>Test Email</h1><p>This is a test email</p>'
      });
      console.log(basic.success ? '✅ Basic email sent' : '❌ Failed:', basic.error);
      break;

    default:
      console.log('Available test commands:');
      console.log('  node scripts/custom-email-test.js connection    - Test SMTP connection');
      console.log('  node scripts/custom-email-test.js basic         - Send basic test email');
      console.log('  node scripts/custom-email-test.js welcome       - Test welcome email');
      console.log('  node scripts/custom-email-test.js verification  - Test verification code');
      console.log('  node scripts/custom-email-test.js job           - Test job notification');
      console.log('  node scripts/custom-email-test.js order         - Test order confirmation');
      console.log('  node scripts/custom-email-test.js reset         - Test password reset');
      break;
  }

  process.exit(0);
}

customTest().catch(console.error);