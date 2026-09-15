// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { Account } from '../models/Account.model.js';
import { Portal } from '../models/Portal.model.js';
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
// ✅ ✅ دالة مصادقة خاصة بـ Socket.IO مع عزل البوابات
// ============================================================

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const requestedPortalId = socket.handshake.auth?.portalId || null;

    if (!token) {
      console.log('❌ Socket auth: No token provided');
      return next(new Error('Authentication required - No token provided'));
    }

    console.log('🔍 Socket auth: Verifying token...');

    // ============================================================
    // 1️⃣ التحقق من التوكن
    // ============================================================

    let decoded;

    try {
      decoded = verifyToken(token);

      if (!decoded) {
        throw new Error('Invalid token');
      }
    } catch (err) {
      console.log(
        '❌ Socket auth: Token verification failed:',
        err.message
      );

      return next(new Error('Invalid or expired token'));
    }

    const accountId = decoded.id || decoded._id;

    console.log(
      '✅ Socket auth: Token verified for user:',
      accountId
    );

    // ============================================================
    // 2️⃣ جلب حساب المستخدم
    // ============================================================

    const account = await Account.findById(accountId)
      .select('-passwordHash')
      .populate('portalId', 'name slug isActive');

    if (!account) {
      console.log(
        '❌ Socket auth: Account not found:',
        accountId
      );

      return next(new Error('Account not found'));
    }

    if (!account.isActive) {
      console.log(
        '❌ Socket auth: Account deactivated:',
        accountId
      );

      return next(new Error('Account is deactivated'));
    }

    // ============================================================
    // 3️⃣ تحديد البوابة
    // ============================================================

    let effectivePortalId = null;
    let effectivePortal = null;

    // ============================================================
    // SUPER ADMIN
    // ============================================================

    if (account.role === 'super_admin') {

      // Super Admin يجب أن يحدد البوابة صراحة
      if (!requestedPortalId) {
        console.log(
          '❌ Socket auth: Super admin must provide portalId'
        );

        return next(
          new Error('Portal selection required for super admin')
        );
      }

      // البحث عن البوابة باستخدام ObjectId أو slug
      let portal = null;

      if (mongoose.Types.ObjectId.isValid(String(requestedPortalId))) {
        portal = await Portal.findById(requestedPortalId);
      }

      if (!portal) {
        portal = await Portal.findOne({
          slug: String(requestedPortalId).trim(),
        });
      }

      if (!portal) {
        console.log(
          '❌ Socket auth: Requested portal not found:',
          requestedPortalId
        );

        return next(new Error('Portal not found'));
      }

      if (!portal.isActive) {
        console.log(
          '❌ Socket auth: Requested portal is inactive:',
          portal._id
        );

        return next(new Error('Portal is inactive'));
      }

      effectivePortal = portal;
      effectivePortalId = portal._id;

      console.log(
        `✅ Socket auth: Super admin selected portal ${portal._id} (${portal.slug})`
      );
    }

    // ============================================================
    // المستخدمون العاديون
    // ============================================================

    else {

      // يجب أن يكون للحساب Portal
      if (!account.portalId) {
        console.log(
          `❌ Socket auth: Account ${account._id} has no portal`
        );

        return next(new Error('Account portal is not configured'));
      }

      effectivePortal = account.portalId;
      effectivePortalId = account.portalId._id;

      // إذا أرسل المستخدم Portal يدويًا،
      // يجب أن يطابق Portal الحساب
      if (
        requestedPortalId &&
        String(requestedPortalId) !== String(effectivePortalId) &&
        String(requestedPortalId) !== String(account.portalId.slug)
      ) {
        console.log(
          `❌ Socket auth: Portal mismatch. Account portal=${effectivePortalId}, requested=${requestedPortalId}`
        );

        return next(new Error('Portal access denied'));
      }

      // يجب أن تكون البوابة فعالة
      if (account.portalId.isActive === false) {
        console.log(
          `❌ Socket auth: Account portal is inactive: ${effectivePortalId}`
        );

        return next(new Error('Portal is inactive'));
      }
    }

    // ============================================================
    // 4️⃣ تخزين بيانات المصادقة داخل Socket
    // ============================================================

    socket.account = account;
    socket.accountId = account._id;

    // البوابة الفعلية التي تم التحقق منها
    socket.portalId = effectivePortalId;

    socket.portal = effectivePortal;

    socket.user = {
      id: account._id,
      _id: account._id,
      portalId: effectivePortalId,
      role: account.role,
      email: account.email,
      username: account.username,
      fullName: account.profile?.fullName,
    };

    console.log(
      `✅ Socket authenticated: ${socket.accountId} (${account.role}) | Portal: ${effectivePortalId}`
    );

    next();

  } catch (error) {
    console.error('❌ Socket auth error:', error);

    next(
      new Error(
        error.message || 'Authentication failed'
      )
    );
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
// ============================================================
// Middleware للتحقق من صلاحية محددة
// ============================================================

export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // ========================================================
      // Socket.IO
      // ========================================================
      if (!res || typeof res.status !== 'function') {
        const account = req.account;

        if (!account) {
          return next(new Error('Unauthorized'));
        }

        // SUPER ADMIN
        // يستطيع العمل على أي Portal
        if (account.role === 'super_admin') {
          return next();
        }

        // يجب أن تكون هناك Portal Context
        const portalId =
          req.portalId ||
          req.portal?._id ||
          account.portalId;

        if (!portalId) {
          return next(new Error('Portal context is required'));
        }

        // المستخدم العادي لا يستطيع الوصول إلى Portal أخرى
        if (
          account.portalId &&
          account.portalId.toString() !== portalId.toString()
        ) {
          return next(new Error('Portal access denied'));
        }

        // PORTAL ADMIN
        // لديه جميع الصلاحيات داخل بوابته فقط
        if (account.role === 'portal_admin') {
          return next();
        }

        // التحقق من الصلاحية المحددة
        const hasPermission =
          typeof account.hasPortalPermission === 'function'
            ? account.hasPortalPermission(portalId, permission)
            : false;

        if (!hasPermission) {
          return next(new Error('Insufficient permissions'));
        }

        return next();
      }

      // ========================================================
      // HTTP
      // ========================================================
      if (!req.account) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        });
      }

      const account = req.account;

      // ========================================================
      // SUPER ADMIN
      // ========================================================
      if (account.role === 'super_admin') {
        return next();
      }

      // ========================================================
      // Portal Context
      // ========================================================
      const portalId =
        req.portalId ||
        req.portal?._id ||
        account.portalId;

      if (!portalId) {
        return res.status(400).json({
          success: false,
          message: 'Portal context is required',
          code: 'PORTAL_ID_REQUIRED',
        });
      }

      // ========================================================
      // منع الوصول إلى Portal أخرى
      // ========================================================
      if (
        account.portalId &&
        account.portalId.toString() !== portalId.toString()
      ) {
        console.warn(
          `🚫 Permission blocked: account=${account._id}, ` +
          `accountPortal=${account.portalId}, requestedPortal=${portalId}`
        );

        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this portal.',
          code: 'PORTAL_ACCESS_DENIED',
        });
      }

      // ========================================================
      // PORTAL ADMIN
      // ========================================================
      // لديه جميع الصلاحيات داخل بوابته فقط
      if (account.role === 'portal_admin') {
        return next();
      }

      // ========================================================
      // المستخدمون الآخرون
      // ========================================================
      const hasPermission =
        typeof account.hasPortalPermission === 'function'
          ? account.hasPortalPermission(portalId, permission)
          : false;

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

      // Socket.IO
      if (!res || typeof res.status !== 'function') {
        return next(new Error('Authorization error'));
      }

      // HTTP
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
        code: 'AUTHORIZATION_ERROR',
      });
    }
  };
};
// ============================================================
// ✅ ✅ دالة مصادقة اختيارية (للصفحات العامة)
// ============================================================
export const optionalAuth = async (req, res, next) => {
  try {
    // ✅ استخراج التوكن (إن وُجد)
    let token = null;

    if (req.headers?.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }
    }

    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // ✅ إذا لم يوجد توكن، تابع كزائر
    if (!token) {
      req.user = null;
      req.account = null;
      req.accountId = null;
      req.isGuest = true;
      console.log('👤 Guest access:', req.method, req.originalUrl);
      return next();
    }

    // ✅ حاول التحقق من التوكن
    try {
      const decoded = verifyToken(token);
      if (!decoded) {
        req.isGuest = true;
        return next();
      }

      const account = await Account.findById(decoded.id || decoded._id)
        .select('-passwordHash')
        .populate('portalId', 'name slug');

      if (account && account.isActive) {
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
        req.isGuest = false;
        console.log('✅ Authenticated access:', account.email);
      } else {
        req.isGuest = true;
      }
    } catch (err) {
      // ⚠️ توكن غير صالح → تابع كزائر
      console.log('⚠️ Optional auth: invalid token, continuing as guest');
      req.isGuest = true;
    }

    next();
  } catch (error) {
    console.error('❌ Optional auth error:', error);
    req.isGuest = true;
    next();
  }
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
  optionalAuth,        // ✅ أضف هذه
  authenticateSocket,
  requireRole,
  requirePermission,
  getSocketAccount,
};
