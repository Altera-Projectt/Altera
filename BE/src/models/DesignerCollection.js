const mongoose = require('mongoose');
const DesignerCollectionSchema = new mongoose.Schema({
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DesignerProfile', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, required: true, lowercase: true, trim: true },
}, { timestamps: true });
DesignerCollectionSchema.index({ designerId: 1, slug: 1 }, { unique: true });
module.exports = mongoose.model('DesignerCollection', DesignerCollectionSchema);
