const mongoose = require('mongoose');

const UploadedImageSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
  url:       { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  publicId:  { type: String, required: true },
  filename:  { type: String, required: true, maxlength: 160 },
  mimeType:  { type: String, required: true, enum: ['image/png', 'image/jpeg', 'image/webp'] },
  size:      { type: Number, required: true, max: 10 * 1024 * 1024 },
  // BE-1: nguồn ảnh — UPLOAD (user tự up) hoặc AI (tạo từ AI)
  source:    { type: String, enum: ['UPLOAD', 'AI'], default: 'UPLOAD', index: true },
  // BE-1: prompt gốc (chỉ có khi source === 'AI')
  prompt:    { type: String, default: null, maxlength: 500 },
  // BE-1: Design._id tạo ra ảnh này (chỉ có khi source === 'AI')
  designId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Design', default: null },
}, { timestamps: true });

// Index tối ưu cho query phân trang theo nguồn
UploadedImageSchema.index({ userId: 1, source: 1, createdAt: -1 });
UploadedImageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('UploadedImage', UploadedImageSchema);
