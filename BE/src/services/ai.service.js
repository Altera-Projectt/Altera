const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');
const logger = require('../utils/logger');

const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const GEMINI_IMAGE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
let genAI = null;

const getGenAI = () => {
  if (!genAI && GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
};

const formatCurrency = (price) => {
  const amount = Number(price || 0);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const buildCatalogPromptSection = (products = []) => {
  if (!Array.isArray(products) || products.length === 0) {
    return 'No product catalog provided for this request.';
  }

  const lines = products.map((product, index) => {
    const desc = product.description ? ` | ${product.description}` : '';
    return `${index + 1}. ${product.name} | Category: ${product.category} | Price: ${formatCurrency(product.price)}${desc}`;
  });

  return `Available products in the shop:\n${lines.join('\n')}`;
};

/**
 * Generate outfit recommendation using AI
 * @param {{ top: string, bottom: string, shoes: string, accessories?: string[], style?: string, preferences?: string }} items
 * @param {string} occasion - Optional occasion context
 * @param {Array<object>} productCatalog - Optional shop catalog for richer recommendations
 * @returns {Promise<{suggestion: string, styleScore: number, tips: string[], improvements: string}>}
 */
const generateOutfitRecommendation = async (items, occasion = 'casual', productCatalog = []) => {
  const { top, bottom, shoes, accessories = [], style, preferences } = items;

  const itemsList = [
    top && `Top: ${top}`,
    bottom && `Bottom: ${bottom}`,
    shoes && `Shoes: ${shoes}`,
    accessories.length > 0 && `Accessories: ${accessories.join(', ')}`,
    style && `Style: ${style}`,
    preferences && `Preferences: ${preferences}`,
  ]
    .filter(Boolean)
    .join('\n');

  const catalogPromptSection = buildCatalogPromptSection(productCatalog);

  const prompt = `You are a professional fashion stylist and outfit consultant.

A customer wants outfit advice for a "${occasion}" occasion. Here are their selected items:
${itemsList || 'No specific items were provided; suggest a fresh outfit based on the request and catalog.'}

${catalogPromptSection}

Please provide:
1. A detailed style analysis (2-3 sentences) about how these items work together
2. Specific styling tips (2-3 tips)
3. A style score from 1-10 based on color coordination, fit appropriateness, and occasion suitability
4. Suggestions for what to add or change to improve the look
5. If the catalog contains a product that clearly fits, mention it naturally in the suggestion and suggest it as a strong option.

Respond in this exact JSON format:
{
  "suggestion": "Your detailed analysis here...",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "styleScore": 8,
  "improvements": "Suggestion for improvement..."
}`;

  const client = getGenAI();

  if (!client) {
    logger.warn('Gemini API key not configured. Using fallback recommendation.');
    return getFallbackRecommendation(items, occasion);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      suggestion: parsed.suggestion || 'Great outfit combination!',
      tips: parsed.tips || [],
      styleScore: parsed.styleScore || 7,
      improvements: parsed.improvements || '',
    };
  } catch (error) {
    logger.error(`AI service error: ${error.message}`);
    return getFallbackRecommendation(items, occasion);
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

const generatePrintImage = async (prompt) => {
  if (!GEMINI_API_KEY) {
    logger.warn('Gemini API key not configured. Print image generation unavailable.');
    throw new Error('Gemini API key not configured.');
  }

  try {
    if (typeof fetch !== 'function') {
      throw new Error('Global fetch is not available. Please run the backend on Node.js 18 or newer.');
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
      throw new Error(message);
    }

    const imageData = extractGeminiImageData(payload);
    if (imageData?.data) {
      return imageData;
    }

    throw new Error('No image data returned from Gemini model.');
  } catch (error) {
    logger.error('Print image AI service error: %s', error?.message || 'Unknown error');
    logger.error(error);
    throw error;
  }
};

/**
 * Fallback when AI is unavailable
 */
const getFallbackRecommendation = (items, occasion) => {
  const { top, bottom, shoes } = items;
  return {
    suggestion: `Your outfit combining ${top || 'your top'}, ${bottom || 'your bottom'}, and ${shoes || 'your shoes'} creates a ${occasion} look. The combination shows a good sense of personal style.`,
    tips: [
      'Make sure your clothes are well-fitted for the best appearance',
      'Accessories can elevate any outfit significantly',
      'Consider the color wheel when mixing and matching pieces',
    ],
    styleScore: 7,
    improvements: 'Consider adding a belt or watch to complete the look.',
  };
};

const normalizeOutfitHistoryEntry = (entry) => {
  const plain = typeof entry?.toObject === 'function' ? entry.toObject() : { ...entry };
  const suggestion = plain.suggestion || plain.aiSuggestion || 'No suggestion';

  return {
    ...plain,
    suggestion,
    aiSuggestion: suggestion,
    products: Array.isArray(plain.products) ? plain.products : [],
  };
};

module.exports = {
  generateOutfitRecommendation,
  generatePrintImage,
  buildCatalogPromptSection,
  buildGeminiImageRequest,
  extractGeminiImageData,
  normalizeOutfitHistoryEntry,
};
