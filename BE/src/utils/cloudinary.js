const cloudinary = require('cloudinary').v2;
const { CLOUDINARY } = require('../config/env');

cloudinary.config({
  cloud_name: CLOUDINARY.CLOUD_NAME,
  api_key: CLOUDINARY.API_KEY,
  api_secret: CLOUDINARY.API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path or base64 data URI
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImage = async (filePath, folder = 'outfit_ai', options = {}) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
    ...options,
  });
  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId
 */
const deleteImage = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadImage, deleteImage };
