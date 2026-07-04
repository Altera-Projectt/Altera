const Design = require('../models/Design');
const { uploadImage } = require('../utils/cloudinary');
const logger = require('../utils/logger');

const buildDataUri = (file) => {
  if (!file) return null;
  if (file.buffer) {
    const mimeType = file.mimetype || 'image/jpeg';
    return `data:${mimeType};base64,${file.buffer.toString('base64')}`;
  }
  return file.path;
};

/**
 * Create a new shirt design
 */
const createDesign = async (userId, designData, files = {}) => {
  const { shirtColor, customText, fontSize, textColor, textPosition } = designData;

  let customImage = null;
  let previewImage = null;

  // Upload custom image if provided
  if (files.customImage) {
    const uploaded = await uploadImage(buildDataUri(files.customImage[0]), 'altera/designs/custom');
    customImage = uploaded.url;
  }

  // Upload preview image if provided
  if (files.previewImage) {
    const uploaded = await uploadImage(buildDataUri(files.previewImage[0]), 'altera/designs/previews');
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

/**
 * Update design
 */
const updateDesign = async (designId, userId, role, updateData, files = {}) => {
  const design = await getDesignById(designId, userId, role);

  if (role !== 'ADMIN' && design.userId._id.toString() !== userId.toString()) {
    const error = new Error('Access denied. You can only update your own designs.');
    error.statusCode = 403;
    throw error;
  }

  // Allowed fields to update
  const allowedFields = ['shirtColor', 'customText', 'fontSize', 'textColor', 'textPosition'];
  
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      design[field] = updateData[field];
    }
  });

  // Update custom image if provided
  if (files.customImage) {
    const uploaded = await uploadImage(buildDataUri(files.customImage[0]), 'altera/designs/custom');
    design.customImage = uploaded.url;
  }

  // Update preview image if provided
  if (files.previewImage) {
    const uploaded = await uploadImage(buildDataUri(files.previewImage[0]), 'altera/designs/previews');
    design.previewImage = uploaded.url;
  }

  await design.save();
  return design;
};

/**
 * Delete design
 */
const deleteDesign = async (designId, userId, role) => {
  const design = await getDesignById(designId, userId, role);

  if (role !== 'ADMIN' && design.userId._id.toString() !== userId.toString()) {
    const error = new Error('Access denied. You can only delete your own designs.');
    error.statusCode = 403;
    throw error;
  }

  await Design.findByIdAndDelete(designId);
  return { message: 'Design deleted successfully' };
};

module.exports = { createDesign, getDesignById, getUserDesigns, updateDesign, deleteDesign };
