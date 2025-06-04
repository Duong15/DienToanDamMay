const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Category = require('../models/category');

// Homepage
router.get('/', async (req, res) => {
    try {
        // Get featured categories (limit to 3)
        const categories = await Category.find().limit(3);
        console.log('Categories found:', categories);

        // Get featured products (limit to 8)
        const products = await Product.find()
            .populate('category')
            .sort({ createdAt: -1 })
            .limit(8);
        console.log('Products found:', products);

        res.render('index', {
            categories,
            products
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải trang chủ' });
    }
});

// Products page
router.get('/products', async (req, res) => {
    try {
        const { category: categoryId, search } = req.query;
        let query = { isActive: true };

        // Filter by category if provided
        if (categoryId) {
            query.category = categoryId;
        }

        // Filter by search term if provided
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(query).populate('category');
        const categories = await Category.find({ isActive: true });

        res.render('products', {
            products,
            categories,
            selectedCategory: categoryId || '',
            searchQuery: search || ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải danh sách sản phẩm' });
    }
});

// Categories page
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.render('categories', { categories });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải danh sách danh mục' });
    }
});

// Category detail page
router.get('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).render('error', { message: 'Không tìm thấy danh mục' });
        }

        const products = await Product.find({ category: req.params.id, isActive: true });
        res.render('category', { category, products });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải chi tiết danh mục' });
    }
});

// Product detail page
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(404).render('error', { message: 'Không tìm thấy sản phẩm' });
        }

        // Get related products from the same category
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id },
            isActive: true
        }).limit(4);

        res.render('product', { product, relatedProducts });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tải chi tiết sản phẩm' });
    }
});

// Search products
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.redirect('/products');
        }

        const products = await Product.find({
            $and: [
                { isActive: true },
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).populate('category');

        const categories = await Category.find({ isActive: true });

        res.render('products', {
            products,
            categories,
            selectedCategory: '',
            searchQuery: query
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm' });
    }
});

// About page
router.get('/about', (req, res) => {
    res.render('about');
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact');
});

module.exports = router; 