const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');
const logger = require('../utils/logger');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

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
    const geminiModel = client.getGenerativeModel({ model });
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens },
    });

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
    throw new AiServiceError('Gemini API unavailable', { cause: error });
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
    const model = client.getGenerativeModel({ model: options.model || GEMINI_MODEL });
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
  } catch (error) {
    if (error instanceof AiServiceError) {
      logger.error('Gemini chat error [%s]: %s', error.code, error.message);
      if (error.cause) logger.error(error.cause);
      throw error;
    }

    logger.error('Gemini chat request failed: %s', error?.message || 'Unknown error');
    logger.error(error);
    throw new AiServiceError('Gemini API unavailable', { cause: error });
  }
};

const buildGeminiImageRequest = (prompt) => ({
  model: GEMINI_MODEL,
  input: [{ type: 'text', text: prompt }],
});

const extractGeminiImageData = () => null;

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
