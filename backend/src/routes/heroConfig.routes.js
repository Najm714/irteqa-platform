// backend/src/routes/heroConfig.routes.js
import express from 'express';
import {
  getHeroConfig,
  updateHeroConfig,
  uploadHeroFile,
  getLiveStats,
  resetHeroConfig,
} from '../controllers/heroConfig.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ============================================================
// ✅ مسارات عامة
// ============================================================
router.get('/', optionalAuth, requirePortalContext, getHeroConfig);
router.get('/stats', optionalAuth, requirePortalContext, getLiveStats);

// ============================================================
// ✅ مسارات إدارية
// ============================================================

// ✅ رفع صورة/فيديو الهيرو
router.post(
  '/upload',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_appearance', 'manage_settings', 'manage_explanations']),
  uploadHeroFile
);

// ✅ تحديث الإعدادات
router.put(
  '/',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_appearance', 'manage_settings', 'manage_explanations']),
  updateHeroConfig
);

// ✅ إعادة تعيين
router.post(
  '/reset',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_appearance', 'manage_settings', 'manage_explanations']),
  resetHeroConfig
);

export default router;