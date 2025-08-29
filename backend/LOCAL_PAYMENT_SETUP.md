# Local Payment Integration Setup

This guide explains how to set up and test the Flutterwave payment integration using your local backend (port 5000) instead of the deployed backend.

## 🔧 Setup Instructions

### 1. Environment Variables

Make sure your local backend has the following environment variables set in `.env`:

```bash
# Flutterwave Configuration
FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxx
FLW_SECRET_KEY=FLWSECK_TEST-xxxx

# Backend Configuration
BACKEND_URL=http://localhost:5000
NODE_ENV=development

# Database (if using local database)
DATABASE_URL=your_local_database_url
```

### 2. Start Local Backend

```bash
cd backend
npm install
npm run dev
```

Your backend should be running on `http://localhost:5000`

### 3. Frontend Configuration

The frontend has been configured to use the local backend for payment endpoints only:

- **Payment endpoints**: `http://localhost:5000/api`
- **Other endpoints**: `https://ndarehe.onrender.com/api`

## 🧪 Testing the Integration

### Option 1: Using the Test Script

```bash
cd backend
node test-payment-local.js
```

This will test:
- Local backend connectivity
- Flutterwave payment initialization
- Payment link generation

### Option 2: Manual Testing

1. **Start your local backend** on port 5000
2. **Start your frontend** on port 5173
3. **Navigate to an accommodation page**
4. **Fill in booking details**
5. **Select payment method** (MTN/Airtel or Card)
6. **Click "Pay with [Method] (Flutterwave)"**
7. **Check console logs** for payment link generation

## 📋 Expected Console Output

When testing payments, you should see logs like:

```
[Flutterwave API] Initializing payment via LOCAL backend: {
  bookingId: "booking-id",
  amount: 50000,
  currency: "RWF",
  customer: { email: "user@example.com", name: "User Name" }
}

[Payment] Initializing Flutterwave payment for booking booking-id
[Payment] Amount: 50000 RWF
[Payment] Customer: User Name (user@example.com)
[Payment] Environment: development
[Payment] Backend URL: localhost:5000

[Flutterwave] ✅ Payment link generated successfully: https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-...
[Payment] ✅ Flutterwave payment link generated: https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-...
[Payment] Transaction reference: ACCOM-booking-id-timestamp
[Payment] Booking ID: booking-id
[Payment] Redirect URL: http://localhost:5000/api/payments/flutterwave/verify

[Flutterwave API] Init response from local backend: { success: true, link: "...", tx_ref: "..." }
```

## 🔄 Payment Flow

1. **User initiates payment** → Frontend calls local backend (`localhost:5000`)
2. **Local backend generates Flutterwave link** → Returns payment link to frontend
3. **User completes payment** → On Flutterwave's secure page
4. **User verifies payment** → Frontend calls local backend for verification
5. **Payment confirmed** → Local backend updates booking and sends email
6. **User redirected** → To frontend success page (`localhost:5173`)

## 🚨 Troubleshooting

### Local Backend Not Starting
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill process if needed
kill -9 <PID>

# Start backend again
npm run dev
```

### Payment Link Not Generated
- Check Flutterwave environment variables
- Verify local backend is running on port 5000
- Check console logs for detailed error messages

### Frontend Can't Connect to Local Backend
- Ensure CORS is properly configured in local backend
- Check if frontend is making requests to `localhost:5000`
- Verify network connectivity

### Payment Verification Fails
- Check if local backend can access the database
- Verify Flutterwave verification endpoint is working
- Check console logs for verification errors

## 📞 Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure both frontend and backend are running
4. Test with the provided test script

## 🔄 Switching Back to Deployed Backend

To switch back to using the deployed backend for payments, simply update the `flutterwaveApi` in `frontend/src/lib/api.ts` to use `apiRequest` instead of `localPaymentApiRequest`.
