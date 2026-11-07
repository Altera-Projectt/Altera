const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// In-memory store for 6-digit password reset codes (TTL: 10 minutes)
const resetCodeStore = new Map();
const RESET_CODE_TTL_MS = 10 * 60 * 1000;

const buildEmailQuery = (rawEmail) => {
  const clean = String(rawEmail || '').trim().toLowerCase();
  const [local, domain] = clean.split('@');
  if (local && (domain === 'gmail.com' || domain === 'googlemail.com')) {
    const dotlessLocal = local.replace(/\./g, '');
    if (dotlessLocal.length > 0 && dotlessLocal.length <= 64) {
      const pattern = dotlessLocal
        .split('')
        .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\.?');
      return {
        $or: [
          { email: clean },
          { email: `${dotlessLocal}@gmail.com` },
          { email: { $regex: new RegExp(`^${pattern}@(gmail|googlemail)\\.com$`, 'i') } },
        ],
      };
    }
  }
  return { email: clean };
};

const findUserByEmail = async (rawEmail, includePassword = false) => {
  const query = User.findOne(buildEmailQuery(rawEmail));
  if (includePassword) query.select('+password');
  return query;
};

/**
 * Register a new user
 */
const register = async ({ fullName, email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    const error = new Error('Email này đã được đăng ký');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    fullName: String(fullName || '').trim(),
    email: normalizedEmail,
    password,
  });
  const token = generateToken({ id: user._id, role: user.role });

  return { user, token };
};

/**
 * Login user
 */
const login = async ({ email, password }) => {
  const user = await findUserByEmail(email, true);
  if (!user) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  if (user.isActive === false) {
    const error = new Error('Tài khoản này đã bị khóa');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({ id: user._id, role: user.role });
  user.password = undefined;

  return { user, token };
};

/**
 * Google OAuth login / register
 */
const googleLogin = async ({ token: accessToken }) => {
  if (!accessToken || typeof accessToken !== 'string') {
    const error = new Error('Thiếu mã xác thực Google');
    error.statusCode = 400;
    throw error;
  }

  let googleProfile;
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const error = new Error('Không thể xác thực tài khoản Google. Vui lòng thử lại.');
      error.statusCode = 401;
      throw error;
    }
    googleProfile = await response.json();
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error('Lỗi kết nối tới máy chủ xác thực Google.');
    error.statusCode = 502;
    throw error;
  }

  const email = String(googleProfile?.email || '').trim().toLowerCase();
  if (!email) {
    const error = new Error('Tài khoản Google không cung cấp địa chỉ email hợp lệ.');
    error.statusCode = 400;
    throw error;
  }

  let user = await findUserByEmail(email);
  if (user) {
    if (user.isActive === false) {
      const error = new Error('Tài khoản này đã bị khóa');
      error.statusCode = 401;
      throw error;
    }
    if (!user.avatar && googleProfile.picture) {
      user.avatar = googleProfile.picture;
      await user.save();
    }
  } else {
    const randomPassword = `${crypto.randomBytes(12).toString('hex')}1A`;
    const fullName = String(googleProfile.name || email.split('@')[0] || 'Thành viên ALTERA').trim().slice(0, 100);
    user = await User.create({
      fullName,
      email,
      password: randomPassword,
      avatar: googleProfile.picture || null,
    });
  }

  const jwtToken = generateToken({ id: user._id, role: user.role });
  return { user, token: jwtToken };
};

/**
 * Request 6-digit password reset code
 */
const requestPasswordReset = async ({ email }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Không tìm thấy tài khoản nào đăng ký với địa chỉ email này');
    error.statusCode = 404;
    throw error;
  }
  if (user.isActive === false) {
    const error = new Error('Tài khoản này đã bị khóa');
    error.statusCode = 403;
    throw error;
  }

  const code = String(crypto.randomInt(100000, 999999));
  resetCodeStore.set(user.email, {
    code,
    userId: String(user._id),
    expiresAt: Date.now() + RESET_CODE_TTL_MS,
  });

  return { email: user.email, code };
};

/**
 * Verify 6-digit password reset code
 */
const verifyResetCode = async ({ email, code }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Không tìm thấy tài khoản người dùng');
    error.statusCode = 404;
    throw error;
  }

  const record = resetCodeStore.get(user.email);
  if (!record || Date.now() > record.expiresAt) {
    resetCodeStore.delete(user.email);
    const error = new Error('Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới.');
    error.statusCode = 400;
    throw error;
  }

  if (record.code !== String(code || '').trim()) {
    const error = new Error('Mã xác thực không chính xác. Vui lòng kiểm tra lại.');
    error.statusCode = 400;
    throw error;
  }

  return { verified: true };
};

/**
 * Reset password using verified 6-digit code
 */
const resetPassword = async ({ email, code, password }) => {
  await verifyResetCode({ email, code });
  const user = await findUserByEmail(email, true);
  if (!user) {
    const error = new Error('Không tìm thấy tài khoản người dùng');
    error.statusCode = 404;
    throw error;
  }

  user.password = password;
  await user.save();
  resetCodeStore.delete(user.email);

  return { reset: true };
};

module.exports = {
  register,
  login,
  googleLogin,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
};
