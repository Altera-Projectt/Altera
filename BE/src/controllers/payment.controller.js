const paymentService = require('../services/payment.service');

exports.status = async (req, res, next) => {
  try {
    const result = await paymentService.getOrderPayment(req.params.orderId, req.user._id, req.user.role);
    res.json({ success: true, data: { orderId: result.order._id, amount: result.order.totalPrice, paymentMethod: result.payment.paymentMethod, paymentStatus: result.payment.paymentStatus, paymentReference: result.payment.paymentReference, transactionId: result.payment.transactionId, failureReason: result.payment.failureReason || null, transfer: result.transfer } });
  } catch (error) { next(error); }
};

exports.momoCreate = async (req, res, next) => {
  try { res.json({ success: true, data: await paymentService.initiateMomo(req.params.orderId, req.user._id) }); }
  catch (error) { next(error); }
};

exports.bankRetry = async (req, res, next) => {
  try { res.json({ success: true, data: await paymentService.retryBankPayment(req.params.orderId, req.user._id) }); }
  catch (error) { next(error); }
};

exports.momoIpn = async (req, res) => {
  try { await paymentService.momoNotification(req.body); return res.status(204).end(); }
  catch (error) { return res.status(error.statusCode || 400).json({ success: false, message: error.message }); }
};

exports.vietqrWebhook = async (req, res) => {
  try { await paymentService.bankNotification(req); return res.status(200).json({ success: true, message: 'Transaction processed' }); }
  catch (error) { return res.status(error.statusCode || 400).json({ success: false, message: error.message }); }
};
