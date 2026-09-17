// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { Account } from '../models/Account.model.js';
import { Portal } from '../models/Portal.model.js';
import { config } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';

// ============================================================
// ✅ قائمة المسارات العامة (لا تحتاج مصادقة)
// ============================================================
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
// ✅ ✅ دالة مساعدة: تحميل الحساب + معلومات البوابة
// ✅ لا نستخدم populate على portalId — يبقى ObjectId
// ============================================================
const loadAccountWithPortal = async (accountId) => {
  // 1. جلب الحساب بدون populate
  const account = await Account.findById(accountId)
    .select('-passwordHash');

  if (!account) {
    return { account: null, portalInfo: null };
  }

  // 2. جلب معلومات البوابة منفصلة (إن وُجدت)
  let portalInfo = null;
  if (account.portalId) {
    portalInfo = await Portal.findById(account.portalId)
      .select('name slug isActive logo')
      .lean();
  }

  return { account, portalInfo };
};

// ============================================================
// ✅ ✅ دالة المصادقة الرئيسية - دعم Socket.IO
// ✅ account.portalId يبقى ObjectId دائماً
// ============================================================
export const authenticate = async (req, res, next) => {
  try {
    // ✅ التحقق من المسار العام (لـ HTTP فقط)
    if (req.path && isPublicPath(req.path)) {
      return next();
    }

    // ============================================================
    // استخراج التوكن
    // ============================================================
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

    // ============================================================
    // لا يوجد توكن
    // ============================================================
    if (!token) {
      // Socket.IO
      if (!res || typeof res.status !== 'function') {
        const error = new Error('Authentication required - No token provided');
        error.status = 401;
        return next(error);
      }
      // HTTP
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided',
        code: 'NO_TOKEN',
      });
    }

    // ============================================================
    // التحقق من التوكن
    // ============================================================
    let decoded;
    try {
      decoded = verifyToken(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }
    } catch (err) {
      console.log('❌ Token verification failed:', err.message);

      if (!res || typeof res.status !== 'function') {
        const error = new Error('Invalid or expired token');
        error.status = 401;
        return next(error);
      }
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    console.log('✅ Token verified for user:', decoded.id || decoded._id);

    // ============================================================
    // ✅ جلب الحساب + معلومات البوابة (بدون populate)
    // ============================================================
    const { account, portalInfo } = await loadAccountWithPortal(
      decoded.id || decoded._id
    );

    if (!account) {
      console.log('❌ Account not found:', decoded.id || decoded._id);

      if (!res || typeof res.status !== 'function') {
        const error = new Error('Account not found');
        error.status = 404;
        return next(error);
      }
      return res.status(404).json({
        success: false,
        message: 'Unauthorized - Account not found',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    if (!account.isActive) {
      console.log('❌ Account deactivated:', decoded.id || decoded._id);

      if (!res || typeof res.status !== 'function') {
        const error = new Error('Account is deactivated');
        error.status = 403;
        return next(error);
      }
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // ============================================================
    // ✅ إضافة بيانات المستخدم إلى req
    // ✅ account.portalId يبقى ObjectId (لا populate)
    // ✅ portalInfo منفصل للاستخدام عند الحاجة
    // ============================================================
    req.account = account;
    req.accountId = account._id;

    // ✅ ObjectId نظيف
    const portalId = account.portalId || null;

    req.user = {
      id: account._id,
      _id: account._id,
      portalId: portalId, // ✅ ObjectId
      role: account.role,
      email: account.email,
      username: account.username,
      fullName: account.profile?.fullName,
    };

    req.portalId = portalId; // ✅ ObjectId

    // ✅ معلومات البوابة منفصلة (اختياري — للاستخدام عند الحاجة)
    req.portalInfo = portalInfo;

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);

    if (!res || typeof res.status !== 'function') {
      const err = new Error(error.message || 'Authentication failed');
      err.status = 500;
      return next(err);
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
};

// ============================================================
// ✅ ✅ دالة مصادقة اختيارية (للصفحات العامة)
// ✅ نفس المنطق — بدون populate
// ============================================================
export const optionalAuth = async (req, res, next) => {
  try {
    // ============================================================
    // استخراج التوكن (إن وُجد)
    // ============================================================
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

    // ============================================================
    // لا يوجد توكن → زائر
    // ============================================================
    if (!token) {
      req.user = null;
      req.account = null;
      req.accountId = null;
      req.portalId = null;
      req.portalInfo = null;
      req.isGuest = true;
      console.log('👤 Guest access:', req.method, req.originalUrl);
      return next();
    }

    // ============================================================
    // التحقق من التوكن
    // ============================================================
    try {
      const decoded = verifyToken(token);
      if (!decoded) {
        req.isGuest = true;
        return next();
      }

      // ✅ جلب الحساب بدون populate
      const { account, portalInfo } = await loadAccountWithPortal(
        decoded.id || decoded._id
      );

      if (account && account.isActive) {
        req.account = account;
        req.accountId = account._id;

        const portalId = account.portalId || null;

        req.user = {
          id: account._id,
          _id: account._id,
          portalId: portalId, // ✅ ObjectId
          role: account.role,
          email: account.email,
          username: account.username,
          fullName: account.profile?.fullName,
        };

        req.portalId = portalId; // ✅ ObjectId
        req.portalInfo = portalInfo;
        req.isGuest = false;

        console.log('✅ Authenticated access:', account.email);
      } else {
        req.isGuest = true;
      }
    } catch (err) {
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

// ============================================================
// ✅ ✅ دالة مصادقة Socket.IO مع عزل البوابات
// ✅ نفس المنطق — بدون populate
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
      console.log('❌ Socket auth: Token verification failed:', err.message);
      return next(new Error('Invalid or expired token'));
    }

    const accountId = decoded.id || decoded._id;
    console.log('✅ Socket auth: Token verified for user:', accountId);

    // ============================================================
    // 2️⃣ جلب الحساب + معلومات البوابة
    // ============================================================
    const { account, portalInfo } = await loadAccountWithPortal(accountId);

    if (!account) {
      console.log('❌ Socket auth: Account not found:', accountId);
      return next(new Error('Account not found'));
    }

    if (!account.isActive) {
      console.log('❌ Socket auth: Account deactivated:', accountId);
      return next(new Error('Account is deactivated'));
    }

    // ============================================================
    // 3️⃣ تحديد البوابة الفعلية
    // ============================================================
    let effectivePortalId = null;
    let effectivePortal = null;

    // ============================================================
    // SUPER ADMIN
    // ============================================================
    if (account.role === 'super_admin') {
      if (!requestedPortalId) {
        console.log('❌ Socket auth: Super admin must provide portalId');
        return next(new Error('Portal selection required for super admin'));
      }

      // البحث عن البوابة
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
        console.log('❌ Socket auth: Requested portal not found:', requestedPortalId);
        return next(new Error('Portal not found'));
      }

      if (!portal.isActive) {
        console.log('❌ Socket auth: Requested portal is inactive:', portal._id);
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
      if (!account.portalId) {
        console.log(`❌ Socket auth: Account ${account._id} has no portal`);
        return next(new Error('Account portal is not configured'));
      }

      // ✅ account.portalId هو ObjectId نظيف
      effectivePortalId = account.portalId;
      effectivePortal = portalInfo;

      // إذا أرسل المستخدم Portal يدوياً، يجب أن يطابق
      if (requestedPortalId) {
        const requestedStr = String(requestedPortalId);
        const effectiveStr = String(effectivePortalId);

        // مطابقة بـ ObjectId أو slug
        const matchesId = requestedStr === effectiveStr;
        const matchesSlug = portalInfo?.slug === requestedStr;

        if (!matchesId && !matchesSlug) {
          console.log(
            `❌ Socket auth: Portal mismatch. Account=${effectivePortalId}, requested=${requestedPortalId}`
          );
          return next(new Error('Portal access denied'));
        }
      }

      // التحقق من أن البوابة فعالة
      if (portalInfo && portalInfo.isActive === false) {
        console.log(`❌ Socket auth: Account portal is inactive: ${effectivePortalId}`);
        return next(new Error('Portal is inactive'));
      }
    }

    // ============================================================
    // 4️⃣ تخزين بيانات المصادقة
    // ============================================================
    socket.account = account;
    socket.accountId = account._id;
    socket.portalId = effectivePortalId; // ✅ ObjectId
    socket.portal = effectivePortal; // معلومات البوابة
    socket.user = {
      id: account._id,
      _id: account._id,
      portalId: effectivePortalId, // ✅ ObjectId
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
    next(new Error(error.message || 'Authentication failed'));
  }
};

// ============================================================
// ✅ Middleware للتحقق من دور المستخدم
// ============================================================
export const requireRole = (...roles) => {
  return (req, res, next) => {
    // Socket.IO
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

    // HTTP
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
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
      // ========================================================
      // Socket.IO
      // ========================================================
      if (!res || typeof res.status !== 'function') {
        const account = req.account;

        if (!account) {
          return next(new Error('Unauthorized'));
        }

        // SUPER ADMIN
        if (account.role === 'super_admin') {
          return next();
        }

        // Portal Context
        const portalId =
          req.portalId ||
          req.portal?._id ||
          account.portalId;

        if (!portalId) {
          return next(new Error('Portal context is required'));
        }

        // منع الوصول إلى Portal أخرى
        if (
          account.portalId &&
          account.portalId.toString() !== portalId.toString()
        ) {
          return next(new Error('Portal access denied'));
        }

        // PORTAL ADMIN
        if (account.role === 'portal_admin') {
          return next();
        }

        // التحقق من الصلاحية
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

      if (!res || typeof res.status !== 'function') {
        return next(new Error('Authorization error'));
      }

      return res.status(500).json({
        success: false,
        message: 'Authorization error',
        code: 'AUTHORIZATION_ERROR',
      });
    }
  };
};

// ============================================================
// ✅ دالة مساعدة للتحقق من التوكن في Socket.IO
// ============================================================
export const getSocketAccount = async (token) => {
  try {
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const { account, portalInfo } = await loadAccountWithPortal(
      decoded.id || decoded._id
    );

    if (!account || !account.isActive) return null;

    // ✅ إرفاق معلومات البوابة للاستخدام
    account.portalInfo = portalInfo;

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
  optionalAuth,
  authenticateSocket,
  requireRole,
  requirePermission,
  getSocketAccount,
};