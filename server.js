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

// Middleware to return 503 when DB not ready
const dbReadyMiddleware = (req, res, next) => {
  // mongoose connection readyState: 1 = connected
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    message: 'Service temporarily unavailable - database not ready'
  });
};

// API Routes (protect with DB-ready middleware)
app.use('/api', dbReadyMiddleware);
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
        // Wrapper to start compiled TypeScript app if available
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require('./dist/server.js');
        } catch (e) {
          console.error('Compiled server not found. Run `npm run build` then `npm start` to run the TypeScript build.');
          console.error(e && e.message ? e.message : e);
          process.exit(1);
        }