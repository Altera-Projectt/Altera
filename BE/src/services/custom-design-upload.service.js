const mongoose = require('mongoose');
const UploadedImage = require('../models/UploadedImage');
const Design = require('../models/Design');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const toThumbnail = (url) => (url.includes('/upload/') ? url.replace('/upload/', '/upload/w_320,h_320,c_fill,q_auto,f_auto/') : url);
const LIST_FIELDS = 'url thumbnailUrl filename mimeType size source prompt designId createdAt';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED = {
  '.png': { mime: 'image/png', signature: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  '.jpg': { mime: 'image/jpeg', signature: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  '.jpeg': { mime: 'image/jpeg', signature: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  '.webp': { mime: 'image/webp', signature: (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
};

const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
const sanitizeFilename = (name = 'image') => {
  const base = String(name).split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '.').slice(0, 160);
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

const upload = async (userId, file) => {
  const { filename, mimeType } = validateImageFile(file);

  const result = await uploadImage(`data:${mimeType};base64,${file.buffer.toString('base64')}`, 'altera/custom-design/uploads', {
    resource_type: 'image',
    public_id: `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    overwrite: false,
  });
  return UploadedImage.create({ userId, url: result.url, thumbnailUrl: toThumbnail(result.url), publicId: result.publicId, filename, mimeType, size: file.size, source: 'UPLOAD' });
};

const list = (userId, { source } = {}) => {
  const filter = { userId };
  if (source === 'UPLOAD') filter.source = { $ne: 'AI' }; // legacy docs have no source field
  if (source === 'AI') filter.source = 'AI';
  return UploadedImage.find(filter).sort({ createdAt: -1 }).limit(200).select(LIST_FIELDS).lean();
};

// Save an AI-generated Design image into the user's asset library (idempotent per design image).
const addFromGenerated = async (userId, designId) => {
  if (!mongoose.Types.ObjectId.isValid(designId)) fail('Invalid design id.');
  const design = await Design.findOne({ _id: designId, userId }).select('previewImage customImage prompt').lean();
  if (!design) fail('Generated design not found.', 404);
  const url = design.previewImage || design.customImage;
  if (!url) fail('This design has no image yet.');

  const existing = await UploadedImage.findOne({ userId, designId: design._id, url }).select(LIST_FIELDS).lean();
  if (existing) return { image: existing, created: false };

  const image = await UploadedImage.create({
    userId,
    url,
    thumbnailUrl: toThumbnail(url),
    filename: `ai-${Date.now()}.png`,
    mimeType: 'image/png',
    size: 0,
    source: 'AI',
    prompt: String(design.prompt || '').slice(0, 2000),
    designId: design._id,
  });
  return { image: image.toObject(), created: true };
};

const remove = async (userId, id, preserveFile = false) => {
  const image = await UploadedImage.findOne({ _id: id, userId });
  if (!image) fail('Uploaded image not found.', 404);
  await UploadedImage.deleteOne({ _id: image._id });
  // AI images share their file with the Design document, so only the library entry is removed.
  if (!preserveFile && image.source !== 'AI' && image.publicId) await deleteImage(image.publicId);
  return { message: 'Uploaded image deleted successfully.' };
};

module.exports = { upload, list, addFromGenerated, remove, validateImageFile, sanitizeFilename, MAX_IMAGE_BYTES };
