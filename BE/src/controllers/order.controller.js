const orderService = require('../services/order.service');

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Order placed successfully', data: { order } });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getUserOrders(req.user._id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, note);
    res.status(200).json({ success: true, message: 'Order status updated', data: { order } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, updateOrderStatus };
