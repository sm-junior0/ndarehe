import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;

// Don't throw during import - just log a warning
if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ Stripe secret key missing - Stripe payments will be disabled');
}

// Only create stripe instance if key exists
export const stripe = STRIPE_SECRET_KEY 
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

export interface CreateCheckoutParams {
  txRef: string;
  amount: number; // in major units
  currency: string; // e.g. 'usd' or 'rwf'
  customer: { email: string; name?: string };
  bookingId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  // Check if Stripe is configured
  if (!stripe) {
    throw new Error("Stripe is not configured - missing secret key");
  }
  
  const unitAmount = Math.round(Number(params.amount) * 100);
  
  // Ensure currency is lowercase and valid for Stripe
  const currency = params.currency.toLowerCase();
  
  // Log the parameters for debugging
  console.log('[Stripe] Creating checkout session with params:', {
    txRef: params.txRef,
    amount: params.amount,
    unitAmount,
    currency,
    customerEmail: params.customer.email,
    bookingId: params.bookingId
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.customer.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency,
          product_data: {
            name: "Ndarehe Booking Payment",
            description: `Booking #${params.bookingId}`,
          },
          unit_amount: unitAmount,
        },
      },
    ],
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}&tx_ref=${encodeURIComponent(params.txRef)}`,
    cancel_url: `${params.cancelUrl}?tx_ref=${encodeURIComponent(params.txRef)}`,
    metadata: {
      bookingId: params.bookingId,
      tx_ref: params.txRef,
    },
  });

  console.log('[Stripe] ✅ Checkout session created successfully:', session.id);
  return session;
}

export async function retrieveSession(sessionId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured - missing secret key");
  }
  
  return stripe.checkout.sessions.retrieve(sessionId);
}