// backend/src/middleware/resourceOwnership.js

import { Request } from '../models/Request.model.js';
import { File } from '../models/File.model.js';
import { Message } from '../models/Message.model.js';

// ============================================================
// Helpers
// ============================================================

const getPortalId = (req) => {
  return req.portalId || req.portal?._id || req.account?.portalId?._id || req.account?.portalId || null;
};

const getAccount = (req) => {
  return req.account || null;
};

const getAccountId = (account) => {
  return account?._id ? String(account._id) : null;
};

const isAdmin = (account) => {
  return (
    account?.role === 'portal_admin' ||
    account?.role === 'super_admin'
  );
};

// ============================================================
// ✅ التحقق من ملكية الطلب
// ============================================================

export const requireRequestOwnership = async (req, res, next) => {
  try {
    const requestId = req.params.requestId || req.params.id;
    const account = getAccount(req);
    const portalId = getPortalId(req);

    // ----------------------------------------------------------
    // التحقق من البيانات الأساسية
    // ----------------------------------------------------------

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
        code: 'REQUEST_ID_REQUIRED',
      });
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required.',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // ----------------------------------------------------------
    // 🔐 Portal-scoped query
    // لا يتم جلب الطلب إلا إذا كان تابعًا للبوابة الحالية
    // ----------------------------------------------------------

    const request = await Request.findOne({
      _id: requestId,
      portalId: portalId,
      isActive: true,
      isDeleted: { $ne: true },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
        code: 'REQUEST_NOT_FOUND',
      });
    }

    // ----------------------------------------------------------
    // 🔐 تحقق إضافي من Portal
    // ----------------------------------------------------------

    if (
      !request.portalId ||
      String(request.portalId) !== String(portalId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Request belongs to a different portal.',
        code: 'PORTAL_ACCESS_DENIED',
      });
    }

    // ----------------------------------------------------------
    // التحقق من الملكية
    // ----------------------------------------------------------

    const accountId = getAccountId(account);

    const isOwner =
      request.accountId &&
      String(request.accountId) === accountId;

    const isSpecialist =
      request.specialistId &&
      String(request.specialistId) === accountId;

    const hasAdminAccess = isAdmin(account);

    if (!isOwner && !isSpecialist && !hasAdminAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this request.',
        code: 'REQUEST_ACCESS_DENIED',
      });
    }

    // ----------------------------------------------------------
    // تمرير الطلب إلى middleware/controller التالي
    // ----------------------------------------------------------

    req.request = request;

    next();
  } catch (error) {
    console.error('❌ Request ownership error:', error);

    return res.status(500).json({
      success: false,
      message: 'Error verifying request access.',
      code: 'REQUEST_ACCESS_ERROR',
    });
  }
};

// ============================================================
// ✅ التحقق من ملكية الملف
// ============================================================

export const requireFileOwnership = async (req, res, next) => {
  try {
    const fileId = req.params.fileId || req.params.id;
    const account = getAccount(req);
    const portalId = getPortalId(req);

    // ----------------------------------------------------------
    // التحقق من البيانات الأساسية
    // ----------------------------------------------------------

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required.',
        code: 'FILE_ID_REQUIRED',
      });
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required.',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // ----------------------------------------------------------
    // 🔐 Portal-scoped query
    // لا يتم جلب الملف إلا إذا كان تابعًا للبوابة الحالية
    // ----------------------------------------------------------

    const file = await File.findOne({
      _id: fileId,
      portalId: portalId,
      isDeleted: { $ne: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
        code: 'FILE_NOT_FOUND',
      });
    }

    // ----------------------------------------------------------
    // 🔐 تحقق إضافي من Portal
    // ----------------------------------------------------------

    if (
      !file.portalId ||
      String(file.portalId) !== String(portalId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'File belongs to a different portal.',
        code: 'PORTAL_ACCESS_DENIED',
      });
    }

    // ----------------------------------------------------------
    // التحقق من ملكية الملف
    // ----------------------------------------------------------

    const accountId = getAccountId(account);

    const isOwner =
      file.accountId &&
      String(file.accountId) === accountId;

    const hasAdminAccess = isAdmin(account);

    // ----------------------------------------------------------
    // مالك الملف أو Portal Admin / Super Admin
    // ----------------------------------------------------------

    if (isOwner || hasAdminAccess) {
      req.file = file;
      return next();
    }

    // ----------------------------------------------------------
    // إذا كان الملف مرتبطًا بطلب:
    // تحقق من أن الطلب نفسه في نفس Portal
    // وأن المستخدم هو المختص بالطلب
    // ----------------------------------------------------------

    if (file.requestId) {
      const request = await Request.findOne({
        _id: file.requestId,
        portalId: portalId,
        isActive: true,
        isDeleted: { $ne: true },
      }).select('_id portalId accountId specialistId status');

      if (request) {
        // تحقق إضافي من تطابق Portal بين الملف والطلب
        const samePortal =
          request.portalId &&
          String(request.portalId) === String(file.portalId) &&
          String(request.portalId) === String(portalId);

        const isRequestSpecialist =
          request.specialistId &&
          String(request.specialistId) === accountId;

        if (samePortal && isRequestSpecialist) {
          req.file = file;
          req.request = request;

          return next();
        }
      }
    }

    // ----------------------------------------------------------
    // لا توجد صلاحية
    // ----------------------------------------------------------

    return res.status(403).json({
      success: false,
      message: 'You do not have access to this file.',
      code: 'FILE_ACCESS_DENIED',
    });
  } catch (error) {
    console.error('❌ File ownership error:', error);

    return res.status(500).json({
      success: false,
      message: 'Error verifying file access.',
      code: 'FILE_ACCESS_ERROR',
    });
  }
};

// ============================================================
// ✅ التحقق من ملكية الرسالة
// ============================================================

export const requireMessageOwnership = async (req, res, next) => {
  try {
    const messageId = req.params.messageId || req.params.id;
    const account = getAccount(req);
    const portalId = getPortalId(req);

    // ----------------------------------------------------------
    // التحقق من البيانات الأساسية
    // ----------------------------------------------------------

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required.',
        code: 'MESSAGE_ID_REQUIRED',
      });
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required.',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // ----------------------------------------------------------
    // 🔐 Portal-scoped query
    // لا يتم جلب الرسالة إلا إذا كانت تابعة للبوابة الحالية
    // ----------------------------------------------------------

    const message = await Message.findOne({
      _id: messageId,
      portalId: portalId,
      isDeleted: { $ne: true },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
        code: 'MESSAGE_NOT_FOUND',
      });
    }

    // ----------------------------------------------------------
    // 🔐 تحقق إضافي من Portal
    // ----------------------------------------------------------

    if (
      !message.portalId ||
      String(message.portalId) !== String(portalId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Message belongs to a different portal.',
        code: 'PORTAL_ACCESS_DENIED',
      });
    }

    // ----------------------------------------------------------
    // التحقق من مرسل الرسالة
    // ----------------------------------------------------------

    const accountId = getAccountId(account);

    const isSender =
      message.senderId &&
      String(message.senderId) === accountId;

    const hasAdminAccess = isAdmin(account);

    if (!isSender && !hasAdminAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this message.',
        code: 'MESSAGE_ACCESS_DENIED',
      });
    }

    // ----------------------------------------------------------
    // تمرير الرسالة إلى middleware/controller التالي
    // ----------------------------------------------------------

    req.message = message;

    next();
  } catch (error) {
    console.error('❌ Message ownership error:', error);

    return res.status(500).json({
      success: false,
      message: 'Error verifying message access.',
      code: 'MESSAGE_ACCESS_ERROR',
    });
  }
};

// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================

export default {
  requireRequestOwnership,
  requireFileOwnership,
  requireMessageOwnership,
};