const mongoose = require('mongoose');

const DesignTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  thumbnail: { type: String, required: true },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  style: { type: String, required: true, trim: true, maxlength: 60 },
  tags: { type: [String], default: [] },
  description: { type: String, default: '', maxlength: 1000 },
  frontDesign: { type: mongoose.Schema.Types.Mixed, default: () => ({ layers: [] }) },
  backDesign: { type: mongoose.Schema.Types.Mixed, default: () => ({ layers: [] }) },
  isActive: { type: Boolean, default: true, index: true },
  isBuiltIn: { type: Boolean, default: false },
}, { timestamps: true });

DesignTemplateSchema.index({ isActive: 1, category: 1, style: 1 });
module.exports = mongoose.model('DesignTemplate', DesignTemplateSchema);
