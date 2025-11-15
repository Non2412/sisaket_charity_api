const express = require('express');
const router = express.Router();
const Order = require('../models/Customer');

router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
    } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;    