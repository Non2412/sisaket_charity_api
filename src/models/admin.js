const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profile: {
    name: String,
    phone: String,
    role: {
      type: String,
      enum: ['admin', 'super_admin', 'staff'],
      default: 'admin'
    }
  },
  permissions: [String],
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// `username` and `email` are declared `unique: true` on the fields; avoid duplicate index declarations

module.exports = mongoose.model('Admin', adminSchema);