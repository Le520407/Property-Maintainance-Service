const dotenv = require('dotenv');
dotenv.config({ path: '.env.production' });

const emailService = require('../services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Test 1: Connection Test
  console.log('1. Testing SMTP connection...');
  const connectionTest = await emailService.testConnection();
  console.log(connectionTest.success ? '✅ Connection successful' : '❌ Connection failed:', connectionTest.error || connectionTest.message);

  if (!connectionTest.success) {
    console.log('\n❌ Email service is not properly configured. Please check your SMTP settings.');
    return;
  }

  // Test 2: Send Test Email
  console.log('\n2. Sending test email...');
  const testEmail = await emailService.sendEmail({
    to: 'test@example.com', // This will go to Mailtrap inbox
    subject: 'Swift Fix Pro - Email Service Test',
    text: 'This is a test email from Swift Fix Pro email service.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Email Service Test</h2>
        <p>This is a test email from Swift Fix Pro email service.</p>
        <p>If you're seeing this, the email configuration is working correctly!</p>
        <p>Best regards,<br>The Swift Fix Pro Team</p>
      </div>
    `
  });

  if (testEmail.success) {
    console.log('✅ Test email sent successfully');
    console.log('📧 Message ID:', testEmail.messageId);
  } else {
    console.log('❌ Test email failed:', testEmail.error);
  }

  // Test 3: Send Welcome Email
  console.log('\n3. Testing welcome email template...');
  const welcomeEmail = await emailService.sendWelcomeEmail(
    'newuser@example.com',
    'John Doe',
    'customer'
  );

  if (welcomeEmail.success) {
    console.log('✅ Welcome email sent successfully');
  } else {
    console.log('❌ Welcome email failed:', welcomeEmail.error);
  }

  // Test 4: Send Verification Code
  console.log('\n4. Testing verification code email...');
  const codeEmail = await emailService.sendVerificationCode(
    'verify@example.com',
    '123456'
  );

  if (codeEmail.success) {
    console.log('✅ Verification code email sent successfully');
  } else {
    console.log('❌ Verification code email failed:', codeEmail.error);
  }

  console.log('\n🎉 Email service testing completed!');
  console.log('\n💡 Tips:');
  console.log('- Check your Mailtrap inbox at https://mailtrap.io/inboxes');
  console.log('- All test emails are sent to the configured Mailtrap inbox');
  console.log('- In production, replace Mailtrap with a real SMTP service');

  process.exit(0);
}

testEmailService().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});