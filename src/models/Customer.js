const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: String,
  addresses: [{
    label: String,
    isDefault: Boolean,
    street: String,
    subDistrict: String,
    district: String,
    province: String,
    postalCode: String
  }],
  statistics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    lastOrderDate: Date
  }
}, {
  timestamps: true
});

customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });

module.exports = mongoose.model('Customer', customerSchema);