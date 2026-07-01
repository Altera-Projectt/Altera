const OutfitRecommendation = require('../models/OutfitRecommendation');
const Product = require('../models/Product');
const { generateOutfitRecommendation, normalizeOutfitHistoryEntry } = require('../services/ai.service');

const recommend = async (req, res, next) => {
  try {
    const { top, bottom, shoes, accessories, occasion, style, budget, preferences } = req.body;
    const normalizedAccessories = Array.isArray(accessories) ? accessories : accessories ? [accessories] : [];
    const normalizedBudget = budget ? Number(budget) : null;
    const requestedCategories = [top ? 'SHIRT' : null, bottom ? 'PANTS' : null, shoes ? 'SHOES' : null].filter(Boolean);

    const productQuery = {
      isActive: true,
      ...(requestedCategories.length > 0 ? { category: { $in: requestedCategories } } : { category: { $in: ['SHIRT', 'PANTS', 'SHOES'] } }),
      ...(normalizedBudget ? { price: { $lte: normalizedBudget } } : {}),
      ...(req.body?.stock === 'available' ? { stock: { $gt: 0 } } : {}),
    };

    const matchedProducts = await Product.find(productQuery).sort({ price: 1 }).limit(6).lean();

    const result = await generateOutfitRecommendation(
      { top, bottom, shoes, accessories: normalizedAccessories, style, preferences },
      occasion || 'casual',
      matchedProducts
    );

    const record = await OutfitRecommendation.create({
      userId: req.user._id,
      selectedItems: { top, bottom, shoes, accessories: normalizedAccessories },
      aiSuggestion: result.suggestion,
      styleScore: result.styleScore,
      occasion: occasion || 'casual',
    });

    res.status(200).json({
      success: true,
      data: {
        suggestion: result.suggestion,
        tips: result.tips,
        styleScore: result.styleScore,
        improvements: result.improvements,
        recordId: record._id,
        products: matchedProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [historyDocs, total] = await Promise.all([
      OutfitRecommendation.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      OutfitRecommendation.countDocuments({ userId: req.user._id }),
    ]);

    const history = historyDocs.map((item) => normalizeOutfitHistoryEntry(item));

    res.status(200).json({
      success: true,
      data: {
        history,
        pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { recommend, getHistory };
