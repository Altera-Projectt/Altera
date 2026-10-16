const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const MarketplaceDesign = require('../models/MarketplaceDesign');
const DesignerProfile = require('../models/DesignerProfile');

const pagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildRevenueChart = (paymentsByDay, days, now = new Date()) => {
  const byDate = new Map(
    paymentsByDay.map((item) => [
      item._id,
      {
        revenue: Number(item.revenue || 0),
        apparelRevenue: Number(item.apparelRevenue || 0),
        membershipRevenue: Number(item.membershipRevenue || 0),
        transactions: Number(item.transactions || 0),
      },
    ])
  );

  if (days > 30) {
    const monthMap = new Map();
    for (let offset = 2; offset >= 0; offset -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      const ym = d.toISOString().slice(0, 7);
      const mm = ym.slice(5, 7);
      const yyyy = ym.slice(0, 4);
      monthMap.set(ym, {
        _id: ym,
        label: `Tháng ${mm}/${yyyy}`,
        revenue: 0,
        apparelRevenue: 0,
        membershipRevenue: 0,
        transactions: 0,
      });
    }
    for (const [dateStr, values] of byDate.entries()) {
      const ym = String(dateStr).slice(0, 7);
      if (!monthMap.has(ym)) {
        const mm = ym.slice(5, 7);
        const yyyy = ym.slice(0, 4);
        monthMap.set(ym, {
          _id: ym,
          label: `Tháng ${mm}/${yyyy}`,
          revenue: 0,
          apparelRevenue: 0,
          membershipRevenue: 0,
          transactions: 0,
        });
      }
      const bucket = monthMap.get(ym);
      bucket.revenue += values.revenue;
      bucket.apparelRevenue += values.apparelRevenue;
      bucket.membershipRevenue += values.membershipRevenue;
      bucket.transactions += values.transactions;
    }
    return [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, item]) => item);
  }

  const daily = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const dateKey = d.toISOString().slice(0, 10);
    const [, mm, dd] = dateKey.split('-');
    const found = byDate.get(dateKey);
    daily.push({
      _id: dateKey,
      label: `${dd}/${mm}`,
      revenue: found ? found.revenue : 0,
      apparelRevenue: found ? found.apparelRevenue : 0,
      membershipRevenue: found ? found.membershipRevenue : 0,
      transactions: found ? found.transactions : 0,
    });
  }
  return daily;
};

exports.dashboard = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 30, 1), 90);
    const now = new Date();
    const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0));
    const [totalCustomers, totalUsers, activeUsers, designerProfiles, designs, pendingDesigns, approvedDesigns,
      totalOrders, pendingOrders, activeProducts, paidPayments, membershipPayments, pendingPayments, failedPayments,
      recentOrders, recentDesigns, paymentsByDay] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      DesignerProfile.countDocuments(),
      MarketplaceDesign.countDocuments(),
      MarketplaceDesign.countDocuments({ status: 'PENDING_REVIEW' }),
      MarketplaceDesign.countDocuments({ status: 'PUBLISHED' }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['PENDING', 'CONFIRMED', 'SHIPPING'] } }),
      Product.countDocuments({ isActive: true }),
      Payment.aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] }, orderId: { $ne: null }, $or: [{ paidAt: { $gte: since } }, { paidAt: null, createdAt: { $gte: since } }] } },
        { $group: { _id: '$orderId', amount: { $max: '$amount' }, paidAt: { $max: { $ifNull: ['$paidAt', '$createdAt'] } } } },
      ]),
      Payment.aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] }, membershipOrderId: { $ne: null }, $or: [{ paidAt: { $gte: since } }, { paidAt: null, createdAt: { $gte: since } }] } },
        { $group: { _id: '$membershipOrderId', amount: { $max: '$amount' } } },
      ]),
      Payment.countDocuments({ paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }),
      Payment.countDocuments({ paymentStatus: 'FAILED' }),
      Order.find().select('_id createdAt totalPrice status paymentStatus userId').populate('userId', 'fullName email').sort({ createdAt: -1 }).limit(6).lean(),
      MarketplaceDesign.find({ status: 'PENDING_REVIEW' }).select('_id name thumbnail thumbnailUrl category price status createdAt designerId').populate('designerId', 'displayName username').sort({ createdAt: 1 }).limit(6).lean(),
      Payment.aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] }, $or: [{ orderId: { $ne: null } }, { membershipOrderId: { $ne: null } }], $and: [{ $or: [{ paidAt: { $gte: since } }, { paidAt: null, createdAt: { $gte: since } }] }] } },
        { $group: { _id: { type: { $cond: [{ $ne: ['$orderId', null] }, 'ORDER', 'MEMBERSHIP'] }, entityId: { $ifNull: ['$orderId', '$membershipOrderId'] } }, amount: { $max: '$amount' }, paidAt: { $max: { $ifNull: ['$paidAt', '$createdAt'] } } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
            revenue: { $sum: '$amount' },
            apparelRevenue: { $sum: { $cond: [{ $eq: ['$_id.type', 'ORDER'] }, '$amount', 0] } },
            membershipRevenue: { $sum: { $cond: [{ $eq: ['$_id.type', 'MEMBERSHIP'] }, '$amount', 0] } },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);
    const apparelRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const membershipRevenue = membershipPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const revenue = apparelRevenue + membershipRevenue;
    const revenueChart = buildRevenueChart(paymentsByDay, days, now);
    res.json({ success: true, data: {
      totalCustomers, totalUsers, activeUsers,
      designerProfiles, designs, pendingDesigns, approvedDesigns, totalOrders,
      pendingOrders, activeProducts, paidTransactions: paidPayments.length + membershipPayments.length,
      pendingPayments, failedPayments, revenue, apparelRevenue, membershipRevenue,
      recentOrders, recentDesigns, revenueByDay: paymentsByDay, revenueChart,
      filters: { days, since: since.toISOString() },
    } });
  } catch (error) { next(error); }
};

exports.listDesigns = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    const statuses = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
    if (req.query.status && !statuses.includes(req.query.status)) return res.status(400).json({ success: false, message: 'Invalid design status.' });
    if (req.query.status) query.status = req.query.status;
    if (req.query.userId && !validId(req.query.userId)) return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const profiles = await DesignerProfile.find({ displayName: { $regex: search, $options: 'i' } }).select('_id');
      const users = await User.find({ fullName: { $regex: search, $options: 'i' } }).select('_id');
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { designerId: { $in: profiles.map((profile) => profile._id) } },
        { userId: { $in: users.map((user) => user._id) } },
      ];
    }
    const [designs, total] = await Promise.all([
      MarketplaceDesign.find(query).populate('designerId', 'displayName username').populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MarketplaceDesign.countDocuments(query),
    ]);
    res.json({ success: true, data: { designs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    if (req.query.role && ['USER', 'ADMIN'].includes(req.query.role)) query.role = req.query.role;
    if (req.query.status === 'active') query.isActive = { $ne: false };
    if (req.query.status === 'inactive') query.isActive = false;
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    }
    const [users, total] = await Promise.all([User.find(query).select('fullName email phone role isActive avatar createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(query)]);
    res.json({ success: true, data: { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.getUser = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'ADMIN' && (req.body.role === 'USER' || req.body.isActive === false)) return res.status(403).json({ success: false, message: 'Admin accounts cannot be demoted or deactivated here.' });
    if (String(user._id) === String(req.user._id) && req.body.isActive === false) return res.status(403).json({ success: false, message: 'You cannot deactivate your own account.' });
    if (user.role === 'ADMIN' && req.body.isActive === false && await User.countDocuments({ role: 'ADMIN', isActive: { $ne: false } }) <= 1) return res.status(409).json({ success: false, message: 'The last active admin cannot be deactivated.' });
    const allowed = ['fullName', 'phone', 'isActive'];
    if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    if (req.body.fullName !== undefined && (typeof req.body.fullName !== 'string' || req.body.fullName.trim().length < 1 || req.body.fullName.length > 120)) return res.status(400).json({ success: false, message: 'fullName must be between 1 and 120 characters.' });
    for (const field of allowed) if (req.body[field] !== undefined) user[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    await user.save();
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

exports.listProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    if (req.query.search) query.name = { $regex: String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (req.query.status === 'active') query.isActive = true;
    if (req.query.status === 'inactive') query.isActive = false;
    const [products, total] = await Promise.all([Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit), Product.countDocuments(query)]);
    res.json({ success: true, data: { products, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};
