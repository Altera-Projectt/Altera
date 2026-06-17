const User = require('../models/User');
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
      const uploaded = await uploadImage(req.file.path, 'avatars');
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

module.exports = { getProfile, updateProfile, getAllUsers };
