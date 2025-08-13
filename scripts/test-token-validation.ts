require('dotenv').config({ path: '.env.local' });

async function testTokenValidation() {
  const testToken = "f2fe4228073f4da091bd46309e124d9e5efb7610c90e257ecd4d5f62748739bf";
  
  console.log('🧪 Testing token validation API...\n');
  console.log('🔑 Testing token:', testToken.substring(0, 10) + '...\n');

  try {
    const response = await fetch('http://localhost:3000/api/auth/reset-password/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: testToken }),
    });

    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Token validation successful!');
      console.log('🔗 Token is valid and can be used for password reset');
    } else {
      console.log('\n❌ Token validation failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Error testing token validation:', error);
  }

  console.log('\n🏁 Token validation test completed!');
}

testTokenValidation();