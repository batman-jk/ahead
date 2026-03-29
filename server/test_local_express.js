import fetch from 'node-fetch';

async function testExpress() {
  console.log('Testing Local Express Server on port 3001...');
  try {
    const response = await fetch('http://127.0.0.1:3001/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Testing the new key again' })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

testExpress();
