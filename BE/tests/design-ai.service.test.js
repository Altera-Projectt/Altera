const test = require('node:test');
const assert = require('node:assert/strict');

const cloudinaryModulePath = '../src/utils/cloudinary';
const designAiServicePath = '../src/services/design-ai.service';

test('generateDesign uses Pollinations image generation instead of legacy image service', async () => {
  delete require.cache[require.resolve(cloudinaryModulePath)];
  delete require.cache[require.resolve(designAiServicePath)];

  const cloudinary = require(cloudinaryModulePath);
  const Design = require('../src/models/Design');

  const originalFetch = global.fetch;
  const originalUploadImage = cloudinary.uploadImage;

  global.fetch = async (url) => ({
    ok: true,
    status: 200,
    headers: { get: (name) => (name === 'content-type' ? 'image/png' : null) },
    arrayBuffer: async () => Buffer.from('fake-image-bytes'),
  });

  cloudinary.uploadImage = async (dataUri, folder) => {
    return { url: 'https://cdn.example.com/generated.png', dataUri, folder };
  };

  Design.create = async (data) => ({ _id: 'design_123', ...data });

  try {
    const service = require(designAiServicePath);
    const result = await service.generateDesign('user-123', {
      prompt: 'a dragon shirt print',
      style: 'minimal',
      shirtType: 't-shirt',
      colorPalette: 'red, black',
    });

    assert.match(result.curlCommand, /image\.pollinations\.ai/);
    assert.equal(result.imageUrl, 'https://cdn.example.com/generated.png');
    assert.equal(result.design.customImage, 'https://cdn.example.com/generated.png');
  } finally {
    global.fetch = originalFetch;
    cloudinary.uploadImage = originalUploadImage;
  }
});
