// backend/src/middleware/errorHandler.js
import { config } from '../config/env.js';

// ✅ معالج الأخطاء المركزي
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // أخطاء JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // أخطاء MongoDB
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      code: 'INVALID_ID',
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: 'DUPLICATE_KEY',
      field,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // أخطاء Rate Limiting
  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT',
    });
  }

  // ✅ في بيئة التطوير، عرض تفاصيل الخطأ
  if (config.nodeEnv === 'development') {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      stack: err.stack,
      code: err.code || 'INTERNAL_ERROR',
    });
  }

  // ✅ في بيئة الإنتاج، عرض رسالة عامة فقط
  return res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};