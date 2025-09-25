const dotenv = require('dotenv');
dotenv.config({ path: '.env.production' });

const emailService = require('../services/emailService');

async function simpleEmailTest() {
  console.log('🧪 Simple Email Test...\n');

  // Test connection
  console.log('Testing SMTP connection...');
  const connectionTest = await emailService.testConnection();

  if (connectionTest.success) {
    console.log('✅ SMTP connection successful');

    // Send one test email
    console.log('\nSending single test email...');
    const testResult = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Swift Fix Pro - Single Test Email',
      text: 'This is a single test email from Swift Fix Pro.',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">Swift Fix Pro Email Test</h2>
          <p>✅ Email service is working correctly!</p>
          <p>Configuration Details:</p>
          <ul>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
            <li>From: ${process.env.EMAIL_FROM}</li>
          </ul>
        </div>
      `
    });

    if (testResult.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', testResult.messageId);
      console.log('\n💡 Check your Mailtrap inbox: https://mailtrap.io/inboxes');
    } else {
      console.log('❌ Email failed:', testResult.error);
    }
  } else {
    console.log('❌ SMTP connection failed:', connectionTest.error);
  }

  process.exit(0);
}

simpleEmailTest().catch(console.error);