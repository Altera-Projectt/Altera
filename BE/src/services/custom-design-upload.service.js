const UploadedImage = require('../models/UploadedImage');
const Design = require('../models/Design');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

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

/** BE-3 (upload thủ công): user upload file lên thư viện với source=UPLOAD */
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
  return UploadedImage.create({ userId, url: result.url, thumbnailUrl, publicId: result.publicId, filename, mimeType, size: file.size, source: 'UPLOAD' });
};

/**
 * BE-2: Lưu ảnh AI vào thư viện.
 * Đọc Design record → copy URL lên UploadedImage với source='AI'.
 * Nếu đã lưu rồi thì trả về bản ghi cũ (idempotent).
 */
const saveFromGenerated = async (userId, designId) => {
  if (!designId) fail('designId is required.');

  // Kiểm tra ownership
  const design = await Design.findOne({ _id: designId, userId }).lean();
  if (!design) fail('Design not found or does not belong to you.', 404);
  if (!design.customImage) fail('This design has no generated image to save.', 400);

  // Idempotent: tránh duplicate
  const existing = await UploadedImage.findOne({ userId, designId }).lean();
  if (existing) return existing;

  const thumbnailUrl = design.customImage.includes('/upload/')
    ? design.customImage.replace('/upload/', '/upload/w_320,h_320,c_fill,q_auto,f_auto/')
    : design.customImage;

  return UploadedImage.create({
    userId,
    url: design.customImage,
    thumbnailUrl,
    publicId: `ai_generated_${designId}`,   // không cần xoá Cloudinary khi remove
    filename: `ai_${designId}.png`,
    mimeType: 'image/png',
    size: 0,                                 // ảnh AI, không có size thực
    source: 'AI',
    prompt: design.prompt || null,
    designId: design._id,
  });
};

/**
 * BE-3a + BE-3b: List thư viện với filter source và pagination.
 * ?source=ALL|UPLOAD|AI   (default: ALL)
 * ?page=1&limit=24
 * Trả về { images, total, page, totalPages }
 */
const list = async (userId, { source = 'ALL', page = 1, limit = 24 } = {}) => {
  const safeSource = ['UPLOAD', 'AI', 'ALL'].includes(String(source).toUpperCase())
    ? String(source).toUpperCase()
    : 'ALL';
  const safePage  = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
  const skip = (safePage - 1) * safeLimit;

  const filter = { userId };
  if (safeSource !== 'ALL') filter.source = safeSource;

  const [images, total] = await Promise.all([
    UploadedImage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select('url thumbnailUrl source prompt designId filename mimeType size createdAt')
      .lean(),
    UploadedImage.countDocuments(filter),
  ]);

  return { images, total, page: safePage, totalPages: Math.ceil(total / safeLimit) };
};

const remove = async (userId, id, preserveFile = false) => {
  const image = await UploadedImage.findOne({ _id: id, userId });
  if (!image) fail('Uploaded image not found.', 404);
  await UploadedImage.deleteOne({ _id: image._id });
  // Ảnh AI dùng publicId giả — không xoá file Cloudinary thật
  if (!preserveFile && image.source !== 'AI') await deleteImage(image.publicId);
  return { message: 'Uploaded image deleted successfully.' };
};

module.exports = { upload, saveFromGenerated, list, remove, validateImageFile, sanitizeFilename, MAX_IMAGE_BYTES };
