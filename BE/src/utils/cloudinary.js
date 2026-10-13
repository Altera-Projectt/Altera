const cloudinary = require('cloudinary').v2;
const { CLOUDINARY } = require('../config/env');

cloudinary.config({
  cloud_name: CLOUDINARY.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY.API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY.API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path or base64 data URI
 * @param {string} folder - Cloudinary folder name
 * @param {object} options - Custom Cloudinary upload options
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImage = async (filePath, folder = 'altera', options = {}) => {
  console.log("Cloudinary Config Check:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || CLOUDINARY.CLOUD_NAME,
    api_key: (process.env.CLOUDINARY_API_KEY || CLOUDINARY.API_KEY)
      ? "***" + (process.env.CLOUDINARY_API_KEY || CLOUDINARY.API_KEY).slice(-4)
      : "MISSING",
  });

  // Tuyệt đối không nuốt lỗi, ném trực tiếp lỗi ra ngoài nếu upload thất bại
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
    ...options,
  });

  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Đảm bảo biến ảnh luôn là URL Cloudinary HTTPS, không bao giờ lưu Base64 vào MongoDB
 * - Nếu là null/undefined/empty -> trả về nguyên vẹn
 * - Nếu đã là URL từ xa (http:// hoặc https://) -> trả về nguyên vẹn
 * - Nếu là Base64 (data:image/... hoặc chuỗi dài) -> upload lên Cloudinary và trả về secure_url
 *
 * @param {string} imageInput - Chuỗi URL hoặc Base64 data URI
 * @param {string} folder - Thư mục Cloudinary mục tiêu
 * @param {object} options - Tùy chọn Cloudinary thêm (nếu có)
 * @returns {Promise<string|null>}
 */
const ensureCloudinaryUrl = async (imageInput, folder = 'altera', options = {}) => {
  if (!imageInput || typeof imageInput !== 'string') return imageInput;

  // Đã là link HTTP/HTTPS
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    return imageInput;
  }

  // Phát hiện chuỗi Base64
  if (
    imageInput.startsWith('data:image/') ||
    imageInput.startsWith('data:application/') ||
    imageInput.length > 500
  ) {
    let dataUri = imageInput;
    if (!dataUri.startsWith('data:')) {
      dataUri = `data:image/png;base64,${dataUri}`;
    }
    const uploaded = await uploadImage(dataUri, folder, options);
    return uploaded.url;
  }

  return imageInput;
};

/**
 * Quét và upload toàn bộ các ảnh Base64 trong các layer của frontDesign / backDesign
 * @param {object} designSide - Object chứa { layers: [...] }
 * @param {string} folder - Thư mục Cloudinary
 * @returns {Promise<object>}
 */
const sanitizeDesignLayers = async (designSide, folder = 'altera/designs/drafts') => {
  if (!designSide || typeof designSide !== 'object') return designSide;
  const layers = Array.isArray(designSide.layers) ? designSide.layers : [];
  for (const layer of layers) {
    if (layer && typeof layer === 'object') {
      if (layer.src) {
        layer.src = await ensureCloudinaryUrl(layer.src, folder);
      }
      if (layer.url) {
        layer.url = await ensureCloudinaryUrl(layer.url, folder);
      }
    }
  }
  return designSide;
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId
 */
const deleteImage = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  uploadImage,
  ensureCloudinaryUrl,
  sanitizeDesignLayers,
  deleteImage,
};
