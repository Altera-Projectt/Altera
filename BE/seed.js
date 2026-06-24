/**
 * ALTERA - Seed Data Script
 * Chạy: node seed.js
 * Yêu cầu: MongoDB đang chạy tại localhost:27017
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://altera:Bin0710@altera.kesdxrm.mongodb.net/Altera?appName=Altera';
// ─── SCHEMAS (copy từ models) ─────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  avatar: { type: String, default: null },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['SHIRT', 'PANTS', 'SHOES', 'ACCESSORY'] },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: null },
  description: { type: String },
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: { type: [CartItemSchema], default: [] },
}, { timestamps: true });

const WishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  name: { type: String },
  imageUrl: { type: String },
}, { _id: false });

const ShippingAddressSchema = new mongoose.Schema({
  fullName: String, phone: String, street: String,
  city: String, province: String, country: { type: String, default: 'Vietnam' }, postalCode: String,
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['PENDING','CONFIRMED','SHIPPING','DELIVERED','CANCELLED'], default: 'PENDING' },
  shippingAddress: ShippingAddressSchema,
  note: String,
  statusHistory: [{ status: String, changedAt: { type: Date, default: Date.now }, note: String }],
}, { timestamps: true });

const DesignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shirtColor: { type: String, required: true },
  customText: { type: String, default: null },
  customImage: { type: String, default: null },
  previewImage: { type: String, default: null },
  fontSize: { type: Number, default: 24 },
  textColor: { type: String, default: '#FFFFFF' },
  textPosition: { type: String, enum: ['center','top','bottom','left','right'], default: 'center' },
}, { timestamps: true });

const OutfitRecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedItems: {
    top: { type: String, default: null },
    bottom: { type: String, default: null },
    shoes: { type: String, default: null },
    accessories: { type: [String], default: [] },
  },
  aiSuggestion: { type: String, required: true },
  styleScore: { type: Number, min: 0, max: 10, default: null },
  occasion: { type: String, enum: ['casual','formal','sport','party','work','date','other'], default: 'casual' },
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['USER', 'AI'], required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Conversation' },
  messages: { type: [MessageSchema], default: [] },
  topic: { type: String, enum: ['fashion','outfit','style','general'], default: 'general' },
}, { timestamps: true });

// ─── MODELS ───────────────────────────────────────────────────────────────────
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Cart = mongoose.model('Cart', CartSchema);
const Wishlist = mongoose.model('Wishlist', WishlistSchema);
const Order = mongoose.model('Order', OrderSchema);
const Design = mongoose.model('Design', DesignSchema);
const OutfitRecommendation = mongoose.model('OutfitRecommendation', OutfitRecommendationSchema);
const Chat = mongoose.model('Chat', ChatSchema);

// ─── SEED DATA ────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}), Cart.deleteMany({}),
    Wishlist.deleteMany({}), Order.deleteMany({}), Design.deleteMany({}),
    OutfitRecommendation.deleteMany({}), Chat.deleteMany({}),
  ]);
  console.log('🗑️  Cleared all collections');

  // ── USERS ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);

  const users = await User.insertMany([
    {
      fullName: 'Admin Altera',
      email: 'admin@altera.vn',
      password: adminHash,
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
    {
      fullName: 'Nguyễn Văn An',
      email: 'customer1@altera.vn',
      password: passwordHash,
      role: 'USER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=an',
    },
    {
      fullName: 'Trần Thị Bình',
      email: 'customer2@altera.vn',
      password: passwordHash,
      role: 'USER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=binh',
    },
  ]);
  console.log(`👤 Created ${users.length} users`);

  const admin = users[0];
  const customer1 = users[1];
  const customer2 = users[2];

  // ── PRODUCTS ───────────────────────────────────────────────────────────────
  const products = await Product.insertMany([
    {
      name: 'Áo Thun Oversize Basic Black',
      category: 'SHIRT',
      price: 299000,
      imageUrl: 'https://picsum.photos/seed/shirt1/400/500',
      description: 'Áo thun oversize form rộng, chất liệu cotton 100%, phong cách streetwear tối giản.',
      stock: 50,
    },
    {
      name: 'Áo Graphic Tee Altera Logo',
      category: 'SHIRT',
      price: 349000,
      imageUrl: 'https://picsum.photos/seed/shirt2/400/500',
      description: 'Áo thun in logo Altera nổi bật, form unisex, phù hợp mặc hằng ngày.',
      stock: 30,
    },
    {
      name: 'Quần Cargo Wide Leg Beige',
      category: 'PANTS',
      price: 550000,
      imageUrl: 'https://picsum.photos/seed/pants1/400/500',
      description: 'Quần cargo wide leg màu beige, nhiều túi tiện dụng, phong cách Y2K.',
      stock: 25,
    },
    {
      name: 'Quần Jean Straight Washed Blue',
      category: 'PANTS',
      price: 480000,
      imageUrl: 'https://picsum.photos/seed/pants2/400/500',
      description: 'Quần jean straight cut màu xanh wash, classic streetwear essential.',
      stock: 40,
    },
    {
      name: 'Giày Chunky Sole White',
      category: 'SHOES',
      price: 890000,
      imageUrl: 'https://picsum.photos/seed/shoes1/400/500',
      description: 'Giày chunky sole đế dày, màu trắng tinh, phối đồ dễ dàng.',
      stock: 20,
    },
    {
      name: 'Giày Sneaker Low Top Black',
      category: 'SHOES',
      price: 750000,
      imageUrl: 'https://picsum.photos/seed/shoes2/400/500',
      description: 'Giày sneaker low top màu đen cổ điển, đế cao su chống trượt.',
      stock: 35,
    },
    {
      name: 'Túi Tote Canvas Altera',
      category: 'ACCESSORY',
      price: 199000,
      imageUrl: 'https://picsum.photos/seed/bag1/400/500',
      description: 'Túi tote vải canvas in logo Altera, đựng được nhiều đồ, unisex.',
      stock: 60,
    },
    {
      name: 'Mũ Bucket Hat Black',
      category: 'ACCESSORY',
      price: 220000,
      imageUrl: 'https://picsum.photos/seed/hat1/400/500',
      description: 'Mũ bucket hat màu đen, chống nắng tốt, phong cách trẻ trung.',
      stock: 45,
    },
  ]);
  console.log(`👟 Created ${products.length} products`);

  // ── CARTS ──────────────────────────────────────────────────────────────────
  await Cart.insertMany([
    {
      userId: customer1._id,
      items: [
        { productId: products[0]._id, quantity: 2, price: products[0].price },
        { productId: products[2]._id, quantity: 1, price: products[2].price },
      ],
    },
    {
      userId: customer2._id,
      items: [
        { productId: products[4]._id, quantity: 1, price: products[4].price },
      ],
    },
  ]);
  console.log('🛒 Created carts');

  // ── WISHLISTS ──────────────────────────────────────────────────────────────
  await Wishlist.insertMany([
    {
      userId: customer1._id,
      products: [products[1]._id, products[4]._id, products[6]._id],
    },
    {
      userId: customer2._id,
      products: [products[0]._id, products[7]._id],
    },
  ]);
  console.log('❤️  Created wishlists');

  // ── ORDERS ─────────────────────────────────────────────────────────────────
  await Order.insertMany([
    {
      userId: customer1._id,
      items: [
        { productId: products[0]._id, quantity: 1, price: products[0].price, name: products[0].name, imageUrl: products[0].imageUrl },
        { productId: products[2]._id, quantity: 1, price: products[2].price, name: products[2].name, imageUrl: products[2].imageUrl },
      ],
      totalPrice: products[0].price + products[2].price,
      status: 'DELIVERED',
      shippingAddress: {
        fullName: 'Nguyễn Văn An',
        phone: '0901234567',
        street: '123 Nguyễn Huệ',
        city: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        country: 'Vietnam',
        postalCode: '700000',
      },
      note: 'Giao giờ hành chính',
      statusHistory: [
        { status: 'PENDING', changedAt: new Date('2024-01-10') },
        { status: 'CONFIRMED', changedAt: new Date('2024-01-11') },
        { status: 'SHIPPING', changedAt: new Date('2024-01-12') },
        { status: 'DELIVERED', changedAt: new Date('2024-01-13') },
      ],
    },
    {
      userId: customer2._id,
      items: [
        { productId: products[4]._id, quantity: 1, price: products[4].price, name: products[4].name, imageUrl: products[4].imageUrl },
      ],
      totalPrice: products[4].price,
      status: 'SHIPPING',
      shippingAddress: {
        fullName: 'Trần Thị Bình',
        phone: '0912345678',
        street: '456 Lê Lợi',
        city: 'Quận 3',
        province: 'TP. Hồ Chí Minh',
        country: 'Vietnam',
      },
      statusHistory: [
        { status: 'PENDING', changedAt: new Date('2024-01-15') },
        { status: 'CONFIRMED', changedAt: new Date('2024-01-16') },
        { status: 'SHIPPING', changedAt: new Date('2024-01-17') },
      ],
    },
    {
      userId: customer1._id,
      items: [
        { productId: products[6]._id, quantity: 2, price: products[6].price, name: products[6].name, imageUrl: products[6].imageUrl },
      ],
      totalPrice: products[6].price * 2,
      status: 'PENDING',
      shippingAddress: {
        fullName: 'Nguyễn Văn An',
        phone: '0901234567',
        street: '123 Nguyễn Huệ',
        city: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        country: 'Vietnam',
      },
      statusHistory: [
        { status: 'PENDING', changedAt: new Date() },
      ],
    },
  ]);
  console.log('📦 Created orders');

  // ── DESIGNS ────────────────────────────────────────────────────────────────
  await Design.insertMany([
    {
      userId: customer1._id,
      shirtColor: '#1a1a2e',
      customText: 'ALTERA 2024',
      fontSize: 28,
      textColor: '#ffffff',
      textPosition: 'center',
    },
    {
      userId: customer2._id,
      shirtColor: '#e8d5b7',
      customText: 'BE YOURSELF',
      fontSize: 24,
      textColor: '#333333',
      textPosition: 'top',
    },
  ]);
  console.log('🎨 Created designs');

  // ── OUTFIT RECOMMENDATIONS ─────────────────────────────────────────────────
  await OutfitRecommendation.insertMany([
    {
      userId: customer1._id,
      selectedItems: {
        top: 'Áo Thun Oversize Basic Black',
        bottom: 'Quần Cargo Wide Leg Beige',
        shoes: 'Giày Chunky Sole White',
        accessories: ['Túi Tote Canvas Altera', 'Mũ Bucket Hat Black'],
      },
      aiSuggestion: 'Outfit này kết hợp tông trắng-đen-beige rất hài hòa. Áo đen oversize tạo điểm nhấn, quần cargo beige cân bằng màu sắc. Giày chunky trắng làm sáng tổng thể. Thêm bucket hat và tote bag để hoàn thiện vibe streetwear Y2K.',
      styleScore: 8.5,
      occasion: 'casual',
    },
    {
      userId: customer2._id,
      selectedItems: {
        top: 'Áo Graphic Tee Altera Logo',
        bottom: 'Quần Jean Straight Washed Blue',
        shoes: 'Giày Sneaker Low Top Black',
        accessories: [],
      },
      aiSuggestion: 'Combo classic streetwear không bao giờ lỗi thời. Graphic tee + straight jean + sneaker đen là công thức hoàn hảo cho ngày đi chơi hoặc đi học.',
      styleScore: 7.8,
      occasion: 'casual',
    },
  ]);
  console.log('👗 Created outfit recommendations');

  // ── CHATS ──────────────────────────────────────────────────────────────────
  await Chat.insertMany([
    {
      userId: customer1._id,
      title: 'Gợi ý outfit đi làm',
      topic: 'outfit',
      messages: [
        { sender: 'USER', text: 'Mình cần gợi ý outfit đi làm văn phòng phong cách streetwear' },
        { sender: 'AI', text: 'Cho văn phòng có dress code thoải mái, bạn có thể mix: áo thun trắng hoặc đen tucked vào quần tây straight cut, thêm blazer oversized để thêm phần chuyên nghiệp. Kết hợp với sneaker trắng và tote bag là hoàn hảo!' },
        { sender: 'USER', text: 'Còn outfit đi cafe cuối tuần thì sao?' },
        { sender: 'AI', text: 'Cuối tuần thư giãn thì chọn: áo graphic tee + quần cargo wide leg + giày chunky. Thêm bucket hat nếu trời nắng. Vibe Y2K streetwear rất phù hợp cho buổi cafe!' },
      ],
    },
    {
      userId: customer2._id,
      title: 'Hỏi về xu hướng thời trang',
      topic: 'fashion',
      messages: [
        { sender: 'USER', text: 'Xu hướng streetwear 2024 là gì vậy?' },
        { sender: 'AI', text: 'Streetwear 2024 đang trending với: (1) Tông màu neutral - beige, trắng, đen. (2) Silhouette oversized và wide leg. (3) Vải utility như cargo, denim wash. (4) Layering nhiều lớp. (5) Sneaker chunky sole. Altera có đủ các items này cho bạn!' },
      ],
    },
  ]);
  console.log('💬 Created chats');

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n🎉 SEED HOÀN TẤT!\n');
  console.log('─────────────────────────────────────────');
  console.log('ACCOUNTS ĐỂ TEST:');
  console.log('');
  console.log('👑 ADMIN:');
  console.log('   Email   : admin@altera.vn');
  console.log('   Password: admin123');
  console.log('   Role    : ADMIN');
  console.log('');
  console.log('👤 CUSTOMER 1:');
  console.log('   Email   : customer1@altera.vn');
  console.log('   Password: password123');
  console.log('   Role    : USER');
  console.log('');
  console.log('👤 CUSTOMER 2:');
  console.log('   Email   : customer2@altera.vn');
  console.log('   Password: password123');
  console.log('   Role    : USER');
  console.log('─────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
