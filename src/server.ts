import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from './config/database';

// Import routes (require allows mixing JS files)
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const userRoutes = require('./routes/users');
const settingRoutes = require('./routes/settings');
const statisticRoutes = require('./routes/statistics');

import 'dotenv/config';

const app = express();

// FORCE all responses to use HTTP 200 status code.
// This monkey-patches `res.status` and `res.sendStatus` so callers
// that set non-200 statuses will still return HTTP 200 to clients.
// Use with caution — this is intentionally forcing 200 for all responses.
app.use((req, res, next) => {
  // store originals
  // @ts-ignore - dynamic patching for debugging/force-200 behavior
  const _origStatus = res.status;
  // @ts-ignore
  const _origSendStatus = res.sendStatus;

  // override status to always set 200
  // @ts-ignore
  res.status = function (code: number) {
    return _origStatus.call(this, 200);
  };

  // override sendStatus to send a 200 and include original code in body
  // @ts-ignore
  res.sendStatus = function (code: number) {
    _origStatus.call(this, 200);
    // respond with a JSON body indicating the original status for debugging
    try {
      return this.json({ forcedStatus: 200, originalStatus: code });
    } catch (e) {
      return this.send(String(code));
    }
  };

  next();
});

// Simple request logger for debugging
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[REQ] ${now} ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://your-frontend-domain.com'] : '*',
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Connect to MongoDB
connectDB();

// Middleware to return 503 when DB not ready
const dbReadyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  try {
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
      return;
    }
  } catch (e) {
    // ignore
  }
  res.json({
    message: '🎉 Sisaket Charity API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      api: '/api',
      health: '/health'
    }
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    message: '🎉 Sisaket Charity API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Health check
app.get('/health', (req, res) => {
  const stateMap: Record<number, string> = {
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

// Debug route (safe/masked)
app.get('/debug/mongo', (req, res) => {
  const stateMap: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const rawUrl = process.env.MONGOOSE_URL || process.env.MONGODB_URI || null;
  let masked: string | null = null;
  if (rawUrl) {
    try {
      const url = new URL(rawUrl);
      if (url.username) {
        masked = `${url.protocol}//${url.username}:*****@${url.host}${url.pathname}${url.search}`;
      } else {
        masked = `${url.protocol}//${url.host}${url.pathname}${url.search}`;
      }
    } catch (e) {
      masked = rawUrl.replace(/:[^:@]+@/, ':*****@');
    }
  }
  res.json({
    success: true,
    environment: process.env.NODE_ENV || 'production',
    port: process.env.PORT || 3000,
    mongoose_ready_state: mongoose.connection.readyState,
    mongoose_state: stateMap[mongoose.connection.readyState] || 'unknown',
    mongoose_url_masked: masked
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 10000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`💚 Health Check: /health`);
  console.log(`📝 API Info: /api`);
  console.log('='.repeat(50));
});

export default app;
