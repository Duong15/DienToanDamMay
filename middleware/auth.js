// Middleware kiểm tra đăng nhập
const isAuthenticated = (req, res, next) => {
    // Debug session data
    console.log('Session data:', {
        session: req.session,
        user: req.session?.user,
        headers: req.headers
    });

    if (!req.session || !req.session.user || !req.session.user._id) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            // Nếu là request AJAX hoặc API
            return res.status(401).json({
                error: 'Vui lòng đăng nhập để tiếp tục',
                requireLogin: true
            });
        } else {
            // Nếu là request thông thường
            return res.redirect('/auth/login');
        }
    }

    // Thêm user vào request để các controller có thể sử dụng
    req.user = req.session.user;
    next();
};

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).render('error', { message: 'Bạn không có quyền truy cập trang này' });
    }
};

module.exports = {
    isAuthenticated,
    isAdmin
}; 