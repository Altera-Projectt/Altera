const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const DesignerProfile = require('../models/DesignerProfile');
const env = require('../config/env');
const { incrementPaidOrderDesignSales } = require('./marketplace-sales.service');

const newReference = () => `ALT${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
const sign = (value, secret) => crypto.createHmac('sha256', secret).update(value).digest('hex');
const equalSignature = (actual, expected) => {
  const a = Buffer.from(String(actual || ''), 'hex'); const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const paymentError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const expireAttempt = async (payment, session) => {
  if (!session) {
    const ownSession = await mongoose.startSession();
    try { return await ownSession.withTransaction(() => expireAttempt(payment, ownSession)); }
    finally { await ownSession.endSession(); }
  }
  const expired = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'EXPIRED' } }, { new: true, ...(session ? { session } : {}) });
  if (!expired) return false;
  payment.paymentStatus = expired.paymentStatus;
  await Order.updateOne({ _id: payment.orderId, paymentReference: payment.paymentReference, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'EXPIRED' } }, session ? { session } : {});
  return true;
};

const assertConfigured = (method) => {
  if (method === 'MOMO' && env.NODE_ENV === 'production' && env.PAYMENT_ENV !== 'production') throw paymentError('Online payments are disabled until PAYMENT_ENV=production is configured.', 503);
  if (method === 'MOMO' && !(env.MOMO_PARTNER_CODE && env.MOMO_ACCESS_KEY && env.MOMO_SECRET_KEY && env.MOMO_IPN_URL)) throw paymentError('MoMo payment is not configured on the server.', 503);
  if (method === 'MOMO' && env.NODE_ENV === 'production' && env.MOMO_ENDPOINT.includes('test-payment.momo.vn')) throw paymentError('Production cannot use the MoMo sandbox endpoint.', 503);
};

const createPayment = async (order, method) => {
  const provider = method === 'MOMO' ? 'MOMO' : method === 'BANK_TRANSFER' ? 'VIETQR' : 'INTERNAL';
  const reference = newReference();
  const expiresAt = method === 'COD' ? undefined : new Date(Date.now() + 30 * 60 * 1000);
  const payment = await Payment.create({ orderId: order._id, userId: order.userId, paymentMethod: method, amount: order.totalPrice, paymentReference: reference, provider, providerOrderId: reference, expiresAt });
  order.paymentReference = reference;
  await order.save();
  return payment;
};

const transferDetails = (payment) => {
  const bankCode = env.BANK_CODE || 'MB';
  const bankName = env.BANK_NAME || 'MBBank';
  const accountNumber = env.BANK_ACCOUNT_NUMBER || '0384431663';
  const accountName = env.BANK_ACCOUNT_NAME || 'HUYNH ANH KHOI';
  const paymentContent = `ALTERA ${payment.paymentReference || String(payment.orderId || '').slice(-8).toUpperCase()}`;
  const imageUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNumber)}-compact2.png?amount=${payment.amount}&addInfo=${encodeURIComponent(paymentContent)}&accountName=${encodeURIComponent(accountName)}`;
  return { bankCode, bankName, accountNumber, accountName, amount: payment.amount, orderId: payment.orderId, paymentContent, paymentReference: payment.paymentReference, qrCodeUrl: imageUrl, paymentStatus: payment.paymentStatus };
};

const createMomoRequest = async (payment) => {
  assertConfigured('MOMO');
  const order = await Order.findById(payment.orderId);
  const requestId = payment.paymentReference;
  const requestType = 'payWithMethod';
  const redirectBase = (env.MOMO_RETURN_URL || `${env.FRONTEND_URL}/orders/success`).replace(/\/$/, '');
  const redirectUrl = `${redirectBase}/${order._id}`;
  const orderInfo = `ALTERA order ${String(order._id).slice(-8)}`;
  const extraData = '';
  const data = `accessKey=${env.MOMO_ACCESS_KEY}&amount=${payment.amount}&extraData=${extraData}&ipnUrl=${env.MOMO_IPN_URL}&orderId=${payment.providerOrderId}&orderInfo=${orderInfo}&partnerCode=${env.MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const body = { partnerCode: env.MOMO_PARTNER_CODE, requestId, amount: payment.amount, orderId: payment.providerOrderId, orderInfo, redirectUrl, ipnUrl: env.MOMO_IPN_URL, requestType, extraData, lang: 'vi', signature: sign(data, env.MOMO_SECRET_KEY) };
  const response = await fetch(env.MOMO_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok || result.resultCode !== 0 || !result.payUrl) {
    payment.failureReason = result.message || 'MoMo could not create a payment request';
    if (result.resultCode && result.resultCode !== 0) payment.paymentStatus = 'FAILED';
    await payment.save();
    if (payment.paymentStatus === 'FAILED') await Order.updateOne({ _id: payment.orderId, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'FAILED' } });
    throw paymentError('Could not start MoMo payment. Please retry this order.', 502);
  }
  payment.providerResponse = { requestId: result.requestId, resultCode: result.resultCode };
  await payment.save();
  return { paymentUrl: result.payUrl, paymentReference: payment.paymentReference };
};

const getOrderPayment = async (orderId, userId, role) => {
  const order = await Order.findById(orderId);
  if (!order) throw paymentError('Order not found', 404);
  if (role !== 'ADMIN' && order.userId.toString() !== userId.toString()) throw paymentError('Access denied. This order belongs to another user.', 403);
  const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
  if (!payment && order.paymentMethod === 'COD') return { order, payment: { paymentMethod: 'COD', paymentStatus: order.paymentStatus || 'PENDING', paymentReference: null, transactionId: null }, transfer: null };
  if (!payment) throw paymentError('Payment not found', 404);
  if (payment.expiresAt && payment.paymentStatus === 'PENDING' && payment.expiresAt <= new Date()) {
    if (await expireAttempt(payment)) order.paymentStatus = 'EXPIRED';
  }
  return { order, payment, transfer: payment.paymentMethod === 'BANK_TRANSFER' ? transferDetails(payment) : null };
};

const initiateMomo = async (orderId, userId) => {
  const session = await mongoose.startSession();
  let attempt;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw paymentError('Order not found', 404);
      if (order.userId.toString() !== userId.toString()) throw paymentError('Access denied. This order belongs to another user.', 403);
      if (order.paymentMethod !== 'MOMO') throw paymentError('This order does not use MoMo.');
      if (order.status === 'CANCELLED') throw paymentError('A cancelled order cannot be retried.', 409);
      const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 }).session(session);
      if (!payment) throw paymentError('Payment not found', 404);
      if (payment.paymentStatus === 'PENDING' && payment.expiresAt && payment.expiresAt <= new Date()) await expireAttempt(payment, session);
      if (payment.paymentStatus === 'PAID') throw paymentError('This order has already been paid.');
      attempt = payment;
      if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(payment.paymentStatus)) {
        const reference = newReference();
        attempt = await Payment.create([{ orderId: order._id, userId, paymentMethod: 'MOMO', paymentStatus: 'PENDING', amount: order.totalPrice, paymentReference: reference, provider: 'MOMO', providerOrderId: reference, expiresAt: new Date(Date.now() + 30 * 60 * 1000) }], { session }).then((docs) => docs[0]);
        order.paymentReference = reference; order.paymentStatus = 'PENDING'; await order.save({ session });
      }
    });
  } finally { await session.endSession(); }
  return createMomoRequest(attempt);
};

const retryBankPayment = async (orderId, userId) => {
  const session = await mongoose.startSession();
  let attempt;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw paymentError('Order not found', 404);
      if (order.userId.toString() !== userId.toString()) throw paymentError('Access denied. This order belongs to another user.', 403);
      if (order.paymentMethod !== 'BANK_TRANSFER') throw paymentError('This order does not use bank transfer.');
      if (order.status === 'CANCELLED') throw paymentError('A cancelled order cannot be retried.', 409);
      const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 }).session(session);
      if (!payment) throw paymentError('Payment not found', 404);
      if (payment.paymentStatus === 'PENDING' && payment.expiresAt && payment.expiresAt <= new Date()) await expireAttempt(payment, session);
      if (payment.paymentStatus === 'PAID') throw paymentError('This order has already been paid.');
      attempt = payment;
      if (payment.paymentStatus !== 'PENDING') {
        const reference = newReference();
        attempt = await Payment.create([{ orderId: order._id, userId, paymentMethod: 'BANK_TRANSFER', paymentStatus: 'PENDING', amount: order.totalPrice, paymentReference: reference, provider: 'VIETQR', providerOrderId: reference, expiresAt: new Date(Date.now() + 30 * 60 * 1000) }], { session }).then((docs) => docs[0]);
        order.paymentReference = reference; order.paymentStatus = 'PENDING'; await order.save({ session });
      }
    });
  } finally { await session.endSession(); }
  return transferDetails(attempt);
};

const listAdminPayments = async ({ status, method, type, search, from, to, page = 1, limit = 20 } = {}) => {
  const query = {};
  const statuses = ['PENDING', 'PROCESSING', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED'];
  const methods = ['COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY'];
  const types = ['ORDER', 'MEMBERSHIP'];
  if (status && !statuses.includes(status)) throw paymentError('Invalid payment status filter.');
  if (method && !methods.includes(method)) throw paymentError('Invalid payment method filter.');
  if (type && !types.includes(type)) throw paymentError('Invalid payment type filter.');
  if (status) query.paymentStatus = status;
  if (method) query.paymentMethod = method;
  if (type === 'ORDER') query.orderId = { $ne: null };
  if (type === 'MEMBERSHIP') query.membershipOrderId = { $ne: null };
  if (from || to) {
    const start = from ? new Date(from) : null;
    const end = to ? new Date(`${to}T23:59:59.999Z`) : null;
    if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) throw paymentError('Invalid date filter.');
    query.createdAt = { ...(start ? { $gte: start } : {}), ...(end ? { $lte: end } : {}) };
  }
  if (search) {
    const escaped = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({ $or: [{ fullName: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }] }).select('_id').lean();
    const orders = await Order.find({ $or: [
      ...(mongoose.Types.ObjectId.isValid(search) ? [{ _id: search }] : []),
      { userId: { $in: users.map((user) => user._id) } },
    ] }).select('_id').lean();
    query.$or = [
      { paymentReference: { $regex: escaped, $options: 'i' } },
      { transactionId: { $regex: escaped, $options: 'i' } },
      { providerOrderId: { $regex: escaped, $options: 'i' } },
      { orderId: { $in: orders.map((order) => order._id) } },
      { userId: { $in: users.map((user) => user._id) } },
    ];
  }
  const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
  const pageLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const [payments, total, summaryAgg] = await Promise.all([
    Payment.find(query)
      .populate('userId', 'fullName email')
      .populate('membershipPlanId', 'name code price durationDays')
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit)
      .lean(),
    Payment.countDocuments(query),
    Payment.aggregate([
      {
        $group: {
          _id: null,
          totalOrderPaidRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$orderId', null] },
                    { $in: ['$paymentStatus', ['PAID', 'SUCCESS']] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          orderPaidCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$orderId', null] },
                    { $in: ['$paymentStatus', ['PAID', 'SUCCESS']] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalMembershipPaidRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $or: [
                        { $ne: ['$membershipOrderId', null] },
                        { $ne: ['$membershipPlanId', null] },
                      ],
                    },
                    { $in: ['$paymentStatus', ['PAID', 'SUCCESS']] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          membershipPaidCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $or: [
                        { $ne: ['$membershipOrderId', null] },
                        { $ne: ['$membershipPlanId', null] },
                      ],
                    },
                    { $in: ['$paymentStatus', ['PAID', 'SUCCESS']] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          pendingOrderCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$orderId', null] },
                    { $in: ['$paymentStatus', ['PENDING', 'PROCESSING']] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          pendingMembershipCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $or: [
                        { $ne: ['$membershipOrderId', null] },
                        { $ne: ['$membershipPlanId', null] },
                      ],
                    },
                    { $in: ['$paymentStatus', ['PENDING', 'PROCESSING']] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);
  const orders = await Order.find({ _id: { $in: payments.map((payment) => payment.orderId).filter(Boolean) } })
    .populate('userId', 'fullName email')
    .populate('items.designerId', 'displayName username')
    .lean();
  const orderById = new Map(orders.map((order) => [String(order._id), order]));
  const rawSummary = summaryAgg[0] || {};
  return {
    payments: payments.map((payment) => ({ ...payment, order: orderById.get(String(payment.orderId)) || null })),
    summary: {
      totalOrderPaidRevenue: Number(rawSummary.totalOrderPaidRevenue || 0),
      orderPaidCount: Number(rawSummary.orderPaidCount || 0),
      totalMembershipPaidRevenue: Number(rawSummary.totalMembershipPaidRevenue || 0),
      membershipPaidCount: Number(rawSummary.membershipPaidCount || 0),
      pendingOrderCount: Number(rawSummary.pendingOrderCount || 0),
      pendingMembershipCount: Number(rawSummary.pendingMembershipCount || 0),
    },
    pagination: { total, page: pageNumber, limit: pageLimit, totalPages: Math.ceil(total / pageLimit) },
  };
};

const getPendingAdminPayment = async (orderId, method, session) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) throw paymentError('Order not found.', 404);
  if (order.status === 'CANCELLED') throw paymentError('A cancelled order cannot have its payment changed.', 409);
  const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 }).session(session);
  if (!payment) throw paymentError('Payment not found.', 404);
  if (payment.paymentStatus !== 'PENDING') throw paymentError(`Payment is already ${payment.paymentStatus}.`, 409);
  if (method && payment.paymentMethod !== method) throw paymentError(`Only ${method} payments can be changed here.`, 400);
  if (order.paymentReference && payment.paymentReference !== order.paymentReference) throw paymentError('This payment attempt is no longer active.', 409);
  if (order.paymentStatus !== 'PENDING') throw paymentError(`Order payment is already ${order.paymentStatus}.`, 409);
  return { order, payment };
};

const confirmPayment = async (orderId, adminId, transactionId) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const { order, payment } = await getPendingAdminPayment(orderId, 'BANK_TRANSFER', session);
      const updated = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'PAID', transactionId, paidAt: new Date(), 'metadata.verifiedBy': adminId, 'metadata.verifiedAt': new Date() } }, { new: true, session });
      if (!updated) throw paymentError('Payment has already been processed.', 409);
      const orderUpdate = await Order.updateOne({ _id: order._id, paymentStatus: 'PENDING', status: { $ne: 'CANCELLED' }, paymentReference: payment.paymentReference }, { $set: { paymentStatus: 'PAID', paidAt: updated.paidAt, ...(order.status === 'PENDING' ? { status: 'CONFIRMED' } : {}) } }, { session });
      if (!orderUpdate.modifiedCount) throw paymentError('Order payment status changed. Refresh and try again.', 409);
      await incrementPaidOrderDesignSales(order, session);
      result = { order: await Order.findById(order._id).session(session), payment: updated };
    });
    return result;
  } finally { await session.endSession(); }
};

const rejectPayment = async (orderId, adminId, reason) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const { order, payment } = await getPendingAdminPayment(orderId, 'BANK_TRANSFER', session);
      const failureReason = reason ? String(reason).trim().slice(0, 300) : 'Rejected by administrator';
      const updated = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'FAILED', failureReason, 'metadata.verifiedBy': adminId, 'metadata.verifiedAt': new Date(), 'metadata.rejectionReason': failureReason } }, { new: true, session });
      if (!updated) throw paymentError('Payment has already been processed.', 409);
      const orderUpdate = await Order.updateOne({ _id: order._id, paymentStatus: 'PENDING', status: { $ne: 'CANCELLED' }, paymentReference: payment.paymentReference }, { $set: { paymentStatus: 'FAILED' } }, { session });
      if (!orderUpdate.modifiedCount) throw paymentError('Order payment status changed. Refresh and try again.', 409);
      result = { order: await Order.findById(order._id).session(session), payment: updated };
    });
    return result;
  } finally { await session.endSession(); }
};

const cancelOrderPayment = async (order, session) => {
  if (order.paymentStatus === 'PAID') throw paymentError('This paid order needs a refund before it can be cancelled.', 409);
  const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 }).session(session);
  if (!payment) { if (order.paymentStatus === 'PENDING') order.paymentStatus = 'CANCELLED'; return null; }
  if (payment.paymentStatus === 'PAID') throw paymentError('This paid order needs a refund before it can be cancelled.', 409);
  if (payment.paymentStatus === 'CANCELLED') throw paymentError('This order payment has already been cancelled.', 409);
  if (payment.paymentStatus === 'PENDING') {
    const updated = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'CANCELLED' } }, { new: true, session });
    if (!updated) throw paymentError('Payment status changed. Refresh and try again.', 409);
  }
  if (order.paymentStatus === 'PENDING') order.paymentStatus = 'CANCELLED';
  return payment;
};

const momoNotification = async (body) => {
  const data = `accessKey=${env.MOMO_ACCESS_KEY}&amount=${body.amount}&extraData=${body.extraData || ''}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;
  if (body.partnerCode !== env.MOMO_PARTNER_CODE || !equalSignature(body.signature, sign(data, env.MOMO_SECRET_KEY))) throw paymentError('Invalid MoMo signature', 401);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const payment = await Payment.findOne({ provider: 'MOMO', providerOrderId: body.orderId }).session(session);
      if (!payment) throw paymentError('Payment reference not found', 404);
      if (payment.paymentStatus !== 'PENDING') return { duplicate: true };
      if (payment.expiresAt && payment.expiresAt <= new Date()) { await expireAttempt(payment, session); return { expired: true }; }
      const order = await Order.findById(payment.orderId).session(session);
      if (!order || Number(body.amount) !== order.totalPrice || Number(body.amount) !== payment.amount) throw paymentError('Payment amount does not match the order.');
      if (order.status === 'CANCELLED' || order.paymentStatus !== 'PENDING' || order.paymentReference !== payment.paymentReference) return { stale: true };
      if (Number(body.resultCode) === 0) {
        const updated = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'PAID', transactionId: String(body.transId), paidAt: new Date(), providerResponse: { resultCode: body.resultCode, responseTime: body.responseTime } } }, { new: true, session });
        if (!updated) return { duplicate: true };
        const changed = await Order.updateOne({ _id: order._id, paymentStatus: 'PENDING', status: { $ne: 'CANCELLED' }, paymentReference: payment.paymentReference }, { $set: { paymentStatus: 'PAID', paidAt: new Date(), status: order.status === 'PENDING' ? 'CONFIRMED' : order.status } }, { session });
        if (!changed.modifiedCount) throw paymentError('Order payment status changed while processing MoMo notification.', 409);
        await incrementPaidOrderDesignSales(order, session);
      } else {
        const failed = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'FAILED', failureReason: String(body.message || 'MoMo payment failed').slice(0, 300) } }, { new: true, session });
        if (!failed) return { duplicate: true };
        const changed = await Order.updateOne({ _id: order._id, paymentStatus: 'PENDING', status: { $ne: 'CANCELLED' }, paymentReference: payment.paymentReference }, { $set: { paymentStatus: 'FAILED' } }, { session });
        if (!changed.modifiedCount) throw paymentError('Order payment status changed while processing MoMo notification.', 409);
      }
      return { duplicate: false };
    });
  } finally { await session.endSession(); }
};

const bankNotification = async (req) => {
  if (!env.PAYMENT_WEBHOOK_TOKEN) throw paymentError('Bank transaction webhook is not configured.', 503);
  const authorization = String(req.headers.authorization || '');
  const match = authorization.match(/^(?:Bearer|Apikey)\s+(.+)$/i);
  const token = match?.[1]?.trim() || '';
  if (!token || !equalSignature(Buffer.from(token).toString('hex'), Buffer.from(env.PAYMENT_WEBHOOK_TOKEN).toString('hex'))) throw paymentError('Invalid bank callback authorization', 401);
  const data = req.body || {};
  const content = String(data.content || '').toUpperCase();
  const suppliedCode = String(data.code || '').toUpperCase();
  const referenceMatch = `${suppliedCode} ${content}`.match(/ALT-?[A-F0-9]{10,16}/);
  const ref = String(data.orderId || referenceMatch?.[0] || '').trim().toUpperCase();
  const transferType = String(data.transferType ?? data.transType ?? '').toUpperCase();
  const accountNumber = String(data.accountNumber ?? data.bankaccount ?? '');
  const amount = Number(data.transferAmount ?? data.amount);
  if (!['IN', 'C'].includes(transferType) || accountNumber !== String(env.BANK_ACCOUNT_NUMBER)) throw paymentError('Bank transaction does not match payment account or transaction type.');
  const transactionId = String(data.id ?? data.transactionid ?? data.referenceCode ?? data.referencenumber ?? '');
  if (!transactionId) throw paymentError('Transaction ID is required.');
  const normalizedData = { ...data, content, amount, transactionid: transactionId, referencenumber: transactionId, transactiontime: data.transactionDate ?? data.transactiontime };
  const membershipPayment = await Payment.findOne({ provider: 'VIETQR', paymentReference: ref });
  if (membershipPayment?.membershipOrderId) return require('./membership.service').bankWebhook(normalizedData, membershipPayment);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const payment = await Payment.findOne({ provider: 'VIETQR', paymentReference: ref }).session(session);
      if (!payment) throw paymentError('Payment reference not found', 404);
      if (payment.paymentStatus !== 'PENDING') return { duplicate: true };
      if (payment.expiresAt && payment.expiresAt <= new Date()) { await expireAttempt(payment, session); return { expired: true }; }
      if (amount !== payment.amount) throw paymentError('Bank transaction amount does not match payment.');
      if (!content.includes(payment.paymentReference.toUpperCase())) throw paymentError('Bank transfer content does not match payment reference.');
      const order = await Order.findById(payment.orderId).session(session);
      if (!order || order.status === 'CANCELLED' || order.paymentStatus !== 'PENDING' || order.paymentReference !== payment.paymentReference) return { stale: true };
      const updated = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'PAID', transactionId, paidAt: new Date(), providerResponse: { referenceNumber: data.referencenumber, transactionTime: data.transactiontime } } }, { new: true, session });
      if (!updated) return { duplicate: true };
      const changed = await Order.updateOne({ _id: order._id, paymentStatus: 'PENDING', status: { $ne: 'CANCELLED' }, paymentReference: payment.paymentReference }, { $set: { paymentStatus: 'PAID', paidAt: new Date(), status: order.status === 'PENDING' ? 'CONFIRMED' : order.status } }, { session });
      if (!changed.modifiedCount) throw paymentError('Order payment status changed while processing bank notification.', 409);
      await incrementPaidOrderDesignSales(order, session);
      return { duplicate: false };
    });
  } finally { await session.endSession(); }
};

module.exports = { assertConfigured, createPayment, transferDetails, createMomoRequest, getOrderPayment, initiateMomo, retryBankPayment, listAdminPayments, confirmPayment, rejectPayment, cancelOrderPayment, momoNotification, bankNotification };
