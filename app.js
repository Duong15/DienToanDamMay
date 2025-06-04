const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sieuthiminibely', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'bely-secret-key-2024',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global middleware
app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;

    // Thêm thông tin giỏ hàng cho user đã đăng nhập
    if (req.session.user) {
        try {
            const Cart = require('./models/Cart');
            const cart = await Cart.findOne({ user: req.session.user._id });
            res.locals.cartCount = cart ? cart.items.length : 0;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin giỏ hàng:', error);
            res.locals.cartCount = 0;
        }
    } else {
        res.locals.cartCount = 0;
    }

    // Theme configuration
    res.locals.theme = {
        primary: '#ff69b4',      // Pink
        secondary: '#fff0f5',    // LavenderBlush
        accent: '#ff1493',       // DeepPink
        borderColor: '#ffe4e1',  // MistyRose
        text: {
            primary: '#333333',
            secondary: '#666666',
            light: '#ffffff'
        }
    };
    next();
});

// Routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const cartRouter = require('./routes/cart');
const orderRoutes = require('./routes/orderRoutes');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/cart', cartRouter);
app.use('/', orderRoutes);

// Error handling
app.use((req, res, next) => {
    res.status(404).render('error', {
        message: 'Không tìm thấy trang bạn yêu cầu'
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).render('error', {
        message: err.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 