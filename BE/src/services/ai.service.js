const cerebrasService = require('./cerebras.service');
const stylistService = require('./stylist.service');

const generateOutfitRecommendation = async (items, occasion = 'casual', productCatalog = []) => {
  const catalogPromptSection = stylistService.buildCatalogPromptSection(productCatalog);
  const accessories = Array.isArray(items.accessories) ? items.accessories : [];

  const prompt = `You are ALTERA AI Stylist. Analyze this outfit and respond in Vietnamese.

Occasion: ${occasion}
Top: ${items.top || 'Not provided'}
Bottom: ${items.bottom || 'Not provided'}
Shoes: ${items.shoes || 'Not provided'}
Accessories: ${accessories.join(', ') || 'Not provided'}
Style: ${items.style || 'Not provided'}
Preferences: ${items.preferences || 'Not provided'}

${catalogPromptSection}

Return JSON only:
{
  "suggestion": "direct outfit analysis for the user",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "styleScore": 8,
  "improvements": "what to improve"
}`;

  const parsed = await cerebrasService.generateJson(prompt, { maxOutputTokens: 700 });
  return {
    suggestion: parsed.suggestion || 'Outfit nay phu hop voi nhu cau cua ban.',
    tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    styleScore: parsed.styleScore || 7,
    improvements: parsed.improvements || '',
  };
};

const generatePrintImage = async (prompt) => cerebrasService.generateImage(prompt);

module.exports = {
  generateOutfitRecommendation,
  generatePrintImage,
  buildCatalogPromptSection: stylistService.buildCatalogPromptSection,
  buildGeminiImageRequest: cerebrasService.buildGeminiImageRequest,
  extractGeminiImageData: cerebrasService.extractGeminiImageData,
  normalizeOutfitHistoryEntry: stylistService.normalizeOutfitHistoryEntry,
};
