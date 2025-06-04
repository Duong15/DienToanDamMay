# Siêu thị mini Bely

Website bán hàng siêu thị mini với giao diện màu hồng, sử dụng Node.js và MongoDB.

## Yêu cầu hệ thống

- Node.js (v14 trở lên)
- MongoDB (v4.4 trở lên)

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd sieuthiminibely
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env trong thư mục gốc và thêm các biến môi trường:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sieuthiminibely
SESSION_SECRET=your-secret-key
```

4. Tạo thư mục images:
```bash
mkdir -p public/images
```

5. Khởi động server:
```bash
npm start
```

Truy cập website tại `http://localhost:3000`

## Cấu trúc thư mục

```
sieuthiminibely/
├── public/
│   ├── css/
│   │   └── style.css
│   └── images/
├── views/
│   └── index.ejs
├── app.js
├── package.json
└── README.md
```

## Tính năng

- Giao diện người dùng thân thiện với theme màu hồng
- Hiển thị danh mục sản phẩm
- Giỏ hàng
- Đăng nhập/Đăng ký
- Quản lý sản phẩm
- Responsive design

## Công nghệ sử dụng

- Node.js
- Express.js
- MongoDB
- EJS Template Engine
- Bootstrap 5
- Font Awesome 