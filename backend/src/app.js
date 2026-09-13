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
  crossOriginEmbedderPolicy: false,  // ✅ عطّلناه لأنه يمنع R2 images
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "*.r2.cloudflarestorage.com",
        "*.r2.dev",              // ✅ أضفنا
        "https:",
      ],
      fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
      connectSrc: [
        "'self'",
        "ws://localhost:5001",
        "wss://localhost:5001",
        "ws://localhost:5173",
        "ws://localhost:5174",
        "ws://localhost:8080",
        "http://localhost:5001",
        "https://*.r2.cloudflarestorage.com",
        "https://*.r2.dev",
        "wss://*.render.com",
      ],
      mediaSrc: ["'self'", "blob:", "data:", "https:"],
      frameSrc: ["'self'", "blob:"],
    },
  },
}));

// ============================================================
// ✅ CORS - إعدادات شاملة
// ============================================================
const corsOptions = {
  origin: function (origin, callback) {
    // ✅ السماح بدون origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
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
    ];

    // ✅ السماح بـ wildcards
    const isAllowed = 
      allowedOrigins.includes(origin) ||
      /\.onrender\.com$/.test(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /\.netlify\.app$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Portal-Id',
    'Accept',
    'Origin',
    'Range',
    'Content-Range',
  ],
  exposedHeaders: [
    'Content-Range',
    'Accept-Ranges',
    'Content-Length',
    'Content-Disposition',
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ CORS headers يدوياً
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Portal-Id, Accept, Origin, Range');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Disposition');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ============================================================
// ✅ الأمان
// ============================================================

app.use(xss());
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

// ============================================================
// ✅ Body Parser (قبل Rate Limit)
// ============================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================
// ✅ Rate Limiting - للإنتاج فقط
// ============================================================

if (config.nodeEnv === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health' || req.path === '/api/health',
  });

  app.use('/api', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
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

  console.log('✅ Rate limiting ENABLED (production mode)');
} else {
  console.log('⚠️  Rate limiting DISABLED (development mode)');
}

// ============================================================
// ✅ Logging (مخفّف)
// ============================================================

if (config.nodeEnv === 'production') {
  app.use(morgan('combined'));
} else {
  // ✅ تجاهل الطلبات المتكررة والمزعجة
  app.use(morgan('dev', {
    skip: (req) => {
      return req.url.includes('/socket.io/') ||
             req.url.includes('/notifications/unread') ||
             req.url === '/health';
    },
  }));
}

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