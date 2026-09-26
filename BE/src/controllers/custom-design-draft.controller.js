const draftService = require('../services/custom-design-draft.service');

const asyncHandler = (handler) => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};

module.exports = {
  list: asyncHandler(async (req, res) => res.status(200).json({ success: true, data: { drafts: await draftService.list(req.user._id) } })),
  create: asyncHandler(async (req, res) => res.status(201).json({ success: true, data: { draft: await draftService.create(req.user._id, req.body) } })),
  get: asyncHandler(async (req, res) => res.status(200).json({ success: true, data: { draft: await draftService.get(req.params.draftId, req.user._id) } })),
  update: asyncHandler(async (req, res) => res.status(200).json({ success: true, data: { draft: await draftService.update(req.params.draftId, req.user._id, req.body) } })),
  remove: asyncHandler(async (req, res) => { await draftService.remove(req.params.draftId, req.user._id); res.status(200).json({ success: true, message: 'Draft deleted.' }); }),
  duplicate: asyncHandler(async (req, res) => res.status(201).json({ success: true, data: { draft: await draftService.duplicate(req.params.draftId, req.user._id) } })),
};
