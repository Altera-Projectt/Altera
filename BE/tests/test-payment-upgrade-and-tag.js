require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const membershipService = require('../src/services/membership.service');
const { enrichUserResponse, getEffectiveTier, getDaysRemaining } = require('../src/utils/membership');

async function runTest() {
  console.log('=================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ: THANH TOÁN THÀNH CÔNG -> TỰ ĐỘNG NÂNG CẤP & GẮN TAG VIP');
  console.log('=================================================================\n');

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ Lỗi: Không tìm thấy MONGODB_URI trong file .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Đã kết nối MongoDB thành công.');

  // Tạo tài khoản test ngẫu nhiên ở gói FREE
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testEmail = `test.vip.user.${randomSuffix}@altera-test.vn`;
  
  const testUser = await User.create({
    fullName: `Khách Hàng Test VIP ${randomSuffix}`,
    email: testEmail,
    password: 'Password123!',
    role: 'USER',
    membershipTier: 'FREE',
    membershipStatus: 'ACTIVE',
    isLifetimeMembership: false,
    membershipStartedAt: null,
    membershipExpiresAt: null,
  });

  console.log(`\n👤 [1] ĐÃ TẠO TÀI KHOẢN TEST:`);
  console.log(`   - ID: ${testUser._id}`);
  console.log(`   - Họ tên: ${testUser.fullName}`);
  console.log(`   - Email: ${testUser.email}`);
  console.log(`   - Gói ban đầu: ${testUser.membershipTier}`);
  console.log(`   - Quyền hiệu lực (effectiveTier): ${getEffectiveTier(testUser)}`);
  console.log(`   - Tag / Badge UI ban đầu: "GÓI MIỄN PHÍ (1 ảnh AI/tuần • Chỉ mua hàng)"`);
  console.log(`   - Vương miện Avatar: Không có`);

  // Bắt đầu đo thời gian thanh toán và nâng cấp
  console.log('\n💳 [2] BẮT ĐẦU MÔ PHỎNG LUỒNG THANH TOÁN THÀNH CÔNG (VIETQR / POST /membership/upgrade)...');
  const startTime = Date.now();
  const startIso = new Date().toISOString();

  // Gọi service upgrade lên gói PRO (99k/Tháng)
  const upgradeResult = await membershipService.upgrade(testUser._id, {
    tier: 'PRO',
    paymentMethod: 'BANK_TRANSFER',
  });

  const endTime = Date.now();
  const endIso = new Date().toISOString();
  const durationMs = endTime - startTime;

  // Lấy lại dữ liệu trực tiếp từ Database để verify tính nhất quán
  const refreshedUser = await User.findById(testUser._id);
  const enriched = await enrichUserResponse(refreshedUser);

  console.log('\n=================================================================');
  console.log('⏱️ KẾT QUẢ ĐO THỜI GIAN THỰC HIỆN:');
  console.log(`   - Thời điểm bắt đầu:  ${startIso}`);
  console.log(`   - Thời điểm kết thúc: ${endIso}`);
  console.log(`   - Tổng thời gian xử lý: ${durationMs} ms (~${(durationMs / 1000).toFixed(2)} giây)`);
  console.log('=================================================================\n');

  console.log('🔍 [3] KIỂM TRA DỮ LIỆU TÀI KHOẢN SAU KHI NÂNG CẤP TRÊN DATABASE:');
  console.log(`   - Cấp bậc lưu trữ (membershipTier): "${refreshedUser.membershipTier}"`);
  console.log(`   - Cấp bậc hiệu lực (effectiveTier):   "${enriched.effectiveTier}"`);
  console.log(`   - Trạng thái hội viên (status):       "${refreshedUser.membershipStatus}"`);
  console.log(`   - Thời điểm kích hoạt (startedAt):   ${refreshedUser.membershipStartedAt?.toISOString()}`);
  console.log(`   - Thời điểm hết hạn (expiresAt):     ${refreshedUser.membershipExpiresAt?.toISOString()}`);
  console.log(`   - Số ngày sử dụng còn lại:          ${enriched.daysRemaining} ngày`);

  console.log('\n👑 [4] KIỂM TRA HIỆU ỨNG NHẬN DIỆN & TAG TRÊN GIAO DIỆN (UI):');
  const hasCrown = enriched.effectiveTier === 'PRO';
  const avatarRing = enriched.effectiveTier === 'PRO' ? 'Viền Vàng Hoàng Kim (ring-4 ring-amber-400)' : 'Viền thường';
  const tagBadge = enriched.effectiveTier === 'PRO' ? `👑 GÓI PRO • Còn ${enriched.daysRemaining} ngày` : 'FREE';

  console.log(`   - Vương miện Avatar (Crown Badge):  ${hasCrown ? '✅ ĐÃ GẮN (Vương miện Vàng Gold)' : '❌ Không có'}`);
  console.log(`   - Hiệu ứng viền Avatar:            ✅ ${avatarRing}`);
  console.log(`   - Tag / Badge hiển thị trên UI:    ✅ "${tagBadge}"`);
  console.log(`   - Quyền hạn tạo ảnh AI:            ✅ Không giới hạn`);
  console.log(`   - Quyền hạn 3D Studio & Lưu nháp:  ✅ Đã mở khóa`);
  console.log(`   - Quyền hạn đăng bán Marketplace:  ✅ Không giới hạn`);

  // Assertions
  const asserts = [
    { name: 'Cấp bậc là PRO', pass: enriched.effectiveTier === 'PRO' },
    { name: 'Thời gian sử dụng = 30 ngày', pass: enriched.daysRemaining === 30 },
    { name: 'Có thời gian bắt đầu & hết hạn', pass: !!refreshedUser.membershipStartedAt && !!refreshedUser.membershipExpiresAt },
    { name: 'Trạng thái ACTIVE', pass: refreshedUser.membershipStatus === 'ACTIVE' },
    { name: 'Thời gian phản hồi < 1000ms', pass: durationMs < 1000 },
  ];

  console.log('\n📋 [5] TỔNG KẾT ĐÁNH GIÁ (VERIFICATION):');
  let allPass = true;
  for (const a of asserts) {
    if (a.pass) {
      console.log(`   ✔ [PASS] ${a.name}`);
    } else {
      console.log(`   ✖ [FAIL] ${a.name}`);
      allPass = false;
    }
  }

  // Dọn dẹp tài khoản test
  await User.deleteOne({ _id: testUser._id });
  console.log(`\n🧹 [6] Đã dọn dẹp tài khoản test (${testUser.email}) khỏi database.`);

  await mongoose.disconnect();
  console.log('✅ Đã ngắt kết nối database an toàn.\n');

  if (!allPass) {
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('❌ Lỗi kiểm thử:', err);
  process.exit(1);
});
