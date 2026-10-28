const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const MarketplaceDesign = require('../src/models/MarketplaceDesign');
const DesignerProfile = require('../src/models/DesignerProfile');
const orderService = require('../src/services/order.service');
const paymentService = require('../src/services/payment.service');

let mongod;
let testUser;
let adminUser;
let product1;
let product2;
let product3;
let design1;

test.before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Setup test users
  testUser = await User.create({
    fullName: 'Test Buyer',
    email: 'buyer@altera.test',
    password: 'Password123!',
    role: 'USER',
  });

  adminUser = await User.create({
    fullName: 'ALTERA Admin',
    email: 'admin@altera.test',
    password: 'Password123!',
    role: 'ADMIN',
  });

  // Setup test products
  product1 = await Product.create({
    name: 'Áo thun Basic Trắng',
    category: 'T-Shirt',
    price: 200000,
    stock: 50,
    isActive: true,
    colors: [{ name: 'Trắng', hex: '#ffffff', stock: 50 }],
    sizes: [{ label: 'M', stock: 50 }],
    printingTechniques: [{ code: 'DTF', name: 'In DTF', price: 50000, additionalSidePrice: 20000 }],
  });

  product2 = await Product.create({
    name: 'Áo thun Basic Đen',
    category: 'T-Shirt',
    price: 220000,
    stock: 50,
    isActive: true,
    colors: [{ name: 'Đen', hex: '#000000', stock: 50 }],
    sizes: [{ label: 'L', stock: 50 }],
    printingTechniques: [{ code: 'DTF', name: 'In DTF', price: 50000, additionalSidePrice: 20000 }],
  });

  product3 = await Product.create({
    name: 'Áo thun FPT Limited',
    category: 'T-Shirt',
    price: 379000,
    stock: 50,
    isActive: true,
    colors: [{ name: 'Cam', hex: '#f26522', stock: 50 }],
    sizes: [{ label: 'XL', stock: 50 }],
    printingTechniques: [{ code: 'DTF', name: 'In DTF', price: 0, additionalSidePrice: 0 }],
  });

  const profile = await DesignerProfile.create({
    userId: adminUser._id,
    displayName: 'ALTERA Designer',
    username: 'altera_designer',
  });

  const dummyDraftId = new mongoose.Types.ObjectId();

  design1 = await MarketplaceDesign.create({
    name: 'FPT Special Edition',
    slug: 'fpt-special-edition',
    description: 'Thiết kế độc quyền FPT',
    thumbnail: 'https://res.cloudinary.com/altera/image/upload/v1/fpt.png',
    thumbnailUrl: 'https://res.cloudinary.com/altera/image/upload/v1/fpt.png',
    price: 379000,
    productId: product3._id,
    designerId: profile._id,
    userId: adminUser._id,
    draftId: dummyDraftId,
    status: 'PUBLISHED',
    salesCount: 0,
    color: { name: 'Cam', hex: '#f26522' },
    size: 'XL',
    printSide: 'FRONT',
    printingTechnique: 'DTF',
    frontDesign: { layers: [{ id: '1', type: 'text', text: 'FPT', visible: true }], background: null },
    backDesign: { layers: [], background: null },
  });
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('TEST 1: Normal Cart Checkout - Emptying cart and creating order with multiple items', async () => {
  const start = Date.now();

  // 1. Populate cart with 2 items
  const cart = await Cart.findOneAndUpdate(
    { userId: testUser._id },
    {
      $set: {
        items: [
          {
            productId: product1._id,
            quantity: 2,
            price: 200000,
            customization: {
              color: { name: 'Trắng', hex: '#ffffff' },
              size: 'M',
              printSide: 'FRONT',
              printingTechnique: 'DTF',
              frontDesign: { layers: [{ id: 't1', type: 'text', text: 'Custom 1', visible: true }], background: null },
              backDesign: { layers: [], background: null },
            },
          },
          {
            productId: product2._id,
            quantity: 1,
            price: 220000,
            customization: {
              color: { name: 'Đen', hex: '#000000' },
              size: 'L',
              printSide: 'FRONT',
              printingTechnique: 'DTF',
              frontDesign: { layers: [{ id: 't2', type: 'text', text: 'Custom 2', visible: true }], background: null },
              backDesign: { layers: [], background: null },
            },
          },
        ],
      },
    },
    { upsert: true, new: true }
  );

  assert.equal(cart.items.length, 2, 'Cart should have 2 items initially');

  // 2. Checkout normal cart
  const orderResult = await orderService.createOrder(testUser._id, {
    items: cart.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      cartItemId: it._id,
    })),
    shippingAddress: {
      fullName: 'Nguyễn Văn A',
      phone: '0901234567',
      street: '123 Đường ABC',
      city: 'Hồ Chí Minh',
    },
    paymentMethod: 'COD',
    isBuyNow: false,
  });

  assert.ok(orderResult.order, 'Order should be created');
  assert.equal(orderResult.order.items.length, 2, 'Order must contain both cart items');
  assert.equal(orderResult.order.paymentMethod, 'COD');

  // 3. Verify cart in DB is now CLEARED
  const clearedCart = await Cart.findOne({ userId: testUser._id });
  assert.equal(clearedCart.items.length, 0, 'User cart must be empty after regular checkout');

  const elapsed = Date.now() - start;
  console.log(`  ⏱️ [TEST 1] Normal Cart Checkout completed in: ${elapsed}ms`);
});

test('TEST 2: Buy Now Flow - Checks out ONLY the selected item and preserves existing cart items', async () => {
  const start = Date.now();

  // 1. Put 2 items back into the user cart (existing cart before clicking Buy Now)
  await Cart.findOneAndUpdate(
    { userId: testUser._id },
    {
      $set: {
        items: [
          {
            productId: product1._id,
            quantity: 3,
            price: 200000,
          },
          {
            productId: product2._id,
            quantity: 2,
            price: 220000,
          },
        ],
      },
    },
    { upsert: true }
  );

  const cartBefore = await Cart.findOne({ userId: testUser._id });
  assert.equal(cartBefore.items.length, 2, 'Cart has 2 preexisting items');

  // 2. User clicks "Buy Now" on Product 3 (FPT Special Edition)
  const buyNowItem = {
    productId: product3._id,
    marketplaceDesignId: design1._id,
    quantity: 1,
    customization: {
      color: { name: 'Cam', hex: '#f26522' },
      size: 'XL',
      printSide: 'FRONT',
      printingTechnique: 'DTF',
      frontDesign: { layers: [{ id: '1', type: 'text', text: 'FPT', visible: true }], background: null },
      backDesign: { layers: [], background: null },
    },
  };

  const buyNowOrder = await orderService.createOrder(testUser._id, {
    items: [buyNowItem],
    shippingAddress: {
      fullName: 'Trần Thị B',
      phone: '0987654321',
      street: '456 Lê Lợi',
      city: 'Đà Nẵng',
    },
    paymentMethod: 'BANK_TRANSFER',
    isBuyNow: true, // FLAG: Buy Now mode
  });

  // 3. Verify Order ONLY contains the 1 buy-now item
  assert.ok(buyNowOrder.order, 'Buy now order created successfully');
  assert.equal(buyNowOrder.order.items.length, 1, 'Buy now order MUST contain only 1 item');
  assert.equal(String(buyNowOrder.order.items[0].productId), String(product3._id));
  assert.equal(buyNowOrder.order.items[0].name, 'FPT Special Edition');
  assert.equal(buyNowOrder.order.totalPrice, 379000, 'Total price must match single item price');

  // 4. CRITICAL VERIFICATION: Cart items must still be intact (NOT wiped out)
  const cartAfter = await Cart.findOne({ userId: testUser._id });
  assert.equal(cartAfter.items.length, 2, 'User cart MUST still preserve its 2 existing items');
  assert.equal(cartAfter.items[0].quantity, 3);
  assert.equal(cartAfter.items[1].quantity, 2);

  const elapsed = Date.now() - start;
  console.log(`  ⏱️ [TEST 2] Buy Now (Cart Isolation) completed in: ${elapsed}ms`);
});

test('TEST 3: Bank Transfer Flow - VietQR Generation & Admin Payment Confirmation with Designer Sales Increment', async () => {
  const start = Date.now();

  const initialSalesCount = design1.salesCount;

  // 1. Create order with BANK_TRANSFER
  const orderResult = await orderService.createOrder(testUser._id, {
    items: [
      {
        productId: product3._id,
        marketplaceDesignId: design1._id,
        quantity: 2,
        customization: {
          color: { name: 'Cam', hex: '#f26522' },
          size: 'XL',
          printSide: 'FRONT',
          printingTechnique: 'DTF',
          frontDesign: { layers: [{ id: '1', type: 'text', text: 'FPT', visible: true }], background: null },
          backDesign: { layers: [], background: null },
        },
      },
    ],
    shippingAddress: {
      fullName: 'Khách Chuyển Khoản',
      phone: '0912345678',
      street: '789 Nguyễn Huệ',
      city: 'Hà Nội',
    },
    paymentMethod: 'BANK_TRANSFER',
    isBuyNow: true,
  });

  const { order, payment } = orderResult;
  assert.equal(order.paymentMethod, 'BANK_TRANSFER');
  assert.equal(payment.paymentStatus, 'PENDING');
  assert.ok(payment.transfer, 'Payment must include transfer details');

  // 2. Verify VietQR details
  const { transfer } = payment;
  assert.ok(transfer.qrCodeUrl.startsWith('https://img.vietqr.io/image/'), 'QR URL must be a valid VietQR endpoint');
  assert.ok(transfer.qrCodeUrl.includes(String(transfer.amount)), 'QR URL must include the exact order amount');
  assert.ok(transfer.accountNumber, 'Account number must be present');
  assert.ok(transfer.accountName, 'Account name must be present');
  assert.ok(transfer.paymentContent.includes('ALTERA'), 'Payment content must have prefix ALTERA');

  // 3. Admin confirms payment via paymentService
  const confirmResult = await paymentService.confirmPayment(order._id, adminUser._id, 'TXN_REF_998877');
  assert.equal(confirmResult.payment.paymentStatus, 'PAID');
  assert.equal(confirmResult.order.paymentStatus, 'PAID');
  assert.equal(confirmResult.order.status, 'CONFIRMED');

  // 4. Verify designer salesCount is automatically incremented
  const updatedDesign = await MarketplaceDesign.findById(design1._id);
  assert.equal(
    updatedDesign.salesCount,
    initialSalesCount + 2,
    'Designer salesCount must be incremented by the order item quantity (2)'
  );

  const elapsed = Date.now() - start;
  console.log(`  ⏱️ [TEST 3] Bank Transfer & Admin Confirmation completed in: ${elapsed}ms`);
});

test('TEST 4: Buy Now Error Case - Stock validation & rollback preserves user cart', async () => {
  const start = Date.now();

  const cartBefore = await Cart.findOne({ userId: testUser._id });
  const itemsCountBefore = cartBefore?.items?.length || 0;

  // Attempt to buy more than available stock
  await assert.rejects(
    async () => {
      await orderService.createOrder(testUser._id, {
        items: [
          {
            productId: product3._id,
            quantity: 9999, // Exceeds stock (50)
          },
        ],
        shippingAddress: {
          fullName: 'Test Overflow',
          phone: '0900000000',
          street: '123 ABC',
          city: 'HCM',
        },
        paymentMethod: 'COD',
        isBuyNow: true,
      });
    },
    (err) => {
      assert.ok(err.message.includes('không đủ tồn kho') || err.message.includes('không đủ số lượng'));
      return true;
    }
  );

  // Verify cart is completely intact
  const cartAfter = await Cart.findOne({ userId: testUser._id });
  assert.equal(cartAfter.items.length, itemsCountBefore, 'Cart must remain intact after failed buy-now');

  const elapsed = Date.now() - start;
  console.log(`  ⏱️ [TEST 4] Stock validation & cart preservation completed in: ${elapsed}ms`);
});

test('TEST 5: End-to-End HTTP API - POST /api/v1/orders with isBuyNow and BANK_TRANSFER', async () => {
  const start = Date.now();
  const app = require('../src/app');
  const { generateToken } = require('../src/utils/jwt');

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  server.unref();
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  const token = generateToken({ id: testUser._id, role: testUser.role });

  try {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        isBuyNow: true,
        items: [
          {
            productId: product1._id.toString(),
            quantity: 1,
          },
        ],
        shippingAddress: {
          fullName: 'Khách Hàng API',
          phone: '0988776655',
          street: '88 Phố Huế',
          city: 'Hà Nội',
        },
        paymentMethod: 'BANK_TRANSFER',
      }),
    });

    const data = await res.json();
    console.log('HTTP Test 5 status & response:', res.status, JSON.stringify(data));
    assert.equal(res.status, 201, `HTTP response must be 201 Created. Body: ${JSON.stringify(data)}`);
    assert.ok(data.success);
    assert.ok(data.data.order._id);
    assert.equal(data.data.order.paymentMethod, 'BANK_TRANSFER');
    assert.ok(data.data.payment.transfer);
    assert.ok(data.data.payment.transfer.qrCodeUrl.includes('img.vietqr.io'));

    const elapsed = Date.now() - start;
    console.log(`  ⏱️ [TEST 5] HTTP API End-to-End completed in: ${elapsed}ms`);
  } catch (err) {
    console.error('Test 5 exception:', err);
    throw err;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
