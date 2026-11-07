const authService = require('../services/auth.service');
const { enrichUserResponse } = require('../utils/membership');

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const { user, token } = await authService.register({ fullName, email, password });
    const enrichedUser = await enrichUserResponse(user);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: { user: enrichedUser, token },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    const enrichedUser = await enrichUserResponse(user);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: { user: enrichedUser, token },
    });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { token: googleAccessToken } = req.body;
    const { user, token } = await authService.googleLogin({ token: googleAccessToken });
    const enrichedUser = await enrichUserResponse(user);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Google thành công',
      data: { user: enrichedUser, token },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { code } = await authService.requestPasswordReset({ email });

    res.status(200).json({
      success: true,
      message: 'Đã tạo mã xác thực khôi phục mật khẩu (hiệu lực 10 phút).',
      data: { devCode: code },
    });
  } catch (error) {
    next(error);
  }
};

const verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    await authService.verifyResetCode({ email, code });

    res.status(200).json({
      success: true,
      message: 'Xác thực mã khôi phục thành công.',
      data: { verified: true },
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;
    await authService.resetPassword({ email, code, password });

    res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu mới thành công! Vui lòng đăng nhập.',
      data: { reset: true },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const enrichedUser = await enrichUserResponse(req.user);
    res.status(200).json({
      success: true,
      data: { user: enrichedUser },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  me,
};
