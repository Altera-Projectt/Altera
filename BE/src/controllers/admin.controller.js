const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const pagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.dashboard = async (req, res, next) => {
  try {
    const [totalCustomers, totalUsers, totalOrders, totalProducts, pendingOrders, completedOrders, revenueAgg] = await Promise.all([
      User.countDocuments({ role: 'USER', isActive: { $ne: false } }),
      User.countDocuments({ isActive: { $ne: false } }), Order.countDocuments(), Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'PENDING' }), Order.countDocuments({ status: 'DELIVERED' }),
      Order.aggregate([{ $match: { status: 'DELIVERED' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    ]);
    res.json({ success: true, data: { totalCustomers, totalUsers, totalOrders, totalProducts, pendingOrders, completedOrders, revenue: revenueAgg[0]?.total || 0 } });
  } catch (error) { next(error); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    if (req.query.role && ['USER', 'ADMIN'].includes(req.query.role)) query.role = req.query.role;
    if (req.query.status === 'active') query.isActive = { $ne: false };
    if (req.query.status === 'inactive') query.isActive = false;
    if (req.query.search) query.$or = [{ fullName: { $regex: req.query.search, $options: 'i' } }, { email: { $regex: req.query.search, $options: 'i' } }];
    const [users, total] = await Promise.all([User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(query)]);
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
    const allowed = ['fullName', 'phone', 'isActive'];
    for (const field of allowed) if (req.body[field] !== undefined) user[field] = req.body[field];
    await user.save();
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

exports.listOrders = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    if (req.query.status && ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.from || req.query.to) query.createdAt = { ...(req.query.from ? { $gte: new Date(req.query.from) } : {}), ...(req.query.to ? { $lte: new Date(`${req.query.to}T23:59:59.999Z`) } : {}) };
    if (req.query.search) {
      const users = await User.find({ $or: [{ fullName: { $regex: req.query.search, $options: 'i' } }, { email: { $regex: req.query.search, $options: 'i' } }] }).select('_id');
      const clauses = [{ _id: validId(req.query.search) ? req.query.search : null }, { userId: { $in: users.map((u) => u._id) } }];
      query.$or = clauses;
    }
    const [orders, total] = await Promise.all([Order.find(query).populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(query)]);
    res.json({ success: true, data: { orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.getOrder = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid order ID' });
    const order = await Order.findById(req.params.id).populate('userId', 'fullName email').populate('items.productId', 'name imageUrl').populate('items.designId', 'previewImage customImage');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: { order } });
  } catch (error) { next(error); }
};

exports.listProducts = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const query = {};
    if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
    if (req.query.status === 'active') query.isActive = true;
    if (req.query.status === 'inactive') query.isActive = false;
    const [products, total] = await Promise.all([Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit), Product.countDocuments(query)]);
    res.json({ success: true, data: { products, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};
