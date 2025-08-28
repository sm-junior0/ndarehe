# 🔧 Flutterwave Setup Guide

## 🚨 **CRITICAL: You need to set up Flutterwave environment variables**

The error you're seeing is because the Flutterwave API keys are not configured. Follow these steps:

### **Step 1: Get Flutterwave API Keys**

1. **Go to Flutterwave Dashboard**: https://dashboard.flutterwave.com/
2. **Sign up/Login** to your account
3. **Go to Settings → API Keys**
4. **Copy your Test API Keys**:
   - **Public Key**: `FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X`
   - **Secret Key**: `FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X`

### **Step 2: Create .env file**

Create a file called `.env` in your `backend` folder with this content:

```bash
# Flutterwave Configuration
FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X
FLW_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-X

# Backend Configuration
BACKEND_URL=http://localhost:5000
NODE_ENV=development

# Database Configuration (if using local database)
DATABASE_URL="postgresql://username:password@localhost:5432/ndarehe"

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Port
PORT=5000
```

### **Step 3: Restart Your Backend**

After creating the `.env` file:

```bash
cd backend
npm run dev
```

You should see:
```
[Flutterwave] ✅ Environment variables loaded successfully
[Flutterwave] Public Key: FLWPUBK_TE...
[Flutterwave] Secret Key: FLWSECK_TE...
```

### **Step 4: Test the Integration**

1. **Go to your frontend**: http://localhost:5173
2. **Navigate to an accommodation page**
3. **Click "Book Now"**
4. **Fill in booking details**
5. **Click "Confirm and Pay"**

You should now see:
```
[Flutterwave] 🚀 Initializing payment...
[Flutterwave] ✅ Payment link generated successfully: https://checkout.flutterwave.com/v3/hosted/pay/...
```

## 🔍 **If you still get errors:**

1. **Check your backend console** for detailed error messages
2. **Verify your API keys** are correct
3. **Make sure the .env file is in the backend folder**
4. **Restart your backend** after making changes

## 📞 **Need Help?**

- **Flutterwave Documentation**: https://developer.flutterwave.com/
- **Test Cards**: https://developer.flutterwave.com/docs/test-cards
