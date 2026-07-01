const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildCatalogPromptSection,
  buildGeminiImageRequest,
  extractGeminiImageData,
  normalizeOutfitHistoryEntry,
} = require('../src/services/ai.service');

test('buildCatalogPromptSection returns product catalog context', () => {
  const products = [
    { name: 'White Shirt', category: 'SHIRT', price: 250000, description: 'Clean office shirt' },
    { name: 'Black Pants', category: 'PANTS', price: 350000, description: 'Slim fit pants' },
  ];

  const section = buildCatalogPromptSection(products);

  assert.match(section, /Available products in the shop/);
  assert.match(section, /White Shirt/);
  assert.match(section, /Black Pants/);
});

test('normalizeOutfitHistoryEntry exposes suggestion for FE compatibility', () => {
  const entry = normalizeOutfitHistoryEntry({
    suggestion: 'Great look',
    aiSuggestion: 'Old field',
    products: [{ name: 'Shirt' }],
  });

  assert.equal(entry.suggestion, 'Great look');
  assert.equal(entry.aiSuggestion, 'Great look');
  assert.equal(entry.products.length, 1);
});

test('buildGeminiImageRequest targets Gemini image generation', () => {
  const request = buildGeminiImageRequest('floral shirt print');

  assert.equal(request.model, process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image');
  assert.deepEqual(request.input, [{ type: 'text', text: 'floral shirt print' }]);
  assert.equal(request.response_format.type, 'image');
  assert.equal(request.response_format.mime_type, 'image/png');
});

test('extractGeminiImageData reads image output payloads', () => {
  const image = extractGeminiImageData({
    output_image: {
      mime_type: 'image/png',
      data: 'abc123',
    },
  });

  assert.deepEqual(image, {
    mimeType: 'image/png',
    data: 'abc123',
  });
});
