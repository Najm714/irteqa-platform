// backend/src/config/env.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ تحميل ملف .env من المجلد الرئيسي
const envPath = path.join(__dirname, '../../.env');
console.log(`📂 Loading .env from: ${envPath}`);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  console.error('⚠️ Please create a .env file in the backend directory');
}

// ✅ التحقق من وجود المتغيرات الأساسية
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnv.join(', '));
  console.error('⚠️ Please check your .env file');
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001'),
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Storage
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  storagePath: process.env.STORAGE_PATH || './uploads',
  
  // R2
  r2: {
    endpoint: process.env.R2_ENDPOINT,
    accessKey: process.env.R2_ACCESS_KEY,
    secretKey: process.env.R2_SECRET_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
  
  // Cloudflare Stream
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
  },
  
  // Client URLs
  clientUrls: process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',') : ['http://localhost'],
  
  // Portal URLs
  portalAUrl: process.env.PORTAL_A_URL || 'http://localhost',
  portalBUrl: process.env.PORTAL_B_URL || 'http://localhost:8080',
  
  // Admin
  superAdminEmails: process.env.SUPER_ADMIN_EMAILS ? process.env.SUPER_ADMIN_EMAILS.split(',') : ['admin@irteqa.com'],
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // SMTP
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  
  // Payment
  payment: {
    gatewayUrl: process.env.PAYMENT_GATEWAY_URL,
    merchantId: process.env.PAYMENT_MERCHANT_ID,
    secret: process.env.PAYMENT_SECRET,
  },
};

// ✅ تسجيل المتغيرات المحملة (للتأكد)
console.log('✅ Environment loaded:');
console.log(`  - NODE_ENV: ${config.nodeEnv}`);
console.log(`  - MONGODB_URI: ${config.mongodbUri ? '✓ Set' : '✗ Missing'}`);
console.log(`  - JWT_SECRET: ${config.jwtSecret ? '✓ Set' : '✗ Missing'}`);
console.log(`  - STORAGE_PROVIDER: ${config.storageProvider}`);
console.log(`  - R2_BUCKET: ${config.r2.bucket || '✗ Not set'}`);