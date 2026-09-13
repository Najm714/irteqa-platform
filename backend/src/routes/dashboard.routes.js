// backend/src/routes/dashboard.routes.js
import express from 'express';
import {
  getDashboardStats,
  getSpecialistStats,
  getRecentActivity,
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة
router.use(authenticate);
router.use(requirePortalContext);

// ✅ مسارات لوحة التحكم مع Cache
// Cache 5 دقائق للإحصائيات (بطيئة لكنها لا تتغير كثيراً)
router.get('/stats', cacheMiddleware(5 * 60 * 1000), getDashboardStats);

// Cache 5 دقائق لإحصائيات المختص
router.get('/specialist-stats', cacheMiddleware(5 * 60 * 1000), getSpecialistStats);

// Cache 2 دقيقة للنشاطات الأخيرة (تتغير أكثر)
router.get('/recent-activity', cacheMiddleware(2 * 60 * 1000), getRecentActivity);

export default router;