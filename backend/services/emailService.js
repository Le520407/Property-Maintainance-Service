const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Choose configuration based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const useGmail = process.env.USE_GMAIL === 'true';

    let config;

    if (useGmail || isProduction) {
      // Gmail SMTP Configuration
      config = {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER || process.env.SMTP_USER,
          pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS
        }
      };
    } else {
      // Mailtrap Configuration (Development)
      config = {
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525', 10),
        secure: (process.env.SMTP_SECURE === 'true'),
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      };
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail({ to, subject, text, html, from }) {
    try {
      const mailOptions = {
        from: from || process.env.EMAIL_FROM || 'Swift Fix Pro <no-reply@swiftfixpro.com>',
        to,
        subject,
        text,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(userEmail, userName, userType) {
    const subject = 'Welcome to Swift Fix Pro!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Swift Fix Pro, ${userName}!</h2>
        <p>Thank you for joining our platform as a ${userType}.</p>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
          ${userType === 'customer' ? `
            <li>Browse and book maintenance services</li>
            <li>Track your service requests</li>
            <li>Communicate with service providers</li>
          ` : userType === 'vendor' ? `
            <li>Create and manage your service listings</li>
            <li>Receive and respond to customer requests</li>
            <li>Build your professional reputation</li>
          ` : `
            <li>Manage platform operations</li>
            <li>Monitor user activities</li>
            <li>Access administrative tools</li>
          `}
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Swift Fix Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      text: `Welcome to Swift Fix Pro, ${userName}! Your ${userType} account has been successfully created.`
    });
  }

  async sendVerificationCode(userEmail, code, purpose = 'login') {
    const subject = `Your ${purpose} verification code`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verification Code</h2>
        <p>Your verification code for ${purpose} is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
        </div>
        <p style="color: #ef4444;"><strong>This code expires in 10 minutes.</strong></p>
        <p>If you didn't request this code, please ignore this email.</p>
        <p>Best regards,<br>The Swift Fix Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      text: `Your verification code is: ${code}. It expires in 10 minutes.`
    });
  }

  async sendJobNotification(vendorEmail, jobDetails) {
    const subject = 'New Job Assignment - Swift Fix Pro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Job Assignment</h2>
        <p>You have been assigned a new job:</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${jobDetails.title}</h3>
          <p><strong>Description:</strong> ${jobDetails.description}</p>
          <p><strong>Location:</strong> ${jobDetails.location}</p>
          <p><strong>Customer:</strong> ${jobDetails.customerName}</p>
          <p><strong>Estimated Budget:</strong> $${jobDetails.estimatedCost}</p>
        </div>
        <p>Please log in to your dashboard to accept or decline this job.</p>
        <p>Best regards,<br>The Swift Fix Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject,
      html,
      text: `New job assignment: ${jobDetails.title}. Please check your dashboard.`
    });
  }

  async sendOrderConfirmation(customerEmail, orderDetails) {
    const subject = 'Order Confirmation - Swift Fix Pro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Order Confirmation</h2>
        <p>Thank you for your order! Here are the details:</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order #${orderDetails.orderId}</h3>
          <p><strong>Service:</strong> ${orderDetails.serviceName}</p>
          <p><strong>Amount:</strong> $${orderDetails.amount}</p>
          <p><strong>Status:</strong> ${orderDetails.status}</p>
          <p><strong>Estimated Completion:</strong> ${orderDetails.estimatedCompletion}</p>
        </div>
        <p>You can track your order status in your dashboard.</p>
        <p>Best regards,<br>The Swift Fix Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: customerEmail,
      subject,
      html,
      text: `Order confirmation for ${orderDetails.serviceName}. Order #${orderDetails.orderId}`
    });
  }

  async sendPasswordReset(userEmail, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset - Swift Fix Pro';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>You requested a password reset for your Swift Fix Pro account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p style="color: #ef4444;"><strong>This link expires in 1 hour.</strong></p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <p>Best regards,<br>The Swift Fix Pro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      text: `Reset your password: ${resetUrl}. Link expires in 1 hour.`
    });
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connection successful');
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      console.error('Email service connection failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();