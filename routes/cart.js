const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/auth');

// Hiển thị giỏ hàng
router.get('/', isAuthenticated, cartController.getCart);

// Thêm vào giỏ hàng - không yêu cầu xác thực ngay lập tức
router.post('/add', cartController.addToCart);

// Các route khác yêu cầu xác thực
router.put('/update', isAuthenticated, cartController.updateQuantity);
router.delete('/remove/:productId', isAuthenticated, cartController.removeFromCart);
router.delete('/clear', isAuthenticated, cartController.clearCart);

module.exports = router; 