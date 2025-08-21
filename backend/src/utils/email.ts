import nodemailer from 'nodemailer';
import { EmailTemplateData, BookingEmailData } from '../types';

// Create email transporter
export const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'NDAREHE <noreply@ndarehe.com>',
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

// Email templates
export const emailTemplates = {
  // In your emailTemplates utility, update the welcome function:
  welcome: (firstName: string, verificationToken: string) => {
    const subject = 'Welcome to NDAREHE - Verify Your Email';

    // Use the direct backend URL (not API endpoint)
    const backendUrl = process.env.BACKEND_URL || 'https://ndarehe.onrender.com';
    const verificationUrl = `${backendUrl}/verify-email?token=${verificationToken}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to NDAREHE, ${firstName}!</h2>
      <p>Thank you for joining our platform. Please verify your email address to get started.</p>
      <a href="${verificationUrl}"
         style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
    </div>
  `;
    return { subject, html };
  },

  emailVerified: (firstName: string) => {
    const subject = 'Email Verified - Welcome to NDAREHE';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verified Successfully!</h2>
        <p>Hi ${firstName},</p>
        <p>Your email has been verified successfully. You can now access all features of NDAREHE.</p>
        <a href="${baseUrl}" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Start Exploring
        </a>
      </div>
    `;
    return { subject, html };
  },

  passwordReset: (firstName: string, resetToken: string) => {
    const subject = 'Password Reset Request - NDAREHE';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${baseUrl}/reset-password?token=${resetToken}" 
           style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    return { subject, html };
  },

  bookingConfirmation: (firstName: string, bookingData: BookingEmailData) => {
    const subject = 'Booking Confirmation - NDAREHE';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmed!</h2>
        <p>Hi ${firstName},</p>
        <p>Your booking has been confirmed successfully.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <p><strong>Booking ID:</strong> ${bookingData.id}</p>
          <p><strong>Service:</strong> ${bookingData.serviceName}</p>
          <p><strong>Date:</strong> ${new Date(bookingData.startDate).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ${bookingData.totalAmount} ${bookingData.currency}</p>
        </div>
        <p>Thank you for choosing NDAREHE!</p>
      </div>
    `;
    return { subject, html };
  },

  tripPlanReady: (firstName: string, tripPlanId: string) => {
    const subject = 'Your Trip Plan is Ready - NDAREHE';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Personalized Trip Plan is Ready!</h2>
        <p>Hi ${firstName},</p>
        <p>We've created a personalized trip plan just for you. Click below to view it:</p>
        <a href="${baseUrl}/trip-plans/${tripPlanId}" 
           style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          View Trip Plan
        </a>
        <p>We hope you enjoy your trip to Rwanda!</p>
      </div>
    `;
    return { subject, html };
  }
}; 