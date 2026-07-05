const OutfitRecommendation = require('../models/OutfitRecommendation');
const cerebrasService = require('./cerebras.service');
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
  const prompt = `Bạn là ALTERA AI Stylist chuyên nghiệp tại Việt Nam.
Khách hàng vừa trả lời quiz phong cách bằng ngôn ngữ đời thường.
Hãy phân tích và xác định phong cách phù hợp nhất.

CÂU TRẢ LỜI QUIZ:
- Họ thường mặc gì khi ra ngoài: ${favoriteItem || 'Không trả lời'}
- Màu sắc họ hay chọn: ${favoriteColor || 'Không trả lời'}  
- Họ tự mô tả bản thân: ${personality || 'Không trả lời'}
- Họ thường mặc đồ đi đâu: ${occasion || 'Không trả lời'}

Lưu ý: câu trả lời có thể rất đơn giản như "áo phông", "đen", "bình thường", "đi học"
— hãy suy luận thông minh từ đó.

Trả về JSON:
{
  "style": "1 tên phong cách: Streetwear / Minimalist / Smart Casual / Vintage / Sporty / Korean Casual / Y2K / Elegant / Workwear",
  "reason": "2 câu tiếng Việt tự nhiên, giải thích tại sao phong cách này hợp với họ",
  "keywords": ["3 từ khóa mô tả style"],
  "colorPalette": ["màu 1", "màu 2", "màu 3 — màu nên mặc nhiều"],
  "avoidColors": ["màu 1", "màu 2 — màu nên tránh"],
  "keyPieces": ["3 món đồ cơ bản nên có trong tủ đồ theo style này"]
}`;

  const result = await cerebrasService.generateJson(prompt, { maxOutputTokens: 400 });
  return {
    style: result.style || 'Minimalist',
    reason: result.reason || 'Phong cach nay phu hop voi ban.',
    keywords: Array.isArray(result.keywords) ? result.keywords : [],
    colorPalette: Array.isArray(result.colorPalette) ? result.colorPalette : [],
    avoidColors: Array.isArray(result.avoidColors) ? result.avoidColors : [],
    keyPieces: Array.isArray(result.keyPieces) ? result.keyPieces : [],
  };
};

const recommend = async (userId, { style, gender, season, budget, occasion, quiz, quizResult } = {}) => {
  let resolvedStyle = style;
  let derivedQuizResult = quizResult || null;

  if (!resolvedStyle && quiz) {
    derivedQuizResult = await analyzeQuiz(quiz);
    resolvedStyle = derivedQuizResult.style;
  }

  if (!resolvedStyle) {
    const error = new Error('Style is required. Submit /stylist/quiz first or pass style directly.');
    error.statusCode = 400;
    throw error;
  }

  const products = await productService.getStylistProducts({ style: resolvedStyle, gender, season, budget, limit: 6 });
  const catalog = buildCatalogPromptSection(products);

  const colorPaletteHint = derivedQuizResult?.colorPalette?.join(', ') || '';
  const keyPiecesHint = derivedQuizResult?.keyPieces?.join(', ') || '';

  const prompt = `Bạn là ALTERA AI Stylist chuyên nghiệp tại Việt Nam.
Hãy tư vấn phong cách ăn mặc thực tế, cụ thể và hữu ích hoàn toàn bằng tiếng Việt.
Viết như đang nói chuyện trực tiếp với khách hàng — thân thiện, rõ ràng, có ví dụ cụ thể.

THÔNG TIN KHÁCH HÀNG:
- Phong cách: ${resolvedStyle}
- Giới tính: ${gender || 'Không xác định'}  
- Mùa: ${season || 'Không xác định'} (lưu ý VN có mùa nóng ẩm và mùa lạnh miền Bắc)
- Dịp mặc: ${occasion || 'Hàng ngày'}
- Ngân sách: ${budget ? formatCurrency(budget) : 'Không giới hạn'}
- Màu sắc phù hợp từ quiz: ${colorPaletteHint || 'Chưa có'}
- Món đồ cơ bản cần có: ${keyPiecesHint || 'Chưa có'}

${catalog}

Trả về JSON đầy đủ:
{
  "style": "${resolvedStyle}",
  "reason": "1-2 câu giải thích ngắn tại sao style này hợp với khách hàng",
  "outfitNote": "3-4 câu tư vấn thân thiện trực tiếp: gợi ý cách phối 1 outfit hoàn chỉnh từ đầu đến chân, dùng sản phẩm trong catalog nếu có, kèm ví dụ màu sắc cụ thể",
  "colorGuide": {
    "main": "màu chủ đạo nên mặc nhiều nhất",
    "secondary": "màu phụ để phối cùng",
    "accent": "màu điểm nhấn nhỏ như phụ kiện",
    "avoid": "màu nên tránh và lý do ngắn gọn",
    "example": "ví dụ 1 bộ outfit cụ thể với màu sắc: áo màu X + quần màu Y + giày màu Z"
  },
  "weatherTips": "2 câu lời khuyên phù hợp thời tiết VN: mùa hè chọn chất liệu gì, mùa lạnh layer ra sao",
  "bodyTips": "1-2 câu tips chọn form dáng phù hợp: oversized hay fitted, quần cao eo hay thấp eo",
  "tips": [
    "tip 1: cụ thể, có ví dụ thực tế (VD: áo trắng oversize + quần đen baggy + giày chunky = core streetwear)",
    "tip 2: tip phối màu hoặc phụ kiện cụ thể",
    "tip 3: tip về chất liệu hoặc cách giữ vệ sinh/bảo quản đồ"
  ],
  "completeOutfit": {
    "top": "gợi ý áo cụ thể (tên sản phẩm từ catalog nếu có, hoặc mô tả chung)",
    "bottom": "gợi ý quần/váy cụ thể",
    "shoes": "gợi ý giày cụ thể",
    "accessories": "gợi ý phụ kiện: túi, mũ, vòng..."
  },
  "productReasoning": [
    { 
      "productName": "tên sản phẩm từ catalog", 
      "reason": "tại sao sản phẩm này fit với style và dịp mặc của khách hàng"
    }
  ]
}`;

  const aiResult = await cerebrasService.generateJson(prompt, { maxOutputTokens: 1200 });

  return {
    style: aiResult.style || resolvedStyle,
    reason: aiResult.reason || derivedQuizResult?.reason || 'Bộ gợi ý này phù hợp với phong cách bạn chọn.',
    outfitNote: aiResult.outfitNote || '',
    colorGuide: aiResult.colorGuide || {},
    weatherTips: aiResult.weatherTips || '',
    bodyTips: aiResult.bodyTips || '',
    tips: Array.isArray(aiResult.tips) ? aiResult.tips : [],
    completeOutfit: aiResult.completeOutfit || {},
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
