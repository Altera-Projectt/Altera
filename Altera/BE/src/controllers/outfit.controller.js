const OutfitRecommendation = require('../models/OutfitRecommendation');
const { generateOutfitRecommendation } = require('../services/ai.service');

const recommend = async (req, res, next) => {
  try {
    const { top, bottom, shoes, accessories, occasion } = req.body;

    if (!top && !bottom && !shoes) {
      return res.status(400).json({ success: false, message: 'Please provide at least one item (top, bottom, or shoes)' });
    }

    const result = await generateOutfitRecommendation({ top, bottom, shoes, accessories }, occasion);

    const record = await OutfitRecommendation.create({
      userId: req.user._id,
      selectedItems: { top, bottom, shoes, accessories: accessories || [] },
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

    const [history, total] = await Promise.all([
      OutfitRecommendation.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      OutfitRecommendation.countDocuments({ userId: req.user._id }),
    ]);

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
