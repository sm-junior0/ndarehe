import Stripe from 'stripe';
import { prisma } from '../config/database';
import { sendEmail, emailTemplates } from './email';
import { sendNotification } from './sms';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Create payment intent
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'rwf',
  metadata: any = {}
): Promise<Stripe.PaymentIntent> => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

// Process payment
export const processPayment = async (
  paymentId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> => {
  return await stripe.paymentIntents.confirm(paymentId, {
    payment_method: paymentMethodId,
  });
};

// Create customer
export const createCustomer = async (
  email: string,
  name: string,
  phone?: string
): Promise<Stripe.Customer> => {
  return await stripe.customers.create({
    email,
    name,
    phone,
  });
};

// Process refund
export const processRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason: Stripe.RefundCreateParams.Reason = 'requested_by_customer'
): Promise<Stripe.Refund> => {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    reason,
  };

  if (amount) {
    refundParams.amount = Math.round(amount * 100);
  }

  return await stripe.refunds.create(refundParams);
};

// Handle payment success
export const handlePaymentSuccess = async (
  paymentIntent: Stripe.PaymentIntent,
  bookingId: string
): Promise<void> => {
  try {
    // Update payment record
    await prisma.payment.update({
      where: { id: paymentIntent.metadata.paymentId },
      data: {
        status: 'COMPLETED',
        transactionId: paymentIntent.id,
        processedAt: new Date()
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        isConfirmed: true,
        confirmedAt: new Date()
      },
      include: {
        user: true,
        accommodation: true,
        transportation: true,
        tour: true
      }
    });

    // Get booking details for notifications
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        accommodation: true,
        transportation: true,
        tour: true
      }
    });

    if (booking && booking.user) {
      const serviceName = booking.accommodation?.name || 
                         booking.transportation?.name || 
                         booking.tour?.name || 'Service';

      // Send email confirmation
      try {
        const { subject, html } = emailTemplates.bookingConfirmation(
          booking.user.firstName,
          {
            id: booking.id,
            serviceName,
            startDate: booking.startDate,
            totalAmount: booking.totalAmount,
            currency: booking.currency
          }
        );
        await sendEmail(booking.user.email, subject, html);
      } catch (emailError) {
        console.error('Failed to send booking confirmation email:', emailError);
      }

      // Send SMS confirmation
      if (booking.user.phone) {
        try {
          await sendNotification(
            booking.user.phone,
            booking.user.firstName,
            'payment_success',
            {
              amount: booking.totalAmount,
              currency: booking.currency
            }
          );
        } catch (smsError) {
          console.error('Failed to send payment success SMS:', smsError);
        }
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
};

// Handle payment failure
export const handlePaymentFailure = async (
  paymentIntent: Stripe.PaymentIntent,
  bookingId: string
): Promise<void> => {
  try {
    // Update payment record
    await prisma.payment.update({
      where: { id: paymentIntent.metadata.paymentId },
      data: {
        status: 'FAILED',
        transactionId: paymentIntent.id,
        processedAt: new Date()
      }
    });

    // Get booking details for notifications
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true
      }
    });

    if (booking && booking.user) {
      // Send SMS failure notification
      if (booking.user.phone) {
        try {
          await sendNotification(
            booking.user.phone,
            booking.user.firstName,
            'payment_failed',
            {
              amount: booking.totalAmount,
              currency: booking.currency
            }
          );
        } catch (smsError) {
          console.error('Failed to send payment failure SMS:', smsError);
        }
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

// Get payment methods for customer
export const getCustomerPaymentMethods = async (
  customerId: string
): Promise<Stripe.PaymentMethod[]> => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return paymentMethods.data;
};

// Create setup intent for saving payment methods
export const createSetupIntent = async (
  customerId: string
): Promise<Stripe.SetupIntent> => {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}; 