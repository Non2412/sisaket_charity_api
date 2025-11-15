const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: {
      street: String,
      subDistrict: String,
      district: String,
      province: String,
      postalCode: String,
      fullAddress: String
    }
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    size: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    pricePerUnit: Number,
    subtotal: Number
  }],
  pricing: {
    subtotal: Number,
    shippingFee: Number,
    discount: {
      type: Number,
      default: 0
    },
    total: Number
  },
  shipping: {
    method: {
      type: String,
      default: 'standard'
    },
    firstItemFee: Number,
    additionalItemFee: Number,
    totalItems: Number,
    trackingNumber: String,
    shippedDate: Date,
    deliveredDate: Date
  },
  payment: {
    method: {
      type: String,
      enum: ['promptpay', 'bank_transfer', 'cod'],
      default: 'promptpay'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    paidAt: Date,
    slipUrl: String,
    transactionId: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  adminNotes: String,
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: String,
    note: String
  }]
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);