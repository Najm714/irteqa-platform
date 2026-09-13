// backend/src/routes/service.routes.js
import express from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  toggleServiceFeatured,
} from '../controllers/service.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ============================================================
// ✅ مسارات القراءة العامة (للزوار)
// ============================================================
router.get('/', optionalAuth, requirePortalContext, getServices);
router.get('/:id', optionalAuth, requirePortalContext, getServiceById);

// ============================================================
// ✅ مسارات الإدارة
// ============================================================
router.post(
  '/',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_services']),
  createService
);
router.put(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_services']),
  updateService
);
router.delete(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_services']),
  deleteService
);
router.patch(
  '/:id/toggle',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_services']),
  toggleServiceStatus
);
router.patch(
  '/:id/toggle-featured',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_services']),
  toggleServiceFeatured
);

export default router;