const test = require('node:test');
const assert = require('node:assert/strict');

test('sendChatMessage uses Cerebras chat completions API', async () => {
  process.env.CEREBRAS_API_KEY = 'test-key';
  process.env.CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1';
  delete require.cache[require.resolve('../src/config/env')];
  delete require.cache[require.resolve('../src/services/gemini.service')];

  const { sendChatMessage } = require('../src/services/gemini.service');

  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Hello from Cerebras' } }] }),
    };
  };

  try {
    const result = await sendChatMessage('You are helpful', [], 'hello', { model: 'gpt-oss-120b' });

    assert.equal(result, 'Hello from Cerebras');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.cerebras.ai/v1/chat/completions');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer test-key');
    assert.match(calls[0].options.body, /"model":"gpt-oss-120b"/);
    assert.match(calls[0].options.body, /"messages"/);
  } finally {
    global.fetch = originalFetch;
  }
});
