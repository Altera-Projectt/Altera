const CustomDesignDraft = require('../models/CustomDesignDraft');
const mongoose = require('mongoose');

const draftFields = ['name', 'productId', 'color', 'size', 'printSide', 'printingTechnique', 'frontDesign', 'backDesign', 'thumbnail'];
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
const safeData = (data) => Object.fromEntries(draftFields.filter((field) => data[field] !== undefined).map((field) => [field, data[field]]));

const list = (userId) => CustomDesignDraft.find({ userId }).sort({ updatedAt: -1 }).lean();
const create = (userId, data) => CustomDesignDraft.create({ ...safeData(data), userId });
const get = (id, userId) => ownedDraft(id, userId);
const update = async (id, userId, data) => {
  const draft = await ownedDraft(id, userId);
  Object.assign(draft, safeData(data));
  await draft.save();
  return draft;
};
const remove = async (id, userId) => { await ownedDraft(id, userId); await CustomDesignDraft.deleteOne({ _id: id, userId }); };
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
