const mongoose = require('mongoose');

const CustomDesignDraftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  color: { type: mongoose.Schema.Types.Mixed, default: undefined },
  size: { type: String, default: undefined },
  printSide: { type: String, enum: ['FRONT', 'BACK', 'BOTH'], default: 'FRONT' },
  printingTechnique: { type: String, default: '' },
  thumbnailUrl: { type: String, trim: true, default: undefined },
  shirtColor: { type: String, trim: true, default: undefined },
  designUrl: { type: String, trim: true, default: undefined },
  decalTransform: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
    rotation: { type: Number, default: 0 },
    scale: { type: Number, default: 1 },
    opacity: { type: Number, default: 1 },
  },
  frontDesign: { type: mongoose.Schema.Types.Mixed, default: () => ({ layers: [], background: null }) },
  backDesign: { type: mongoose.Schema.Types.Mixed, default: () => ({ layers: [], background: null }) },
  thumbnail: { type: String, default: '' },
}, { timestamps: true });

CustomDesignDraftSchema.index({ userId: 1, updatedAt: -1 });
module.exports = mongoose.model('CustomDesignDraft', CustomDesignDraftSchema);
