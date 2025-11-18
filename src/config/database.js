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

  // Retry/connect loop with exponential backoff (keeps trying, does not exit the process)
  let attempt = 0;
  const maxDelay = 30000; // 30s
  while (true) {
    try {
      attempt += 1;
      console.log(`🔄 Attempting MongoDB connection (attempt ${attempt})...`);
      await mongoose.connect(mongoUrl, {
        // use unified topology options as needed by mongoose v5/v6+
        // leave defaults for mongoose v8
      });
      console.log('✅ MongoDB Connected Successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      break; // success
    } catch (error) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), maxDelay);
      console.error(`❌ MongoDB Connection Error (attempt ${attempt}): ${error.message}`);
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

module.exports = connectDB;