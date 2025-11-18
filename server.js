const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/database');
const mongoose = require('mongoose');

// Import routes
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');
const customerRoutes = require('./src/routes/customers');
const userRoutes = require('./src/routes/users');
const settingRoutes = require('./src/routes/settings');
const statisticRoutes = require('./src/routes/statistics');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/statistics', statisticRoutes);

// Root route - serve dashboard
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: '🎉 Sisaket Charity API',
      version: '1.0.0',
      status: 'Running',
      endpoints: {
        api: '/api',
        health: '/health',
        products: '/api/products',
        orders: '/api/orders',
        customers: '/api/customers',
        users: '/api/users',
        settings: '/api/settings',
        statistics: '/api/statistics'
      }
    });
  }
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    message: '🎉 Sisaket Charity API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      customers: '/api/customers',
      users: '/api/users',
      settings: '/api/settings',
      statistics: '/api/statistics'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const readyState = mongoose.connection.readyState;
  res.json({
    status: readyState === 1 ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    database: stateMap[readyState] || 'unknown'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`💚 Health Check: /health`);
  console.log(`📝 API Info: /api`);
  console.log('='.repeat(50));
});

module.exports = app;