const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'BE/.env' });

const testLuot = async () => {
  try {
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    const userId = new mongoose.Types.ObjectId().toString(); // fake id
    const token = jwt.sign({ id: userId, role: 'USER' }, secret, { expiresIn: '1d' });

    console.log('[Test] Token generated');

    const payload = {
      prompt: "A vintage eagle print",
      style: "Vintage",
      shirtColor: "#ffffff",
      printSide: "Front"
    };

    console.log('[Test] Sending POST /api/v1/designs/generate');
    const res = await axios.post('http://localhost:5000/api/v1/designs/generate', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('[Test] Generate Response:', res.data);

    if (res.data.success && res.data.data.jobId) {
      const jobId = res.data.data.jobId;
      console.log(`[Test] Job enqueued with ID: ${jobId}. Polling status...`);
      
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await axios.get(`http://localhost:5000/api/v1/designs/generate/status/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log(`[Test] Status Check (Attempt ${attempts}):`, statusRes.data);
          
          if (statusRes.data.data.state === 'completed') {
            console.log('✅ Job completed! Result:', JSON.stringify(statusRes.data.data.result, null, 2));
            clearInterval(poll);
          } else if (statusRes.data.data.state === 'failed') {
            console.error('❌ Job failed!', statusRes.data.data.failedReason);
            clearInterval(poll);
          }
          
          if (attempts > 15) {
            console.error('❌ Timeout polling job');
            clearInterval(poll);
          }
        } catch (err) {
          console.error('[Test] Polling error:', err.message);
        }
      }, 3000);
    }
  } catch (error) {
    console.error('[Test] Error:', error.response ? error.response.data : error.message);
  }
};

testLuot();
