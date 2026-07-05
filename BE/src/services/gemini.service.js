const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');
const logger = require('../utils/logger');

const SUPPORTED_GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];
// Ép cứng dùng gemini-1.5-flash vì 2.0 đang bị limit 0 trên Free Tier
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_MODEL_FALLBACKS = SUPPORTED_GEMINI_MODELS;
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';

let genAI = null;

class AiServiceError extends Error {
  constructor(message, { statusCode = 503, code = 'AI_SERVICE_UNAVAILABLE', cause } = {}) {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.cause = cause;
  }
}

const getClient = () => {
  if (!GEMINI_API_KEY) {
    throw new AiServiceError('Gemini API unavailable', {
      code: 'AI_SERVICE_UNAVAILABLE',
      cause: new Error('GEMINI_API_KEY is not configured'),
    });
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  return genAI;
};

const isModelUnavailableError = (error) => {
  const message = error?.message || '';
  return /404|not found|unsupported|does not exist|invalid model/i.test(message);
};

const getModelCandidates = (preferredModel) => {
  const candidates = [];
  if (preferredModel) candidates.push(preferredModel);
  GEMINI_MODEL_FALLBACKS.forEach((fallback) => {
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
      if (!isModelUnavailableError(error) || index === candidates.length - 1) {
        throw error;
      }

      logger.warn('Gemini model %s failed, retrying with %s', model, candidates[index + 1]);
    }
  }

  throw lastError;
};

const extractJson = (text) => {
  const jsonMatch = text?.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AiServiceError('Gemini returned an invalid JSON response', {
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE',
    });
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new AiServiceError('Gemini returned malformed JSON', {
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE',
      cause: error,
    });
  }
};

const generateText = async (prompt, { model = GEMINI_MODEL, maxOutputTokens = 800 } = {}) => {
  try {
    const client = getClient();
    const result = await runWithModelFallback(async (candidateModel) => {
      const geminiModel = client.getGenerativeModel({ model: candidateModel });
      return geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens },
      });
    }, model);

    const text = result.response.text();
    if (!text) {
      throw new AiServiceError('Gemini returned an empty response', {
        statusCode: 502,
        code: 'AI_EMPTY_RESPONSE',
      });
    }

    return text;
  } catch (error) {
    if (error instanceof AiServiceError) {
      logger.error('Gemini text error [%s]: %s', error.code, error.message);
      if (error.cause) logger.error(error.cause);
      throw error;
    }

    logger.error('Gemini text request failed: %s', error?.message || 'Unknown error');
    logger.error(error);
    throw new AiServiceError(`Gemini API unavailable: ${error?.message || 'Unknown error'}`, { cause: error });
  }
};

const generateJson = async (prompt, options = {}) => extractJson(await generateText(prompt, options));

const buildChatHistory = (systemPrompt, messageHistory = []) => [
  { role: 'user', parts: [{ text: systemPrompt }] },
  {
    role: 'model',
    parts: [{ text: 'Understood. I will answer as ALTERA assistant and keep the response conversational.' }],
  },
  ...messageHistory.map((msg) => ({
    role: msg.sender === 'USER' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  })),
];

const sendChatMessage = async (systemPrompt, messageHistory, userMessage, options = {}) => {
  try {
    const client = getClient();
    const requestChat = async (candidateModel) => {
      const model = client.getGenerativeModel({ model: candidateModel });
      const chat = model.startChat({
        history: buildChatHistory(systemPrompt, messageHistory),
        generationConfig: { maxOutputTokens: options.maxOutputTokens || 500 },
      });

      if (options.stream && typeof options.onChunk === 'function') {
        const resultStream = await chat.sendMessageStream(userMessage);
        let fullText = '';

        for await (const chunk of resultStream.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullText += chunkText;
            options.onChunk(chunkText);
          }
        }

        if (!fullText) {
          throw new AiServiceError('Gemini returned an empty response', {
            statusCode: 502,
            code: 'AI_EMPTY_RESPONSE',
          });
        }

        return fullText;
      }

      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();
      if (!text) {
        throw new AiServiceError('Gemini returned an empty response', {
          statusCode: 502,
          code: 'AI_EMPTY_RESPONSE',
        });
      }

      return text;
    };

    return runWithModelFallback(requestChat, options.model || GEMINI_MODEL);
  } catch (error) {
    if (error instanceof AiServiceError) {
      logger.error('Gemini chat error [%s]: %s', error.code, error.message);
      if (error.cause) logger.error(error.cause);
      throw error;
    }

    logger.error('Gemini chat request failed: %s', error?.message || 'Unknown error');
    logger.error(error);
    throw new AiServiceError(`Gemini API unavailable: ${error?.message || 'Unknown error'}`, { cause: error });
  }
};

const buildGeminiImageRequest = (prompt) => ({
  model: GEMINI_IMAGE_MODEL,
  input: [{ type: 'text', text: prompt }],
  response_format: {
    type: 'image',
    mime_type: 'image/png',
  },
});

const extractGeminiImageData = (response) => {
  const image = response?.output_image;
  if (!image?.data) return null;

  return {
    mimeType: image.mime_type || 'image/png',
    data: image.data,
  };
};

const generateImage = async () => {
  throw new AiServiceError('Image generation is disabled for this backend. Gemini is configured for text and chat responses only.', {
    statusCode: 501,
    code: 'AI_IMAGE_GENERATION_UNSUPPORTED',
  });
};

module.exports = {
  AiServiceError,
  buildGeminiImageRequest,
  extractGeminiImageData,
  generateImage,
  generateJson,
  generateText,
  sendChatMessage,
};
