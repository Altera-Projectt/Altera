const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
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
    .normalizeEmail(),

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
    .isEmail().withMessage('Email không đúng định dạng'),

  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống'),

  handleValidationErrors,
];

module.exports = { registerValidator, loginValidator, handleValidationErrors };
