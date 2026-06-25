const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user
 */
const register = async ({ fullName, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ fullName, email, password });
  const token = generateToken({ id: user._id, role: user.role });

  return { user, token };
};

/**
 * Login user
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({ id: user._id, role: user.role });
  user.password = undefined;

  return { user, token };
};

module.exports = { register, login };
