const jwt = require('jsonwebtoken');

async function run() {
  const token = jwt.sign({ id: '60c72b2f9b1e8a0015f3a0a1', role: 'DESIGNER' }, 'AlteraSecretKey@2026', { expiresIn: '1d' });
  
  const start1 = Date.now();
  try {
    const res1 = await fetch('http://localhost:5001/api/v1/designers/marketplace');
    const data1 = await res1.json();
    console.log(`Marketplace API: ${Date.now() - start1}ms (Size: ${JSON.stringify(data1).length / 1024} KB)`);
  } catch (e) {
    console.log('Marketplace API Failed:', e.message);
  }

  const start2 = Date.now();
  try {
    const res2 = await fetch('http://localhost:5001/api/v1/designs/my', { headers: { Authorization: `Bearer ${token}` } });
    const data2 = await res2.json();
    console.log(`Library API: ${Date.now() - start2}ms (Size: ${JSON.stringify(data2).length / 1024} KB)`);
  } catch (e) {
    console.log('Library API Failed:', e.message);
  }
}

run();
