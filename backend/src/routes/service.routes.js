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
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ✅ مسارات القراءة (متاحة للجميع)
router.get('/', getServices);
router.get('/:id', getServiceById);

// ✅ مسارات الإدارة (تتطلب صلاحيات)
router.post('/', requirePermission(['manage_services']), createService);
router.put('/:id', requirePermission(['manage_services']), updateService);
router.delete('/:id', requirePermission(['manage_services']), deleteService);
router.patch('/:id/toggle', requirePermission(['manage_services']), toggleServiceStatus);
router.patch('/:id/toggle-featured', requirePermission(['manage_services']), toggleServiceFeatured);

export default router;