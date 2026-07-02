const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Create a new order
 */
const createOrder = async (userId, { items, shippingAddress, note }) => {
  // Validate products and calculate total
  const orderItems = [];
  let totalPrice = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      const error = new Error(`Product not found: ${item.productId}`);
      error.statusCode = 404;
      throw error;
    }

    if (!product.isActive) {
      const error = new Error(`Product is no longer available: ${product.name}`);
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < item.quantity) {
      const error = new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      error.statusCode = 400;
      throw error;
    }

    orderItems.push({
      productId: product._id,
      quantity: item.quantity,
      price: product.price,
      name: product.name,
      imageUrl: product.imageUrl,
    });

    totalPrice += product.price * item.quantity;
  }

  // Deduct stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity },
    });
  }

  const order = await Order.create({
    userId,
    items: orderItems,
    totalPrice,
    shippingAddress,
    note,
    status: 'PENDING',
  });

  return order.populate('userId', 'fullName email');
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
  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent illegal status transitions
  const allowedTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['SHIPPING', 'CANCELLED'],
    SHIPPING: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  if (!allowedTransitions[order.status].includes(status)) {
    const error = new Error(`Cannot change status from ${order.status} to ${status}`);
    error.statusCode = 400;
    throw error;
  }

  // Restore stock if cancelled
  if (status === 'CANCELLED') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }
  }

  order.status = status;
  if (note) {
    order.statusHistory[order.statusHistory.length - 1].note = note;
  }

  await order.save();
  return order;
};

module.exports = { createOrder, getUserOrders, getOrderById, updateOrderStatus };
