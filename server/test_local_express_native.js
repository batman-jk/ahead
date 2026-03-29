async function testExpress() {
  console.log('Testing Local Express Server on port 3001 using native fetch...');
  try {
    const response = await fetch('http://127.0.0.1:3001/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Testing the new key again' })
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Status: ${response.status}`);
      console.error(`Response Text: ${text}`);
      return;
    }

    const data = await response.json();
    console.log('Status: 200 (OK)');
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch failed:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('SERVER IS NOT RUNNING ON PORT 3001');
    }
  }
}

testExpress();
