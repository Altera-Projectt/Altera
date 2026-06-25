const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');
const logger = require('../utils/logger');

let genAI = null;

const getGenAI = () => {
  if (!genAI && GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Generate outfit recommendation using AI
 * @param {{ top: string, bottom: string, shoes: string, accessories?: string[] }} items
 * @param {string} occasion - Optional occasion context
 * @returns {Promise<{suggestion: string, styleScore: number, tips: string[]}>}
 */
const generateOutfitRecommendation = async (items, occasion = 'casual') => {
  const { top, bottom, shoes, accessories = [] } = items;

  const itemsList = [
    top && `Top: ${top}`,
    bottom && `Bottom: ${bottom}`,
    shoes && `Shoes: ${shoes}`,
    accessories.length > 0 && `Accessories: ${accessories.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `You are a professional fashion stylist and outfit consultant.

A customer wants outfit advice for a "${occasion}" occasion. Here are their selected items:
${itemsList}

Please provide:
1. A detailed style analysis (2-3 sentences) about how these items work together
2. Specific styling tips (2-3 tips)
3. A style score from 1-10 based on color coordination, fit appropriateness, and occasion suitability
4. Suggestions for what to add or change to improve the look

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

    // Parse JSON response
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

module.exports = { generateOutfitRecommendation };
