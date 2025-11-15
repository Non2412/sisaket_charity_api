const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const productRoutes = require('./src/routes/products');
const path = require('path');
const ordersRoutes = require('./src/routes/orders');
const customersRoutes = require('./src/routes/customers');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
// Connect to MongoDB
connectDB();

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);


// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Docs
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Sisaket Charity API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      products: '/api/products',
      health: '/health'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 API Docs: http://localhost:${PORT}/`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});