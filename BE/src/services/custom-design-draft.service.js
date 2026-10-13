const CustomDesignDraft = require('../models/CustomDesignDraft');
const mongoose = require('mongoose');
const normalizeDecalTransform = require('../utils/decal-transform');
const { ensureCloudinaryUrl, sanitizeDesignLayers } = require('../utils/cloudinary');

const draftFields = ['name', 'productId', 'color', 'size', 'printSide', 'printingTechnique', 'frontDesign', 'backDesign', 'thumbnail', 'thumbnailUrl', 'shirtColor', 'designUrl', 'decalTransform'];

const ownedDraft = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Draft not found.');
    error.statusCode = 404;
    throw error;
  }
  const draft = await CustomDesignDraft.findOne({ _id: id, userId });
  if (!draft) {
    const error = new Error('Draft not found.');
    error.statusCode = 404;
    throw error;
  }
  return draft;
};

const safeData = (data) => Object.fromEntries(draftFields.filter((field) => data[field] !== undefined).map((field) => [field, field === 'decalTransform' ? normalizeDecalTransform(data[field]) : data[field]]));

// Chuẩn hóa dữ liệu nháp và upload toàn bộ ảnh Base64 lên Cloudinary trước khi lưu DB
const prepareDraftData = async (data) => {
  const result = safeData(data);
  if (result.thumbnail) {
    result.thumbnail = await ensureCloudinaryUrl(result.thumbnail, 'altera/designs/drafts');
  }
  if (result.thumbnailUrl) {
    result.thumbnailUrl = await ensureCloudinaryUrl(result.thumbnailUrl, 'altera/designs/drafts');
  }
  if (result.designUrl) {
    result.designUrl = await ensureCloudinaryUrl(result.designUrl, 'altera/designs/drafts');
  }
  if (result.frontDesign) {
    result.frontDesign = await sanitizeDesignLayers(result.frontDesign, 'altera/designs/drafts');
  }
  if (result.backDesign) {
    result.backDesign = await sanitizeDesignLayers(result.backDesign, 'altera/designs/drafts');
  }
  return result;
};

const list = (userId) => CustomDesignDraft.find({ userId }).sort({ updatedAt: -1 }).lean();

const create = async (userId, data) => {
  const cleanData = await prepareDraftData(data);
  return CustomDesignDraft.create({ ...cleanData, userId });
};

const get = (id, userId) => ownedDraft(id, userId);

const update = async (id, userId, data) => {
  const draft = await ownedDraft(id, userId);
  const cleanData = await prepareDraftData(data);
  Object.assign(draft, cleanData);
  await draft.save();
  return draft;
};

const remove = async (id, userId) => {
  await ownedDraft(id, userId);
  await CustomDesignDraft.deleteOne({ _id: id, userId });
};

const duplicate = async (id, userId) => {
  const draft = await ownedDraft(id, userId);
  const data = draft.toObject();
  delete data._id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.__v;
  data.name = `${draft.name} Copy`;
  return CustomDesignDraft.create({ ...data, userId });
};

module.exports = { list, create, get, update, remove, duplicate };
