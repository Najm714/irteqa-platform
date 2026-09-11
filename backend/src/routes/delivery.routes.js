// src/routes/delivery.routes.js
import express from 'express';
import {
  createDelivery,
  reviewDelivery,
  getDeliveriesByRequest,
} from '../controllers/delivery.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

router.use(authenticate);
router.use(requirePortalContext);

// إنشاء تسليم جديد
router.post(
  '/:requestId/deliveries',
  requirePermission('create_delivery'),
  createDelivery
);

// مراجعة التسليم
router.put(
  '/deliveries/:deliveryId/review',
  requirePermission('review_delivery'),
  reviewDelivery
);

// جلب تسليمات الطلب
router.get(
  '/:requestId/deliveries',
  requirePermission('view_deliveries'),
  getDeliveriesByRequest
);

export default router;