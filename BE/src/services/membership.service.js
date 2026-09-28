const crypto = require('crypto');
const mongoose = require('mongoose');
const MembershipPlan = require('../models/MembershipPlan');
const MembershipOrder = require('../models/MembershipOrder');
const Payment = require('../models/Payment');
const User = require('../models/User');
const env = require('../config/env');

const plans = [
  { code: 'BASIC', name: 'BASIC', price: 0, billingCycle: 'FREE', description: 'Quyền lợi cơ bản', features: ['Thiết kế cơ bản', 'Lưu các thiết kế yêu thích'] },
  { code: 'PREMIUM', name: 'PREMIUM', price: 59000, billingCycle: 'MONTHLY', description: 'Quyền lợi nâng cao', features: ['Thiết kế nâng cao', 'AI Design', 'Nhiều thiết kế hơn', 'Ưu tiên tính năng mới'] },
  { code: 'PRO_STUDIO', name: 'PRO STUDIO', price: 99000, billingCycle: 'MONTHLY', description: 'Dành cho Designer / Creator', features: ['Tất cả quyền lợi Premium', 'Công cụ sáng tạo chuyên nghiệp', 'Ưu tiên hỗ trợ', 'Truy cập sớm tính năng mới'] },
];
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const reference = () => `ALT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const formatDate = (date) => { const d = new Date(date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; };
const addCycle = (date, cycle) => { const result = new Date(date); if (cycle === 'YEARLY') result.setFullYear(result.getFullYear()+1); else result.setMonth(result.getMonth()+1); return result; };

async function listPlans() {
  for (const plan of plans) await MembershipPlan.updateOne({ code: plan.code }, { $setOnInsert: plan }, { upsert: true });
  return MembershipPlan.find({ isActive: true }).sort({ price: 1 }).lean();
}
async function current(userId) {
  await listPlans();
  const user = await User.findById(userId).populate('membershipPlanId').select('membershipPlanId membershipStatus membershipStartDate membershipEndDate membershipAutoRenew');
  if (!user) throw fail('User not found.', 404);
  if (!user.membershipPlanId) {
    const basic = await MembershipPlan.findOne({ code: 'BASIC' });
    user.membershipPlanId = basic._id; user.membershipStatus = 'ACTIVE'; user.membershipStartDate = user.membershipStartDate || user.createdAt || new Date();
    await user.save(); await user.populate('membershipPlanId');
  }
  if (user.membershipStatus === 'ACTIVE' && user.membershipEndDate && user.membershipEndDate < new Date()) {
    user.membershipStatus = 'EXPIRED'; await user.save();
  }
  return user;
}
async function activateFree(user, plan) {
  user.membershipPlanId = plan._id; user.membershipStatus = 'ACTIVE'; user.membershipStartDate = new Date(); user.membershipEndDate = null; user.membershipAutoRenew = false;
  await user.save(); return user;
}
function signedVnpay(params, secret) {
  const query = Object.keys(params).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`).join('&');
  return crypto.createHmac('sha512', secret).update(query).digest('hex');
}
function vnpDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date).replace(/\D/g, '');
}
async function checkout(userId, body, clientIp = '127.0.0.1') {
  const plan = await MembershipPlan.findOne({ code: body.planCode, isActive: true });
  if (!plan) throw fail('Invalid membership plan.', 404);
  const user = await User.findById(userId);
  if (!user) throw fail('User not found.', 404);
  const fullName = String(body.fullName || user.fullName).trim(); const email = String(body.email || user.email).trim().toLowerCase(); const phone = String(body.phone || user.phone || '').trim();
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !phone) throw fail('Please provide a valid name, email and phone number.');
  if (user.membershipStatus === 'ACTIVE' && user.membershipPlanId?.toString() === plan._id.toString() && user.membershipEndDate > new Date()) throw fail('You already have this active membership.', 409);
  const existing = await MembershipOrder.findOne({ userId, membershipPlanId: plan._id, status: 'PENDING', expiresAt: { $gt: new Date() } });
  if (existing) throw fail(`A payment is already pending for this plan. Reference: ${existing.paymentReference}`, 409);
  if (plan.price === 0) return { free: true, membership: await activateFree(user, plan) };
  const method = body.paymentMethod;
  if (!['VNPAY', 'MOMO', 'BANK_TRANSFER'].includes(method)) throw fail('Invalid payment method.');
  if (method === 'BANK_TRANSFER' && !(env.BANK_CODE && env.BANK_ACCOUNT_NUMBER && env.BANK_ACCOUNT_NAME)) throw fail('Bank transfer is not configured.', 503);
  if (method === 'MOMO' && !(env.MOMO_PARTNER_CODE && env.MOMO_ACCESS_KEY && env.MOMO_SECRET_KEY && env.MOMO_IPN_URL)) throw fail('MoMo is not configured.', 503);
  if (method === 'MOMO' && env.NODE_ENV === 'production' && (env.PAYMENT_ENV !== 'production' || env.MOMO_ENDPOINT.includes('test-payment.momo.vn'))) throw fail('MoMo production credentials and endpoint are required.', 503);
  if (method === 'VNPAY' && !(env.VNPAY_TMN_CODE && env.VNPAY_HASH_SECRET && env.VNPAY_URL && env.VNPAY_RETURN_URL && env.VNPAY_IPN_URL)) throw fail('VNPay is not configured.', 503);
  if (method === 'VNPAY' && env.NODE_ENV === 'production' && (env.VNPAY_URL.includes('sandbox') || env.PAYMENT_ENV !== 'production')) throw fail('VNPay production credentials and endpoint are required.', 503);
  const ref = reference(); const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const order = await MembershipOrder.create({ userId, membershipPlanId: plan._id, fullName, email, phone, amount: plan.price, paymentMethod: method, paymentReference: ref, expiresAt });
  const payment = await Payment.create({ membershipOrderId: order._id, membershipPlanId: plan._id, userId, paymentMethod: method, paymentStatus: 'PENDING', amount: plan.price, currency: plan.currency, paymentReference: ref, provider: method === 'BANK_TRANSFER' ? 'VIETQR' : method, providerOrderId: ref, expiresAt });
  let paymentUrl = null; let transfer = null;
  if (method === 'BANK_TRANSFER') {
    if (!(env.BANK_CODE && env.BANK_ACCOUNT_NUMBER && env.BANK_ACCOUNT_NAME)) throw fail('Bank transfer is not configured.', 503);
    transfer = { bankName: env.BANK_NAME || env.BANK_CODE, accountNumber: env.BANK_ACCOUNT_NUMBER, accountName: env.BANK_ACCOUNT_NAME, amount: plan.price, paymentReference: ref, paymentContent: `ALTERA ${plan.code} ${ref}`, qrCodeUrl: `https://img.vietqr.io/image/${encodeURIComponent(env.BANK_CODE)}-${encodeURIComponent(env.BANK_ACCOUNT_NUMBER)}-compact2.png?amount=${plan.price}&addInfo=${encodeURIComponent(ref)}&accountName=${encodeURIComponent(env.BANK_ACCOUNT_NAME)}` };
  } else if (method === 'MOMO') {
    if (!(env.MOMO_PARTNER_CODE && env.MOMO_ACCESS_KEY && env.MOMO_SECRET_KEY && env.MOMO_IPN_URL)) throw fail('MoMo is not configured.', 503);
    const requestId = ref; const orderInfo = `ALTERA ${plan.name}`; const redirectUrl = `${env.FRONTEND_URL}/payment/pending?reference=${ref}`; const extraData = '';
    const data = `accessKey=${env.MOMO_ACCESS_KEY}&amount=${plan.price}&extraData=${extraData}&ipnUrl=${env.MOMO_IPN_URL}&orderId=${ref}&orderInfo=${orderInfo}&partnerCode=${env.MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
    const response = await fetch(env.MOMO_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ partnerCode: env.MOMO_PARTNER_CODE, requestId, amount: plan.price, orderId: ref, orderInfo, redirectUrl, ipnUrl: env.MOMO_IPN_URL, requestType: 'captureWallet', extraData, lang: 'vi', signature: crypto.createHmac('sha256', env.MOMO_SECRET_KEY).update(data).digest('hex') }), signal: AbortSignal.timeout(25000) });
    const dataResult = await response.json(); if (!response.ok || dataResult.resultCode !== 0 || !dataResult.payUrl) throw fail('Could not start MoMo payment.', 502); paymentUrl = dataResult.payUrl;
  } else {
    if (!(env.VNPAY_TMN_CODE && env.VNPAY_HASH_SECRET && env.VNPAY_URL && env.VNPAY_RETURN_URL)) throw fail('VNPay is not configured.', 503);
    const now = new Date(); const expires = new Date(now.getTime() + 15 * 60 * 1000);
    const params = { vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: env.VNPAY_TMN_CODE, vnp_Amount: String(plan.price * 100), vnp_CurrCode: 'VND', vnp_TxnRef: ref, vnp_OrderInfo: `ALTERA ${plan.name}`, vnp_OrderType: 'other', vnp_Locale: 'vn', vnp_ReturnUrl: env.VNPAY_RETURN_URL, vnp_IpAddr: clientIp, vnp_CreateDate: vnpDate(now), vnp_ExpireDate: vnpDate(expires) };
    paymentUrl = `${env.VNPAY_URL}?${Object.keys(params).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')}&vnp_SecureHash=${signedVnpay(params, env.VNPAY_HASH_SECRET)}`;
  }
  await Payment.updateOne({ _id: payment._id }, { $set: { paymentStatus: 'PROCESSING' } });
  return { orderId: order._id, paymentId: payment._id, paymentUrl, transfer, paymentReference: ref, status: 'PENDING' };
}
async function settle(order, payment, adminId, transactionId) {
  if (payment.paymentStatus === 'PAID' || payment.paymentStatus === 'SUCCESS') return { duplicate: true };
  if (payment.paymentStatus !== 'PENDING' && payment.paymentStatus !== 'PROCESSING') throw fail('Payment is no longer pending.', 409);
  if (order.expiresAt && order.expiresAt <= new Date()) {
    await Promise.all([
      Payment.updateOne({ _id: payment._id, paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }, { $set: { paymentStatus: 'EXPIRED' } }),
      MembershipOrder.updateOne({ _id: order._id, status: 'PENDING' }, { $set: { status: 'EXPIRED' } }),
    ]);
    return { expired: true };
  }
  const session = await mongoose.startSession();
  try { return await session.withTransaction(async () => {
    const now = new Date();
    const p = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }, { $set: { paymentStatus: 'SUCCESS', transactionId: transactionId || null, providerTransactionId: transactionId || null, paidAt: now, ...(adminId ? { 'metadata.verifiedBy': adminId } : {}) } }, { new: true, session });
    if (!p) return { duplicate: true };
    const orderUpdate = await MembershipOrder.updateOne({ _id: order._id, status: 'PENDING' }, { $set: { status: 'SUCCESS', paidAt: now, transactionId: transactionId || null, ...(adminId ? { verifiedBy: adminId, verifiedAt: now } : {}) } }, { session });
    if (!orderUpdate.modifiedCount) throw fail('Membership order was already processed.', 409);
    const user = await User.findById(order.userId).session(session);
    const plan = await MembershipPlan.findById(order.membershipPlanId).session(session);
    const start = user.membershipStatus === 'ACTIVE' && user.membershipEndDate > now ? user.membershipEndDate : now;
    user.membershipPlanId = plan._id; user.membershipStatus = 'ACTIVE'; user.membershipStartDate = now; user.membershipEndDate = addCycle(start, plan.billingCycle); user.membershipAutoRenew = false;
    await user.save({ session }); return { payment: p, membership: user };
  }); } finally { await session.endSession(); }
}
async function vnpayReturn(query) {
  const params = { ...query }; const hash = params.vnp_SecureHash; delete params.vnp_SecureHash; delete params.vnp_SecureHashType;
  const expected = env.VNPAY_HASH_SECRET ? signedVnpay(params, env.VNPAY_HASH_SECRET) : '';
  const actualBytes = Buffer.from(String(hash || ''), 'hex'); const expectedBytes = Buffer.from(expected, 'hex');
  if (!hash || !env.VNPAY_HASH_SECRET || params.vnp_TmnCode !== env.VNPAY_TMN_CODE || actualBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(actualBytes, expectedBytes)) throw fail('Invalid VNPay signature.', 401);
  const order = await MembershipOrder.findOne({ paymentReference: params.vnp_TxnRef }); const payment = await Payment.findOne({ paymentReference: params.vnp_TxnRef, paymentMethod: 'VNPAY' });
  if (!order || !payment) throw fail('Payment reference not found.', 404);
  if (Number(params.vnp_Amount) !== payment.amount * 100) throw fail('Payment amount mismatch.');
  if (params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00') return settle(order, payment, null, params.vnp_TransactionNo);
  await Payment.updateOne({ _id: payment._id, paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }, { $set: { paymentStatus: 'FAILED', failureReason: 'VNPay payment failed or was cancelled.' } });
  await MembershipOrder.updateOne({ _id: order._id, status: 'PENDING' }, { $set: { status: 'FAILED' } }); return { failed: true };
}
async function vnpayIpn(query) {
  const result = await vnpayReturn(query);
  return result.failed ? { RspCode: '00', Message: 'Payment failed recorded' } : { RspCode: '00', Message: 'Confirm Success' };
}
async function momoIpn(body) {
  const data = `accessKey=${env.MOMO_ACCESS_KEY}&amount=${body.amount}&extraData=${body.extraData || ''}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;
  const signature = crypto.createHmac('sha256', env.MOMO_SECRET_KEY).update(data).digest('hex');
  if (body.partnerCode !== env.MOMO_PARTNER_CODE || signature !== body.signature) throw fail('Invalid MoMo signature.', 401);
  const order = await MembershipOrder.findOne({ paymentReference: body.orderId }); const payment = await Payment.findOne({ paymentReference: body.orderId, paymentMethod: 'MOMO' });
  if (!order || !payment) throw fail('Payment reference not found.', 404);
  if (Number(body.amount) !== payment.amount) throw fail('Payment amount mismatch.');
  if (Number(body.resultCode) === 0) return settle(order, payment, null, String(body.transId));
  await Payment.updateOne({ _id: payment._id, paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }, { $set: { paymentStatus: 'FAILED', failureReason: 'MoMo payment failed.' } }); await MembershipOrder.updateOne({ _id: order._id, status: 'PENDING' }, { $set: { status: 'FAILED' } }); return { failed: true };
}
async function verifyBank(orderId, adminId, approved, reason) {
  const order = await MembershipOrder.findById(orderId); if (!order || order.paymentMethod !== 'BANK_TRANSFER') throw fail('Bank transfer payment not found.', 404);
  const payment = await Payment.findOne({ membershipOrderId: order._id }); if (!payment) throw fail('Payment not found.', 404);
  if (order.expiresAt && order.expiresAt <= new Date()) throw fail('This bank transfer request has expired.', 409);
  if (approved) return settle(order, payment, adminId, order.transactionId);
  if (order.status !== 'PENDING' || !['PENDING','PROCESSING'].includes(payment.paymentStatus)) throw fail('Payment is no longer pending.', 409);
  order.status = 'FAILED'; order.verifiedBy = adminId; order.verifiedAt = new Date(); order.rejectionReason = String(reason || 'Rejected by administrator').slice(0,300); await order.save(); payment.paymentStatus = 'FAILED'; payment.failureReason = order.rejectionReason; await payment.save(); return { order, payment };
}
async function bankWebhook(data, payment) {
  const order = await MembershipOrder.findById(payment.membershipOrderId);
  if (!order || order.status !== 'PENDING') return { duplicate: true };
  if (Number(data.amount) !== payment.amount || !String(data.content || '').toUpperCase().includes(payment.paymentReference.toUpperCase())) throw fail('Bank payment amount or reference does not match.');
  return settle(order, payment, null, String(data.transactionid || data.referencenumber));
}
async function history(userId) { return MembershipOrder.find({ userId }).populate('membershipPlanId', 'code name').sort({ createdAt: -1 }).lean(); }
async function expireMemberships() {
  const now = new Date();
  const [memberships, expiredOrders] = await Promise.all([
    User.updateMany({ membershipStatus: 'ACTIVE', membershipEndDate: { $ne: null, $lte: now } }, { $set: { membershipStatus: 'EXPIRED' } }),
    MembershipOrder.find({ status: 'PENDING', expiresAt: { $lte: now } }).select('_id').lean(),
  ]);
  if (expiredOrders.length) {
    const ids = expiredOrders.map((item) => item._id);
    await Promise.all([MembershipOrder.updateMany({ _id: { $in: ids }, status: 'PENDING' }, { $set: { status: 'EXPIRED' } }), Payment.updateMany({ membershipOrderId: { $in: ids }, paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }, { $set: { paymentStatus: 'EXPIRED' } })]);
  }
  return memberships;
}
async function result(referenceValue, userId) {
  let order = await MembershipOrder.findOne({ paymentReference: referenceValue, userId }).populate('membershipPlanId', 'code name billingCycle');
  if (!order) throw fail('Payment not found.',404);
  let payment = await Payment.findOne({ membershipOrderId: order._id });
  if (order.status === 'PENDING' && order.expiresAt && order.expiresAt <= new Date()) {
    await MembershipOrder.updateOne({ _id: order._id, status: 'PENDING' }, { $set: { status: 'EXPIRED' } });
    await Payment.updateOne({ _id: payment._id, paymentStatus: { $in: ['PENDING','PROCESSING'] } }, { $set: { paymentStatus: 'EXPIRED' } });
    order.status = 'EXPIRED'; payment.paymentStatus = 'EXPIRED';
  }
  const user = await User.findById(userId).select('membershipStatus membershipPlanId membershipEndDate');
  return { order, payment, membership: user };
}
module.exports = { listPlans, current, checkout, vnpayReturn, vnpayIpn, momoIpn, verifyBank, bankWebhook, history, result, formatDate, expireMemberships };
