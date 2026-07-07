const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = '../src/services/cerebras.service';

const loadService = () => {
  delete require.cache[require.resolve(servicePath)];
  process.env.CEREBRAS_API_KEY = 'test-key';
  return require(servicePath);
};

test('generateText reads Cerebras array content parts', async () => {
  const originalFetch = global.fetch;
  const service = loadService();

  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: [{ type: 'text', text: 'Xin chao' }],
          },
        },
      ],
    }),
  });

  try {
    const result = await service.generateText('hello');
    assert.equal(result, 'Xin chao');
  } finally {
    global.fetch = originalFetch;
  }
});

test('generateText retries the next model when Cerebras returns empty content', async () => {
  const originalFetch = global.fetch;
  const service = loadService();
  let callCount = 0;

  global.fetch = async () => {
    callCount += 1;
    return {
      ok: true,
      json: async () => (callCount === 1
        ? { choices: [{ message: { content: '' }, finish_reason: 'stop' }] }
        : { choices: [{ message: { content: 'fallback ok' } }] }),
    };
  };

  try {
    const result = await service.generateText('hello', { model: 'gpt-oss-120b' });
    assert.equal(result, 'fallback ok');
    assert.equal(callCount, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test('generateJson extracts JSON from markdown and explanatory text', async () => {
  const originalFetch = global.fetch;
  const service = loadService();

  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: 'Da day la ket qua cua ban:\n```json\n{ "style": "Streetwear" }\n```\nChuc ban mac dep!',
          },
        },
      ],
    }),
  });

  try {
    const result = await service.generateJson('style');
    assert.deepEqual(result, { style: 'Streetwear' });
  } finally {
    global.fetch = originalFetch;
  }
});

test('generateJson extracts a top-level JSON array from markdown', async () => {
  const originalFetch = global.fetch;
  const service = loadService();

  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: '```json\n[{ "style": "Streetwear" }, { "style": "Minimal" }]\n```',
          },
        },
      ],
    }),
  });

  try {
    const result = await service.generateJson('styles');
    assert.deepEqual(result, [{ style: 'Streetwear' }, { style: 'Minimal' }]);
  } finally {
    global.fetch = originalFetch;
  }
});
