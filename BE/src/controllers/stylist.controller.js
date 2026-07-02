const stylistService = require('../services/stylist.service');

const quiz = async (req, res, next) => {
  try {
    const result = await stylistService.analyzeQuiz(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const recommend = async (req, res, next) => {
  try {
    const result = await stylistService.recommend(req.user._id, req.body);
    const record = await stylistService.saveRecommendation(req.user._id, {
      ...result,
      occasion: req.body.occasion || 'other',
    });

    res.status(200).json({
      success: true,
      data: {
        ...result,
        recordId: record._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

const save = async (req, res, next) => {
  try {
    const record = await stylistService.saveRecommendation(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Stylist recommendation saved successfully',
      data: { record },
    });
  } catch (error) {
    next(error);
  }
};

const history = async (req, res, next) => {
  try {
    const result = await stylistService.getHistory(req.user._id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { quiz, recommend, save, history };
