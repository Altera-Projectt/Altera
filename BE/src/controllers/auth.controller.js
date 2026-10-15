const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const { user, token } = await authService.register({ fullName, email, password });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = { register, login, me };
