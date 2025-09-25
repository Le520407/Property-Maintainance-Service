// Different email service configurations

const emailConfigs = {
  // Current development setup (FREE)
  mailtrap: {
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },

  // Gmail SMTP (FREE - 100 emails/day)
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER, // your-email@gmail.com
      pass: process.env.GMAIL_APP_PASSWORD // App password, not regular password
    }
  },

  // Outlook SMTP (FREE - 300 emails/day)
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.OUTLOOK_USER,
      pass: process.env.OUTLOOK_PASS
    }
  },

  // SendGrid (FREE - 100 emails/day)
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  }
};

module.exports = emailConfigs;