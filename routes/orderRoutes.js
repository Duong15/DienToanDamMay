const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/auth');

// Hiển thị form thanh toán
router.get('/checkout', isAuthenticated, orderController.showCheckout);

// Xử lý đặt hàng
router.post('/place-order', isAuthenticated, orderController.placeOrder);

// Danh sách đơn hàng của người dùng
router.get('/orders', isAuthenticated, orderController.getOrders);

// Chi tiết đơn hàng
router.get('/orders/:id', isAuthenticated, orderController.getOrderDetail);

// Hủy đơn hàng
router.post('/orders/:id/cancel', isAuthenticated, orderController.cancelOrder);

module.exports = router; 