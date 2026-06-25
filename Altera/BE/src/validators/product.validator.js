const { body } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const createProductValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Name cannot exceed 200 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['SHIRT', 'PANTS', 'SHOES', 'ACCESSORY']).withMessage('Invalid category'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  handleValidationErrors,
];

const updateProductValidator = [
  body('name').optional().trim().isLength({ max: 200 }).withMessage('Name cannot exceed 200 characters'),
  body('category').optional().isIn(['SHIRT', 'PANTS', 'SHOES', 'ACCESSORY']).withMessage('Invalid category'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  handleValidationErrors,
];

module.exports = { createProductValidator, updateProductValidator };
