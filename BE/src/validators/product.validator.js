const { body } = require('express-validator');
const { handleValidationErrors } = require('./auth.validator');

const CATEGORIES = ['T-Shirt', 'Hoodie', 'Pants', 'Shorts', 'Jacket', 'Accessory', 'Shoes'];
const STYLES = ['Oversize', 'Boxy', 'Slim', 'Regular', 'Crop', 'Baby Tee', 'Polo', 'Henley'];
const FITS = ['Oversized', 'Boxy', 'Regular', 'Slim', 'Relaxed'];
const GENDERS = ['Men', 'Women', 'Unisex'];

const createProductValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Name cannot exceed 200 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(CATEGORIES).withMessage('Invalid category'),

  body('style').optional({ nullable: true }).isIn(STYLES).withMessage('Invalid style'),
  body('fit').optional({ nullable: true }).isIn(FITS).withMessage('Invalid fit'),
  body('gender').optional().isIn(GENDERS).withMessage('Invalid gender'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('discountPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Discount price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  handleValidationErrors,
];

const updateProductValidator = [
  body('name').optional().trim().isLength({ max: 200 }).withMessage('Name cannot exceed 200 characters'),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  body('style').optional({ nullable: true }).isIn(STYLES).withMessage('Invalid style'),
  body('fit').optional({ nullable: true }).isIn(FITS).withMessage('Invalid fit'),
  body('gender').optional().isIn(GENDERS).withMessage('Invalid gender'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discountPrice')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Discount price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  handleValidationErrors,
];

module.exports = { createProductValidator, updateProductValidator };
