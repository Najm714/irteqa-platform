// backend/src/routes/serviceDetail.routes.js
import express from 'express';
import {
  getServiceDetails,
  getServiceDetailById,
  createServiceDetail,
  updateServiceDetail,
  deleteServiceDetail,
  toggleServiceDetailStatus,
} from '../controllers/serviceDetail.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

router.use(authenticate);
router.use(requirePortalContext);

// مسارات القراءة
router.get('/', getServiceDetails);
router.get('/:id', getServiceDetailById);

// مسارات الإدارة
router.post('/', requirePermission(['manage_services']), createServiceDetail);
router.put('/:id', requirePermission(['manage_services']), updateServiceDetail);
router.delete('/:id', requirePermission(['manage_services']), deleteServiceDetail);
router.patch('/:id/toggle', requirePermission(['manage_services']), toggleServiceDetailStatus);

export default router;