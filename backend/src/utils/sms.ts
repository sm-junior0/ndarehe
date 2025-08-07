import twilio from 'twilio';
import { SMSData } from '../types';

// Create Twilio client
export const createTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  return twilio(accountSid, authToken);
};

// Send SMS
export const sendSMS = async (
  to: string,
  message: string
): Promise<void> => {
  try {
    const client = createTwilioClient();
    const from = process.env.TWILIO_PHONE_NUMBER;
    
    if (!from) {
      throw new Error('Twilio phone number not configured');
    }

    await client.messages.create({
      body: message,
      from,
      to
    });
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
};

// SMS templates
export const smsTemplates = {
  welcome: (firstName: string) => {
    return `Welcome to NDAREHE, ${firstName}! Your account has been created successfully. Start exploring amazing accommodations and experiences in Rwanda.`;
  },

  bookingConfirmation: (firstName: string, bookingData: SMSData) => {
    return `Hi ${firstName}! Your booking (ID: ${bookingData.id}) for ${bookingData.serviceName} on ${new Date(bookingData.startDate).toLocaleDateString()} has been confirmed. Total: ${bookingData.totalAmount} ${bookingData.currency}. Thank you for choosing NDAREHE!`;
  },

  paymentSuccess: (firstName: string, amount: number, currency: string) => {
    return `Hi ${firstName}! Your payment of ${amount} ${currency} has been processed successfully. Your booking is now confirmed. Enjoy your trip!`;
  },

  paymentFailed: (firstName: string, amount: number, currency: string) => {
    return `Hi ${firstName}! Your payment of ${amount} ${currency} could not be processed. Please try again or contact support.`;
  },

  tripPlanReady: (firstName: string) => {
    return `Hi ${firstName}! Your personalized trip plan is ready. Check your email or login to NDAREHE to view it. We hope you enjoy your Rwanda adventure!`;
  },

  bookingReminder: (firstName: string, serviceName: string, date: string) => {
    return `Hi ${firstName}! Reminder: Your booking for ${serviceName} is tomorrow (${date}). Have a great time!`;
  },

  passwordReset: (firstName: string, resetToken: string) => {
    return `Hi ${firstName}! Your password reset code is: ${resetToken}. This code expires in 10 minutes. If you didn't request this, please ignore.`;
  },

  verificationCode: (firstName: string, code: string) => {
    return `Hi ${firstName}! Your NDAREHE verification code is: ${code}. Enter this code to verify your account.`;
  }
};

// Send notification based on type
export const sendNotification = async (
  phone: string,
  firstName: string,
  type: 'welcome' | 'booking_confirmation' | 'payment_success' | 'payment_failed' | 'trip_plan_ready' | 'booking_reminder' | 'password_reset' | 'verification_code',
  data?: any
): Promise<void> => {
  let message: string;

  switch (type) {
    case 'welcome':
      message = smsTemplates.welcome(firstName);
      break;
    case 'booking_confirmation':
      message = smsTemplates.bookingConfirmation(firstName, data);
      break;
    case 'payment_success':
      message = smsTemplates.paymentSuccess(firstName, data.amount, data.currency);
      break;
    case 'payment_failed':
      message = smsTemplates.paymentFailed(firstName, data.amount, data.currency);
      break;
    case 'trip_plan_ready':
      message = smsTemplates.tripPlanReady(firstName);
      break;
    case 'booking_reminder':
      message = smsTemplates.bookingReminder(firstName, data.serviceName, data.date);
      break;
    case 'password_reset':
      message = smsTemplates.passwordReset(firstName, data.code);
      break;
    case 'verification_code':
      message = smsTemplates.verificationCode(firstName, data.code);
      break;
    default:
      throw new Error('Unknown notification type');
  }

  await sendSMS(phone, message);
}; 