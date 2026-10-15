const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const CustomDesignDraft = require('../src/models/CustomDesignDraft');
const MarketplaceDesign = require('../src/models/MarketplaceDesign');
const DesignerProfile = require('../src/models/DesignerProfile');
const { generateToken } = require('../src/utils/jwt');

// Sample lightweight base64 PNG image (1x1 pixel)
const SAMPLE_BASE64_PREVIEW = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function runPublishFlowTest() {
  console.log('\n============================================================');
  console.log('🚀 [E2E PERFORMANCE TEST] Studio 3D to Marketplace Publish Flow');
  console.log('============================================================\n');

  // 1. Kết nối Database MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in .env');
  }
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');
  }

  // 2. Khởi tạo server HTTP tạm thời
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✅ Test server running on port: ${port}`);

  let testUser = null;
  let testDraft = null;
  let publishedDesign = null;

  try {
    // 3. Tìm hoặc khởi tạo Designer User & Token
    testUser = await User.findOne({ email: 'test.publisher@altera.local' });
    if (!testUser) {
      testUser = await User.create({
        fullName: 'Demo Publisher 3D',
        email: 'test.publisher@altera.local',
        password: 'Password123!',
        role: 'USER',
        isActive: true,
      });
    }

    let profile = await DesignerProfile.findOne({ userId: testUser._id });
    if (!profile) {
      profile = await DesignerProfile.create({
        userId: testUser._id,
        username: `demo_designer_${Date.now().toString(36)}`,
        displayName: testUser.fullName,
      });
    }

    const token = generateToken({ id: testUser._id, role: testUser.role });
    console.log(`✅ Authenticated test designer: ${profile.username}`);

    // 4. Lấy một phôi áo Product còn hoạt động
    const baseProduct = await Product.findOne({ isActive: true, category: 'T-Shirt' });
    if (!baseProduct) {
      throw new Error('No active T-Shirt product found in database. Please seed products first.');
    }
    const color = baseProduct.colors?.[0] || { name: 'Trắng', hex: '#FFFFFF' };
    const size = baseProduct.sizes?.[0]?.label || 'L';
    const technique = baseProduct.printingTechniques?.[0]?.code || 'DTF';
    console.log(`✅ Selected base product template: "${baseProduct.name}" (${baseProduct._id})`);

    // 5. Tạo một CustomDesignDraft giả lập trạng thái Studio 3D đã thiết kế
    testDraft = await CustomDesignDraft.create({
      userId: testUser._id,
      productId: baseProduct._id,
      name: `Draft Demo 3D Shirt ${Date.now()}`,
      shirtColor: color.hex,
      color: { name: color.name, hex: color.hex },
      size: size,
      printSide: 'FRONT',
      printingTechnique: technique,
      frontDesign: {
        layers: [
          {
            id: 'layer-mock-art',
            type: 'image',
            name: 'Artwork Layer',
            src: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500',
            visible: true,
            x: 50,
            y: 50,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
        ],
      },
      backDesign: { layers: [] },
    });
    console.log(`✅ Created Studio 3D draft: ${testDraft._id}`);

    // 6. Gửi Payload Publish và đo lường thời gian (Performance Profiling)
    console.log('\n⏱️  Bắt đầu gửi request Publish lên API Backend...');
    const publishPayload = {
      draftId: testDraft._id.toString(),
      name: `Áo Thun 3D Demo Marketplace ${Date.now().toString(36).toUpperCase()}`,
      description: 'Mẫu áo thiết kế 3D hoàn chỉnh chụp từ WebGL canvas được publish lên Marketplace.',
      price: (baseProduct.price || 300000) + 70000,
      category: 'T-Shirt',
      tags: ['demo', 'studio3d', 'streetwear', 'altera'],
      thumbnailBase64: SAMPLE_BASE64_PREVIEW,
      shirtColor: color.hex,
    };

    console.time('PublishFlow');
    const startTime = performance.now();

    const response = await fetch(`${baseUrl}/designers/me/designs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(publishPayload),
    });

    const endTime = performance.now();
    console.timeEnd('PublishFlow');
    const totalDuration = Math.round(endTime - startTime);

    const body = await response.json();

    if (!response.ok) {
      console.error('❌ API returned error response:', body);
      throw new Error(`Publish API failed with HTTP status ${response.status}: ${body.message || 'Unknown error'}`);
    }

    publishedDesign = body.data?.design;
    console.log('\n============================================================');
    console.log('📊 KẾT QUẢ ĐO LƯỜNG HIỆU NĂNG & DỮ LIỆU TRẢ VỀ:');
    console.log('============================================================');
    console.log(`⏱️  Tổng thời gian xử lý (Total Duration): ${totalDuration} ms`);
    console.log(`🆔 ID thiết kế (Design ID): ${publishedDesign?._id}`);
    console.log(`🏷️  Tên thiết kế (Name): ${publishedDesign?.name}`);
    console.log(`💰 Giá bán (Price): ${publishedDesign?.price?.toLocaleString('vi-VN')} ₫`);
    console.log(`🚦 Trạng thái (Status): ${publishedDesign?.status}`);
    console.log(`🖼️  Thumbnail URL: ${publishedDesign?.thumbnail}`);
    console.log(`🖼️  ThumbnailUrl: ${publishedDesign?.thumbnailUrl}`);
    console.log('============================================================\n');

    // 7. ASSERTIONS & KIỂM TRA TÍNH TOÀN VẸN
    console.log('🔍 Kiểm tra Assertions:');

    // Kiểm tra tính hợp lệ của response
    assert.ok(body.success, 'Response success must be true');
    assert.ok(publishedDesign, 'Design object must be returned');

    // Kiểm tra thumbnail là Cloudinary HTTPS URL
    assert.ok(
      typeof publishedDesign.thumbnail === 'string' && publishedDesign.thumbnail.startsWith('https://res.cloudinary.com/'),
      `Thumbnail must be a valid Cloudinary HTTPS URL! Received: ${publishedDesign.thumbnail}`
    );
    console.log('  [PASS] 1. Thumbnail lưu trữ trực tiếp trên Cloudinary (https://res.cloudinary.com/...)');

    // Kiểm tra tuyệt đối không chứa Base64 trong DB
    assert.ok(
      !publishedDesign.thumbnail.startsWith('data:'),
      'Thumbnail MUST NOT be a Base64 string'
    );
    console.log('  [PASS] 2. Tuyệt đối không chứa chuỗi Base64 rác trong cơ sở dữ liệu');

    // Kiểm tra liên kết áo phôi
    assert.equal(
      publishedDesign.productId.toString(),
      baseProduct._id.toString(),
      'Design must be correctly linked to base product'
    );
    console.log('  [PASS] 3. Liên kết chính xác với áo phôi vật lý (Product ID)');

    // Kiểm tra thời gian phản hồi đạt chuẩn nhanh mượt (< 5000ms bao gồm cả upload Cloudinary qua internet)
    assert.ok(
      totalDuration < 5000,
      `Publish flow should complete under 5000ms. Actual: ${totalDuration}ms`
    );
    console.log(`  [PASS] 4. Hiệu năng đạt chuẩn demo: ${totalDuration}ms (< 5000ms)`);

    console.log('\n🎉 ALL PUBLISH FLOW ASSERTIONS PASSED SUCCESSFULLY! 100% READY!\n');
    return { success: true, duration: totalDuration, design: publishedDesign };
  } finally {
    // Dọn dẹp tài nguyên test
    if (publishedDesign?._id) {
      await MarketplaceDesign.deleteOne({ _id: publishedDesign._id });
    }
    if (testDraft?._id) {
      await CustomDesignDraft.deleteOne({ _id: testDraft._id });
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log('🧹 Test cleanup completed. Server & DB connection closed.');
  }
}

if (require.main === module) {
  runPublishFlowTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ PUBLISH FLOW TEST FAILED:', err);
      process.exit(1);
    });
}

module.exports = { runPublishFlowTest };
