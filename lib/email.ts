import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

export const getVerificationEmail = (firstName: string, verificationUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background-color: #C9A22E; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome to SHILLMONGER — Verify Your Email Address</h2>
        <p>Hello <strong>${firstName}</strong>,</p>
        <p>Welcome to <strong>SHILLMONGER</strong>. Your account has been successfully created, and you are now one step away from accessing your trading dashboard and getting started with the platform.</p>
        <p>Before you can access all account features, we need to confirm that this email address belongs to you. Email verification helps us protect your account, secure your access, and ensure that important account notifications are delivered to the correct address.</p>
        <p>Please click the verification button below to confirm your email address:</p>
        <a href="${verificationUrl}" class="button">VERIFY MY EMAIL</a>
        <p>Once your email has been verified, your account will be activated and you will be able to log in and access your dashboard.</p>
        <p>From your dashboard, you will be able to manage your account, connect your trading account, monitor your platform activity, manage your subscription when available, and access other features provided by the platform.</p>
        <p>For your security, this verification link is unique to your account and should not be shared with anyone else. If you did not create an account on <strong>SHILLMONGER</strong>, you can safely ignore this email.</p>
        <p>Thank you for joining us.</p>
        <p>We look forward to having you on the platform.</p>
        <p><strong>The SHILLMONGER Team</strong></p>
      </div>
    </body>
    </html>
  `;
};

export const getForgotPasswordEmail = (firstName: string, resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background-color: #C9A22E; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Your SHILLMONGER Password</h2>
        <p>Hello <strong>${firstName}</strong>,</p>
        <p>We received a request to reset the password for your <strong>SHILLMONGER</strong> account.</p>
        <p>If you made this request, you can securely create a new password by clicking the button below:</p>
        <a href="${resetUrl}" class="button">RESET MY PASSWORD</a>
        <p>This password reset link is created specifically for your account and is valid for a limited period. Once you create a new password, you will be able to use it to access your account and return to your dashboard.</p>
        <p>For your protection, please do not share this link with anyone. Our team will never ask you to send your password by email, message, or any other communication channel.</p>
        <p>If you did not request a password reset, no action is required. Your current password will remain unchanged, and you can safely ignore this email.</p>
        <p>If you continue receiving unexpected password reset emails, we recommend checking the security of your email account and contacting our support team if you need further assistance.</p>
        <p>Thank you for helping us keep your account secure.</p>
        <p><strong>The SHILLMONGER Team</strong></p>
      </div>
    </body>
    </html>
  `;
};

export const getWelcomeEmail = (firstName: string, dashboardUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Account Has Been Verified</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background-color: #C9A22E; }
        ol { padding-left: 20px; }
        li { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Your Account Has Been Verified — Welcome to SHILLMONGER</h2>
        <p>Hello <strong>${firstName}</strong>,</p>
        <p>Great news — your email address has been successfully verified, and your <strong>SHILLMONGER</strong> account is now active.</p>
        <p>You can now access your dashboard and begin setting up your account for the platform.</p>
        <p>Your dashboard is the central place where you can manage your account and follow your activity. Depending on your current account status and the features available to you, you can connect your trading account, review your connection status, manage your subscription access, monitor trading-related activity, and keep track of important account updates.</p>
        <p>To help you get started, we recommend completing the following steps:</p>
        <ol>
          <li><strong>Review your profile and account information</strong> to make sure your details are correct.</li>
          <li><strong>Connect your supported trading account</strong> when you are ready to use the platform's trading features.</li>
          <li><strong>Explore the available demo and platform access options</strong> before activating live trading features.</li>
          <li><strong>Choose and activate a subscription plan</strong> when you are ready for eligible live access.</li>
          <li><strong>Monitor your dashboard regularly</strong> for account activity, connection status, trade updates, and important notifications.</li>
        </ol>
        <p>You can return to your dashboard at any time using the button below:</p>
        <a href="${dashboardUrl}" class="button">GO TO MY DASHBOARD</a>
        <p>We are excited to have you on board.</p>
        <p>Our goal is to provide a simple and organized platform where you can manage your account and access automated XAUUSD copy-trading features through the platform's supported workflow.</p>
        <p>As always, trading involves risk. Platform automation does not guarantee profits, and you should only use funds you understand and are comfortable putting at risk.</p>
        <p>Thank you for joining <strong>SHILLMONGER</strong>.</p>
        <p>Welcome aboard.</p>
        <p><strong>The SHILLMONGER Team</strong></p>
      </div>
    </body>
    </html>
  `;
};