const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const mappedErrors = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return res.status(400).json({
      success: false,
      message: mappedErrors[0]?.message || 'Dữ liệu không hợp lệ',
      errors: mappedErrors,
    });
  }
  next();
};

const registerValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Họ và tên không được để trống')
    .isLength({ min: 2, max: 100 }).withMessage('Họ và tên phải từ 2 đến 100 ký tự'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .toLowerCase(),

  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất một chữ số'),

  handleValidationErrors,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .toLowerCase(),

  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống'),

  handleValidationErrors,
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .toLowerCase(),
  handleValidationErrors,
];

const verifyResetCodeValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .toLowerCase(),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('Mã xác thực phải gồm 6 chữ số'),
  handleValidationErrors,
];

const resetPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng')
    .toLowerCase(),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('Mã xác thực phải gồm 6 chữ số'),
  body('password')
    .notEmpty().withMessage('Mật khẩu mới không được để trống')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất một chữ số'),
  handleValidationErrors,
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetCodeValidator,
  resetPasswordValidator,
  handleValidationErrors,
};
