import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

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
  return stripe.checkout.sessions.retrieve(sessionId);
}


