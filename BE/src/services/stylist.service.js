const OutfitRecommendation = require('../models/OutfitRecommendation');
const User = require('../models/User');
const cerebrasService = require('./cerebras.service');
const productService = require('./product.service');
const logger = require('../utils/logger');

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

const getProductNameByCategory = (products, categories) => {
  const categoryList = Array.isArray(categories) ? categories : [categories];
  return products.find((product) => categoryList.includes(product.category))?.name || null;
};

const normalizeAnswerText = (value) => String(value || '').trim().toLowerCase();

const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const buildFallbackQuizResult = ({ favoriteItem, favoriteColor, personality, occasion } = {}) => {
  const item = normalizeAnswerText(favoriteItem);
  const color = normalizeAnswerText(favoriteColor);
  const trait = normalizeAnswerText(personality);
  const event = normalizeAnswerText(occasion);
  const combined = [item, color, trait, event].join(' ');

  let style = 'Minimalist';

  if (includesAny(combined, ['đi làm', 'cong so', 'công sở', 'van phong', 'văn phòng', 'meeting', 'lich su', 'lịch sự'])) {
    style = 'Smart Casual';
  } else if (includesAny(combined, ['chiến', 'ca tinh', 'cá tính', 'nổi bật', 'noi bat', 'hoodie', 'baggy', 'street', 'skate'])) {
    style = 'Streetwear';
  } else if (includesAny(combined, ['sport', 'gym', 'the thao', 'thể thao', 'năng động', 'nang dong'])) {
    style = 'Sporty';
  } else if (includesAny(combined, ['vintage', 'retro', 'co dien', 'cổ điển'])) {
    style = 'Vintage';
  } else if (includesAny(combined, ['korean', 'hàn', 'han quoc', 'hàn quốc', 'oppa'])) {
    style = 'Korean Casual';
  } else if (includesAny(combined, ['y2k', '2000', 'crop', 'baby tee'])) {
    style = 'Y2K';
  } else if (includesAny(combined, ['sang', 'thanh lịch', 'thanh lich', 'elegant', 'váy', 'dam', 'đầm'])) {
    style = 'Elegant';
  } else if (includesAny(combined, ['workwear', 'cargo', 'utility', 'bụi', 'bui'])) {
    style = 'Workwear';
  }

  const paletteByColor = {
    đen: ['đen', 'trắng', 'xám'],
    den: ['đen', 'trắng', 'xám'],
    trắng: ['trắng', 'be', 'đen'],
    trang: ['trắng', 'be', 'đen'],
    pastel: ['xanh pastel', 'trắng', 'hồng nhạt'],
    be: ['be', 'nâu nhạt', 'trắng'],
    nâu: ['nâu', 'kem', 'xanh rêu'],
    nau: ['nâu', 'kem', 'xanh rêu'],
    xanh: ['xanh navy', 'trắng', 'xám'],
    đỏ: ['đỏ đô', 'đen', 'trắng'],
    do: ['đỏ đô', 'đen', 'trắng'],
  };

  const matchedPaletteKey = Object.keys(paletteByColor).find((key) => color.includes(key));
  const colorPalette = matchedPaletteKey ? paletteByColor[matchedPaletteKey] : ['đen', 'trắng', 'xám'];

  const keyPiecesByStyle = {
    Streetwear: ['áo phông oversize', 'quần baggy', 'sneaker chunky'],
    Minimalist: ['áo basic trơn', 'quần suông tối màu', 'sneaker trắng'],
    'Smart Casual': ['áo sơ mi', 'quần chinos', 'giày tối giản'],
    Vintage: ['áo khoác denim', 'quần jeans ống đứng', 'giày retro'],
    Sporty: ['áo thun thoáng khí', 'quần jogger', 'sneaker thể thao'],
    'Korean Casual': ['áo cardigan mỏng', 'quần ống rộng', 'giày loafer hoặc sneaker trắng'],
    Y2K: ['baby tee hoặc áo croptop', 'quần jeans cạp thấp/vừa', 'phụ kiện ánh kim'],
    Elegant: ['áo blouse hoặc sơ mi lụa', 'quần tây/váy midi', 'giày loafer hoặc kitten heels'],
    Workwear: ['áo khoác utility', 'quần cargo', 'boots hoặc sneaker chắc form'],
  };

  return {
    style,
    reason: `Dựa trên câu trả lời của bạn, ${style} là hướng phối đồ hợp lý vì vừa bám thói quen mặc hằng ngày vừa dễ áp dụng cho ${event || 'nhiều hoàn cảnh'}. Bạn có thể bắt đầu bằng các món cơ bản, màu dễ phối rồi thêm một điểm nhấn nhỏ để outfit rõ cá tính hơn.`,
    keywords: [style, colorPalette[0], event || 'hằng ngày'],
    colorPalette,
    avoidColors: ['neon quá chói', 'quá nhiều màu nổi trong cùng một outfit'],
    keyPieces: keyPiecesByStyle[style],
  };
};

const buildFallbackRecommendation = (resolvedStyle, derivedQuizResult, products = [], occasion) => {
  const colorPalette = Array.isArray(derivedQuizResult?.colorPalette) ? derivedQuizResult.colorPalette : [];
  const keyPieces = Array.isArray(derivedQuizResult?.keyPieces) ? derivedQuizResult.keyPieces : [];
  const avoidColors = Array.isArray(derivedQuizResult?.avoidColors) ? derivedQuizResult.avoidColors : [];

  const mainColor = colorPalette[0] || 'đen';
  const secondaryColor = colorPalette[1] || 'trắng';
  const accentColor = colorPalette[2] || 'xám';
  const top = getProductNameByCategory(products, 'SHIRT') || keyPieces[0] || 'áo basic vừa vặn';
  const bottom = getProductNameByCategory(products, 'PANTS') || keyPieces[1] || 'quần tối màu dễ phối';
  const shoes = getProductNameByCategory(products, 'SHOES') || keyPieces[2] || 'sneaker tối giản';
  const accessories = getProductNameByCategory(products, 'ACCESSORY') || 'túi hoặc đồng hồ tối giản';
  const occasionText = occasion || 'hằng ngày';

  return {
    style: resolvedStyle,
    reason: derivedQuizResult?.reason || `Phong cách ${resolvedStyle} phù hợp với thói quen và màu sắc bạn đã chọn.`,
    outfitNote: `Bạn có thể phối ${top} cùng ${bottom}, thêm ${shoes} để giữ tổng thể gọn và đúng tinh thần ${resolvedStyle}. Với dịp ${occasionText}, hãy ưu tiên ${mainColor} làm màu chính, phối ${secondaryColor} để dễ mặc hơn và dùng ${accentColor} như điểm nhấn nhỏ. Bộ này đủ chỉn chu để ra ngoài nhưng vẫn thoải mái cho hoạt động trong ngày.`,
    colorGuide: {
      main: mainColor,
      secondary: secondaryColor,
      accent: accentColor,
      avoid: avoidColors[0] || 'màu quá chói nếu bạn muốn giữ tổng thể dễ phối',
      example: `${top} màu ${mainColor} + ${bottom} màu ${secondaryColor} + ${shoes} màu trung tính.`,
    },
    weatherTips: 'Thời tiết nóng ẩm nên chọn cotton, linen hoặc chất vải thoáng. Khi trời lạnh, layer thêm áo khoác mỏng để giữ form mà không bị nặng nề.',
    bodyTips: 'Ưu tiên form vừa người hoặc hơi rộng nhẹ để dễ vận động. Nếu muốn trông cao hơn, hãy chọn quần cạp vừa/cao và phối giày cùng tông với quần.',
    tips: [
      `Giữ 1 màu chủ đạo là ${mainColor}, các món còn lại nên trung tính để outfit không bị rối.`,
      `Dùng ${accessories} làm điểm nhấn thay vì thêm quá nhiều phụ kiện cùng lúc.`,
      'Chọn chất liệu ít nhăn và dễ giặt để outfit dùng được thường xuyên hơn.',
    ],
    completeOutfit: {
      top,
      bottom,
      shoes,
      accessories,
    },
    recommendedProducts: products,
    productReasoning: products.map((product) => ({
      productName: product.name,
      reason: `${product.name} dễ phối với phong cách ${resolvedStyle} và phù hợp để xây dựng outfit ${occasionText}.`,
    })),
  };
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

  let result;
  try {
    result = await cerebrasService.generateJson(prompt, { maxOutputTokens: 400 });
  } catch (error) {
    logger.warn('Cerebras stylist quiz failed, using fallback. %s', error?.message || 'Unknown error');
    return buildFallbackQuizResult({ favoriteItem, favoriteColor, personality, occasion });
  }

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
  const user = await User.findById(userId).select('measurements preferences').lean();

  const colorPaletteHint = derivedQuizResult?.colorPalette?.join(', ') || '';
  const keyPiecesHint = derivedQuizResult?.keyPieces?.join(', ') || '';
  const measurementHint = user?.measurements
    ? `Cao: ${user.measurements.height || 'chưa có'} cm; Nặng: ${user.measurements.weight || 'chưa có'} kg; Size áo: ${user.measurements.shirtSize || 'chưa có'}; Size giày: ${user.measurements.shoeSize || 'chưa có'}`
    : 'Chưa có';
  const preferenceStyles = user?.preferences?.styles?.join(', ') || 'Chưa có';
  const favoriteColors = user?.preferences?.favoriteColors?.join(', ') || 'Chưa có';
  const avoidColors = user?.preferences?.avoidColors?.join(', ') || 'Chưa có';

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
- Chỉ số cơ thể: ${measurementHint}
- Gu thời trang đã lưu: ${preferenceStyles}
- Màu yêu thích đã lưu: ${favoriteColors}
- Màu cần tránh đã lưu: ${avoidColors}

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

  let aiResult;
  try {
    aiResult = await cerebrasService.generateJson(prompt, { maxOutputTokens: 1200 });
  } catch (error) {
    logger.warn('Cerebras stylist recommendation failed, using fallback. %s', error?.message || 'Unknown error');
    return buildFallbackRecommendation(resolvedStyle, derivedQuizResult, products, occasion);
  }

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
