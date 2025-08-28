// Test script to verify environment variables
// Run with: node test-env.js

require('dotenv').config();

console.log('🔧 Testing Environment Variables...\n');

// Check Flutterwave variables
const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

console.log('Flutterwave Configuration:');
console.log('FLW_PUBLIC_KEY:', FLW_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
console.log('FLW_SECRET_KEY:', FLW_SECRET_KEY ? '✅ Set' : '❌ Missing');

if (FLW_PUBLIC_KEY) {
  console.log('Public Key starts with:', FLW_PUBLIC_KEY.substring(0, 10) + '...');
}

if (FLW_SECRET_KEY) {
  console.log('Secret Key starts with:', FLW_SECRET_KEY.substring(0, 10) + '...');
}

// Check other variables
console.log('\nOther Configuration:');
console.log('BACKEND_URL:', process.env.BACKEND_URL || '❌ Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || '❌ Not set');
console.log('PORT:', process.env.PORT || '❌ Not set');

// Test Flutterwave initialization
if (FLW_PUBLIC_KEY && FLW_SECRET_KEY) {
  console.log('\n🧪 Testing Flutterwave initialization...');
  try {
    const Flutterwave = require('flutterwave-node-v3');
    const flw = new Flutterwave(FLW_PUBLIC_KEY, FLW_SECRET_KEY);
    console.log('✅ Flutterwave client initialized successfully');
  } catch (error) {
    console.log('❌ Flutterwave initialization failed:', error.message);
  }
} else {
  console.log('\n❌ Cannot test Flutterwave - missing API keys');
}

console.log('\n📝 Next steps:');
if (!FLW_PUBLIC_KEY || !FLW_SECRET_KEY) {
  console.log('1. Create a .env file in the backend folder');
  console.log('2. Add your Flutterwave API keys');
  console.log('3. Restart your backend server');
} else {
  console.log('✅ Environment variables look good!');
  console.log('You can now test the payment integration.');
}
