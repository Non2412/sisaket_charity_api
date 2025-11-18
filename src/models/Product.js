const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  sizes: [{
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL', '2XL', '3XL']
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    available: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    default: 'charity-event'
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes
// `productCode` is declared `unique: true` on the field; avoid duplicate index definitions
productSchema.index({ isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Methods
productSchema.methods.getTotalStock = function() {
  return this.sizes.reduce((total, size) => total + size.stock, 0);
};

module.exports = mongoose.model('Product', productSchema);