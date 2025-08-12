const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

async function testReferralAPI() {
  try {
    console.log('1. Attempting to login...');
    
    // Use the test user we just created
    const testCredentials = [
      { email: 'test@example.com', password: 'password123' }
    ];
    
    let loginResponse;
    let successfulCredentials;
    
    for (const cred of testCredentials) {
      try {
        console.log(`Trying ${cred.email} with password: ${cred.password}`);
        loginResponse = await axios.post(`${baseURL}/auth/login`, cred);
        successfulCredentials = cred;
        break;
      } catch (error) {
        console.log(`Failed: ${error.response?.data?.message || error.message}`);
      }
    }
    
    if (!loginResponse) {
      throw new Error('Could not login with any test credentials');
    }
    
    console.log(`Login successful with ${successfulCredentials.email}!`);
    console.log('Token:', loginResponse.data.token);
    
    const token = loginResponse.data.token;
    
    console.log('\n2. Testing referral code generation...');
    
    // Test referral code generation
    const referralResponse = await axios.post(
      `${baseURL}/referral/generate-code`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Referral code generation successful!');
    console.log('Response:', JSON.stringify(referralResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testReferralAPI();