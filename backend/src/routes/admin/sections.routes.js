// backend/src/routes/admin/sections.routes.js
import express from 'express';
import {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  toggleSectionStatus,
} from '../../controllers/section.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePortalContext } from '../../middleware/portalContext.js';
import { requirePermission } from '../../middleware/authorization.js';

const router = express.Router();

// ✅ جميع Routes تحتاج مصادقة وصلاحيات مدير
router.use(authenticate);
router.use(requirePortalContext);
router.use(requirePermission('manage_sections'));

// ✅ جلب جميع الأقسام
router.get('/', getSections);

// ✅ جلب قسم محدد
router.get('/:id', getSectionById);

// ✅ إنشاء قسم جديد
router.post('/', createSection);

// ✅ تحديث قسم
router.put('/:id', updateSection);

// ✅ حذف قسم
router.delete('/:id', deleteSection);

// ✅ تبديل حالة النشر
router.patch('/:id/toggle', toggleSectionStatus);

export default router;