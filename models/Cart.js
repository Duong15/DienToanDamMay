const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [cartItemSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Tính tổng tiền giỏ hàng
cartSchema.virtual('total').get(function () {
    return this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
});

// Tính phí vận chuyển (ví dụ: miễn phí cho đơn > 500k, 30k cho đơn < 500k)
cartSchema.virtual('shippingFee').get(function () {
    const total = this.total;
    return total >= 500000 ? 0 : 30000;
});

// Tổng cộng bao gồm phí vận chuyển
cartSchema.virtual('grandTotal').get(function () {
    return this.total + this.shippingFee;
});

// Đảm bảo virtuals được bao gồm khi chuyển đổi sang JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema); 