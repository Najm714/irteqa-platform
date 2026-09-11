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
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ✅ مسارات القراءة (متاحة للجميع)
router.get('/', getSections);
router.get('/:id', getSectionById);

// ✅ مسارات الإدارة (تتطلب صلاحيات)
router.post('/', requirePermission(['manage_sections']), createSection);
router.put('/:id', requirePermission(['manage_sections']), updateSection);
router.delete('/:id', requirePermission(['manage_sections']), deleteSection);
router.patch('/:id/toggle', requirePermission(['manage_sections']), toggleSectionStatus);

export default router;