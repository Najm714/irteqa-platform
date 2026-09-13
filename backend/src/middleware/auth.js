// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { Account } from '../models/Account.model.js';
import { config } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';

// ✅ قائمة المسارات العامة (لا تحتاج مصادقة)
const PUBLIC_PATHS = [
  '/health',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/legal/public',
  '/api/explanations/public',
  '/api/videos/public',
  '/api/files/public',
];

// ✅ التحقق من المسار العام
const isPublicPath = (path) => {
  if (!path) return false;
  return PUBLIC_PATHS.some(p => path.startsWith(p));
};

// ============================================================
// ✅ ✅ دالة المصادقة الرئيسية - معدلة لدعم Socket.IO
// ============================================================

export const authenticate = async (req, res, next) => {
  try {
    // ✅ التحقق من المسار العام (لـ HTTP فقط)
    if (req.path && isPublicPath(req.path)) {
      return next();
    }

    // ✅ استخراج التوكن
    let token = null;
    
    // 1. من Headers
    if (req.headers?.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }
    }
    
    // 2. من Query String
    if (!token && req.query?.token) {
      token = req.query.token;
    }
    
    // 3. من Cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // ✅ إذا لم يوجد توكن
    if (!token) {
      // ✅ في حالة Socket.IO، لا يوجد res
      if (!res || typeof res.status !== 'function') {
        const error = new Error('Authentication required - No token provided');
        error.status = 401;
        return next(error);
      }
      // ✅ في حالة HTTP
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided',
        code: 'NO_TOKEN',
      });
    }

    // ✅ التحقق من التوكن
    let decoded;
    try {
      decoded = verifyToken(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }
    } catch (err) {
      console.log('❌ Token verification failed:', err.message);
      
      // ✅ في حالة Socket.IO
      if (!res || typeof res.status !== 'function') {
        const error = new Error('Invalid or expired token');
        error.status = 401;
        return next(error);
      }
      // ✅ في حالة HTTP
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    console.log('✅ Token verified for user:', decoded.id || decoded._id);

    // ✅ البحث عن الحساب
    const account = await Account.findById(decoded.id || decoded._id)
      .select('-passwordHash')
      .populate('portalId', 'name slug');

    if (!account) {
      console.log('❌ Account not found:', decoded.id || decoded._id);
      
      // ✅ في حالة Socket.IO
      if (!res || typeof res.status !== 'function') {
        const error = new Error('Account not found');
        error.status = 404;
        return next(error);
      }
      // ✅ في حالة HTTP
      return res.status(404).json({
        success: false,
        message: 'Unauthorized - Account not found',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    if (!account.isActive) {
      console.log('❌ Account deactivated:', decoded.id || decoded._id);
      
      // ✅ في حالة Socket.IO
      if (!res || typeof res.status !== 'function') {
        const error = new Error('Account is deactivated');
        error.status = 403;
        return next(error);
      }
      // ✅ في حالة HTTP
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // ✅ إضافة بيانات المستخدم إلى req
    req.account = account;
    req.accountId = account._id;
    req.user = {
      id: account._id,
      _id: account._id,
      portalId: account.portalId?._id || account.portalId,
      role: account.role,
      email: account.email,
      username: account.username,
      fullName: account.profile?.fullName,
    };
    req.portalId = account.portalId?._id || account.portalId;

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    
    // ✅ في حالة Socket.IO
    if (!res || typeof res.status !== 'function') {
      const err = new Error(error.message || 'Authentication failed');
      err.status = 500;
      return next(err);
    }
    // ✅ في حالة HTTP
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
};

// ============================================================
// ✅ ✅ دالة مصادقة خاصة بـ Socket.IO
// ============================================================

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('❌ Socket auth: No token provided');
      return next(new Error('Authentication required - No token provided'));
    }

    console.log('🔍 Socket auth: Verifying token...');

    // ✅ التحقق من التوكن
    let decoded;
    try {
      decoded = verifyToken(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }
    } catch (err) {
      console.log('❌ Socket auth: Token verification failed:', err.message);
      return next(new Error('Invalid or expired token'));
    }

    console.log('✅ Socket auth: Token verified for user:', decoded.id || decoded._id);

    // ✅ جلب حساب المستخدم
    const account = await Account.findById(decoded.id || decoded._id)
      .select('-passwordHash')
      .populate('portalId', 'name slug');

    if (!account) {
      console.log('❌ Socket auth: Account not found:', decoded.id || decoded._id);
      return next(new Error('Account not found'));
    }

    if (!account.isActive) {
      console.log('❌ Socket auth: Account deactivated:', decoded.id || decoded._id);
      return next(new Error('Account is deactivated'));
    }

    // ✅ إضافة بيانات المستخدم إلى socket
    socket.account = account;
    socket.accountId = account._id;
    socket.portalId = account.portalId?._id || account.portalId;
    socket.user = {
      id: account._id,
      _id: account._id,
      portalId: account.portalId?._id || account.portalId,
      role: account.role,
      email: account.email,
      username: account.username,
      fullName: account.profile?.fullName,
    };

    console.log(`✅ Socket authenticated: ${socket.accountId} (${socket.account.role})`);
    next();
  } catch (error) {
    console.error('❌ Socket auth error:', error);
    next(new Error(error.message || 'Authentication failed'));
  }
};

// ============================================================
// ✅ Middleware للتحقق من دور المستخدم
// ============================================================

export const requireRole = (...roles) => {
  return (req, res, next) => {
    // ✅ في حالة Socket.IO
    if (!res || typeof res.status !== 'function') {
      if (!req.user && !req.account) {
        return next(new Error('Unauthorized'));
      }
      const user = req.user || req.account;
      if (!roles.includes(user.role)) {
        return next(new Error('Insufficient permissions'));
      }
      return next();
    }

    // ✅ في حالة HTTP
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};

// ============================================================
// ✅ Middleware للتحقق من صلاحية محددة
// ============================================================

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // ✅ في حالة Socket.IO
      if (!res || typeof res.status !== 'function') {
        const account = req.account || req.user;
        if (!account) {
          return next(new Error('Unauthorized'));
        }

        // المشرف العام لديه جميع الصلاحيات
        if (account.role === 'super_admin') {
          return next();
        }

        // مدير البوابة لديه جميع الصلاحيات
        if (account.role === 'portal_admin') {
          return next();
        }

        return next(new Error('Insufficient permissions'));
      }

      // ✅ في حالة HTTP
      if (!req.account) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // المشرف العام لديه جميع الصلاحيات
      if (req.account.role === 'super_admin') {
        return next();
      }

      // ✅ التحقق من صلاحية البوابة
      const portalId = req.portalId || req.headers['x-portal-id'];
      
      if (req.account.role === 'portal_admin' && portalId) {
        // مدير البوابة لديه جميع الصلاحيات في بوابته
        if (req.account.portalId?.toString() === portalId.toString() ||
            req.account.portalId?._id?.toString() === portalId.toString()) {
          return next();
        }
      }

      // التحقق من صلاحية محددة
      const hasPermission = await req.account.hasPortalPermission?.(
        portalId,
        permission
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      next();
    } catch (error) {
      console.error('❌ Permission middleware error:', error);
      
      // ✅ في حالة Socket.IO
      if (!res || typeof res.status !== 'function') {
        return next(new Error('Authorization error'));
      }
      
      res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

// ✅ ✅ دالة مساعدة للتحقق من التوكن في Socket.IO
export const getSocketAccount = async (token) => {
  try {
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const account = await Account.findById(decoded.id || decoded._id)
      .select('-passwordHash')
      .populate('portalId', 'name slug');

    if (!account || !account.isActive) return null;

    return account;
  } catch (error) {
    console.error('❌ getSocketAccount error:', error);
    return null;
  }
};

// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================

export default {
  authenticate,
  authenticateSocket,
  requireRole,
  requirePermission,
  getSocketAccount,
};
