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

exports.dashboard = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 30, 1), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } }, revenue: { $sum: '$amount' }, transactions: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    const apparelRevenue = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const membershipRevenue = membershipPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const revenue = apparelRevenue + membershipRevenue;
    res.json({ success: true, data: {
      totalCustomers, totalUsers, activeUsers,
      designerProfiles, designs, pendingDesigns, approvedDesigns, totalOrders,
      pendingOrders, activeProducts, paidTransactions: paidPayments.length + membershipPayments.length,
      pendingPayments, failedPayments, revenue, apparelRevenue, membershipRevenue,
      recentOrders, recentDesigns, revenueByDay: paymentsByDay,
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

exports.getCustomer = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    const user = await User.findOne({ _id: req.params.id, role: 'USER' }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });
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

exports.listOrders = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    if (req.query.status && ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.paymentStatus) {
      if (!['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(req.query.paymentStatus)) return res.status(400).json({ success: false, message: 'Invalid payment status.' });
      query.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.from || req.query.to) {
      const from = req.query.from ? new Date(req.query.from) : null;
      const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : null;
      if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return res.status(400).json({ success: false, message: 'Invalid date filter.' });
      query.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    }
    if (req.query.search) {
      const search = String(req.query.search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const users = await User.find({ $or: [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }).select('_id');
      const clauses = [...(validId(search) ? [{ _id: search }] : []), { userId: { $in: users.map((u) => u._id) } }];
      query.$or = clauses;
    }
    const [orders, total] = await Promise.all([Order.find(query).populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(query)]);
    const payments = await Payment.find({ orderId: { $in: orders.map((order) => order._id) } }).sort({ createdAt: -1 }).lean();
    const latestPayment = new Map();
    for (const payment of payments) if (!latestPayment.has(String(payment.orderId))) latestPayment.set(String(payment.orderId), payment);
    res.json({ success: true, data: { orders: orders.map((order) => { const payment = latestPayment.get(String(order._id)); return { ...order.toObject(), transactionId: payment?.transactionId || null }; }), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.getOrder = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid order ID' });
    const order = await Order.findById(req.params.id).populate('userId', 'fullName email').populate('items.productId', 'name imageUrl').populate('items.designId', 'previewImage customImage');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const payment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { order, payment } });
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
