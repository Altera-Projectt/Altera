const { CEREBRAS_API_KEY, CEREBRAS_BASE_URL } = require('../config/env');
const logger = require('../utils/logger');

const SUPPORTED_CEREBRAS_MODELS = ['gpt-oss-120b', 'gemma-4-31b', 'zai-glm-4.7'];
const CEREBRAS_MODEL = (() => {
  const configuredModel = (process.env.CEREBRAS_MODEL || process.env.AI_MODEL)?.trim();
  if (configuredModel && SUPPORTED_CEREBRAS_MODELS.includes(configuredModel)) {
    return configuredModel;
  }
  return 'gpt-oss-120b';
})();
const CEREBRAS_MODEL_FALLBACKS = SUPPORTED_CEREBRAS_MODELS;
const CEREBRAS_IMAGE_MODEL = process.env.CEREBRAS_IMAGE_MODEL || 'cerebras-image-1';

class AiServiceError extends Error {
  constructor(message, { statusCode = 503, code = 'AI_SERVICE_UNAVAILABLE', cause } = {}) {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.cause = cause;
  }
}

const getApiConfig = () => ({
  apiKey: CEREBRAS_API_KEY,
  baseUrl: CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1',
});

const isModelUnavailableError = (error) => {
  const message = error?.message || '';
  return /404|not found|unsupported|does not exist|invalid model/i.test(message);
};

const isRetryableModelResponseError = (error) => error instanceof AiServiceError
  && ['AI_EMPTY_RESPONSE', 'AI_INVALID_RESPONSE'].includes(error.code);

const getModelCandidates = (preferredModel) => {
  const candidates = [];
  if (preferredModel) candidates.push(preferredModel);
  CEREBRAS_MODEL_FALLBACKS.forEach((fallback) => {
    if (!candidates.includes(fallback)) candidates.push(fallback);
  });
  return candidates;
};

const runWithModelFallback = async (requestFn, preferredModel) => {
  const candidates = getModelCandidates(preferredModel);
  let lastError;

  for (let index = 0; index < candidates.length; index += 1) {
    const model = candidates[index];
    try {
      return await requestFn(model);
    } catch (error) {
      lastError = error;
      const shouldTryNextModel = isModelUnavailableError(error) || isRetryableModelResponseError(error);
      if (!shouldTryNextModel || index === candidates.length - 1) {
        throw error;
      }

      logger.warn('Cerebras model %s failed, retrying with %s', model, candidates[index + 1]);
    }
  }

  throw lastError;
};

const extractJson = (text) => {
  logger.info('[Cerebras Raw Response]: %s', JSON.stringify(text));

  if (!text) {
    throw new AiServiceError('Cerebras returned an empty response', {
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE',
    });
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Fall through and try to extract a JSON object from explanatory text.
  }

  const stripped = trimmed
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '');

  const jsonBlocks = [];
  let startIndex = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < stripped.length; index += 1) {
    const char = stripped[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') {
      if (depth === 0) startIndex = index;
      depth += 1;
      continue;
    }

    if (char === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0 && startIndex !== -1) {
        jsonBlocks.push(stripped.slice(startIndex, index + 1));
        startIndex = -1;
      }
    }
  }

  if (!jsonBlocks.length) {
    logger.error('[Cerebras] Could not find JSON in response: %s', stripped);
    throw new AiServiceError('Cerebras returned an invalid JSON response', {
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE',
    });
  }

  let lastError;
  for (const block of jsonBlocks) {
    try {
      return JSON.parse(block);
    } catch (error) {
      logger.error('[Cerebras] JSON parse failed on: %s', block);
      lastError = error;
    }
  }

  throw new AiServiceError('Cerebras returned malformed JSON', {
    statusCode: 502,
    code: 'AI_INVALID_RESPONSE',
    cause: lastError,
  });
};

const normalizeContentPart = (part) => {
  if (typeof part === 'string') return part;
  if (!part || typeof part !== 'object') return '';

  if (typeof part.text === 'string') return part.text;
  if (typeof part.content === 'string') return part.content;
  if (typeof part.value === 'string') return part.value;

  return '';
};

const extractResponseText = (data) => {
  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? choice?.text ?? data?.output_text;

  if (Array.isArray(content)) {
    return content.map(normalizeContentPart).join('').trim();
  }

  if (typeof content === 'string') {
    return content.trim();
  }

  return '';
};

const requestChatCompletion = async ({ model, messages, maxOutputTokens = 800, stream = false }) => {
  const { apiKey, baseUrl } = getApiConfig();

  if (!apiKey) {
    throw new AiServiceError('Cerebras API unavailable', {
      code: 'AI_SERVICE_UNAVAILABLE',
      cause: new Error('CEREBRAS_API_KEY is not configured'),
    });
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxOutputTokens,
      stream,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Cerebras request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = extractResponseText(data);

  if (!text) {
    const finishReason = data?.choices?.[0]?.finish_reason || data?.choices?.[0]?.finishReason || 'unknown';
    logger.warn('Cerebras model %s returned empty content. finish_reason=%s', model, finishReason);
    throw new AiServiceError('Cerebras returned an empty response', {
      statusCode: 502,
      code: 'AI_EMPTY_RESPONSE',
    });
  }

  return text;
};

const generateText = async (prompt, { model = CEREBRAS_MODEL, maxOutputTokens = 800 } = {}) => {
  try {
    return runWithModelFallback(async (candidateModel) => requestChatCompletion({
      model: candidateModel,
      messages: [{ role: 'user', content: prompt }],
      maxOutputTokens,
    }), model);
  } catch (error) {
    if (error instanceof AiServiceError) {
      logger.error('Cerebras text error [%s]: %s', error.code, error.message);
      if (error.cause) logger.error(error.cause);
      throw error;
    }

    logger.error('Cerebras text request failed: %s', error?.message || 'Unknown error');
    logger.error(error);
    throw new AiServiceError(`Cerebras API unavailable: ${error?.message || 'Unknown error'}`, { cause: error });
  }
};

const generateJson = async (prompt, options = {}) => extractJson(await generateText(prompt, options));

const buildChatHistory = (systemPrompt, messageHistory = []) => {
  const history = [];

  if (systemPrompt) {
    history.push({ role: 'system', content: systemPrompt });
  }

  history.push({ role: 'assistant', content: 'Understood. I will answer as ALTERA assistant and keep the response conversational.' });

  messageHistory.forEach((msg) => {
    history.push({
      role: msg.sender === 'USER' ? 'user' : 'assistant',
      content: msg.text,
    });
  });

  return history;
};

const sendChatMessage = async (systemPrompt, messageHistory, userMessage, options = {}) => {
  try {
    const messages = buildChatHistory(systemPrompt, messageHistory);
    messages.push({ role: 'user', content: userMessage });

    const responseText = await runWithModelFallback(async (candidateModel) => requestChatCompletion({
      model: candidateModel,
      messages,
      maxOutputTokens: options.maxOutputTokens || 500,
      stream: Boolean(options.stream),
    }), options.model || CEREBRAS_MODEL);

    if (options.stream && typeof options.onChunk === 'function' && responseText) {
      options.onChunk(responseText);
    }

    return responseText;
  } catch (error) {
    if (error instanceof AiServiceError) {
      logger.error('Cerebras chat error [%s]: %s', error.code, error.message);
      if (error.cause) logger.error(error.cause);
      throw error;
    }

    logger.error('Cerebras chat request failed: %s', error?.message || 'Unknown error');
    logger.error(error);
    throw new AiServiceError(`Cerebras API unavailable: ${error?.message || 'Unknown error'}`, { cause: error });
  }
};

const buildImageRequest = (prompt) => ({
  model: CEREBRAS_IMAGE_MODEL,
  input: [{ type: 'text', text: prompt }],
  response_format: {
    type: 'image',
    mime_type: 'image/png',
  },
});

const extractImageData = (response) => {
  const image = response?.output_image;
  if (!image?.data) return null;

  return {
    mimeType: image.mime_type || 'image/png',
    data: image.data,
  };
};

const generateImage = async () => {
  throw new AiServiceError('Image generation is disabled for this backend. Cerebras is configured for text and chat responses only.', {
    statusCode: 501,
    code: 'AI_IMAGE_GENERATION_UNSUPPORTED',
  });
};

module.exports = {
  AiServiceError,
  buildImageRequest,
  extractImageData,
  generateImage,
  generateJson,
  generateText,
  sendChatMessage,
};
