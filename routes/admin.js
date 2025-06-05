const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAdmin } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const adminProductController = require('../controllers/adminProductController');
const siteConfig = require('../config/site');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Chỉ cho phép file hình ảnh!'), false);
        }
        cb(null, true);
    }
});

// Admin dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const productsCount = await Product.countDocuments();
        const categoriesCount = await Category.countDocuments();
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('category');

        res.render('admin/dashboard', {
            productsCount,
            categoriesCount,
            recentProducts,
            theme: siteConfig.theme
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Quản lý sản phẩm
router.get('/products', isAdmin, async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        const categories = await Category.find();
        res.render('admin/products', { products, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Quản lý danh mục
router.get('/categories', isAdmin, async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/categories', { categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

router.post('/categories', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : '';

        const category = new Category({
            name,
            description,
            image,
            isActive: isActive === 'on'
        });

        await category.save();
        res.status(201).json({ message: 'Thêm danh mục thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

router.delete('/categories/:id', isAdmin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        // Delete category image if exists
        if (category.image) {
            const imagePath = path.join(__dirname, '../public', category.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await category.deleteOne();
        res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Quản lý người dùng
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.render('admin/users', { users });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải danh sách người dùng' });
    }
});

router.post('/products', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, quantity, description, isActive } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : '';

        const product = new Product({
            name,
            category,
            price,
            quantity,
            description,
            image,
            isActive: isActive === 'on'
        });

        await product.save();
        res.status(201).json({ message: 'Thêm sản phẩm thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

router.delete('/products/:id', isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        // Delete product image if exists
        if (product.image) {
            const imagePath = path.join(__dirname, '../public', product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await product.deleteOne();
        res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Chi tiết sản phẩm
router.get('/products/:id', isAdmin, adminProductController.getProductDetail);

// Trang sửa sản phẩm
router.get('/products/:id/edit', isAdmin, async (req, res) => {
    try {
        const [product, categories] = await Promise.all([
            Product.findById(req.params.id).populate('category'),
            Category.find()
        ]);

        if (!product) {
            return res.status(404).render('error', {
                message: 'Không tìm thấy sản phẩm',
                backUrl: '/admin/products'
            });
        }

        res.render('admin/edit-product', {
            product,
            categories,
            theme: siteConfig.theme
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', {
            message: 'Đã xảy ra lỗi khi tải thông tin sản phẩm',
            backUrl: '/admin/products'
        });
    }
});

// Xử lý sửa sản phẩm
router.post('/products/:id', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Validate dữ liệu
        const { name, category, price, quantity, description } = req.body;

        if (!name || name.length < 3 || name.length > 100) {
            return res.status(400).json({
                message: 'Tên sản phẩm phải từ 3-100 ký tự'
            });
        }

        if (price < 0 || price > 1000000000) {
            return res.status(400).json({
                message: 'Giá sản phẩm phải từ 0 đến 1,000,000,000 VNĐ'
            });
        }

        if (quantity < 0 || quantity > 10000) {
            return res.status(400).json({
                message: 'Số lượng phải từ 0 đến 10,000'
            });
        }

        if (description && description.length > 500) {
            return res.status(400).json({
                message: 'Mô tả không được quá 500 ký tự'
            });
        }

        // Cập nhật thông tin sản phẩm
        product.name = name;
        product.category = category || null;
        product.price = price;
        product.quantity = quantity;
        product.description = description;

        // Nếu có upload hình ảnh mới
        if (req.file) {
            // Xóa ảnh cũ nếu có
            if (product.image) {
                const oldImagePath = path.join(__dirname, '../public', product.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            product.image = '/uploads/' + req.file.filename;
        }

        await product.save();
        res.json({
            message: 'Cập nhật sản phẩm thành công',
            product: product
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi cập nhật sản phẩm'
        });
    }
});

// Cập nhật trạng thái sản phẩm
router.put('/products/:id/status', isAdmin, adminProductController.updateProductStatus);

// Cập nhật giá sản phẩm
router.put('/products/:id/price', isAdmin, adminProductController.updateProductPrice);

// Cập nhật số lượng sản phẩm
router.put('/products/:id/stock', isAdmin, adminProductController.updateProductStock);

// Thêm chức năng quản lý khuyến mãi
router.post('/products/:id/promotions', isAdmin, adminProductController.addPromotion);

// Thêm chức năng quản lý phiên bản
router.post('/products/:id/variants', isAdmin, adminProductController.addVariant);

module.exports = router; 
