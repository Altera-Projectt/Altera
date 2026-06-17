const { body } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const createOrderValidator = [
  body('items')
    .isArray({ min: 1 }).withMessage('Order must have at least one item'),

  body('items.*.productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),

  body('items.*.quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

  body('shippingAddress.fullName')
    .trim().notEmpty().withMessage('Shipping full name is required'),

  body('shippingAddress.phone')
    .trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Invalid phone number'),

  body('shippingAddress.street')
    .trim().notEmpty().withMessage('Street address is required'),

  body('shippingAddress.city')
    .trim().notEmpty().withMessage('City is required'),

  body('shippingAddress.province')
    .trim().notEmpty().withMessage('Province is required'),

  handleValidationErrors,
];

module.exports = { createOrderValidator };
