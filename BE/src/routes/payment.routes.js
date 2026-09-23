const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const payment = require('../controllers/payment.controller');

// Provider callbacks are verified by their signatures/tokens in payment.service.
router.post('/webhook/momo', payment.momoIpn);
router.post('/webhook/vietqr', payment.vietqrWebhook);
router.get('/:orderId/status', protect, payment.status);
router.post('/:orderId/bank/retry', protect, payment.bankRetry);
router.post('/:orderId/momo', protect, payment.momoCreate);

module.exports = router;
