// backend/src/routes/admin/services.routes.js
import express from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} from '../../controllers/service.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePortalContext } from '../../middleware/portalContext.js';
import { requirePermission } from '../../middleware/authorization.js';

const router = express.Router();

// ✅ جميع Routes تحتاج مصادقة وصلاحيات مدير
router.use(authenticate);
router.use(requirePortalContext);
router.use(requirePermission('manage_services'));

// ✅ جلب جميع الخدمات
router.get('/', getServices);

// ✅ جلب خدمة محددة
router.get('/:id', getServiceById);

// ✅ إنشاء خدمة جديدة
router.post('/', createService);

// ✅ تحديث خدمة
router.put('/:id', updateService);

// ✅ حذف خدمة
router.delete('/:id', deleteService);

// ✅ تبديل حالة النشر
router.patch('/:id/toggle', toggleServiceStatus);

export default router;