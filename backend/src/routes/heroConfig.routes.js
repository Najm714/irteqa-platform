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

// ✅ صلاحيات موحدة
const APPEARANCE_PERMS = ['manage_appearance', 'manage_settings'];

// ============================================================
// ✅ مسارات عامة
// ============================================================
router.get('/', optionalAuth, requirePortalContext, getHeroConfig);
router.get('/stats', optionalAuth, requirePortalContext, getLiveStats);

// ============================================================
// ✅ مسارات إدارية
// ============================================================
router.post(
  '/upload',
  authenticate,
  requirePortalContext,
  requirePermission(APPEARANCE_PERMS),
  uploadHeroFile
);

router.put(
  '/',
  authenticate,
  requirePortalContext,
  requirePermission(APPEARANCE_PERMS),
  updateHeroConfig
);

router.post(
  '/reset',
  authenticate,
  requirePortalContext,
  requirePermission(APPEARANCE_PERMS),
  resetHeroConfig
);

export default router;