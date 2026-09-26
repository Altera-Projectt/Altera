const templateService = require('../services/design-template.service');
const wrap = (handler) => async (req, res, next) => { try { await handler(req, res); } catch (error) { next(error); } };

module.exports = {
  list: wrap(async (req, res) => res.status(200).json({ success: true, data: { templates: await templateService.list(req.query) } })),
  get: wrap(async (req, res) => res.status(200).json({ success: true, data: { template: await templateService.get(req.params.id) } })),
  adminList: wrap(async (req, res) => res.status(200).json({ success: true, data: { templates: await templateService.adminList() } })),
  create: wrap(async (req, res) => res.status(201).json({ success: true, data: { template: await templateService.create(req.body) } })),
  update: wrap(async (req, res) => res.status(200).json({ success: true, data: { template: await templateService.update(req.params.id, req.body) } })),
  remove: wrap(async (req, res) => { await templateService.remove(req.params.id); res.status(200).json({ success: true, message: 'Template deleted.' }); }),
};
