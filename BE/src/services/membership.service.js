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
const reference = () => `ALT${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
const formatDate = (date) => { const d = new Date(date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; };
const addCycle = (date, cycle) => { const result = new Date(date); if (cycle === 'YEARLY') result.setFullYear(result.getFullYear()+1); else result.setMonth(result.getMonth()+1); return result; };

function getBankConfig() {
  return {
    bankCode: env.BANK_CODE || 'MB',
    bankName: env.BANK_NAME || env.BANK_CODE || 'MBBank',
    accountNumber: env.BANK_ACCOUNT_NUMBER || '0384431663',
    accountName: env.BANK_ACCOUNT_NAME || 'HUYNH ANH KHOI',
  };
}

function buildBankTransfer(plan, ref) {
  const bank = getBankConfig();
  const paymentContent = `ALTERA ${plan.code === 'PRO_STUDIO' ? 'PRO' : plan.code} ${ref}`;
  const qrCodeUrl = `https://img.vietqr.io/image/${encodeURIComponent(bank.bankCode)}-${encodeURIComponent(bank.accountNumber)}-compact2.png?amount=${plan.price}&addInfo=${encodeURIComponent(paymentContent)}&accountName=${encodeURIComponent(bank.accountName)}`;
  return {
    bankCode: bank.bankCode,
    bankName: bank.bankName,
    accountNumber: bank.accountNumber,
    accountName: bank.accountName,
    amount: plan.price,
    paymentReference: ref,
    paymentContent,
    qrCodeUrl,
  };
}

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
  await listPlans();
  const requestedCode = body.planCode === 'PRO' ? 'PRO_STUDIO' : body.planCode;
  const plan = await MembershipPlan.findOne({ code: requestedCode, isActive: true });
  if (!plan) throw fail('Invalid membership plan.', 404);
  const user = await User.findById(userId);
  if (!user) throw fail('User not found.', 404);
  const fullName = String(body.fullName || user.fullName || 'Hội viên ALTERA').trim();
  const email = String(body.email || user.email || '').trim().toLowerCase();
  const phone = String(body.phone || user.phone || '0900000000').trim();
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !phone) throw fail('Please provide a valid name, email and phone number.');
  if (plan.price === 0) return { free: true, membership: await activateFree(user, plan) };
  const method = body.paymentMethod || 'BANK_TRANSFER';
  if (!['VNPAY', 'MOMO', 'BANK_TRANSFER'].includes(method)) throw fail('Invalid payment method.');
  const existing = await MembershipOrder.findOne({ userId, membershipPlanId: plan._id, status: 'PENDING', expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (existing) {
    if (method === 'BANK_TRANSFER') {
      const existingPayment = await Payment.findOne({ membershipOrderId: existing._id });
      return {
        orderId: existing._id,
        paymentId: existingPayment?._id || null,
        paymentUrl: null,
        transfer: buildBankTransfer(plan, existing.paymentReference),
        paymentReference: existing.paymentReference,
        status: 'PENDING',
      };
    }
    throw fail(`A payment is already pending for this plan. Reference: ${existing.paymentReference}`, 409);
  }
  if (method !== 'BANK_TRANSFER' && user.membershipStatus === 'ACTIVE' && user.membershipPlanId?.toString() === plan._id.toString() && user.membershipEndDate > new Date()) {
    throw fail('You already have this active membership.', 409);
  }
  if (method === 'MOMO' && !(env.MOMO_PARTNER_CODE && env.MOMO_ACCESS_KEY && env.MOMO_SECRET_KEY && env.MOMO_IPN_URL)) throw fail('MoMo is not configured.', 503);
  if (method === 'MOMO' && env.NODE_ENV === 'production' && (env.PAYMENT_ENV !== 'production' || env.MOMO_ENDPOINT.includes('test-payment.momo.vn'))) throw fail('MoMo production credentials and endpoint are required.', 503);
  if (method === 'VNPAY' && !(env.VNPAY_TMN_CODE && env.VNPAY_HASH_SECRET && env.VNPAY_URL && env.VNPAY_RETURN_URL && env.VNPAY_IPN_URL)) throw fail('VNPay is not configured.', 503);
  if (method === 'VNPAY' && env.NODE_ENV === 'production' && (env.VNPAY_URL.includes('sandbox') || env.PAYMENT_ENV !== 'production')) throw fail('VNPay production credentials and endpoint are required.', 503);
  const ref = reference(); const expiresAt = new Date(Date.now() + (method === 'BANK_TRANSFER' ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000));
  const order = await MembershipOrder.create({ userId, membershipPlanId: plan._id, fullName, email, phone, amount: plan.price, paymentMethod: method, paymentReference: ref, expiresAt });
  const payment = await Payment.create({ membershipOrderId: order._id, membershipPlanId: plan._id, userId, paymentMethod: method, paymentStatus: 'PENDING', amount: plan.price, currency: plan.currency, paymentReference: ref, provider: method === 'BANK_TRANSFER' ? 'VIETQR' : method, providerOrderId: ref, expiresAt });
  let paymentUrl = null; let transfer = null;
  if (method === 'BANK_TRANSFER') {
    transfer = buildBankTransfer(plan, ref);
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
    const endDate = addCycle(start, plan.billingCycle);
    const normalizedTier = plan.code === 'PRO_STUDIO' || plan.code === 'PRO' ? 'PRO' : plan.code === 'PREMIUM' ? 'PREMIUM' : 'FREE';
    user.membershipPlanId = plan._id;
    user.membershipStatus = 'ACTIVE';
    user.membershipStartDate = now;
    user.membershipEndDate = endDate;
    user.membershipTier = normalizedTier;
    user.membershipStartedAt = now;
    user.membershipExpiresAt = endDate;
    user.membershipAutoRenew = false;
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
  if (order.status !== 'PENDING') throw fail('Payment is no longer pending.', 409);
  if (order.expiresAt && order.expiresAt <= new Date()) {
    await Promise.all([
      MembershipOrder.updateOne({ _id: order._id, status: 'PENDING' }, { $set: { status: 'EXPIRED' } }),
      Payment.updateOne({ _id: payment._id, paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }, { $set: { paymentStatus: 'EXPIRED' } }),
    ]);
    throw fail('This bank transfer request has expired.', 409);
  }
  if (approved) return settle(order, payment, adminId, order.transactionId);
  if (order.status !== 'PENDING' || !['PENDING','PROCESSING'].includes(payment.paymentStatus)) throw fail('Payment is no longer pending.', 409);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const now = new Date(); const rejectionReason = String(reason).trim().slice(0, 300);
      const updatedOrder = await MembershipOrder.findOneAndUpdate(
        { _id: order._id, status: 'PENDING' },
        { $set: { status: 'FAILED', verifiedBy: adminId, verifiedAt: now, rejectionReason } },
        { new: true, session },
      );
      if (!updatedOrder) throw fail('Membership order was already processed.', 409);
      const updatedPayment = await Payment.findOneAndUpdate(
        { _id: payment._id, paymentStatus: { $in: ['PENDING', 'PROCESSING'] } },
        { $set: { paymentStatus: 'FAILED', failureReason: rejectionReason } },
        { new: true, session },
      );
      if (!updatedPayment) throw fail('Payment was already processed.', 409);
      return { order: updatedOrder, payment: updatedPayment };
    });
  } finally { await session.endSession(); }
}
async function bankWebhook(data, payment) {
  const order = await MembershipOrder.findById(payment.membershipOrderId);
  if (!order || order.status !== 'PENDING') return { duplicate: true };
  const cleanContent = String(data.content || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanRef = String(payment.paymentReference || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (Number(data.transferAmount ?? data.amount) !== payment.amount || !cleanContent.includes(cleanRef)) throw fail('Bank payment amount or reference does not match.');
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

async function upgrade(userId, body = {}) {
  const { enrichUserResponse } = require('../utils/membership');
  const rawTier = String(body.tier || '').toUpperCase();
  const normalizedTier = rawTier === 'PRO_STUDIO' || rawTier === 'PRO' ? 'PRO' : rawTier === 'PREMIUM' ? 'PREMIUM' : null;
  if (!normalizedTier) {
    throw fail('Gói hội viên không hợp lệ. Vui lòng chọn PREMIUM hoặc PRO.', 400);
  }

  await listPlans();
  const planCode = normalizedTier === 'PRO' ? 'PRO_STUDIO' : 'PREMIUM';
  const plan = await MembershipPlan.findOne({ code: planCode });

  const user = await User.findById(userId);
  if (!user) throw fail('Không tìm thấy tài khoản người dùng.', 404);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const amount = normalizedTier === 'PRO' ? 99000 : 59000;
  const ref = reference();

  if (plan) {
    user.membershipPlanId = plan._id;
    const pendingQuery = body.paymentReference
      ? { userId: user._id, paymentReference: body.paymentReference, status: 'PENDING' }
      : { userId: user._id, membershipPlanId: plan._id, status: 'PENDING' };
    const existingOrder = await MembershipOrder.findOne(pendingQuery).sort({ createdAt: -1 });
    if (existingOrder) {
      await MembershipOrder.updateOne(
        { _id: existingOrder._id },
        { $set: { status: 'SUCCESS', paidAt: now, expiresAt } }
      );
      await Payment.updateOne(
        { membershipOrderId: existingOrder._id },
        { $set: { paymentStatus: 'SUCCESS', paidAt: now, expiresAt } }
      );
    } else {
      const memOrder = await MembershipOrder.create({
        userId: user._id,
        membershipPlanId: plan._id,
        fullName: user.fullName || 'Hội viên ALTERA',
        email: user.email,
        phone: user.phone || '0900000000',
        amount,
        paymentMethod: body.paymentMethod || 'BANK_TRANSFER',
        paymentReference: ref,
        status: 'SUCCESS',
        paidAt: now,
        expiresAt,
      });
      await Payment.create({
        membershipOrderId: memOrder._id,
        membershipPlanId: plan._id,
        userId: user._id,
        paymentMethod: body.paymentMethod || 'BANK_TRANSFER',
        paymentStatus: 'SUCCESS',
        amount,
        currency: 'VND',
        paymentReference: ref,
        provider: 'VIETQR',
        providerOrderId: ref,
        paidAt: now,
        expiresAt,
      });
    }
  }

  user.membershipTier = normalizedTier;
  user.membershipStartedAt = now;
  user.membershipExpiresAt = expiresAt;
  user.membershipStatus = 'ACTIVE';
  user.membershipStartDate = now;
  user.membershipEndDate = expiresAt;
  await user.save();

  const enrichedUser = await enrichUserResponse(user);
  return { user: enrichedUser };
}

module.exports = { listPlans, getBankConfig, current, checkout, upgrade, vnpayReturn, vnpayIpn, momoIpn, verifyBank, bankWebhook, history, result, formatDate, expireMemberships };
