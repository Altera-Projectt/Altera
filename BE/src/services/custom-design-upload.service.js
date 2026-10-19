const mongoose = require('mongoose');
const UploadedImage = require('../models/UploadedImage');
const Design = require('../models/Design');
const { uploadImage, ensureCloudinaryUrl, deleteImage } = require('../utils/cloudinary');

const toThumbnail = (url) => (url && url.includes('/upload/') ? url.replace('/upload/', '/upload/w_320,h_320,c_fill,q_auto,f_auto/') : url);
const LIST_FIELDS = 'url thumbnailUrl filename mimeType size source imageType prompt designId createdAt';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED = {
  '.png':  { mime: 'image/png',  signature: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  '.jpg':  { mime: 'image/jpeg', signature: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  '.jpeg': { mime: 'image/jpeg', signature: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  '.webp': { mime: 'image/webp', signature: (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
};

const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
const sanitizeFilename = (name = 'image') => {
  const base = String(name).split(/[\\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.').slice(0, 160);
  return base || 'image';
};

const validateImageFile = (file) => {
  if (!file) fail('Image file is required.');
  if (file.size > MAX_IMAGE_BYTES) fail('Image size exceeds the 10MB limit.');
  const filename = sanitizeFilename(file.originalname);
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const type = ALLOWED[extension];
  if (!type || file.mimetype !== type.mime || !type.signature(file.buffer)) fail('Only valid PNG, JPG, JPEG, and WEBP images are allowed.');
  return { filename, mimeType: type.mime };
};

/** Upload ảnh xem trước/thumbnail của cả phôi áo lên Cloudinary, không lưu vào UploadedImage */
const uploadPreview = async (userId, file) => {
  const { filename, mimeType } = validateImageFile(file);
  const result = await uploadImage(`data:${mimeType};base64,${file.buffer.toString('base64')}`, 'altera/previews', {
    resource_type: 'image',
  });
  return {
    url: result.url,
    thumbnailUrl: toThumbnail(result.url),
    publicId: result.publicId,
    filename,
    mimeType,
  };
};

/** BE-3 (upload thủ công): user upload file lên thư viện với source=UPLOAD */
const upload = async (userId, file, imageType = 'UPLOADED') => {
  const normalizedImageType = String(imageType || 'UPLOADED').toUpperCase();
  const { filename, mimeType } = validateImageFile(file);

  // Nếu là preview hoặc tên file là thumbnail/design-preview thì không lưu vào UploadedImage
  if (normalizedImageType === 'PREVIEW' || /^(thumbnail|design-preview)/i.test(filename)) {
    return uploadPreview(userId, file);
  }

  if (!['AI', 'UPLOADED'].includes(normalizedImageType)) fail('imageType must be AI or UPLOADED.');
  const result = await uploadImage(`data:${mimeType};base64,${file.buffer.toString('base64')}`, 'altera/designs/uploads', {
    resource_type: 'image',
  });
  const existing = await UploadedImage.findOne({ userId, publicId: result.publicId });
  if (existing) {
    return existing;
  }
  return UploadedImage.create({ userId, url: result.url, thumbnailUrl: toThumbnail(result.url), publicId: result.publicId, filename, mimeType, size: file.size, source: 'UPLOAD', imageType: normalizedImageType });
};

const list = async (userId, { source = 'ALL', page = 1, limit = 24 } = {}) => {
  const safeSource = ['UPLOAD', 'AI', 'ALL'].includes(String(source).toUpperCase()) ? String(source).toUpperCase() : 'ALL';
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
  const filter = {
    userId,
    filename: { $not: /^(thumbnail|design-preview)/i },
  };
  if (safeSource === 'AI') filter.source = 'AI';
  if (safeSource === 'UPLOAD') filter.source = { $ne: 'AI' };
  const [images, total] = await Promise.all([
    UploadedImage.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).select('_id url thumbnailUrl filename source imageType prompt createdAt').lean(),
    UploadedImage.countDocuments(filter),
  ]);
  const normalizedImages = images
    .filter((image) => !/^(thumbnail|design-preview)/i.test(image.filename || ''))
    .map((image) => ({ ...image, imageType: image.imageType || (image.source === 'AI' ? 'AI' : 'UPLOADED') }));
  return { images: normalizedImages, total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
};

const addFromGenerated = async (userId, designId) => {
  if (!mongoose.Types.ObjectId.isValid(designId)) fail('Invalid design id.');
  const design = await Design.findOne({ _id: designId, userId }).select('previewImage customImage prompt').lean();
  if (!design) fail('Generated design not found.', 404);
  const rawUrl = design.previewImage || design.customImage;
  if (!rawUrl) fail('This design has no image yet.');
  const url = await ensureCloudinaryUrl(rawUrl, 'altera/designs/generated');
  const existing = await UploadedImage.findOne({ userId, designId: design._id, url }).select(LIST_FIELDS).lean();
  if (existing) return { image: { ...existing, imageType: existing.imageType || 'AI' }, created: false };
  const image = await UploadedImage.create({ userId, url, thumbnailUrl: toThumbnail(url), filename: `ai-${Date.now()}.png`, mimeType: 'image/png', size: 0, source: 'AI', imageType: 'AI', prompt: String(design.prompt || '').slice(0, 2000), designId: design._id });
  return { image: image.toObject(), created: true };
};

const remove = async (userId, id, preserveFile = false) => {
  const image = await UploadedImage.findOne({ _id: id, userId });
  if (!image) fail('Uploaded image not found.', 404);
  await UploadedImage.deleteOne({ _id: image._id });
  if (!preserveFile && image.source !== 'AI' && image.publicId) await deleteImage(image.publicId);
  return { message: 'Uploaded image deleted successfully.' };
};

module.exports = { upload, uploadPreview, list, addFromGenerated, remove, validateImageFile, sanitizeFilename, MAX_IMAGE_BYTES };
