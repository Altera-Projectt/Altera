const UploadedImage = require('../models/UploadedImage');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

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
  const thumbnailUrl = result.url.includes('/upload/')
    ? result.url.replace('/upload/', '/upload/w_320,h_320,c_fill,q_auto,f_auto/')
    : result.url;
  return UploadedImage.create({ userId, url: result.url, thumbnailUrl, publicId: result.publicId, filename, mimeType, size: file.size });
};

const list = (userId) => UploadedImage.find({ userId }).sort({ createdAt: -1 }).select('url thumbnailUrl filename mimeType size createdAt').lean();

const remove = async (userId, id, preserveFile = false) => {
  const image = await UploadedImage.findOne({ _id: id, userId });
  if (!image) fail('Uploaded image not found.', 404);
  await UploadedImage.deleteOne({ _id: image._id });
  if (!preserveFile) await deleteImage(image.publicId);
  return { message: 'Uploaded image deleted successfully.' };
};

module.exports = { upload, list, remove, validateImageFile, sanitizeFilename, MAX_IMAGE_BYTES };
