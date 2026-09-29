const test = require('node:test');
const assert = require('node:assert/strict');

const cloudinaryModulePath = '../src/utils/cloudinary';
const designAiServicePath = '../src/services/design-ai.service';

test('generateDesign calls OpenAI once for transparent PNG print artwork', async () => {
  delete require.cache[require.resolve(cloudinaryModulePath)];
  delete require.cache[require.resolve(designAiServicePath)];

  const cloudinary = require(cloudinaryModulePath);
  const Design = require('../src/models/Design');

  const originalFetch = global.fetch;
  const originalUploadImage = cloudinary.uploadImage;
  const originalApiKey = process.env.OPENAI_API_KEY;
  let imageRequest;

  process.env.OPENAI_API_KEY = 'test-key';
  global.fetch = async (url, options) => {
    assert.match(String(url), /api\.openai\.com/);
    imageRequest = JSON.parse(options.body);
    return new Response(JSON.stringify({ data: [{ b64_json: Buffer.from('fake-image-bytes').toString('base64') }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  cloudinary.uploadImage = async (dataUri, folder) => {
    return { url: 'https://cdn.example.com/generated.png', dataUri, folder };
  };

  Design.create = async (data) => ({ _id: 'design_123', ...data });

  try {
    const service = require(designAiServicePath);
    const result = await service.generateDesign('user-123', {
      idea: 'a dragon print',
      style: 'Minimal',
      printSide: 'Front',
      globalShirtColor: '#111111',
    });

    assert.equal(imageRequest.model, 'gpt-image-2');
    assert.equal(imageRequest.quality, 'low');
    assert.equal(imageRequest.size, '1024x1024');
    assert.equal(imageRequest.background, 'transparent');
    assert.equal(imageRequest.output_format, 'png');
    assert.equal(imageRequest.n, 1);
    assert.match(imageRequest.prompt, /USER IDEA: a dragon print/);
    assert.equal(result.imageUrl, 'https://cdn.example.com/generated.png');
    assert.equal(result.design.customImage, 'https://cdn.example.com/generated.png');
  } finally {
    global.fetch = originalFetch;
    cloudinary.uploadImage = originalUploadImage;
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  }
});
