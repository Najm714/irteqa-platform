// backend/src/middleware/portalContext.js

import { Portal } from '../models/Portal.model.js';
import { Account } from '../models/Account.model.js';

/**
 * الحصول على Portal ID المطلوب من الطلب.
 *
 * ملاحظة:
 * هذا المصدر يُستخدم فقط لتحديد البوابة المطلوبة.
 * لا يُعتبر مصدرًا موثوقًا للمستخدمين المسجلين.
 */
const getRequestedPortalId = (req) => {
  return (
    req.headers['x-portal-id'] ||
    req.query?.portalId ||
    req.body?.portalId ||
    null
  );
};

/**
 * التحقق من Portal وتحميلها.
 */
const findPortal = async (portalId) => {
  if (!portalId) {
    return null;
  }

  // البحث باستخدام ObjectId
  try {
    const portal = await Portal.findById(portalId);

    if (portal) {
      return portal;
    }
  } catch (error) {
    // قد تكون القيمة slug وليست ObjectId
  }

  // البحث باستخدام slug
  return await Portal.findOne({ slug: portalId });
};

/**
 * detectPortal
 *
 * يستخدم لاكتشاف البوابة المطلوبة.
 *
 * للمستخدم المسجل:
 * - super_admin يستطيع اختيار أي Portal.
 * - بقية الأدوار لا تستطيع تغيير Portal الخاصة بها.
 *
 * للزائر غير المسجل:
 * - يجب إرسال Portal محددة.
 */
export const detectPortal = async (req, res, next) => {
  try {
    const requestedPortalId = getRequestedPortalId(req);

    // =========================================================
    // المستخدم المسجل
    // =========================================================
    if (req.user) {
      // SUPER ADMIN
      if (req.user.role === 'super_admin') {
        if (!requestedPortalId) {
          req.portal = null;
          req.portalId = null;
          return next();
        }

        const portal = await findPortal(requestedPortalId);

        if (!portal) {
          return res.status(404).json({
            success: false,
            message: 'Portal not found',
            code: 'PORTAL_NOT_FOUND',
          });
        }

        if (!portal.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Portal is not active',
            code: 'PORTAL_INACTIVE',
          });
        }

        req.portal = portal;
        req.portalId = portal._id;

        return next();
      }

      // =======================================================
      // بقية المستخدمين:
      // Portal الخاصة بهم هي المصدر الموثوق الوحيد
      // =======================================================
      const accountPortalId = req.user.portalId;

      if (!accountPortalId) {
        req.portal = null;
        req.portalId = null;
        return next();
      }

      // إذا أرسل العميل Portal مختلفة عن Portal حسابه → رفض
      if (
        requestedPortalId &&
        requestedPortalId.toString() !== accountPortalId.toString()
      ) {
        const requestedPortal = await findPortal(requestedPortalId);

        if (
          !requestedPortal ||
          requestedPortal._id.toString() !== accountPortalId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to access this portal.',
            code: 'PORTAL_ACCESS_DENIED',
          });
        }
      }

      const portal = await findPortal(accountPortalId);

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: 'Account portal not found',
          code: 'ACCOUNT_PORTAL_NOT_FOUND',
        });
      }

      if (!portal.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Portal is not active',
          code: 'PORTAL_INACTIVE',
        });
      }

      req.portal = portal;
      req.portalId = portal._id;

      return next();
    }

    // =========================================================
    // مستخدم غير مسجل الدخول
    // =========================================================
    if (!requestedPortalId) {
      req.portal = null;
      req.portalId = null;
      return next();
    }

    const portal = await findPortal(requestedPortalId);

    if (!portal) {
      return res.status(404).json({
        success: false,
        message: 'Portal not found',
        code: 'PORTAL_NOT_FOUND',
      });
    }

    if (!portal.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Portal is not active',
        code: 'PORTAL_INACTIVE',
      });
    }

    req.portal = portal;
    req.portalId = portal._id;

    next();
  } catch (error) {
    console.error('❌ Detect portal error:', error);

    return res.status(500).json({
      success: false,
      message: 'Portal detection error',
      code: 'PORTAL_DETECTION_ERROR',
    });
  }
};


/**
 * requirePortalContext
 *
 * يفرض وجود Portal صحيحة قبل تنفيذ الـ route.
 *
 * قواعد الأمان:
 *
 * SUPER_ADMIN:
 *   يستطيع العمل على أي Portal يتم تحديدها في الطلب.
 *
 * PORTAL_ADMIN / SPECIALIST / CUSTOMER:
 *   لا يستطيعون تغيير Portal الخاصة بحسابهم.
 *
 * Guest:
 *   يجب تحديد Portal في الطلب.
 */
export const requirePortalContext = async (req, res, next) => {
  try {
    const requestedPortalId = getRequestedPortalId(req);

    // =========================================================
    // 1. المستخدم المسجل الدخول
    // =========================================================
    if (req.user) {

      // -------------------------------------------------------
      // SUPER ADMIN
      // -------------------------------------------------------
      if (req.user.role === 'super_admin') {
        if (!requestedPortalId) {
          return res.status(400).json({
            success: false,
            message: 'Portal context is required for super admin.',
            code: 'PORTAL_ID_REQUIRED',
          });
        }

        const portal = await findPortal(requestedPortalId);

        if (!portal) {
          return res.status(404).json({
            success: false,
            message: 'Portal not found',
            code: 'PORTAL_NOT_FOUND',
          });
        }

        if (!portal.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Portal is not active',
            code: 'PORTAL_INACTIVE',
          });
        }

        req.portal = portal;
        req.portalId = portal._id;

        return next();
      }

      // -------------------------------------------------------
      // بقية المستخدمين
      // -------------------------------------------------------
      const accountPortalId = req.user.portalId;

      if (!accountPortalId) {
        return res.status(403).json({
          success: false,
          message: 'Your account is not assigned to a portal.',
          code: 'ACCOUNT_PORTAL_REQUIRED',
        });
      }

      // إذا حاول المستخدم تحديد Portal أخرى
      if (requestedPortalId) {
        const requestedPortal = await findPortal(requestedPortalId);

        if (!requestedPortal) {
          return res.status(404).json({
            success: false,
            message: 'Portal not found',
            code: 'PORTAL_NOT_FOUND',
          });
        }

        if (
          requestedPortal._id.toString() !== accountPortalId.toString()
        ) {
          console.warn(
            `🚫 Cross-portal access blocked: account=${req.user.id}, ` +
            `accountPortal=${accountPortalId}, requestedPortal=${requestedPortal._id}`
          );

          return res.status(403).json({
            success: false,
            message: 'You are not authorized to access this portal.',
            code: 'PORTAL_ACCESS_DENIED',
          });
        }
      }

      // استخدام Portal الحساب، وليس Portal المرسلة من العميل
      const portal = await findPortal(accountPortalId);

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: 'Account portal not found',
          code: 'ACCOUNT_PORTAL_NOT_FOUND',
        });
      }

      if (!portal.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Portal is not active',
          code: 'PORTAL_INACTIVE',
        });
      }

      req.portal = portal;
      req.portalId = portal._id;

      return next();
    }

    // =========================================================
    // 2. المستخدم غير المسجل
    // =========================================================
    if (!requestedPortalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required.',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const portal = await findPortal(requestedPortalId);

    if (!portal) {
      return res.status(404).json({
        success: false,
        message: 'Portal not found',
        code: 'PORTAL_NOT_FOUND',
      });
    }

    if (!portal.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Portal is not active',
        code: 'PORTAL_INACTIVE',
      });
    }

    req.portal = portal;
    req.portalId = portal._id;

    next();
  } catch (error) {
    console.error('❌ Portal context error:', error);

    return res.status(500).json({
      success: false,
      message: 'Portal context error',
      code: 'PORTAL_CONTEXT_ERROR',
    });
  }
};


/**
 * Middleware خاص بالإعدادات.
 *
 * يستخدم نفس قواعد عزل البوابات.
 */
export const requirePortalForSettings = async (req, res, next) => {
  try {
    const requestedPortalId = getRequestedPortalId(req);

    // =========================================================
    // SUPER ADMIN
    // =========================================================
    if (req.user?.role === 'super_admin') {
      if (!requestedPortalId) {
        return res.status(400).json({
          success: false,
          message: 'Portal ID is required for settings.',
          code: 'PORTAL_ID_REQUIRED',
        });
      }

      const portal = await findPortal(requestedPortalId);

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: 'Portal not found',
          code: 'PORTAL_NOT_FOUND',
        });
      }

      if (!portal.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Portal is not active',
          code: 'PORTAL_INACTIVE',
        });
      }

      req.portal = portal;
      req.portalId = portal._id;

      return next();
    }

    // =========================================================
    // المستخدم العادي المسجل
    // =========================================================
    if (req.user) {
      const accountPortalId = req.user.portalId;

      if (!accountPortalId) {
        return res.status(403).json({
          success: false,
          message: 'Your account is not assigned to a portal.',
          code: 'ACCOUNT_PORTAL_REQUIRED',
        });
      }

      if (requestedPortalId) {
        const requestedPortal = await findPortal(requestedPortalId);

        if (!requestedPortal) {
          return res.status(404).json({
            success: false,
            message: 'Portal not found',
            code: 'PORTAL_NOT_FOUND',
          });
        }

        if (
          requestedPortal._id.toString() !== accountPortalId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to access this portal.',
            code: 'PORTAL_ACCESS_DENIED',
          });
        }
      }

      const portal = await findPortal(accountPortalId);

      if (!portal) {
        return res.status(404).json({
          success: false,
          message: 'Account portal not found',
          code: 'ACCOUNT_PORTAL_NOT_FOUND',
        });
      }

      if (!portal.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Portal is not active',
          code: 'PORTAL_INACTIVE',
        });
      }

      req.portal = portal;
      req.portalId = portal._id;

      return next();
    }

    // =========================================================
    // غير مسجل الدخول
    // =========================================================
    if (!requestedPortalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required for settings.',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const portal = await findPortal(requestedPortalId);

    if (!portal) {
      return res.status(404).json({
        success: false,
        message: 'Portal not found',
        code: 'PORTAL_NOT_FOUND',
      });
    }

    if (!portal.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Portal is not active',
        code: 'PORTAL_INACTIVE',
      });
    }

    req.portal = portal;
    req.portalId = portal._id;

    next();
  } catch (error) {
    console.error('❌ Portal for settings error:', error);

    return res.status(500).json({
      success: false,
      message: 'Portal context error',
      code: 'PORTAL_CONTEXT_ERROR',
    });
  }
};