const mongoose = require('mongoose');
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, designId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceDesign', required: true } }, { timestamps: true });
schema.index({ userId: 1, designId: 1 }, { unique: true });
module.exports = mongoose.model('DesignerLike', schema);
