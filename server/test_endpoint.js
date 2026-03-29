async function testApi() {
  console.log('Testing AI Proxy endpoints...');
  try {
    const response = await fetch('http://localhost:3001/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Built a flutter project with Mistral API' })
    });
    const result = await response.json();
    console.log('Classification Result:', JSON.stringify(result, null, 2));
    
    if (result.type === 'project') {
      console.log('✅ Classification SUCCESS!');
    } else {
      console.log('❌ Classification FAILED (expected "project")');
    }
  } catch (err) {
    console.error('API Test Failed!', err);
  }
}

testApi();
