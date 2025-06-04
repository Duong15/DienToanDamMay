const Product = require('../models/product');
const Category = require('../models/category');

// Hiển thị chi tiết sản phẩm
exports.getProductDetail = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('history.createdBy', 'username');

        if (!product) {
            return res.status(404).send('Không tìm thấy sản phẩm');
        }

        // Lấy thống kê
        const stats = {
            views: product.views || 0,
            sold: product.sold || 0,
            revenue: product.revenue || 0,
            rating: product.rating || { average: 0, count: 0 }
        };

        res.render('admin/product-detail', {
            product,
            stats,
            moment: require('moment')
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Đã xảy ra lỗi khi tải thông tin sản phẩm');
    }
};

// Cập nhật trạng thái sản phẩm
exports.updateProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        product.isActive = req.body.isActive;
        product.history.push({
            action: 'update_status',
            value: req.body.isActive,
            createdBy: req.user._id
        });

        await product.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật trạng thái' });
    }
};

// Cập nhật giá sản phẩm
exports.updateProductPrice = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        const oldPrice = product.price;
        product.price = req.body.price;
        product.history.push({
            action: 'update_price',
            value: {
                old: oldPrice,
                new: req.body.price
            },
            createdBy: req.user._id
        });

        await product.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật giá' });
    }
};

// Cập nhật số lượng tồn kho
exports.updateProductStock = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        const oldQuantity = product.quantity;
        product.quantity = req.body.quantity;
        product.history.push({
            action: 'update_stock',
            value: {
                old: oldQuantity,
                new: req.body.quantity
            },
            createdBy: req.user._id
        });

        await product.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật số lượng' });
    }
};

// Thêm khuyến mãi
exports.addPromotion = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        product.promotions.push({
            type: req.body.type,
            value: req.body.value,
            startDate: req.body.startDate,
            endDate: req.body.endDate
        });

        product.history.push({
            action: 'add_promotion',
            value: {
                type: req.body.type,
                value: req.body.value
            },
            createdBy: req.user._id
        });

        await product.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm khuyến mãi' });
    }
};

// Thêm biến thể sản phẩm
exports.addVariant = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        product.variants.push({
            name: req.body.name,
            price: req.body.price,
            quantity: req.body.quantity
        });

        product.history.push({
            action: 'add_variant',
            value: req.body.name,
            createdBy: req.user._id
        });

        await product.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm biến thể' });
    }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        await Product.deleteOne({ _id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa sản phẩm' });
    }
}; 