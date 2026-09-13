// backend/src/middleware/portalContext.js
import { Portal } from '../models/Portal.model.js';
import { Account } from '../models/Account.model.js';

// ✅ دالة detectPortal
export const detectPortal = async (req, res, next) => {
  try {
    const portalId = req.headers['x-portal-id'] || req.query.portalId || req.body.portalId;
    
    if (!portalId) {
      req.portal = null;
      req.portalId = null;
      return next();
    }

    const portal = await Portal.findById(portalId);
    if (!portal) {
      req.portal = null;
      req.portalId = null;
      return next();
    }

    req.portal = portal;
    req.portalId = portal._id;
    next();
  } catch (error) {
    console.error('❌ Detect portal error:', error);
    req.portal = null;
    req.portalId = null;
    next();
  }
};

// ✅ دالة requirePortalContext - الحل النهائي
export const requirePortalContext = async (req, res, next) => {
  try {
    console.log('🔍 requirePortalContext - Headers:', req.headers);
    console.log('🔍 requirePortalContext - req.portalId:', req.portalId);
    console.log('🔍 requirePortalContext - req.user:', req.user);

    // ✅ الحصول على portalId من مصادر متعددة
    let portalId = req.portalId || 
                   req.headers['x-portal-id'] || 
                   req.query.portalId || 
                   req.body?.portalId ||
                   req.user?.portalId;

    // ✅ إذا لم يتم العثور على portalId، حاول البحث في قاعدة البيانات
    if (!portalId && req.user?.id) {
      try {
        const account = await Account.findById(req.user.id).select('portalId');
        if (account && account.portalId) {
          portalId = account.portalId;
          console.log('🔍 PortalId found from account:', portalId);
        }
      } catch (err) {
        console.error('❌ Error fetching account:', err);
      }
    }

    // ✅ إذا كان لا يزال undefined، استخدم قيمة افتراضية (للاختبار)
    if (!portalId) {
      try {
        const firstPortal = await Portal.findOne({ isActive: true });
        if (firstPortal) {
          portalId = firstPortal._id;
          console.log('🔍 Using first portal as default:', portalId);
        }
      } catch (err) {
        console.error('❌ Error fetching first portal:', err);
      }
    }

    if (!portalId) {
      console.log('❌ No portalId found in request');
      return res.status(400).json({
        success: false,
        message: 'Portal context is required. Please provide X-Portal-Id header.',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // ✅ التحقق من وجود البوابة
    let portal = await Portal.findById(portalId);
    
    if (!portal) {
      portal = await Portal.findOne({ slug: portalId });
    }

    if (!portal) {
      console.log('❌ Portal not found:', portalId);
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

    console.log('✅ Portal context set:', req.portalId);
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

// ✅ Middleware خاص للإعدادات
export const requirePortalForSettings = async (req, res, next) => {
  try {
    let portalId = req.headers['x-portal-id'] || req.query.portalId || req.user?.portalId;

    if (!portalId) {
      try {
        const firstPortal = await Portal.findOne({ isActive: true });
        if (firstPortal) {
          portalId = firstPortal._id;
        }
      } catch (err) {
        console.error('❌ Error fetching first portal:', err);
      }
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required for settings',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    let portal = await Portal.findById(portalId);
    if (!portal) {
      portal = await Portal.findOne({ slug: portalId });
    }

    if (!portal) {
      return res.status(404).json({
        success: false,
        message: 'Portal not found',
        code: 'PORTAL_NOT_FOUND',
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
