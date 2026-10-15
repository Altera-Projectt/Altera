const { body } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const createOrderValidator = [
  body('paymentMethod').optional().isIn(['COD', 'BANK_TRANSFER', 'MOMO']).withMessage('Phương thức thanh toán không hợp lệ'),
  body('checkoutKey').optional().isUUID().withMessage('Mã thanh toán không hợp lệ'),
  body('items')
    .isArray({ min: 1 }).withMessage('Đơn hàng phải có ít nhất một sản phẩm'),

  body('items.*.productId')
    .notEmpty().withMessage('ID sản phẩm không được để trống')
    .isMongoId().withMessage('ID sản phẩm không hợp lệ'),

  body('items.*.cartItemId')
    .optional().isMongoId().withMessage('ID mục giỏ hàng không hợp lệ'),

  body('items.*.quantity')
    .notEmpty().withMessage('Số lượng không được để trống')
    .isInt({ min: 1 }).withMessage('Số lượng phải từ 1 trở lên'),

  body('shippingAddress.fullName')
    .trim().notEmpty().withMessage('Họ tên người nhận không được để trống'),

  body('shippingAddress.phone')
    .trim().notEmpty().withMessage('Số điện thoại không được để trống')
    .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Số điện thoại không hợp lệ'),

  body('shippingAddress.street')
    .trim().notEmpty().withMessage('Địa chỉ giao hàng không được để trống'),

  body('shippingAddress.city')
    .optional({ checkFalsy: true }).trim(),

  body('shippingAddress.province')
    .optional({ checkFalsy: true }).trim(),

  handleValidationErrors,
];

module.exports = { createOrderValidator };
