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

module.exports = { register, login, me };
