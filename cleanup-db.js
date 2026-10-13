const path = require('path');
const fs = require('fs');

// Cho phép load thư viện mongoose và dotenv từ BE/node_modules khi chạy script ở thư mục gốc
const beNodeModules = path.resolve(__dirname, 'BE/node_modules');
if (fs.existsSync(beNodeModules)) {
  module.paths.push(beNodeModules);
}

const dotenv = require('dotenv');
const mongoose = require('mongoose');

// 1. Load biến môi trường từ file BE/.env
const envPath = path.resolve(__dirname, 'BE/.env');
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ Không tìm thấy biến môi trường MONGO_URI trong file BE/.env');
  process.exit(1);
}

// 2. Load Models
const User = require('./BE/src/models/User');

// Helper drop collection an toàn và thu hồi disk space trên WiredTiger (Atlas Free Tier)
async function dropCollectionSafely(collectionName) {
  try {
    const coll = mongoose.connection.db.collection(collectionName);
    const countBefore = await coll.countDocuments();
    await mongoose.connection.db.dropCollection(collectionName);
    console.log(`✅ Đã drop collection "${collectionName}" (xóa ${countBefore} bản ghi), giải phóng 100% dung lượng file vật lý.`);
  } catch (err) {
    if (err.code === 26 || (err.message && err.message.includes('ns not found'))) {
      console.log(`ℹ️ Collection "${collectionName}" không tồn tại hoặc đã được drop trước đó.`);
    } else {
      console.error(`❌ Lỗi khi drop collection "${collectionName}":`, err.message);
    }
  }
}

async function cleanupDatabase() {
  try {
    console.log('🔄 Đang kết nối tới MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công!');

    // 3. Drop các collection chứa dữ liệu test Base64 cực nặng
    const collectionsToDrop = [
      'designs',
      'uploadedimages',
      'customdesigndrafts',
      'marketplacedesigns'
    ];

    console.log('\n🧹 Bắt đầu dọn dẹp và drop các collection rác...');
    for (const name of collectionsToDrop) {
      await dropCollectionSafely(name);
    }

    // 4. Dọn rác Collection users: Tìm các user có avatar Base64 (data:image/...) và reset về null
    console.log('\n🧹 Đang quét và dọn avatar Base64 trong collection "users"...');
    try {
      const updateUserResult = await User.updateMany(
        { avatar: { $regex: '^data:image/' } },
        { $set: { avatar: null } }
      );
      console.log(`✅ Đã cập nhật ${updateUserResult.modifiedCount} user có avatar chứa chuỗi Base64 về null.`);
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật avatar user:', err.message);
    }

    // 5. Thống kê chi tiết dung lượng sau khi dọn dẹp
    console.log('\n📊 Đang thống kê dung lượng Database sau khi dọn rác:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    let totalStorageMB = 0;
    let totalDataMB = 0;

    for (const c of collections) {
      try {
        const stats = await mongoose.connection.db.command({ collStats: c.name });
        const dataMB = stats.size / (1024 * 1024);
        const storageMB = stats.storageSize / (1024 * 1024);
        totalDataMB += dataMB;
        totalStorageMB += storageMB;

        console.log(`  📁 ${c.name.padEnd(24)}: ${String(stats.count).padStart(4)} docs | data: ${dataMB.toFixed(2)} MB | storage: ${storageMB.toFixed(2)} MB`);
      } catch (e) {
        // Bỏ qua nếu collection tạm hoặc view không hỗ trợ collStats
      }
    }

    console.log('─'.repeat(65));
    console.log(`💾 TỔNG DATA SIZE       : ${totalDataMB.toFixed(2)} MB`);
    console.log(`📦 TỔNG STORAGE SIZE    : ${totalStorageMB.toFixed(2)} MB / 512 MB (Hạn mức Atlas Free)`);
    console.log(`✨ DUNG LƯỢNG CÒN TRỐNG : ${(512 - totalStorageMB).toFixed(2)} MB`);
    console.log('─'.repeat(65));
    console.log('🎉 Toàn bộ dữ liệu Base64 đã được dọn sạch hoàn toàn!');
  } catch (error) {
    console.error('❌ Đã xảy ra lỗi trong quá trình dọn dẹp:', error);
    process.exit(1);
  } finally {
    // 6. Ngắt kết nối Database và thoát tiến trình
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB.');
    process.exit(0);
  }
}

cleanupDatabase();
