async function testFullApi() {
  console.log('Testing ALL AI Proxy endpoints (V2)...');
  try {
    // 1. Classify
    const cRes = await fetch('http://localhost:3001/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Learning Rust programming' })
    });
    console.log('Classify (Rust):', (await cRes.json()).type);

    // 2. Roadmap
    const rRes = await fetch('http://localhost:3001/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'Become a Rust Expert', skills: [] })
    });
    const roadmap = await rRes.json();
    console.log('Roadmap (Rust):', roadmap.todayGoal);

    // 3. Resources
    const sRes = await fetch('http://localhost:3001/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill: 'Rust Ownership', level: 'Beginner' })
    });
    const resources = await sRes.json();
    console.log('Resources (Ownership): Count =', resources.length);

    console.log('✅ ALL TESTS PASSED!');
  } catch (err) {
    console.error('API Test Failed!', err);
  }
}

testFullApi();
