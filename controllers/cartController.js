const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Hiển thị giỏ hàng
const getCart = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ error: 'Người dùng chưa đăng nhập' });
        }

        const cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                populate: {
                    path: 'category'
                }
            });

        if (!cart) {
            return res.render('cart', {
                cart: { items: [], total: 0, shippingFee: 0, grandTotal: 0 }
            });
        }

        // Cập nhật số lượng và tình trạng sản phẩm trong giỏ hàng
        let needsUpdate = false;
        cart.items = cart.items.filter(item => {
            const product = item.product;
            if (!product || !product.isActive || product.quantity < item.quantity) {
                needsUpdate = true;
                return false;
            }
            return true;
        });

        if (needsUpdate) {
            await cart.save();
        }

        res.render('cart', { cart });
    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        res.status(500).render('error', { message: 'Không thể tải giỏ hàng' });
    }
};

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        console.log('Request body:', req.body);

        if (!productId) {
            return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
        }

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }

        // Kiểm tra số lượng tồn kho và trạng thái sản phẩm
        if (!product.isActive || product.quantity < quantity) {
            return res.status(400).json({ error: 'Sản phẩm đã hết hàng hoặc không đủ số lượng' });
        }

        // Kiểm tra đăng nhập
        if (!req.session?.user?._id) {
            return res.status(401).json({
                error: 'Vui lòng đăng nhập để thêm vào giỏ hàng',
                requireLogin: true
            });
        }

        // Tìm hoặc tạo giỏ hàng cho user
        let cart = await Cart.findOne({ user: req.session.user._id });
        if (!cart) {
            cart = new Cart({
                user: req.session.user._id,
                items: []
            });
        }

        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const existingItemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Cập nhật số lượng nếu sản phẩm đã có trong giỏ
            const newQuantity = cart.items[existingItemIndex].quantity + parseInt(quantity);
            if (newQuantity > product.quantity) {
                return res.status(400).json({ error: 'Số lượng yêu cầu vượt quá số lượng tồn kho' });
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Thêm sản phẩm mới vào giỏ
            cart.items.push({
                product: productId,
                quantity: parseInt(quantity),
                price: product.price
            });
        }

        // Lưu giỏ hàng
        await cart.save();
        console.log('Cart saved:', cart);

        res.json({
            success: true,
            message: 'Đã thêm vào giỏ hàng thành công',
            cartCount: cart.items.length
        });
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        res.status(500).json({
            error: 'Không thể thêm vào giỏ hàng',
            details: error.message
        });
    }
};

// Cập nhật số lượng sản phẩm
const updateQuantity = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ error: 'Người dùng chưa đăng nhập' });
        }

        const { productId, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }

        // Kiểm tra số lượng tồn kho
        if (quantity > 0 && (quantity > product.quantity || !product.isActive)) {
            return res.status(400).json({ error: 'Số lượng yêu cầu không hợp lệ hoặc sản phẩm đã hết hàng' });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
        }

        if (quantity > 0) {
            const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
            if (itemIndex === -1) {
                return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng' });
            }
            cart.items[itemIndex].quantity = parseInt(quantity);
        } else {
            cart.items = cart.items.filter(item => item.product.toString() !== productId);
        }

        await cart.save();

        res.json({
            success: true,
            message: 'Đã cập nhật giỏ hàng',
            cartCount: cart.items.length
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật giỏ hàng:', error);
        res.status(500).json({ error: 'Không thể cập nhật giỏ hàng' });
    }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ error: 'Người dùng chưa đăng nhập' });
        }

        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();

        res.json({
            success: true,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng',
            cartCount: cart.items.length
        });
    } catch (error) {
        console.error('Lỗi khi xóa khỏi giỏ hàng:', error);
        res.status(500).json({ error: 'Không thể xóa khỏi giỏ hàng' });
    }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ error: 'Người dùng chưa đăng nhập' });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json({
            success: true,
            message: 'Đã xóa toàn bộ giỏ hàng'
        });
    } catch (error) {
        console.error('Lỗi khi xóa giỏ hàng:', error);
        res.status(500).json({ error: 'Không thể xóa giỏ hàng' });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
}; 