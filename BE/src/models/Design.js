const mongoose = require('mongoose');

const DesignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    shirtColor: {
      type: String,
      required: [true, 'Shirt color is required'],
      trim: true,
    },
    customText: {
      type: String,
      trim: true,
      maxlength: [100, 'Custom text cannot exceed 100 characters'],
      default: null,
    },
    customImage: {
      type: String, // URL from Cloudinary
      default: null,
    },
    previewImage: {
      type: String, // URL from Cloudinary
      default: null,
    },
    prompt: {
      type: String,
      trim: true,
      default: null,
    },
    style: {
      type: String,
      trim: true,
      default: null,
    },
    shirtType: {
      type: String,
      trim: true,
      default: null,
    },
    colorPalette: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SAVED'],
      default: 'SAVED',
    },
    fontSize: {
      type: Number,
      default: 24,
    },
    textColor: {
      type: String,
      default: '#FFFFFF',
    },
    textPosition: {
      type: String,
      enum: ['center', 'top', 'bottom', 'left', 'right'],
      default: 'center',
    },
  },
  {
    timestamps: true,
  }
);

DesignSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Design', DesignSchema);
