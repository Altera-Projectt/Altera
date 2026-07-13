const User = require('../models/User');
const Order = require('../models/Order');
const Design = require('../models/Design');
const OutfitRecommendation = require('../models/OutfitRecommendation');
const { uploadImage } = require('../utils/cloudinary');

const getProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['fullName'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Handle avatar upload
    if (req.file) {
      const mimeType = req.file.mimetype || 'image/jpeg';
      const dataUri = req.file.buffer
        ? `data:${mimeType};base64,${req.file.buffer.toString('base64')}`
        : req.file.path;
      const uploaded = await uploadImage(dataUri, 'altera/avatars');
      updates.avatar = uploaded.url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const updateBasic = async (req, res, next) => {
  try {
    const allowedFields = ['fullName', 'bio', 'location', 'phone'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Basic profile updated successfully', data: { user } });
  } catch (error) {
    next(error);
  }
};

const updateMeasurements = async (req, res, next) => {
  try {
    const allowedFields = ['height', 'weight', 'shirtSize', 'shoeSize'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[`measurements.${field}`] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Measurements updated successfully', data: { user } });
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const allowedFields = ['styles', 'favoriteColors', 'avoidColors'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (!Array.isArray(req.body[field])) {
          const error = new Error(`${field} must be an array`);
          error.statusCode = 400;
          throw error;
        }
        updates[`preferences.${field}`] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Fashion preferences updated successfully', data: { user } });
  } catch (error) {
    next(error);
  }
};

const uploadProfileImage = (field, folder, options = {}) => async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('Image file is required');
      error.statusCode = 400;
      throw error;
    }

    if (!req.file.mimetype?.startsWith('image/')) {
      const error = new Error('Only image files are allowed');
      error.statusCode = 400;
      throw error;
    }

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploaded = await uploadImage(dataUri, folder, options);
    const user = await User.findByIdAndUpdate(req.user._id, { [field]: uploaded.url }, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: `${field} updated successfully`, data: { user } });
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = uploadProfileImage('avatar', 'altera/avatars');
const uploadCover = uploadProfileImage('coverImage', 'altera/covers', {
  transformation: [{ width: 1500, height: 500, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
});

const getActivities = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const userId = req.user._id;

    const [orders, designs, recommendations] = await Promise.all([
      Order.find({ userId }).select('_id totalPrice status createdAt').lean(),
      Design.find({ userId }).select('_id customText style shirtType createdAt').lean(),
      OutfitRecommendation.find({ userId }).select('_id style occasion createdAt').lean(),
    ]);

    const activities = [
      ...orders.map((order) => ({
        id: `order_${order._id}`,
        type: 'ORDER_PLACED',
        title: `Bạn đã đặt một đơn hàng #${String(order._id).slice(-6)}`,
        createdAt: order.createdAt,
        metadata: { orderId: order._id, status: order.status, totalPrice: order.totalPrice },
      })),
      ...designs.map((design) => ({
        id: `design_${design._id}`,
        type: 'DESIGN_CREATED',
        title: `Bạn đã tạo một thiết kế mới${design.customText ? `: ${design.customText}` : ''}`,
        createdAt: design.createdAt,
        metadata: { designId: design._id, style: design.style, shirtType: design.shirtType },
      })),
      ...recommendations.map((recommendation) => ({
        id: `outfit_${recommendation._id}`,
        type: 'AI_OUTFIT_SAVED',
        title: `Bạn đã lưu một gợi ý outfit${recommendation.style ? ` phong cách ${recommendation.style}` : ''}`,
        createdAt: recommendation.createdAt,
        metadata: { recommendationId: recommendation._id, style: recommendation.style, occasion: recommendation.occasion },
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = activities.length;
    const data = activities.slice((page - 1) * limit, page * limit);
    res.status(200).json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateBasic,
  updateMeasurements,
  updatePreferences,
  uploadAvatar,
  uploadCover,
  getActivities,
  getAllUsers,
  deleteAccount,
};
