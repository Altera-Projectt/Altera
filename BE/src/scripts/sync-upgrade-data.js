require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');
const DesignerProfile = require('../models/DesignerProfile');
const MarketplaceDesign = require('../models/MarketplaceDesign');
const productsSeed = require('../seeds/products.seed');

const CREATOR_SEEDS = [
  {
    username: 'minh_streetlab',
    displayName: 'Minh StreetLab Studio',
    email: 'minh.streetlab@altera.vn',
    fullName: 'Trần Quang Minh',
    membershipTier: 'PRO',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    bio: 'Chuyên thiết kế Áo Thun Streetwear & Typography đương đại Việt Nam.',
  },
  {
    username: 'linh_y2k_atelier',
    displayName: 'Linh Cyber & Y2K',
    email: 'linh.atelier@altera.vn',
    fullName: 'Nguyễn Khánh Linh',
    membershipTier: 'PRO',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    bio: 'Sáng tạo đồ họa Y2K, Baby Tee và Cyber Graphic trên nền vải Cotton cao cấp.',
  },
  {
    username: 'khoi_viet_archive',
    displayName: 'Khôi Việt Archive',
    email: 'khoi.archive@altera.vn',
    fullName: 'Huỳnh Anh Khôi',
    membershipTier: 'PRO',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Tái hiện di sản văn hóa Việt Nam qua ngôn ngữ thiết kế Áo Thun 3D hiện đại.',
  },
  {
    username: 'vy_minimal_club',
    displayName: 'Vy Minimalist Club',
    email: 'vy.minimal@altera.vn',
    fullName: 'Lê Thảo Vy',
    membershipTier: 'PREMIUM',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    bio: 'Tối giản trong từng đường nét Typography và bảng màu trung tính.',
  },
];

const MARKETPLACE_DESIGN_SEEDS = [
  {
    slug: 'ao-thun-saigon-cyber-dragon-280gsm',
    name: 'Áo Thun Boxy Sài Gòn Cyber Dragon 280gsm',
    description: 'Thiết kế rồng cơ khí lấy cảm hứng từ nhịp sống đêm Sài Gòn, in DTG sắc nét trên phôi áo Boxy 280gsm.',
    category: 'T-Shirt',
    tags: ['Streetwear', 'Cyber', 'Việt Nam', 'Boxy'],
    price: 259000,
    salesCount: 42,
    likesCount: 128,
    creatorIndex: 0,
    thumbnail: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    color: { name: 'Đen tuyền', hex: '#111111' },
    size: 'L',
  },
  {
    slug: 'ao-thun-vietnam-heritage-lotus-oversize',
    name: 'Áo Thun Oversize Liên Hoa Bản Sắc Việt',
    description: 'Họa tiết hoa sen cách điệu kết hợp Typography hiện đại trên phôi áo Oversize 240gsm màu Kem sữa.',
    category: 'T-Shirt',
    tags: ['Văn hóa Việt', 'Vintage', 'Oversize', 'Art'],
    price: 239000,
    salesCount: 38,
    likesCount: 114,
    creatorIndex: 2,
    thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    color: { name: 'Kem sữa', hex: '#F3EFE6' },
    size: 'M',
  },
  {
    slug: 'ao-thun-baby-tee-chrome-star-y2k',
    name: 'Áo Thun Baby Tee Chrome Star Y2K',
    description: 'Họa tiết ngôi sao Chrome ánh bạc phong cách thập niên 2000 trên phôi Baby Tee Cotton 4 chiều tôn dáng.',
    category: 'T-Shirt',
    tags: ['Y2K', 'Baby Tee', 'Cyber', 'Streetwear'],
    price: 219000,
    salesCount: 35,
    likesCount: 96,
    creatorIndex: 1,
    thumbnail: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    color: { name: 'Trắng kem', hex: '#FAF8F5' },
    size: 'S',
  },
  {
    slug: 'ao-thun-minimal-silence-studio-boxy',
    name: 'Áo Thun Boxy Silence Type Minimalist',
    description: 'Phong cách Bắc Âu tối giản với dòng chữ Typography tinh tế trước ngực, dễ dàng phối cùng quần âu hoặc jeans.',
    category: 'T-Shirt',
    tags: ['Minimalist', 'Typo', 'Art', 'Boxy'],
    price: 229000,
    salesCount: 29,
    likesCount: 85,
    creatorIndex: 3,
    thumbnail: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80',
    color: { name: 'Trắng', hex: '#FFFFFF' },
    size: 'M',
  },
  {
    slug: 'ao-thun-acid-wash-retro-tokyo-drift',
    name: 'Áo Thun Acid Wash Retro Street 1998',
    description: 'Phôi áo Acid Wash xám khói bụi bặm kết hợp hình in 그래픽 cổ điển sắc sảo ở cả mặt trước và mặt sau.',
    category: 'T-Shirt',
    tags: ['Vintage', 'Streetwear', 'Retro', 'Wash'],
    price: 279000,
    salesCount: 31,
    likesCount: 92,
    creatorIndex: 0,
    thumbnail: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    color: { name: 'Xám khói Wash', hex: '#4B5563' },
    size: 'L',
  },
  {
    slug: 'ao-thun-hanoi-autumn-manifesto-regular',
    name: 'Áo Thun Regular Hà Nội Mùa Thu Manifesto',
    description: 'Bản vẽ ký họa phố cổ Hà Nội kết hợp bảng màu trầm ấm trên phôi áo Regular Fit 220gsm mềm mịn.',
    category: 'T-Shirt',
    tags: ['Văn hóa Việt', 'Vintage', 'Minimalist', 'Art'],
    price: 219000,
    salesCount: 24,
    likesCount: 74,
    creatorIndex: 2,
    thumbnail: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    color: { name: 'Xanh Navy', hex: '#0F172A' },
    size: 'L',
  },
  {
    slug: 'ao-thun-neo-angel-cyberpunk-oversize',
    name: 'Áo Thun Oversize Neo Angel Cyberpunk',
    description: 'Đồ họa AI генератив kết hợp nghệ thuật Neo-Futurism trên phôi áo thun Oversize 240gsm rộng rãi.',
    category: 'T-Shirt',
    tags: ['Y2K', 'Cyber', 'Streetwear', 'Art'],
    price: 249000,
    salesCount: 27,
    likesCount: 88,
    creatorIndex: 1,
    thumbnail: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
    color: { name: 'Đen', hex: '#141414' },
    size: 'XL',
  },
  {
    slug: 'ao-thun-essential-architect-grid-280gsm',
    name: 'Áo Thun Boxy Architect Grid 280gsm',
    description: 'Bố cục lưới kiến trúc đương đại dành cho tín đồ yêu thích sự chuẩn xác và tối giản.',
    category: 'T-Shirt',
    tags: ['Minimalist', 'Art', 'Typo', 'Boxy'],
    price: 235000,
    salesCount: 19,
    likesCount: 63,
    creatorIndex: 3,
    thumbnail: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    color: { name: 'Xám tiêu', hex: '#9CA3AF' },
    size: 'M',
  },
];

async function runSync() {
  try {
    await connectDB();

    // 1. Upsert all 12 curated products from products.seed.js
    for (const item of productsSeed) {
      await Product.findOneAndUpdate(
        { name: item.name },
        {
          $set: {
            ...item,
            isActive: true,
            printingTechniques: [
              {
                code: 'DTF',
                name: 'In DTF (Màng chuyển nhiệt sắc nét)',
                price: 40000,
                additionalSidePrice: 25000,
                customizationPrice: 0,
                description: 'Bền màu, chi tiết nhỏ sắc sảo, phù hợp mọi màu vải.',
              },
              {
                code: 'DTG',
                name: 'In DTG (Phun trực tiếp thấm sợi vải)',
                price: 60000,
                additionalSidePrice: 35000,
                customizationPrice: 0,
                description: 'Mực thấm trực tiếp vào thớ vải Cotton, thoáng khí tuyệt đối.',
              },
            ],
          },
        },
        { upsert: true, new: true }
      );
    }

    // 2. Also normalize any existing older products with high prices (> 230,000 VND)
    await Product.updateMany(
      { price: { $gt: 230000 } },
      {
        $set: {
          price: 189000,
          discountPrice: 159000,
          'printingTechniques.0.price': 40000,
          'printingTechniques.0.additionalSidePrice': 25000,
          'printingTechniques.1.price': 60000,
          'printingTechniques.1.additionalSidePrice': 35000,
        },
      }
    );

    const baseProducts = await Product.find({ isActive: true, category: 'T-Shirt' }).lean();
    const defaultProduct = baseProducts[0] || (await Product.findOne({ isActive: true }).lean());

    // 3. Ensure Creator users and DesignerProfiles exist
    const creatorProfiles = [];
    for (const c of CREATOR_SEEDS) {
      let user = await User.findOne({ email: c.email });
      if (!user) {
        user = await User.create({
          fullName: c.fullName,
          email: c.email,
          password: 'Password123!',
          role: 'USER',
          isActive: true,
          avatar: c.avatar,
          membershipTier: c.membershipTier,
          membershipStatus: 'ACTIVE',
          membershipStartedAt: new Date(),
          membershipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }
      let profile = await DesignerProfile.findOne({
        $or: [{ userId: user._id }, { username: c.username }],
      });
      if (!profile) {
        profile = await DesignerProfile.create({
          userId: user._id,
          username: c.username,
          displayName: c.displayName,
          avatar: c.avatar,
          bio: c.bio,
        });
      }
      creatorProfiles.push({ user, profile });
    }

    // 4. Lower prices of any existing MarketplaceDesigns > 320,000 VND so all marketplace items are affordable
    await MarketplaceDesign.updateMany(
      { price: { $gt: 320000 } },
      { $set: { price: 249000 } }
    );

    // 5. Upsert diverse MarketplaceDesigns across creators
    if (defaultProduct && creatorProfiles.length > 0) {
      for (let i = 0; i < MARKETPLACE_DESIGN_SEEDS.length; i += 1) {
        const seed = MARKETPLACE_DESIGN_SEEDS[i];
        const creator = creatorProfiles[seed.creatorIndex % creatorProfiles.length];
        const productDoc = baseProducts[i % baseProducts.length] || defaultProduct;

        await MarketplaceDesign.findOneAndUpdate(
          { slug: seed.slug },
          {
            $set: {
              designerId: creator.profile._id,
              userId: creator.user._id,
              draftId: new mongoose.Types.ObjectId(),
              name: seed.name,
              slug: seed.slug,
              description: seed.description,
              thumbnail: seed.thumbnail,
              thumbnailUrl: seed.thumbnail,
              productId: productDoc._id,
              color: seed.color,
              size: seed.size,
              printSide: 'FRONT',
              printingTechnique: 'DTF',
              frontDesign: {
                layers: [
                  {
                    id: `seed-layer-${i}`,
                    type: 'image',
                    name: seed.name,
                    src: seed.thumbnail,
                    x: 50,
                    y: 45,
                    scaleX: 1,
                    scaleY: 1,
                    rotation: 0,
                    zIndex: 1,
                    visible: true,
                  },
                ],
              },
              backDesign: { layers: [] },
              price: seed.price,
              category: seed.category,
              tags: seed.tags,
              status: 'PUBLISHED',
              salesCount: seed.salesCount,
              likesCount: seed.likesCount,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log('Successfully synced upgraded products, prices, measurements, and marketplace designs!');
    process.exit(0);
  } catch (err) {
    console.error('Sync script warning:', err.message);
    process.exit(0);
  }
}

runSync();
