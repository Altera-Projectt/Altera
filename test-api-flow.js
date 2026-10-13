const path = require('path');
const fs = require('fs');

// Đảm bảo Node có thể nạp các package từ BE/node_modules
const beNodeModules = path.resolve(__dirname, 'BE/node_modules');
if (fs.existsSync(beNodeModules)) {
  module.paths.push(beNodeModules);
}

const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// 1. Load biến môi trường từ BE/.env
const envPath = path.resolve(__dirname, 'BE/.env');
dotenv.config({ path: envPath });

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
const BASE_URL = 'http://localhost:5000/api/v1';

async function runTestFlow() {
  console.log('🚀 Bắt đầu kịch bản test luồng API sinh ảnh AI và upload Cloudinary...');

  // 2. Tạo JWT Token giả lập
  const userId = '6a3a363badf6184a79ab4ceb';
  const token = jwt.sign({ id: userId, role: 'USER' }, JWT_SECRET, { expiresIn: '1d' });
  console.log(`🔑 Đã tạo JWT Token thành công cho User ID: ${userId}`);

  // 3. Gửi POST Request để đưa yêu cầu sinh ảnh vào hàng đợi
  const postUrl = `${BASE_URL}/designs/generate`;
  const requestBody = {
    prompt: 'A magical forest at night',
    style: 'Fantasy',
    shirtColor: '#000000',
    printSide: 'Front'
  };

  console.log(`\n📤 [POST] Đang gửi yêu cầu tới: ${postUrl}`);
  console.log(`📦 Body:`, JSON.stringify(requestBody));

  const postRes = await fetch(postUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  });

  const postData = await postRes.json();
  if (!postRes.ok) {
    console.error(`❌ Gửi yêu cầu thất bại (HTTP ${postRes.status}):`, postData);
    process.exit(1);
  }

  const jobId = postData.data?.jobId || postData.jobId;
  console.log(`📥 Nhận phản hồi thành công (HTTP ${postRes.status}): Job ID = ${jobId}`);

  // 4. Polling GET trạng thái xử lý mỗi 2 giây
  const statusUrl = `${BASE_URL}/designs/generate/status/${jobId}`;
  console.log(`\n⏳ Bắt đầu Polling kiểm tra trạng thái tại: ${statusUrl}`);

  let pollCount = 1;
  const pollIntervalMs = 2000;
  const maxPolls = 60; // Tối đa 2 phút

  const poll = async () => {
    try {
      const getRes = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const getData = await getRes.json();
      const jobData = getData.data || {};
      const state = jobData.state;

      console.log(`[Polling #${pollCount}] Trạng thái job: "${state}"`);

      if (state === 'completed') {
        const imageUrl = jobData.result?.imageUrl || jobData.result?.preview;
        console.log('\n=================================================================');
        console.log(`✅ THÀNH CÔNG! Link ảnh Cloudinary: ${imageUrl}`);
        console.log('=================================================================');
        process.exit(0);
      } else if (state === 'failed') {
        console.log('\n=================================================================');
        console.log(`❌ THẤT BẠI: ${jobData.failedReason || 'Không rõ nguyên nhân'}`);
        console.log('=================================================================');
        process.exit(1);
      } else {
        pollCount++;
        if (pollCount > maxPolls) {
          console.error('\n⚠️ Đã vượt quá thời gian chờ polling tối đa (2 phút). Thoát tiến trình.');
          process.exit(1);
        }
        setTimeout(poll, pollIntervalMs);
      }
    } catch (err) {
      console.error(`❌ Lỗi kết nối khi polling lần #${pollCount}:`, err.message);
      setTimeout(poll, pollIntervalMs);
    }
  };

  // Khởi động polling lần đầu sau 1 giây
  setTimeout(poll, 1000);
}

runTestFlow().catch((err) => {
  console.error('❌ Lỗi ngoại lệ trong quá trình chạy test:', err);
  process.exit(1);
});
