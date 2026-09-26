const mongoose = require('mongoose');

const UploadedImageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  url: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  filename: { type: String, required: true, maxlength: 160 },
  mimeType: { type: String, required: true, enum: ['image/png', 'image/jpeg', 'image/webp'] },
  size: { type: Number, required: true, max: 10 * 1024 * 1024 },
}, { timestamps: true });

module.exports = mongoose.model('UploadedImage', UploadedImageSchema);
