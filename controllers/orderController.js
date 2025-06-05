const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Hiển thị form thanh toán
const showCheckout = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                populate: {
                    path: 'category'
                }
            });

        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart');
        }

        res.render('checkout', { cart });
    } catch (error) {
        console.error('Lỗi khi hiển thị trang thanh toán:', error);
        res.status(500).render('error', { message: 'Không thể tải trang thanh toán' });
    }
};

// Xử lý đặt hàng
const placeOrder = async (req, res) => {
    try {
        const { fullName, phone, address, city, paymentMethod, note } = req.body;

        // Kiểm tra giỏ hàng
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Giỏ hàng trống'
            });
        }

        // Kiểm tra số lượng tồn kho
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);
            if (!product || product.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Sản phẩm ${item.product.name} không đủ số lượng`
                });
            }
        }

        // Tạo đơn hàng mới
        const order = new Order({
            user: req.user._id,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            })),
            shippingAddress: {
                fullName,
                phone,
                address,
                city
            },
            totalAmount: cart.total,
            paymentMethod,
            note
        });

        // Lưu đơn hàng
        await order.save();

        // Cập nhật số lượng sản phẩm
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { quantity: -item.quantity }
            });
        }

        // Xóa giỏ hàng
        await Cart.findByIdAndDelete(cart._id);

        res.json({
            success: true,
            message: 'Đặt hàng thành công',
            orderId: order._id.toString() // Chuyển ObjectId thành string
        });
    } catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể đặt hàng. Vui lòng thử lại sau.'
        });
    }
};

// Hiển thị danh sách đơn hàng
const getOrders = async (req, res) => {
    try {
        // Kiểm tra user đã đăng nhập
        if (!req.user) {
            return res.redirect('/auth/login');
        }

        const orders = await Order.find({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name image price category',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 });

        res.render('orders', {
            title: 'Đơn hàng của tôi',
            orders,
            formatCurrency: (amount) => {
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(amount);
            },
            formatDate: (date) => {
                return new Date(date).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        res.status(500).render('error', {
            message: 'Không thể tải danh sách đơn hàng'
        });
    }
};

// Xem chi tiết đơn hàng
const getOrderDetail = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Kiểm tra ID hợp lệ
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).render('error', {
                message: 'ID đơn hàng không hợp lệ',
                error: {
                    status: 400,
                    stack: ''
                }
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        }).populate({
            path: 'items.product',
            populate: {
                path: 'category'
            }
        });

        if (!order) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy đơn hàng',
                error: {
                    status: 404,
                    stack: ''
                }
            });
        }

        res.render('order-detail', {
            title: 'Chi tiết đơn hàng',
            order
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
        res.status(500).render('error', {
            message: 'Không thể tải chi tiết đơn hàng',
            error: {
                status: 500,
                stack: process.env.NODE_ENV === 'development' ? error.stack : ''
            }
        });
    }
};

// Hủy đơn hàng
const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Kiểm tra ID hợp lệ
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                error: 'ID đơn hàng không hợp lệ'
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy đơn hàng'
            });
        }

        // Chỉ cho phép hủy đơn hàng ở trạng thái chờ xác nhận
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Không thể hủy đơn hàng này vì đã được xác nhận'
            });
        }

        // Hoàn lại số lượng sản phẩm
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { quantity: item.quantity }
            });
        }

        // Cập nhật trạng thái đơn hàng
        order.status = 'cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Đã hủy đơn hàng thành công'
        });
    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
        res.status(500).json({
            success: false,
            error: 'Không thể hủy đơn hàng. Vui lòng thử lại sau.'
        });
    }
};

module.exports = {
    showCheckout,
    placeOrder,
    getOrders,
    getOrderDetail,
    cancelOrder
}; 