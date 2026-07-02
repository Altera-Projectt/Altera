const stylistService = require('../services/stylist.service');

const recommend = async (req, res, next) => {
  try {
    const result = await stylistService.recommend(req.user._id, req.body);
    const record = await stylistService.saveRecommendation(req.user._id, {
      ...result,
      occasion: req.body.occasion || 'other',
      selectedItems: {
        top: req.body.top,
        bottom: req.body.bottom,
        shoes: req.body.shoes,
        accessories: Array.isArray(req.body.accessories) ? req.body.accessories : req.body.accessories ? [req.body.accessories] : [],
      },
    });

    res.status(200).json({
      success: true,
      data: {
        style: result.style,
        suggestion: result.outfitNote || result.reason,
        reason: result.reason,
        tips: result.tips,
        recordId: record._id,
        products: result.recommendedProducts,
        recommendedProducts: result.recommendedProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

const generatePrint = async (req, res, next) => {
  const error = new Error('This endpoint has moved to POST /api/v1/designs/generate');
  error.statusCode = 410;
  error.code = 'ENDPOINT_MOVED';
  next(error);
};

const getHistory = async (req, res, next) => {
  try {
    const result = await stylistService.getHistory(req.user._id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { recommend, getHistory, generatePrint };
