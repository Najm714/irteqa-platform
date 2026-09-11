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
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ مسارات العرض والتحميل - عامة (تقرأ التوكن من Query)
router.get('/:id/view', viewInfographic);
router.get('/:id/download', downloadInfographic);

// ✅ جميع المسارات الأخرى تتطلب مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات العميل
// ============================================================
router.get('/', getInfographics);
router.get('/stats', getInfographicStats);
router.get('/:id', getInfographicById);

// ============================================================
// ✅ مسارات المدير
// ============================================================
router.post('/', requirePermission(['manage_infographics']), addInfographic);
router.put('/:id', requirePermission(['manage_infographics']), updateInfographic);
router.delete('/:id', requirePermission(['manage_infographics']), deleteInfographic);

export default router;