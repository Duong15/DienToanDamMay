const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    sold: {
        type: Number,
        default: 0
    },
    revenue: {
        type: Number,
        default: 0
    },
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    variants: [{
        name: String,
        price: Number,
        quantity: Number,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    promotions: [{
        type: {
            type: String,
            enum: ['discount', 'gift', 'combo'],
            required: true
        },
        value: {
            type: Number,
            required: true
        },
        startDate: Date,
        endDate: Date,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    history: [{
        action: {
            type: String,
            required: true
        },
        value: mongoose.Schema.Types.Mixed,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Middleware để tự động thêm vào lịch sử khi có thay đổi
productSchema.pre('save', function(next) {
    if (this.isModified('price')) {
        this.history.push({
            action: 'update_price',
            value: this.price
        });
    }
    if (this.isModified('quantity')) {
        this.history.push({
            action: 'update_stock',
            value: this.quantity
        });
    }
    if (this.isModified('isActive')) {
        this.history.push({
            action: 'update_status',
            value: this.isActive
        });
    }
    next();
});

// Method để tăng lượt xem
productSchema.methods.increaseView = async function() {
    this.views += 1;
    return this.save();
};

// Method để cập nhật sau khi bán
productSchema.methods.updateAfterSale = async function(quantity, price) {
    this.quantity -= quantity;
    this.sold += quantity;
    this.revenue += price * quantity;
    return this.save();
};

// Method để thêm đánh giá
productSchema.methods.addRating = async function(rating) {
    const oldTotal = this.rating.average * this.rating.count;
    this.rating.count += 1;
    this.rating.average = (oldTotal + rating) / this.rating.count;
    return this.save();
};

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function () {
    return this.quantity > 0;
});

// Tạo model một lần và export
const Product = mongoose.model('Product', productSchema);
module.exports = Product; 