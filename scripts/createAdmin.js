const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

// Thông tin tài khoản admin mặc định
const adminUser = {
    name: 'Admin Bely',
    email: 'admin@bely.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '0123456789',
    address: 'Bely Store'
};

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sieuthiminibely', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');

    try {
        // Kiểm tra xem admin đã tồn tại chưa
        const existingAdmin = await User.findOne({ email: adminUser.email });

        if (existingAdmin) {
            console.log('Admin account already exists');
            process.exit(0);
        }

        // Tạo tài khoản admin mới
        const admin = new User(adminUser);
        await admin.save();

        console.log('Admin account created successfully');
        console.log('Email:', adminUser.email);
        console.log('Password:', adminUser.password);

    } catch (error) {
        console.error('Error creating admin account:', error);
    }

    process.exit(0);
}).catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
}); 