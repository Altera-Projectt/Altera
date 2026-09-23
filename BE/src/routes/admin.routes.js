const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const admin = require('../controllers/admin.controller');
const order = require('../controllers/order.controller');
const product = require('../controllers/product.controller');
const { createProductValidator, updateProductValidator } = require('../validators/product.validator');
const multer = require('multer');
const upload = multer({ dest: 'src/uploads/' });

router.use(protect, restrictTo('ADMIN'));
router.get('/dashboard', admin.dashboard);
router.get('/users', admin.listUsers);
router.get('/users/:id', admin.getUser);
router.patch('/users/:id', admin.updateUser);
router.get('/customers', (req, res, next) => { req.query.role = 'USER'; admin.listUsers(req, res, next); });
router.get('/customers/:id', admin.getCustomer);
router.get('/orders', admin.listOrders);
router.get('/orders/:id', admin.getOrder);
router.patch('/orders/:id/status', order.updateOrderStatus);
router.get('/products', admin.listProducts);
router.post('/products', upload.single('image'), createProductValidator, product.createProduct);
router.put('/products/:id', upload.single('image'), updateProductValidator, product.updateProduct);
router.delete('/products/:id', product.deleteProduct);

module.exports = router;
