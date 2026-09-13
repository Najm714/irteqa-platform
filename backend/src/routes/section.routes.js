// backend/src/routes/section.routes.js
import express from 'express';
import {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  toggleSectionStatus,
} from '../controllers/section.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ============================================================
// ✅ مسارات القراءة العامة (للزوار والمسجّلين)
// ============================================================
router.get('/', optionalAuth, requirePortalContext, getSections);
router.get('/:id', optionalAuth, requirePortalContext, getSectionById);

// ============================================================
// ✅ مسارات الإدارة (تتطلب مصادقة + صلاحيات)
// ============================================================
router.post(
  '/',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_sections']),
  createSection
);

router.put(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_sections']),
  updateSection
);

router.delete(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_sections']),
  deleteSection
);

router.patch(
  '/:id/toggle',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_sections']),
  toggleSectionStatus
);

export default router;