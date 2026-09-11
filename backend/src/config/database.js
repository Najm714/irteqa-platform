// backend/src/config/database.js
import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  try {
    // ✅ التحقق من وجود URI
    if (!config.mongodbUri) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please check your .env file.');
    }

    console.log('🔄 Connecting to MongoDB...');
    
    // ✅ إخفاء البيانات الحساسة في السجل
    const sanitizedUri = config.mongodbUri.replace(/\/\/.*@/, '//***:***@');
    console.log(`  - URI: ${sanitizedUri}`);

    await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`  - Database: ${mongoose.connection.name}`);
    console.log(`  - Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:');
    console.error(`  - Message: ${error.message}`);
    console.error(`  - Stack: ${error.stack}`);
    
    // ✅ في بيئة الإنتاج، أوقف الخادم
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Exiting due to database connection failure');
      process.exit(1);
    }
    
    // ✅ في بيئة التطوير، استمر مع تحذير
    console.warn('⚠️ Continuing without database connection (development mode)');
  }
};

// ✅ مراقبة أحداث الاتصال
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// ✅ إغلاق الاتصال بشكل نظيف عند إنهاء العملية
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

export default connectDB;