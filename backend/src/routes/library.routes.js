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
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات العميل
// ============================================================
router.get('/', getLibraryFiles);
router.get('/stats', getLibraryStats);
router.get('/:id', getLibraryFileById);
router.get('/:id/download', downloadLibraryFile);

// ============================================================
// ✅ مسارات المدير
// ============================================================
router.post('/', requirePermission(['manage_library']), addLibraryFile);
router.put('/:id', requirePermission(['manage_library']), updateLibraryFile);
router.delete('/:id', requirePermission(['manage_library']), deleteLibraryFile);

export default router;