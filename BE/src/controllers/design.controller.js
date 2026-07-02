const designService = require('../services/design.service');
const designAiService = require('../services/design-ai.service');

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

const updateDesign = async (req, res, next) => {
  try {
    const design = await designService.updateDesign(req.params.id, req.user._id, req.user.role, req.body, req.files || {});
    res.status(200).json({ success: true, message: 'Design updated successfully', data: { design } });
  } catch (error) {
    next(error);
  }
};

const deleteDesign = async (req, res, next) => {
  try {
    const result = await designService.deleteDesign(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const uploadDesign = async (req, res, next) => {
  try {
    const result = await designAiService.uploadDesignImage(req.user._id, req.files || {}, req.body);
    res.status(201).json({ success: true, message: 'Design image uploaded successfully', data: result });
  } catch (error) {
    next(error);
  }
};

const generateDesign = async (req, res, next) => {
  try {
    const result = await designAiService.generateDesign(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Design generated successfully', data: result });
  } catch (error) {
    next(error);
  }
};

const refineDesign = async (req, res, next) => {
  try {
    const result = await designAiService.refineDesign(req.params.id, req.user._id, req.user.role, req.body);
    res.status(200).json({ success: true, message: 'Design refined successfully', data: result });
  } catch (error) {
    next(error);
  }
};

const saveDesign = async (req, res, next) => {
  try {
    const design = await designAiService.saveGeneratedDesign(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, message: 'Design saved successfully', data: { design } });
  } catch (error) {
    next(error);
  }
};

const orderDesign = async (req, res, next) => {
  try {
    const order = await designAiService.createOrderFromDesign(req.params.id, req.user._id, req.user.role, req.body);
    res.status(201).json({ success: true, message: 'Design order created successfully', data: { order } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDesign,
  getDesignById,
  getMyDesigns,
  updateDesign,
  deleteDesign,
  uploadDesign,
  generateDesign,
  refineDesign,
  saveDesign,
  orderDesign,
};
