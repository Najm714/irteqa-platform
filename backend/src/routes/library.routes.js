// backend/src/routes/library.routes.js
import express from 'express';
import {
  addLibraryFile,
  getLibraryFiles,
  getLibraryFileById,
  updateLibraryFile,
  deleteLibraryFile,
  downloadLibraryFile,
  getLibraryStats,
} from '../controllers/library.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ============================================================
// ✅ مسارات القراءة العامة (للزوار)
// ============================================================
router.get('/', optionalAuth, requirePortalContext, getLibraryFiles);
router.get('/stats', optionalAuth, requirePortalContext, getLibraryStats);
router.get('/:id', optionalAuth, requirePortalContext, getLibraryFileById);
router.get('/:id/download', optionalAuth, requirePortalContext, downloadLibraryFile);

// ============================================================
// ✅ مسارات الإدارة
// ============================================================
router.post(
  '/',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_library']),
  addLibraryFile
);
router.put(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_library']),
  updateLibraryFile
);
router.delete(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_library']),
  deleteLibraryFile
);

export default router;