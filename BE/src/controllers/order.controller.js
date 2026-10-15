const orderService = require('../services/order.service');

const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Đặt hàng thành công', data: result });
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
    if (!['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ' });
    }
    const order = await orderService.updateOrderStatus(req.params.id, status, note);
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công', data: { order } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getOrderById, updateOrderStatus };
