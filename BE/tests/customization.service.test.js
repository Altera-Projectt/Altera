const test = require('node:test');
const assert = require('node:assert/strict');
const { getCustomizationPrice, isAllowedImageSource } = require('../src/services/customization.service');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');

const product = {
  price: 300000,
  discountPrice: 280000,
  colors: [{ name: 'Black', hex: '#000000', stock: 5 }],
  sizes: [{ label: 'M', stock: 4 }],
  printingTechniques: [
    { code: 'DTF', price: 80000, additionalSidePrice: 40000, customizationPrice: 0 },
    { code: 'DTG', price: 120000, additionalSidePrice: 60000, customizationPrice: 0 },
  ],
};
const layer = { id: 'layer-1', type: 'text', text: 'ALTERA' };
const customization = (overrides = {}) => ({
  color: { name: 'Black', hex: '#000000' }, size: 'M', printSide: 'FRONT', printingTechnique: 'DTF',
  frontDesign: { layers: [layer], background: null }, backDesign: { layers: [], background: null },
  ...overrides,
});

test('computes product and printing price on front', () => {
  assert.equal(getCustomizationPrice(product, customization()), 360000);
});

test('keeps the existing regular cart price unchanged', () => {
  assert.equal(getCustomizationPrice(product, null), product.price);
});

test('adds the second-side price for both sides', () => {
  assert.equal(getCustomizationPrice(product, customization({ printSide: 'BOTH', backDesign: { layers: [layer], background: null } })), 400000);
});

test('includes server configured customization cost', () => {
  const configured = { ...product, printingTechniques: [{ code: 'DTF', price: 80000, additionalSidePrice: 40000, customizationPrice: 15000 }] };
  assert.equal(getCustomizationPrice(configured, customization()), 375000);
});

test('rejects unavailable colors and sizes', () => {
  assert.throws(() => getCustomizationPrice(product, customization({ color: { name: 'Red', hex: '#f00' } })), /available product color/);
  assert.throws(() => getCustomizationPrice(product, customization({ size: 'XXL' })), /available product color/);
});

test('requires design on each requested side and caps text length', () => {
  assert.throws(() => getCustomizationPrice(product, customization({ printSide: 'BACK' })), /each selected print side/);
  assert.throws(() => getCustomizationPrice(product, customization({ frontDesign: { layers: [{ ...layer, text: 'x'.repeat(501) }] } })), /invalid text or image layer/);
});

test('accepts image data layers and rejects unsafe image sources', () => {
  const imageLayer = { id: 'image-1', type: 'image', src: 'data:image/png;base64,aGVsbG8=', x: 50, y: 50, scaleX: 1, scaleY: 1, rotation: 0 };
  assert.equal(getCustomizationPrice(product, customization({ frontDesign: { layers: [imageLayer] } })), 360000);
  assert.throws(() => getCustomizationPrice(product, customization({ frontDesign: { layers: [{ ...imageLayer, src: 'javascript:alert(1)' }] } })), /invalid text or image layer/);
});

test('accepts Cloudinary image URLs while rejecting arbitrary remote sources', () => {
  assert.equal(isAllowedImageSource('https://res.cloudinary.com/demo/image/upload/sample.png'), true);
  assert.equal(isAllowedImageSource('https://example.com/image.png'), false);
  assert.equal(isAllowedImageSource('http://res.cloudinary.com/demo/image/upload/sample.png'), false);
});

test('rejects unsupported printing technique', () => {
  assert.throws(() => getCustomizationPrice(product, customization({ printingTechnique: 'SCREEN' })), /available product color/);
});

test('provides server-owned printing techniques for existing products', () => {
  const hydrated = Product.hydrate({ _id: '507f1f77bcf86cd799439011', name: 'Test', category: 'T-Shirt', price: 100, stock: 1 });
  assert.deepEqual(hydrated.printingTechniques.map((item) => item.code), ['DTF', 'DTG']);
});

test('keeps non-custom cart lines valid and stores custom layers as data', () => {
  const normalCart = new Cart({ userId: '507f1f77bcf86cd799439011', items: [{ productId: '507f1f77bcf86cd799439012', quantity: 1, price: 100 }] });
  assert.equal(normalCart.validateSync(), undefined);
  const customized = new Cart({ userId: '507f1f77bcf86cd799439011', items: [{ productId: '507f1f77bcf86cd799439012', quantity: 1, price: 180, customization: customization() }] });
  assert.equal(customized.validateSync(), undefined);
  assert.equal(customized.items[0].customization.frontDesign.layers[0].text, 'ALTERA');
});
