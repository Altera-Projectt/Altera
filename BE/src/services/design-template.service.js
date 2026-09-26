const DesignTemplate = require('../models/DesignTemplate');
const builtInTemplates = require('../seeds/design-templates.seed');

let builtInsReady;
const ensureBuiltIns = async () => {
  if (!builtInsReady) builtInsReady = DesignTemplate.bulkWrite(builtInTemplates.map((template) => ({
    updateOne: { filter: { slug: template.slug }, update: { $setOnInsert: { ...template, isActive: true, isBuiltIn: true } }, upsert: true },
  })), { ordered: false }).catch((error) => {
    const writeErrors = error.writeErrors ?? [];
    if (error.code !== 11000 && (!writeErrors.length || writeErrors.some((writeError) => writeError.code !== 11000))) { builtInsReady = null; throw error; }
  });
  await builtInsReady;
};
const list = async ({ search, category, style } = {}) => {
  await ensureBuiltIns();
  const query = { isActive: true };
  if (category) query.category = new RegExp(`^${String(category).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  if (style) query.style = new RegExp(`^${String(style).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  if (search) {
    const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(safeSearch, 'i');
    query.$or = [{ name: matcher }, { category: matcher }, { style: matcher }, { tags: matcher }];
  }
  return DesignTemplate.find(query).sort({ category: 1, name: 1 }).lean();
};
const get = async (id) => {
  const template = await DesignTemplate.findOne({ _id: id, isActive: true }).lean();
  if (!template) { const error = new Error('Template not found.'); error.statusCode = 404; throw error; }
  return template;
};
const adminList = async () => { await ensureBuiltIns(); return DesignTemplate.find().sort({ updatedAt: -1 }).lean(); };
const create = async (data) => {
  const allowed = ['name', 'slug', 'thumbnail', 'category', 'style', 'tags', 'description', 'frontDesign', 'backDesign'];
  const values = Object.fromEntries(allowed.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]));
  values.slug = values.slug || String(values.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return DesignTemplate.create({ ...values, isActive: true, isBuiltIn: false });
};
const update = async (id, data) => {
  const allowed = ['name', 'slug', 'thumbnail', 'category', 'style', 'tags', 'description', 'frontDesign', 'backDesign', 'isActive'];
  const changes = Object.fromEntries(allowed.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]));
  const template = await DesignTemplate.findByIdAndUpdate(id, changes, { new: true, runValidators: true });
  if (!template) { const error = new Error('Template not found.'); error.statusCode = 404; throw error; }
  return template;
};
const remove = async (id) => {
  const template = await DesignTemplate.findById(id);
  if (!template) { const error = new Error('Template not found.'); error.statusCode = 404; throw error; }
  if (template.isBuiltIn) { template.isActive = false; await template.save(); }
  else await template.deleteOne();
};

module.exports = { list, get, adminList, create, update, remove, ensureBuiltIns };
