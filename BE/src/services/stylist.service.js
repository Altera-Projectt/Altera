const OutfitRecommendation = require('../models/OutfitRecommendation');
const geminiService = require('./gemini.service');
const productService = require('./product.service');

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

const analyzeQuiz = async ({ favoriteItem, favoriteColor, personality, occasion }) => {
  const prompt = `You are ALTERA AI Stylist. Analyze this style quiz and choose one clear fashion style.

Quiz:
- Favorite item: ${favoriteItem || 'Not provided'}
- Favorite color: ${favoriteColor || 'Not provided'}
- Personality: ${personality || 'Not provided'}
- Occasion: ${occasion || 'Not provided'}

Return JSON only:
{
  "style": "one concise style name, for example Streetwear, Minimal, Smart Casual, Vintage, Sporty, Korean Casual",
  "reason": "2 short Vietnamese sentences explaining why this style fits",
  "keywords": ["keyword 1", "keyword 2", "keyword 3"]
}`;

  const result = await geminiService.generateJson(prompt, { maxOutputTokens: 400 });
  return {
    style: result.style || 'Minimal Casual',
    reason: result.reason || 'Phong cach nay phu hop voi thong tin quiz cua ban.',
    keywords: Array.isArray(result.keywords) ? result.keywords : [],
  };
};

const recommend = async (userId, { style, gender, season, budget, occasion, quiz } = {}) => {
  let resolvedStyle = style;
  let quizReason = null;

  if (!resolvedStyle && quiz) {
    const quizResult = await analyzeQuiz(quiz);
    resolvedStyle = quizResult.style;
    quizReason = quizResult.reason;
  }

  if (!resolvedStyle) {
    const error = new Error('Style is required. Submit /stylist/quiz first or pass style directly.');
    error.statusCode = 400;
    throw error;
  }

  const products = await productService.getStylistProducts({ style: resolvedStyle, gender, season, budget, limit: 6 });
  const catalog = buildCatalogPromptSection(products);

  const prompt = `You are ALTERA AI Stylist. Create a useful outfit recommendation response in Vietnamese.

Style: ${resolvedStyle}
Gender: ${gender || 'Any'}
Season: ${season || 'Any'}
Occasion: ${occasion || 'Any'}
Budget: ${budget || 'No budget provided'}
Quiz reason: ${quizReason || 'No quiz reason provided'}

${catalog}

Return JSON only:
{
  "style": "${resolvedStyle}",
  "reason": "why this outfit direction fits the user",
  "tips": ["specific styling tip 1", "specific styling tip 2", "specific styling tip 3"],
  "outfitNote": "a direct response to the user, not just product names",
  "productReasoning": [
    { "productName": "name from catalog", "reason": "why this product fits" }
  ]
}`;

  const aiResult = await geminiService.generateJson(prompt, { maxOutputTokens: 900 });

  return {
    style: aiResult.style || resolvedStyle,
    reason: aiResult.reason || quizReason || 'Bo san pham nay phu hop voi phong cach ban chon.',
    tips: Array.isArray(aiResult.tips) ? aiResult.tips : [],
    outfitNote: aiResult.outfitNote || '',
    recommendedProducts: products,
    productReasoning: Array.isArray(aiResult.productReasoning) ? aiResult.productReasoning : [],
  };
};

const saveRecommendation = async (userId, recommendation) => {
  const record = await OutfitRecommendation.create({
    userId,
    selectedItems: recommendation.selectedItems || {},
    style: recommendation.style,
    reason: recommendation.reason,
    tips: recommendation.tips || [],
    products: (recommendation.recommendedProducts || recommendation.products || []).map((product) => product._id || product.id || product),
    aiSuggestion: recommendation.outfitNote || recommendation.reason || 'Stylist recommendation saved.',
    styleScore: recommendation.styleScore || null,
    occasion: recommendation.occasion || 'other',
  });

  return record;
};

const getHistory = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [historyDocs, total] = await Promise.all([
    OutfitRecommendation.find({ userId })
      .populate('products')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    OutfitRecommendation.countDocuments({ userId }),
  ]);

  const history = historyDocs.map((item) => normalizeOutfitHistoryEntry(item));

  return {
    history,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const normalizeOutfitHistoryEntry = (entry) => {
  const plain = typeof entry?.toObject === 'function' ? entry.toObject() : { ...entry };
  const suggestion = plain.suggestion || plain.aiSuggestion || plain.outfitNote || 'No suggestion';

  return {
    ...plain,
    suggestion,
    aiSuggestion: suggestion,
    recommendedProducts: Array.isArray(plain.products) ? plain.products : [],
    products: Array.isArray(plain.products) ? plain.products : [],
  };
};

module.exports = {
  analyzeQuiz,
  buildCatalogPromptSection,
  getHistory,
  normalizeOutfitHistoryEntry,
  recommend,
  saveRecommendation,
};
