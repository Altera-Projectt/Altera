const test = require('node:test');
const assert = require('node:assert/strict');

const cerebrasService = require('../src/services/cerebras.service');
const productService = require('../src/services/product.service');
const stylistService = require('../src/services/stylist.service');

test('recommend returns a fallback outfit when Cerebras recommendation JSON is invalid', async () => {
  const originalGenerateJson = cerebrasService.generateJson;
  const originalGetStylistProducts = productService.getStylistProducts;

  productService.getStylistProducts = async () => [
    { _id: 'shirt-1', name: 'Black Oxford Shirt', category: 'SHIRT', price: 320000 },
    { _id: 'pants-1', name: 'Grey Chinos', category: 'PANTS', price: 420000 },
    { _id: 'shoes-1', name: 'White Minimal Sneakers', category: 'SHOES', price: 590000 },
  ];

  cerebrasService.generateJson = async () => {
    throw new cerebrasService.AiServiceError('Cerebras returned an invalid JSON response', {
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE',
    });
  };

  try {
    const result = await stylistService.recommend('user-123', {
      style: 'Smart Casual',
      occasion: 'đi làm',
      quizResult: {
        reason: 'Bạn thích sự gọn gàng và chỉn chu.',
        colorPalette: ['đen', 'xám', 'trắng'],
        avoidColors: ['neon'],
        keyPieces: ['áo sơ mi', 'quần chinos', 'sneaker trắng'],
      },
    });

    assert.equal(result.style, 'Smart Casual');
    assert.match(result.outfitNote, /Black Oxford Shirt/);
    assert.equal(result.colorGuide.main, 'đen');
    assert.equal(result.completeOutfit.top, 'Black Oxford Shirt');
    assert.equal(result.completeOutfit.bottom, 'Grey Chinos');
    assert.equal(result.completeOutfit.shoes, 'White Minimal Sneakers');
    assert.equal(result.recommendedProducts.length, 3);
    assert.equal(result.productReasoning.length, 3);
  } finally {
    cerebrasService.generateJson = originalGenerateJson;
    productService.getStylistProducts = originalGetStylistProducts;
  }
});
