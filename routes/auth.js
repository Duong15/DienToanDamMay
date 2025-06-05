const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Hiển thị trang đăng nhập
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login');
});

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { name, username, password, phone, address } = req.body;

        // Kiểm tra username đã tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập đã được sử dụng' });
        }

        // Tạo user mới
        const user = new User({
            name,
            username,
            password,
            phone,
            address
        });

        await user.save();

        // Lưu session
        req.session.user = {
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role
        };

        res.status(201).json({
            message: 'Đăng ký thành công',
            user: req.session.user
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng ký' });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Tìm user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Kiểm tra tài khoản có bị khóa
        if (!user.isActive) {
            return res.status(401).json({ message: 'Tài khoản đã bị khóa' });
        }

        // Lưu session
        req.session.user = {
            _id: user._id,
            name: user.name || user.username,
            username: user.username,
            role: user.role
        };

        // Debug session
        console.log('Session after login:', {
            sessionID: req.sessionID,
            user: req.session.user
        });

        res.json({
            message: 'Đăng nhập thành công',
            user: req.session.user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng nhập' });
    }
});

// Đăng xuất
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng xuất' });
        }
        res.redirect('/');
    });
});

// Kiểm tra đăng nhập
router.get('/check', (req, res) => {
    if (req.session.user) {
        res.json({ isLoggedIn: true, user: req.session.user });
    } else {
        res.json({ isLoggedIn: false });
    }
});

module.exports = router; 
