const service = require('../services/membership.service');
exports.plans = async (_req, res, next) => { try { res.json({ success: true, data: { plans: await service.listPlans() } }); } catch (e) { next(e); } };
exports.current = async (req, res, next) => { try { res.json({ success: true, data: { membership: await service.current(req.user._id) } }); } catch (e) { next(e); } };
exports.checkout = async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.checkout(req.user._id, req.body, req.ip) }); } catch (e) { next(e); } };
exports.history = async (req, res, next) => { try { res.json({ success: true, data: { payments: await service.history(req.user._id) } }); } catch (e) { next(e); } };
exports.result = async (req, res, next) => { try { res.json({ success: true, data: await service.result(req.params.reference, req.user._id) }); } catch (e) { next(e); } };
exports.vnpayReturn = async (req, res) => { try { const result = await service.vnpayReturn(req.query); res.redirect(`${require('../config/env').FRONTEND_URL}/payment/${result.failed || result.expired ? 'failed' : 'success'}?reference=${encodeURIComponent(req.query.vnp_TxnRef)}`); } catch (_) { res.redirect(`${require('../config/env').FRONTEND_URL}/payment/failed`); } };
exports.vnpayIpn = async (req, res) => { try { res.json(await service.vnpayIpn(req.query)); } catch (e) { res.json({ RspCode: e.statusCode === 404 ? '01' : e.message.includes('amount') ? '04' : '97', Message: e.message }); } };
exports.momoIpn = async (req, res) => { try { await service.momoIpn(req.body); res.status(204).end(); } catch (e) { res.status(e.statusCode || 400).json({ success: false, message: e.message }); } };
exports.adminList = async (req, res, next) => {
  try {
    const MembershipOrder = require('../models/MembershipOrder'); const User = require('../models/User'); const mongoose = require('mongoose');
    const allowedStatuses = ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'];
    if (req.query.status && !allowedStatuses.includes(req.query.status)) return res.status(400).json({ success: false, message: 'Invalid membership payment status.' });
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1); const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100); const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.from || req.query.to) {
      const from = req.query.from ? new Date(req.query.from) : null; const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : null;
      if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return res.status(400).json({ success: false, message: 'Invalid date filter.' });
      query.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    }
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const users = await User.find({ $or: [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }).select('_id').lean();
      query.$or = [{ paymentReference: { $regex: search, $options: 'i' } }, { transactionId: { $regex: search, $options: 'i' } }, { userId: { $in: users.map((user) => user._id) } }, ...(mongoose.Types.ObjectId.isValid(search) ? [{ _id: search }] : [])];
    }
    const [payments, total] = await Promise.all([
      MembershipOrder.find(query).populate('userId','fullName email').populate('membershipPlanId','code name').sort({createdAt:-1}).skip((page - 1) * limit).limit(limit).lean(),
      MembershipOrder.countDocuments(query),
    ]);
    res.json({ success: true, data: { payments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch(e) { next(e); }
};
exports.adminVerify = async (req, res, next) => {
  try {
    if (!['verify', 'reject'].includes(req.body.action)) return res.status(400).json({ success: false, message: 'Invalid membership payment action.' });
    if (req.body.action === 'reject' && (typeof req.body.reason !== 'string' || !req.body.reason.trim() || req.body.reason.trim().length > 300)) return res.status(400).json({ success: false, message: 'A rejection reason of at most 300 characters is required.' });
    const data = await service.verifyBank(req.params.id, req.user._id, req.body.action === 'verify', req.body.reason);
    res.json({ success: true, data });
  } catch(e) { next(e); }
};
