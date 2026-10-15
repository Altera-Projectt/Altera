const crypto = require('crypto');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CLOUDINARY } = require('../config/env');

cloudinary.config({
  cloud_name: CLOUDINARY.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY.API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY.API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

/**
 * Kiểm tra xem chuỗi có phải Base64 hoặc Data URI hay không
 * @param {string} str
 * @returns {boolean}
 */
const isBase64OrDataUri = (str) => {
  if (typeof str !== 'string' || !str) return false;
  if (str.startsWith('data:')) return true;
  if (str.startsWith('http://') || str.startsWith('https://')) return false;
  if (str.length >= 16 && /^[A-Za-z0-9+/=\r\n]+$/.test(str.trim())) return true;
  return false;
};

/**
 * Tạo mã hash (MD5) từ nội dung ảnh (Base64 string, Buffer, hoặc File Path) để deduplication
 * @param {string|Buffer} filePath
 * @returns {string} 32-character hex string
 */
const getImageHash = (filePath) => {
  const hash = crypto.createHash('md5');

  if (Buffer.isBuffer(filePath)) {
    hash.update(filePath);
  } else if (typeof filePath === 'string') {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      // Remote URL
      hash.update(filePath);
    } else if (isBase64OrDataUri(filePath)) {
      // Chuỗi Base64 hoặc Data URI
      const base64Data = filePath.includes(';base64,')
        ? filePath.split(';base64,')[1]
        : filePath;
      try {
        hash.update(Buffer.from(base64Data.trim(), 'base64'));
      } catch {
        hash.update(base64Data);
      }
    } else if (fs.existsSync(filePath)) {
      // Đường dẫn file cục bộ
      try {
        hash.update(fs.readFileSync(filePath));
      } catch {
        hash.update(filePath);
      }
    } else {
      hash.update(filePath);
    }
  } else {
    hash.update(String(filePath));
  }

  return hash.digest('hex');
};

/**
 * Upload file to Cloudinary với nguyên lý Deduplication (Chống trùng lặp ảnh)
 * @param {string|Buffer} filePath - Local file path, Buffer, hoặc Base64 data URI
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

  // Băm nội dung bức ảnh bằng MD5 để làm public_id chống trùng lặp (Deduplication)
  const contentHash = getImageHash(filePath);

  const uploadOptions = {
    folder,
    resource_type: 'auto',
    public_id: contentHash,
    overwrite: true,
    unique_filename: false,
    ...options,
  };

  // Nếu options không chỉ định public_id hoặc overwrite thì ưu tiên thiết lập chống trùng lặp
  if (!options.public_id) {
    uploadOptions.public_id = contentHash;
  }
  if (options.overwrite === undefined) {
    uploadOptions.overwrite = true;
  }
  if (options.unique_filename === undefined) {
    uploadOptions.unique_filename = false;
  }

  // Tuyệt đối không nuốt lỗi, ném trực tiếp lỗi ra ngoài nếu upload thất bại
  const result = await cloudinary.uploader.upload(filePath, uploadOptions);

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
  getImageHash,
  ensureCloudinaryUrl,
  sanitizeDesignLayers,
  deleteImage,
};
