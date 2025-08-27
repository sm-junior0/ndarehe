import Flutterwave from "flutterwave-node-v3";
import axios from "axios";

// Validate environment variables
const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

if (!FLW_PUBLIC_KEY || !FLW_SECRET_KEY) {
  console.error('[Flutterwave] ❌ Missing environment variables:');
  console.error('[Flutterwave] FLW_PUBLIC_KEY:', FLW_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
  console.error('[Flutterwave] FLW_SECRET_KEY:', FLW_SECRET_KEY ? '✅ Set' : '❌ Missing');
  throw new Error('Flutterwave environment variables are not configured. Please set FLW_PUBLIC_KEY and FLW_SECRET_KEY in your .env file.');
}

console.log('[Flutterwave] ✅ Environment variables loaded successfully');
console.log('[Flutterwave] Public Key:', FLW_PUBLIC_KEY.substring(0, 10) + '...');
console.log('[Flutterwave] Secret Key:', FLW_SECRET_KEY.substring(0, 10) + '...');

const flw = new Flutterwave(FLW_PUBLIC_KEY, FLW_SECRET_KEY);
const FLW_API_BASE = 'https://api.flutterwave.com/v3';

export interface FlutterwavePaymentPayload {
  tx_ref: string;
  amount: number;
  currency: string;
  payment_type?: "card" | "mobilemoney" | "ussd";
  redirect_url?: string;
  customer: {
    email: string;
    phonenumber?: string;
    name: string;
  };
  meta?: Record<string, any>;
}

export const initializePayment = async (payload: FlutterwavePaymentPayload) => {
  try {
    console.log('[Flutterwave] 🚀 Initializing payment...');
    console.log('[Flutterwave] Payload:', {
      tx_ref: payload.tx_ref,
      amount: payload.amount,
      currency: payload.currency,
      customer_email: payload.customer.email,
      customer_name: payload.customer.name,
      payment_type: payload.payment_type,
      redirect_url: payload.redirect_url
    });

    // Validate payload
    if (!payload.tx_ref || !payload.amount || !payload.currency || !payload.customer) {
      throw new Error('Invalid payload: missing required fields');
    }
    if (payload.amount <= 0) {
      throw new Error('Invalid amount: must be greater than 0');
    }

    // Derive payment options
    // For Rwanda MoMo, the option key is "mobilemoneyrw"; card remains "card".
    const wantsMoMo = payload.payment_type === 'mobilemoney' || !!payload.customer.phonenumber;
    const payment_options = wantsMoMo ? 'mobilemoneyrw' : 'card';

    const requestPayload = {
      tx_ref: payload.tx_ref,
      amount: payload.amount,
      currency: payload.currency,
      redirect_url: payload.redirect_url,
      customer: payload.customer,
      meta: payload.meta || {},
      payment_options,
      customizations: {
        title: 'Ndarehe Booking Payment',
        description: 'Secure checkout powered by Flutterwave',
      },
    };

    // Call Flutterwave REST API directly (hosted pay)
    const { data } = await axios.post(
      `${FLW_API_BASE}/payments`,
      requestPayload,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    console.log('[Flutterwave] Initialize response:', JSON.stringify(data, null, 2));

    const link = data?.data?.link || data?.link;
    if (link) {
      console.log(`[Flutterwave] ✅ Payment link generated successfully: ${link}`);
      console.log(`[Flutterwave] Transaction reference: ${payload.tx_ref}`);
    } else {
      console.error('[Flutterwave] ❌ No payment link found in response:', data);
      throw new Error('Failed to generate payment link from Flutterwave response');
    }

    return data;
  } catch (error) {
    console.error("[Flutterwave] ❌ Initialize payment error:", error);

    if (error instanceof Error) {
      console.error("[Flutterwave] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else {
      console.error("[Flutterwave] Error details (non-Error type):", error);
    }

    // If axios error, log response data for clarity
    // @ts-ignore
    if (error?.response) {
      // @ts-ignore
      console.error('[Flutterwave] Axios response error:', error.response.status, error.response.data);
    }

    throw error;
  }
};

export const verifyPayment = async (tx_ref: string) => {
  try {
    console.log(`[Flutterwave] Verifying payment for tx_ref: ${tx_ref}`);

    // Verify by reference via REST API
    const { data } = await axios.get(
      `${FLW_API_BASE}/transactions/verify_by_reference`,
      {
        params: { tx_ref },
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('[Flutterwave] Verification response:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error("[Flutterwave] ❌ Verify payment error:", error);
    // @ts-ignore
    if (error?.response) {
      // @ts-ignore
      console.error('[Flutterwave] Axios response error (verify):', error.response.status, error.response.data);
    }
    throw error;
  }
};
