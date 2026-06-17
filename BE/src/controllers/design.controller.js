const designService = require('../services/design.service');

const createDesign = async (req, res, next) => {
  try {
    const design = await designService.createDesign(req.user._id, req.body, req.files || {});
    res.status(201).json({ success: true, message: 'Design created successfully', data: { design } });
  } catch (error) {
    next(error);
  }
};

const getDesignById = async (req, res, next) => {
  try {
    const design = await designService.getDesignById(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, data: { design } });
  } catch (error) {
    next(error);
  }
};

const getMyDesigns = async (req, res, next) => {
  try {
    const result = await designService.getUserDesigns(req.user._id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDesign, getDesignById, getMyDesigns };
