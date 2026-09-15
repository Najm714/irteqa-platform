// backend/src/routes/infographic.routes.js
import express from 'express';
import {
  addInfographic,
  getInfographics,
  getInfographicById,
  updateInfographic,
  deleteInfographic,
  viewInfographic,
  downloadInfographic,
  getInfographicStats,
} from '../controllers/infographic.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ============================================================
// ✅ مسارات العرض والتحميل العامة (للزوار)
// ============================================================
router.get(
  '/:id/view',
  authenticate,
  requirePortalContext,
  viewInfographic
);

router.get(
  '/:id/download',
  authenticate,
  requirePortalContext,
  downloadInfographic
);

// ============================================================
// ✅ مسارات القراءة العامة
// ============================================================
router.get('/', optionalAuth, requirePortalContext, getInfographics);
router.get('/stats', optionalAuth, requirePortalContext, getInfographicStats);
router.get('/:id', optionalAuth, requirePortalContext, getInfographicById);

// ============================================================
// ✅ مسارات الإدارة
// ============================================================
router.post(
  '/',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_infographics']),
  addInfographic
);
router.put(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_infographics']),
  updateInfographic
);
router.delete(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_infographics']),
  deleteInfographic
);

export default router;