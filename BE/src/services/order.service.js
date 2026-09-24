const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const paymentService = require('./payment.service');

/**
 * Create a new order
 */
const createOrder = async (userId, { items, shippingAddress, note, paymentMethod = 'COD', checkoutKey }) => {
  paymentService.assertConfigured(paymentMethod);
  if (checkoutKey) {
    const existing = await Order.findOne({ userId, checkoutKey }).select('+checkoutKey');
    if (existing) {
      if (existing.paymentMethod !== paymentMethod) { const error = new Error('This checkout was already submitted with another payment method.'); error.statusCode = 409; throw error; }
      const payment = await Payment.findOne({ orderId: existing._id }).sort({ createdAt: -1 });
      return { order: await existing.populate('userId', 'fullName email'), payment: payment ? { paymentReference: payment.paymentReference, paymentMethod, paymentStatus: payment.paymentStatus, transfer: paymentMethod === 'BANK_TRANSFER' ? paymentService.transferDetails(payment) : null } : null };
    }
  }
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) { const error = new Error('Your cart is empty.'); error.statusCode = 400; throw error; }
  const requested = new Map();
  for (const item of items || []) requested.set(String(item.productId), (requested.get(String(item.productId)) || 0) + Number(item.quantity));
  const cartItems = new Map();
  for (const item of cart.items) cartItems.set(String(item.productId), (cartItems.get(String(item.productId)) || 0) + item.quantity);
  if (requested.size !== cartItems.size || [...cartItems].some(([id, quantity]) => requested.get(id) !== quantity)) {
    const error = new Error('Your cart changed. Refresh it and try again.'); error.statusCode = 409; throw error;
  }
  // Validate products and calculate total
  const orderItems = [];
  let totalPrice = 0;

  const quantities = new Map();
  for (const item of items) quantities.set(String(item.productId), (quantities.get(String(item.productId)) || 0) + Number(item.quantity));
  for (const [productId, quantity] of quantities) {
    const product = await Product.findById(productId);

    if (!product) {
      const error = new Error(`Product not found: ${productId}`);
      error.statusCode = 404;
      throw error;
    }

    if (!product.isActive) {
      const error = new Error(`Product is no longer available: ${product.name}`);
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < quantity) {
      const error = new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      error.statusCode = 400;
      throw error;
    }

    orderItems.push({
      productId: product._id,
      quantity,
      price: product.price,
      name: product.name,
      imageUrl: product.imageUrl,
    });

    totalPrice += product.price * quantity;
  }

  const reserved = [];
  let order;
  try {
    for (const item of orderItems) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }, { new: true }
      );
      if (!product) { const error = new Error(`Insufficient stock for ${item.name}`); error.statusCode = 400; throw error; }
      reserved.push(item);
    }
    order = await Order.create({ userId, checkoutKey, items: orderItems, totalPrice, shippingAddress, note, paymentMethod, paymentStatus: 'PENDING', status: 'PENDING' });
    const payment = await paymentService.createPayment(order, paymentMethod);
    order.paymentReference = payment.paymentReference;
    const transfer = paymentMethod === 'BANK_TRANSFER' ? paymentService.transferDetails(payment) : null;
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
    return { order: await order.populate('userId', 'fullName email'), payment: { paymentReference: payment.paymentReference, paymentMethod, paymentStatus: payment.paymentStatus, transfer } };
  } catch (error) {
    if (order) { await Payment.deleteMany({ orderId: order._id }); await Order.deleteOne({ _id: order._id }); }
    for (const item of reserved) await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    if (error.code === 11000 && checkoutKey) {
      const existing = await Order.findOne({ userId, checkoutKey }).select('+checkoutKey');
      if (existing) {
        const payment = await Payment.findOne({ orderId: existing._id }).sort({ createdAt: -1 });
        return { order: await existing.populate('userId', 'fullName email'), payment: payment ? { paymentReference: payment.paymentReference, paymentMethod, paymentStatus: payment.paymentStatus, transfer: paymentMethod === 'BANK_TRANSFER' ? paymentService.transferDetails(payment) : null } : null };
      }
    }
    throw error;
  }
};

/**
 * Get all orders for a user (paginated)
 */
const getUserOrders = async (userId, { page = 1, limit = 10, status }) => {
  const skip = (page - 1) * limit;
  const query = { userId };
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('items.productId', 'name imageUrl category')
      .populate('items.designId', 'previewImage customImage shirtColor status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single order by ID
 */
const getOrderById = async (orderId, userId, role) => {
  const order = await Order.findById(orderId)
    .populate('userId', 'fullName email')
    .populate('items.productId', 'name imageUrl category')
    .populate('items.designId', 'previewImage customImage shirtColor status');

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (role !== 'ADMIN' && order.userId._id.toString() !== userId.toString()) {
    const error = new Error('Access denied. This order belongs to another user.');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

/**
 * Update order status (Admin only)
 */
const updateOrderStatus = async (orderId, status, note) => {
  const session = await mongoose.startSession();
  let updatedOrder;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) { const error = new Error('Order not found'); error.statusCode = 404; throw error; }
      const allowedTransitions = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['SHIPPING', 'CANCELLED'], SHIPPING: ['DELIVERED'], DELIVERED: [], CANCELLED: [] };
      if (!allowedTransitions[order.status].includes(status)) { const error = new Error(`Cannot change status from ${order.status} to ${status}`); error.statusCode = 400; throw error; }

      if (status === 'CANCELLED') {
        await paymentService.cancelOrderPayment(order, session);
        for (const item of order.items) await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } }, { session });
      }

      order.status = status;
      if (status === 'DELIVERED' && order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING') {
        const payment = await Payment.findOne({ orderId: order._id, paymentMethod: 'COD' }).sort({ createdAt: -1 }).session(session);
        if (payment?.paymentStatus === 'PENDING') {
          const paid = await Payment.findOneAndUpdate({ _id: payment._id, paymentStatus: 'PENDING' }, { $set: { paymentStatus: 'PAID', paidAt: new Date() } }, { new: true, session });
          if (paid) { order.paymentStatus = 'PAID'; order.paidAt = paid.paidAt; }
        }
      }
      if (note && order.statusHistory.length) order.statusHistory[order.statusHistory.length - 1].note = note;
      await order.save({ session });
      updatedOrder = order;
    });
    return updatedOrder;
  } finally { await session.endSession(); }
};

module.exports = { createOrder, getUserOrders, getOrderById, updateOrderStatus };
