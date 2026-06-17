const Design = require('../models/Design');
const { uploadImage } = require('../utils/cloudinary');
const logger = require('../utils/logger');

/**
 * Create a new shirt design
 */
const createDesign = async (userId, designData, files = {}) => {
  const { shirtColor, customText, fontSize, textColor, textPosition } = designData;

  let customImage = null;
  let previewImage = null;

  // Upload custom image if provided
  if (files.customImage) {
    const uploaded = await uploadImage(files.customImage[0].path, 'designs/custom');
    customImage = uploaded.url;
  }

  // Upload preview image if provided
  if (files.previewImage) {
    const uploaded = await uploadImage(files.previewImage[0].path, 'designs/previews');
    previewImage = uploaded.url;
  }

  const design = await Design.create({
    userId,
    shirtColor,
    customText: customText || null,
    customImage,
    previewImage,
    fontSize: fontSize || 24,
    textColor: textColor || '#FFFFFF',
    textPosition: textPosition || 'center',
  });

  return design;
};

/**
 * Get design by ID (must belong to user unless admin)
 */
const getDesignById = async (designId, userId, role) => {
  const design = await Design.findById(designId).populate('userId', 'fullName email');

  if (!design) {
    const error = new Error('Design not found');
    error.statusCode = 404;
    throw error;
  }

  if (role !== 'ADMIN' && design.userId._id.toString() !== userId.toString()) {
    const error = new Error('Access denied. This design belongs to another user.');
    error.statusCode = 403;
    throw error;
  }

  return design;
};

/**
 * Get all designs for a user
 */
const getUserDesigns = async (userId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const [designs, total] = await Promise.all([
    Design.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Design.countDocuments({ userId }),
  ]);

  return {
    designs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = { createDesign, getDesignById, getUserDesigns };
