const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const payment = require('../controllers/payment.controller');
const membership = require('../controllers/membership.controller');

// Provider callbacks are verified by their signatures/tokens in payment.service.
router.post('/webhook/momo', payment.momoIpn);
router.post('/webhook/vietqr', payment.vietqrWebhook);
router.get('/vnpay/return', membership.vnpayReturn);
router.get('/webhook/vnpay', membership.vnpayIpn);
router.post('/webhook/membership/momo', membership.momoIpn);
router.get('/membership/:reference', protect, membership.result);
router.get('/:orderId/status', protect, payment.status);
router.post('/:orderId/bank/retry', protect, payment.bankRetry);
router.post('/:orderId/momo', protect, payment.momoCreate);

module.exports = router;
