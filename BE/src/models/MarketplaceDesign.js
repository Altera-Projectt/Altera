const mongoose = require('mongoose');
const MarketplaceDesignSchema = new mongoose.Schema({
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DesignerProfile', required: true, index: true }, userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomDesignDraft', required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 }, slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, description: { type: String, default: '', maxlength: 3000 }, thumbnail: { type: String, default: '' }, thumbnailUrl: { type: String, required: true, trim: true, default: function defaultThumbnailUrl() { return this.thumbnail || undefined; } }, shirtColor: { type: String, trim: true, default: undefined }, designUrl: { type: String, trim: true, default: undefined }, decalTransform: {
    x: { type: Number, default: undefined }, y: { type: Number, default: undefined }, z: { type: Number, default: 0 },
    rotation: { type: Number, default: 0 }, scale: { type: Number, default: 1 }, opacity: { type: Number, default: 1 },
  }, productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, color: { type: mongoose.Schema.Types.Mixed, default: undefined }, size: { type: String, default: undefined }, printSide: { type: String, enum: ['FRONT','BACK','BOTH'], default: 'FRONT' }, printingTechnique: { type: String, default: '' }, frontDesign: { type: mongoose.Schema.Types.Mixed, required: true }, backDesign: { type: mongoose.Schema.Types.Mixed, default: null }, price: { type: Number, required: true, min: 0 }, category: { type: String, default: '' }, tags: { type: [String], default: [] }, collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DesignerCollection', default: null }, status: { type: String, enum: ['DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','ARCHIVED'], default: 'PENDING_REVIEW', index: true }, rejectionReason: { type: String, default: '' },
  likesCount: { type: Number, default: 0, index: true }, salesCount: { type: Number, default: 0, index: true },
}, { timestamps: true });
MarketplaceDesignSchema.index({ designerId: 1, status: 1, createdAt: -1 });
MarketplaceDesignSchema.index({ name: 'text', tags: 'text', category: 'text' });
MarketplaceDesignSchema.index({ status: 1, createdAt: -1 });
MarketplaceDesignSchema.index({ status: 1, likesCount: -1, createdAt: -1 });
MarketplaceDesignSchema.index({ status: 1, salesCount: -1, createdAt: -1 });
MarketplaceDesignSchema.index({ status: 1, price: 1, createdAt: -1 });
MarketplaceDesignSchema.index({ status: 1, price: -1, createdAt: -1 });
module.exports = mongoose.model('MarketplaceDesign', MarketplaceDesignSchema);
