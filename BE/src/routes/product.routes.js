const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { createProductValidator, updateProductValidator } = require('../validators/product.validator');
const multer = require('multer');
const upload = multer({ dest: 'src/uploads/' });

// Public
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only
router.post('/', protect, restrictTo('ADMIN'), upload.single('image'), createProductValidator, createProduct);
router.put('/:id', protect, restrictTo('ADMIN'), upload.single('image'), updateProductValidator, updateProduct);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteProduct);

module.exports = router;
