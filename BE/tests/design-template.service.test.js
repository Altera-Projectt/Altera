const test = require('node:test');
const assert = require('node:assert/strict');
const DesignTemplate = require('../src/models/DesignTemplate');
const templates = require('../src/seeds/design-templates.seed');

test('built-in template gallery covers all requested categories with editable layers', () => {
  const categories = new Set(templates.map((template) => template.category));
  for (const category of ['Typography', 'Minimal', 'Graphic', 'Streetwear', 'Vintage', 'Sport', 'Anime', 'Abstract']) assert.ok(categories.has(category));
  assert.ok(templates.length >= 8);
  for (const data of templates) {
    const template = new DesignTemplate({ ...data, isActive: true, isBuiltIn: true });
    assert.equal(template.validateSync(), undefined, `${data.name} should satisfy the template schema`);
    assert.match(template.thumbnail, /^data:image\/svg\+xml,/);
    assert.ok(Array.isArray(template.frontDesign.layers));
    assert.ok(Array.isArray(template.backDesign.layers));
    for (const layer of [...template.frontDesign.layers, ...template.backDesign.layers]) {
      assert.ok(layer.id && layer.type && typeof layer.x === 'number' && typeof layer.y === 'number');
      assert.ok(typeof layer.scaleX === 'number' && typeof layer.scaleY === 'number' && typeof layer.rotation === 'number');
    }
  }
  assert.ok(templates.some((template) => template.backDesign.layers.length > 0));
  assert.ok(templates.some((template) => template.frontDesign.layers.length > 1));
});
