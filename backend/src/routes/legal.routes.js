// backend/src/routes/legal.routes.js
import express from 'express';
import legalController from '../controllers/legal.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ============================================================
// Routes العامة (بدون مصادقة)
// ============================================================

router.get('/public/:type', legalController.getPublicLegalPage);

// ============================================================
// Routes المحمية (للمستخدمين المسجلين)
// ============================================================

router.use(authenticate);
router.use(requirePortalContext);

// جلب صفحة قانونية
router.get('/:type', requirePermission('view_legal_pages'), legalController.getLegalPage);

// جلب جميع الصفحات القانونية
router.get('/', requirePermission('view_legal_pages'), legalController.getAllLegalPages);

// ============================================================
// Routes الإدارية (للمشرفين فقط)
// ============================================================

router.post('/', requirePermission('manage_legal_pages'), legalController.createLegalPage);
router.put('/:type', requirePermission('manage_legal_pages'), legalController.updateLegalPage);
router.delete('/:type', requirePermission('manage_legal_pages'), legalController.deleteLegalPage);

export default router;