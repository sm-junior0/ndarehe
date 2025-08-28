// Test script for local payment integration
// Run this with: node test-payment-local.js

const axios = require('axios');

const LOCAL_API_URL = 'http://localhost:5000/api';

async function testLocalPaymentIntegration() {
  console.log('🧪 Testing Local Payment Integration...\n');

  try {
    // Test 1: Check if local backend is running
    console.log('1. Testing local backend connectivity...');
    const healthCheck = await axios.get(`${LOCAL_API_URL}/health`).catch(() => null);
    
    if (healthCheck) {
      console.log('✅ Local backend is running');
    } else {
      console.log('❌ Local backend is not running on port 5000');
      console.log('   Please start your local backend with: npm run dev');
      return;
    }

    // Test 2: Test Flutterwave payment initialization (mock data)
    console.log('\n2. Testing Flutterwave payment initialization...');
    
    const mockPaymentData = {
      bookingId: 'test-booking-123',
      amount: 50000,
      currency: 'RWF',
      customer: {
        email: 'test@example.com',
        name: 'Test User',
        phonenumber: '+250700000000'
      }
    };

    try {
      const paymentResponse = await axios.post(
        `${LOCAL_API_URL}/payments/flutterwave`,
        mockPaymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      );

      if (paymentResponse.data.success && paymentResponse.data.link) {
        console.log('✅ Payment initialization successful');
        console.log(`   Transaction Reference: ${paymentResponse.data.tx_ref}`);
        console.log(`   Payment Link: ${paymentResponse.data.link}`);
      } else {
        console.log('❌ Payment initialization failed');
        console.log('   Response:', paymentResponse.data);
      }
    } catch (error) {
      console.log('❌ Payment initialization error:');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message || error.message);
    }

    console.log('\n📋 Local Payment Integration Test Summary:');
    console.log('   - Local backend connectivity: ✅');
    console.log('   - Payment initialization: Check response above');
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure your local backend has Flutterwave environment variables set');
    console.log('   2. Test the payment flow in your frontend application');
    console.log('   3. Check the console logs for detailed payment information');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLocalPaymentIntegration();
