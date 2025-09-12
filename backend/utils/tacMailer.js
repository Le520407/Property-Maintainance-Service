const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: (process.env.SMTP_SECURE === 'true'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

async function sendTAC(email, code) {
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const subject = 'Your login verification code';
  const text = `Your verification code is: ${code}. It expires in 10 minutes.`;
  const html = `<p>Your verification code is: <strong>${code}</strong>. It expires in 10 minutes.</p>`;

  return transporter.sendMail({ from, to: email, subject, text, html });
}

module.exports = { sendTAC };
