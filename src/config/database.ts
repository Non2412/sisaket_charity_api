import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async (): Promise<void> => {
  const mongoUrl = process.env.MONGOOSE_URL || process.env.MONGODB_URI;
  if (!mongoUrl) {
    console.error('❌ No MongoDB connection string provided. Set MONGOOSE_URL or MONGODB_URI in your environment.');
    return;
  }

  const maskMongoUrl = (url: string) => {
    try {
      return url.replace(/\/\/([^:@\/]+)(:[^@\/]+)?@/, '//<REDACTED>@');
    } catch (e) {
      return '<masked>';
    }
  };

  const usedVar = process.env.MONGOOSE_URL ? 'MONGOOSE_URL' : 'MONGODB_URI';
  console.log(`🔗 Using ${usedVar}: ${maskMongoUrl(mongoUrl)}`);

  const connectOptions: any = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    tls: true,
    tlsInsecure: false,
    family: 4
  };

  if (process.env.DEBUG_MONGO_ALLOW_INSECURE === 'true') {
    console.warn('⚠️ DEBUG_MONGO_ALLOW_INSECURE is enabled — TLS certificate verification will be relaxed (testing only)');
    connectOptions.tlsInsecure = true;
  }

  let attempt = 0;
  const maxDelay = 30000;
  while (true) {
    try {
      attempt += 1;
      console.log(`🔄 Attempting MongoDB connection (attempt ${attempt})...`);
      await mongoose.connect(mongoUrl, connectOptions);
      console.log('✅ MongoDB Connected Successfully');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      break;
    } catch (error: any) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), maxDelay);
      console.error(`❌ MongoDB Connection Error (attempt ${attempt}): ${error.message}`);
      console.error(error);
      if (error && error.message && /ReplicaSetNoPrimary|TLS|SSL|ssl/i.test(error.message)) {
        console.error('ℹ️ Hint: If you are using MongoDB Atlas, ensure your connection string is the SRV form (mongodb+srv://...), that the user:pass are correct, and that Atlas IP Access List allows connections from your host (or 0.0.0.0/0 for testing).');
      }
      console.log(`⏳ Retrying in ${delay}ms...`);
      const jitter = Math.floor(Math.random() * 300);
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
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

export default connectDB;
