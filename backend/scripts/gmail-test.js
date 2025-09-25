const dotenv = require('dotenv');

// Load environment with Gmail settings
console.log('🔧 Loading Gmail configuration...');
const result = dotenv.config({ path: '.env.production' });

if (result.error) {
  console.error('❌ Error loading .env.production:', result.error);
  process.exit(1);
}

// Override to force Gmail usage for this test
process.env.USE_GMAIL = 'true';

const emailService = require('../services/emailService');

async function testGmailSetup() {
  console.log('📧 Gmail SMTP Test\n');

  // Check configuration
  console.log('Configuration Check:');
  console.log('- USE_GMAIL:', process.env.USE_GMAIL);
  console.log('- GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('- GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set');

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('\n❌ Gmail credentials not configured!');
    console.log('\n📖 Setup Instructions:');
    console.log('1. Update your .env.production file with:');
    console.log('   GMAIL_USER=your-gmail@gmail.com');
    console.log('   GMAIL_APP_PASSWORD=your-16-character-app-password');
    console.log('\n2. Follow the setup guide in docs/GMAIL_EMAIL_SETUP.md');
    process.exit(1);
  }

  console.log('\n🧪 Testing Gmail Connection...');

  try {
    // Test connection
    const connectionResult = await emailService.testConnection();

    if (connectionResult.success) {
      console.log('✅ Gmail SMTP connection successful!');

      // Send test email
      console.log('\n📨 Sending test email...');
      const testEmail = await emailService.sendEmail({
        to: process.env.GMAIL_USER, // Send to yourself for testing
        subject: 'Swift Fix Pro - Gmail Test Email',
        text: 'This is a test email from Swift Fix Pro using Gmail SMTP.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🎉 Gmail SMTP Working!</h2>
            <p>Congratulations! Your Swift Fix Pro application is now successfully configured to send emails through Gmail.</p>

            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>Service:</strong> Gmail SMTP</li>
                <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
                <li><strong>To:</strong> ${process.env.GMAIL_USER}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>

            <p>Your email service is now ready for production use!</p>

            <p style="color: #6b7280; font-size: 0.9em;">
              This email was sent automatically by Swift Fix Pro email service test.
            </p>
          </div>
        `
      });

      if (testEmail.success) {
        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', testEmail.messageId);
        console.log(`📬 Check your inbox: ${process.env.GMAIL_USER}`);

        console.log('\n🎯 Next Steps:');
        console.log('1. Check your Gmail inbox for the test email');
        console.log('2. Your app is now ready to send real emails!');
        console.log('3. Monitor your daily usage (100 emails/day limit)');
      } else {
        console.log('❌ Test email failed:', testEmail.error);
      }

    } else {
      console.log('❌ Gmail connection failed:', connectionResult.error);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Verify 2-Factor Authentication is enabled on your Gmail');
      console.log('2. Check that GMAIL_APP_PASSWORD is correct');
      console.log('3. Make sure GMAIL_USER matches the account that generated the App Password');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  process.exit(0);
}

console.log('='.repeat(50));
console.log('       SWIFT FIX PRO - GMAIL SMTP TEST');
console.log('='.repeat(50));

testGmailSetup().catch(console.error);