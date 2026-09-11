// backend/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/security.js';
import { config } from './config/env.js';

const app = express();

// ============================================================
// ✅ الأمان - إعدادات Helmet المتقدمة
// ============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "*.r2.cloudflarestorage.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      connectSrc: [
        "'self'", 
        "ws://localhost:5001", 
        "wss://localhost:5001",
        "ws://localhost:5173",
        "wss://*.render.com"
      ],
    },
  },
}));

// ============================================================
// ✅ CORS - إعدادات شاملة
// ============================================================

const corsOptions = {
  origin: [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'http://127.0.0.1',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:8080',
    'http://localhost:5001',
    'https://*.render.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Portal-Id',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// ✅ تطبيق CORS قبل كل شيء
app.use(cors(corsOptions));

// ✅ معالجة طلبات OPTIONS (Preflight) يدوياً
app.options('*', cors(corsOptions));

// ✅ إضافة CORS headers يدوياً لجميع الردود
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Portal-Id, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // معالجة طلبات OPTIONS مباشرة
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ============================================================
// ✅ إضافة الأمان
// ============================================================

// منع هجمات XSS
app.use(xss());

// منع هجمات NoSQL Injection (MongoDB)
app.use(mongoSanitize());

// منع Parameter Pollution
app.use(hpp());

// ضغط الردود
app.use(compression());

// ============================================================
// ✅ Rate Limiting - منع هجمات DDoS
// ============================================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================================
// ✅ Middleware العامة
// ============================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// ✅ Headers الأمان المخصصة
app.use(securityHeaders);

// ============================================================
// ✅ Routes
// ============================================================

app.use('/', router);

// ============================================================
// ✅ Error Handler
// ============================================================

app.use(errorHandler);

export default app;