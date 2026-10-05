const mongoose = require('mongoose');

// Personal asset library for Custom Design: holds both user-uploaded files and AI-generated images.
const UploadedImageSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
  url:       { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  // AI images reuse the Cloudinary file owned by the Design document, so they have no own publicId.
  publicId: { type: String, default: '' },
  filename: { type: String, required: true, maxlength: 160 },
  mimeType: { type: String, required: true, enum: ['image/png', 'image/jpeg', 'image/webp'] },
  size: { type: Number, default: 0, max: 10 * 1024 * 1024 },
  source: { type: String, enum: ['UPLOAD', 'AI'], default: 'UPLOAD', index: true },
  prompt: { type: String, default: '', maxlength: 2000 },
  designId: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', default: null },
}, { timestamps: true });

UploadedImageSchema.index({ userId: 1, source: 1, createdAt: -1 });
UploadedImageSchema.index({ userId: 1, designId: 1 });

module.exports = mongoose.model('UploadedImage', UploadedImageSchema);
