const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const mongoUrl = process.env.MONGOOSE_URL || process.env.MONGODB_URI;
  if (!mongoUrl) {
    console.error('❌ No MongoDB connection string provided. Set MONGOOSE_URL or MONGODB_URI in your environment.');
    // Do not exit; return so the app can continue in degraded mode
    return;
  }

  // Mask credentials for logging (do not reveal user:pass)
  const maskMongoUrl = (url) => {
    try {
      // Replace credentials like //user:pass@ with //<REDACTED>@
      return url.replace(/\/\/([^:@\/]+)(:[^@\/]+)?@/, '//<REDACTED>@');
    } catch (e) {
      return '<masked>';
    }
  };

  const usedVar = process.env.MONGOOSE_URL ? 'MONGOOSE_URL' : 'MONGODB_URI';
  console.log(`🔗 Using ${usedVar}: ${maskMongoUrl(mongoUrl)}`);
  // Connection options tuned for Atlas and hosted environments
  const isSrv = /^mongodb\+srv:.*$/i.test(mongoUrl);
  const connectOptions = {
    serverSelectionTimeoutMS: 10000, // how long to try selecting a server
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    // prefer modern TLS; do NOT allow invalid certificates in production
    tls: true,
    tlsInsecure: false,
    // use IPv4 by default to avoid IPv6-only resolution issues in some hosts
    family: 4
  };

  // Allow an opt-in insecure TLS mode for debugging (DO NOT enable in production)
  if (process.env.DEBUG_MONGO_ALLOW_INSECURE === 'true') {
    console.warn('⚠️ DEBUG_MONGO_ALLOW_INSECURE is enabled — TLS certificate verification will be relaxed (testing only)');
    connectOptions.tlsInsecure = true;
  }

  // Retry/connect loop with exponential backoff (keeps trying, does not exit the process)
  let attempt = 0;
  const maxDelay = 30000; // 30s
  while (true) {
    try {
      attempt += 1;
      console.log(`🔄 Attempting MongoDB connection (attempt ${attempt})...`);
      // If using SRV, the driver will resolve the seed list over DNS and handle TLS automatically
      await mongoose.connect(mongoUrl, connectOptions);
      console.log('✅ MongoDB Connected Successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      break; // success
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), maxDelay);
      console.error(`❌ MongoDB Connection Error (attempt ${attempt}): ${error.message}`);
      // Full error object for logs (helps Render/Atlas debugging)
      console.error(error);
      // If TLS alert or ReplicaSetNoPrimary appears, give actionable hint
      if (error && error.message && /ReplicaSetNoPrimary|TLS|SSL|ssl/i.test(error.message)) {
        console.error('ℹ️ Hint: If you are using MongoDB Atlas, ensure your connection string is the SRV form (mongodb+srv://...), that the user:pass are correct, and that Atlas IP Access List allows connections from your host (or 0.0.0.0/0 for testing).');
      }
      console.log(`⏳ Retrying in ${delay}ms...`);
      // wait with small jitter
      const jitter = Math.floor(Math.random() * 300);
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      // loop continues
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Error:', err);
});

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose event: connected');
});

mongoose.connection.on('reconnectFailed', () => {
  console.error('❌ Mongoose event: reconnectFailed');
});

module.exports = connectDB;