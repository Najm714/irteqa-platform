// backend/src/routes/task.routes.js
import express from 'express';
import {
  getSpecialistTasks,
  getTaskById,
  updateTaskStatus,
  getTaskStats,
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { getRequest } from '../middleware/requestAuth.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات المختص
// ============================================================

// ✅ جلب مهام المختص
router.get('/specialist', getSpecialistTasks);

// ✅ إحصائيات المهام
router.get('/stats', getTaskStats);

// ============================================================
// ✅ مسارات المهام
// ============================================================

// ✅ جلب مهمة محددة
router.get('/:id', getTaskById);

// ✅ تحديث حالة المهمة
router.patch('/:id/status', updateTaskStatus);

export default router;