# Gmail Email Setup Guide for Swift Fix Pro

## 📧 Why Gmail SMTP?
- **FREE** up to 100 emails/day
- **Reliable** Google infrastructure
- **Professional** email delivery
- **Already integrated** with your Google Auth

## 🔧 Setup Steps

### Step 1: Enable 2-Factor Authentication
1. Go to your [Google Account Security](https://myaccount.google.com/security)
2. Turn on **2-Step Verification** if not already enabled
3. Complete the setup with your phone number

### Step 2: Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" from the dropdown
3. Select "Other" and type "Swift Fix Pro"
4. Click **Generate**
5. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update Your Environment Files

#### For Development (.env):
```bash
# Email Configuration
USE_GMAIL=true
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=abcd-efgh-ijkl-mnop
EMAIL_FROM=Swift Fix Pro <your-gmail@gmail.com>
```

#### For Production (.env.production):
```bash
# Email Configuration
USE_GMAIL=true
GMAIL_USER=your-business-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
EMAIL_FROM=Swift Fix Pro <your-business-gmail@gmail.com>
```

## 🎛️ Configuration Options

### Switch Between Gmail and Mailtrap
```bash
# Use Gmail for real emails
USE_GMAIL=true

# Use Mailtrap for testing
USE_GMAIL=false
```

### Email Sender Options
```bash
# Option 1: Use your Gmail as sender
EMAIL_FROM=Swift Fix Pro <your-gmail@gmail.com>

# Option 2: Use a custom name (Gmail will still show your email)
EMAIL_FROM=Swift Fix Pro Support <your-gmail@gmail.com>
```

## 🧪 Testing Your Setup

### Test Connection
```bash
cd backend
node scripts/custom-email-test.js connection
```

### Test Email Sending
```bash
cd backend
node scripts/custom-email-test.js basic
```

### Test All Email Types
```bash
cd backend
node scripts/test-email.js
```

## 📊 Gmail Limits

| **Plan** | **Daily Limit** | **Cost** |
|----------|----------------|----------|
| Personal Gmail | 100 emails/day | FREE |
| Google Workspace | 2,000 emails/day | $6/month |

## 🛡️ Security Best Practices

### ✅ DO:
- Use **App Passwords**, not your regular Gmail password
- Keep your App Password in environment variables
- Use different App Passwords for different applications
- Revoke unused App Passwords

### ❌ DON'T:
- Share your App Password
- Commit credentials to version control
- Use your regular Gmail password for SMTP
- Exceed daily sending limits

## 🔧 Troubleshooting

### "Invalid Credentials" Error
- Verify 2-Factor Authentication is enabled
- Check App Password is correct (no spaces)
- Ensure you're using GMAIL_APP_PASSWORD, not regular password

### "Authentication Failed" Error
- Make sure GMAIL_USER matches the account that generated the App Password
- Try generating a new App Password

### "Daily Sending Quota Exceeded"
- You've sent more than 100 emails today
- Wait 24 hours or upgrade to Google Workspace

### Emails Going to Spam
- Use a professional FROM name
- Include unsubscribe links
- Avoid spam trigger words
- Consider using a business domain

## 🚀 Production Recommendations

### For Small Business (< 100 emails/day)
- Use personal Gmail account
- Set professional FROM name
- Monitor daily usage

### For Growing Business (> 100 emails/day)
- Upgrade to Google Workspace ($6/month)
- Use business domain email
- Consider dedicated email marketing service

### Email Templates
Your current setup includes:
- ✅ Welcome emails
- ✅ Verification codes
- ✅ Job notifications
- ✅ Order confirmations
- ✅ Password reset emails

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Run the test scripts
3. Verify environment variables
4. Check Gmail account settings

---

**Ready to switch to Gmail?** Update your `.env.production` file and run the test commands!