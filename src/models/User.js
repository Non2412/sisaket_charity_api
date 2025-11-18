const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: String,
  phone: String,
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// `googleId` and `email` are declared `unique: true` on the fields; avoid duplicate index declarations

module.exports = mongoose.model('User', userSchema);