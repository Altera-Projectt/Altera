const mongoose = require('mongoose');

const CustomDesignDraftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  color: { type: mongoose.Schema.Types.Mixed, default: null },
  size: { type: String, default: '' },
  printSide: { type: String, enum: ['FRONT', 'BACK', 'BOTH'], default: 'FRONT' },
  printingTechnique: { type: String, default: '' },
  frontDesign: { type: mongoose.Schema.Types.Mixed, default: () => ({ layers: [], background: null }) },
  backDesign: { type: mongoose.Schema.Types.Mixed, default: () => ({ layers: [], background: null }) },
  thumbnail: { type: String, default: '' },
}, { timestamps: true });

CustomDesignDraftSchema.index({ userId: 1, updatedAt: -1 });
module.exports = mongoose.model('CustomDesignDraft', CustomDesignDraftSchema);
