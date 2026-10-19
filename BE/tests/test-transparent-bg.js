require('dotenv').config();

const { v2: cloudinary } = require('cloudinary');
const { removeBackground } = require('../src/utils/removeBackground');
const https = require('https');
const mongoose = require('mongoose');
const UploadedImage = require('../src/models/UploadedImage');
const Design = require('../src/models/Design');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  const originalUrl = 'https://res.cloudinary.com/pingbx2s/image/upload/v1791910014/altera/designs/generated/itl3b2wt0kb1gxidaact.png';

  console.log('1. Downloading original image from Cloudinary...');
  const fetchBuffer = (url) => new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });

  const originalBuffer = await fetchBuffer(originalUrl);
  const originalSizeKb = (originalBuffer.length / 1024).toFixed(2);
  console.log(`   Downloaded ${originalBuffer.length} bytes (${originalSizeKb} KB)`);

  console.log('2. Running background removal algorithm...');
  const startTime = Date.now();
  const bgRes = await removeBackground(originalBuffer, { tolerance: 32, feather: 12, defringe: true });
  const processDuration = Date.now() - startTime;
  const transparentPngBuffer = bgRes.buffer;
  const newSizeKb = (transparentPngBuffer.length / 1024).toFixed(2);
  console.log(`   Processed in ${processDuration} ms! Transparent pixels: ${bgRes.transparentPixelsCount}. New PNG size: ${transparentPngBuffer.length} bytes (${newSizeKb} KB)`);

  console.log('3. Uploading transparent PNG to Cloudinary...');
  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'altera/designs/generated',
        public_id: 'itl3b2wt0kb1gxidaact_transparent_test',
        resource_type: 'image',
        format: 'png',
        overwrite: true
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(transparentPngBuffer);
  });

  console.log('\n===== KẾT QUẢ TÁCH NỀN CLOUDINARY THỰC TẾ =====');
  console.log('Ảnh gốc (Original):', originalUrl);
  console.log('Ảnh đã tách nền (Transparent):', uploadResult.secure_url);
  console.log('Public ID:', uploadResult.public_id);
  console.log('Format:', uploadResult.format);
  console.log('Kích thước ảnh:', `${uploadResult.width} x ${uploadResult.height} px`);
  console.log('Thời gian xử lý tách nền:', processDuration, 'ms');
  console.log('Dung lượng ảnh gốc:', originalSizeKb, 'KB');
  console.log('Dung lượng ảnh tách nền:', newSizeKb, 'KB');

  console.log('\n4. Cập nhật URL mới vào Database...');
  await mongoose.connect(process.env.MONGODB_URI);

  const upRes = await UploadedImage.updateOne(
    { _id: '6ace473bda859c1d5588672a' },
    { $set: { url: uploadResult.secure_url, thumbnailUrl: uploadResult.secure_url } }
  );
  const desRes = await Design.updateOne(
    { _id: '6ace46dada859c1d55886720' },
    { $set: { imageUrl: uploadResult.secure_url } }
  );

  console.log('Database updated successfully:', {
    uploadedImageModified: upRes.modifiedCount,
    designModified: desRes.modifiedCount
  });

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
