const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById, updateOrderStatus } = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { createOrderValidator } = require('../validators/order.validator');

router.use(protect);

router.post('/', createOrderValidator, createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', restrictTo('ADMIN'), updateOrderStatus);

module.exports = router;
