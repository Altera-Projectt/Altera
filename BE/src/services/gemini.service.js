const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');
const logger = require('../utils/logger');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const GEMINI_IMAGE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

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

const extractGeminiImageData = (payload) => {
  const directImage = payload?.output_image || payload?.outputImage;
  if (directImage?.data) {
    return {
      mimeType: directImage.mime_type || directImage.mimeType || 'image/png',
      data: directImage.data,
    };
  }

  const blocks = payload?.output || payload?.content || payload?.response?.candidates?.[0]?.content?.parts || [];
  const imageBlock = Array.isArray(blocks)
    ? blocks.find((block) => block?.type === 'image' || block?.inlineData || block?.inline_data)
    : null;

  const inlineData = imageBlock?.inlineData || imageBlock?.inline_data || imageBlock;
  if (inlineData?.data) {
    return {
      mimeType: inlineData.mime_type || inlineData.mimeType || 'image/png',
      data: inlineData.data,
    };
  }

  return null;
};

const generateImage = async (prompt) => {
  if (!GEMINI_API_KEY) {
    throw new AiServiceError('Gemini API unavailable', {
      code: 'AI_SERVICE_UNAVAILABLE',
      cause: new Error('GEMINI_API_KEY is not configured'),
    });
  }

  try {
    if (typeof fetch !== 'function') {
      throw new AiServiceError('Global fetch is not available. Please run Node.js 18 or newer.', {
        statusCode: 500,
        code: 'AI_RUNTIME_UNSUPPORTED',
      });
    }

    const response = await fetch(GEMINI_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(buildGeminiImageRequest(prompt)),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.error?.message || `Gemini image request failed with status ${response.status}`;
      throw new AiServiceError(message, { statusCode: 503, code: 'AI_SERVICE_UNAVAILABLE' });
    }

    const imageData = extractGeminiImageData(payload);
    if (!imageData?.data) {
      throw new AiServiceError('Gemini returned no image data', {
        statusCode: 502,
        code: 'AI_INVALID_RESPONSE',
      });
    }

    return imageData;
  } catch (error) {
    if (error instanceof AiServiceError) {
      logger.error('Gemini image error [%s]: %s', error.code, error.message);
      if (error.cause) logger.error(error.cause);
      throw error;
    }

    logger.error('Gemini image request failed: %s', error?.message || 'Unknown error');
    logger.error(error);
    throw new AiServiceError(`Gemini API unavailable: ${error?.message || 'Unknown error'}`, { cause: error });
  }
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
