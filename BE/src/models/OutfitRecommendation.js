const mongoose = require('mongoose');

const OutfitRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    selectedItems: {
      top: { type: String, default: null },
      bottom: { type: String, default: null },
      shoes: { type: String, default: null },
      accessories: { type: [String], default: [] },
    },
    aiSuggestion: {
      type: String,
      required: [true, 'AI suggestion is required'],
    },
    style: {
      type: String,
      trim: true,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    tips: {
      type: [String],
      default: [],
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    styleScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    occasion: {
      type: String,
      trim: true,
      default: 'other',
    },
  },
  {
    timestamps: true,
  }
);

OutfitRecommendationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('OutfitRecommendation', OutfitRecommendationSchema);
