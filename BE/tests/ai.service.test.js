const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCatalogPromptSection, normalizeOutfitHistoryEntry } = require('../src/services/ai.service');

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
