const test = require('node:test');
const assert = require('node:assert/strict');
const CustomDesignDraft = require('../src/models/CustomDesignDraft');
const draftService = require('../src/services/custom-design-draft.service');

test('draft schema stores front and back design data and metadata', () => {
  const draft = new CustomDesignDraft({
    userId: '507f1f77bcf86cd799439011', name: 'Layered shirt', productId: '507f1f77bcf86cd799439012',
    color: { name: 'Black', hex: '#000000' }, size: 'M', printSide: 'BOTH', printingTechnique: 'DTF',
    frontDesign: { layers: [{ id: 'text-1', type: 'text', text: 'Front' }] },
    backDesign: { layers: [{ id: 'image-1', type: 'image', src: 'https://res.cloudinary.com/demo/image/upload/a.png' }] },
    thumbnail: 'data:image/svg+xml,preview',
  });
  assert.equal(draft.validateSync(), undefined);
  assert.equal(draft.frontDesign.layers[0].text, 'Front');
  assert.equal(draft.backDesign.layers[0].type, 'image');
});

test('draft read, update, and delete cannot access another user draft', async () => {
  const originalFindOne = CustomDesignDraft.findOne;
  const originalDeleteOne = CustomDesignDraft.deleteOne;
  try {
    CustomDesignDraft.findOne = async () => null;
    let deleted = false;
    CustomDesignDraft.deleteOne = async () => { deleted = true; };
    const id = '507f1f77bcf86cd799439013';
    const userB = '507f1f77bcf86cd799439014';
    await assert.rejects(draftService.get(id, userB), { statusCode: 404 });
    await assert.rejects(draftService.update(id, userB, { name: 'Hijack' }), { statusCode: 404 });
    await assert.rejects(draftService.remove(id, userB), { statusCode: 404 });
    assert.equal(deleted, false);
  } finally {
    CustomDesignDraft.findOne = originalFindOne;
    CustomDesignDraft.deleteOne = originalDeleteOne;
  }
});

test('draft creation ignores a frontend-supplied owner ID', async () => {
  const originalCreate = CustomDesignDraft.create;
  try {
    let saved;
    CustomDesignDraft.create = async (data) => { saved = data; return data; };
    await draftService.create('507f1f77bcf86cd799439011', { userId: '507f1f77bcf86cd799439099', name: 'Owned', frontDesign: { layers: [] } });
    assert.equal(saved.userId, '507f1f77bcf86cd799439011');
  } finally { CustomDesignDraft.create = originalCreate; }
});
