// backend/src/routes/dashboard.routes.js
import express from 'express';
import {
  getDashboardStats,
  getSpecialistStats, // ✅ إضافة
  getRecentActivity,
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة
router.use(authenticate);
router.use(requirePortalContext);

// ✅ مسارات لوحة التحكم
router.get('/stats', getDashboardStats);
router.get('/specialist-stats', getSpecialistStats); // ✅ إضافة مسار المختص
router.get('/recent-activity', getRecentActivity);

export default router;