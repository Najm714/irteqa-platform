// backend/src/routes/call.routes.js
import express from 'express';
import {
  getSpecialistCalls,
  getRequestCalls,
  scheduleCall,
  updateCallStatus,
  cancelCall,
  joinCall,
  getUpcomingCalls,
  getPastCalls,
} from '../controllers/call.controller.js';
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

// ✅ جلب مكالمات المختص (الطلبات المسندة إليه)
router.get('/specialist', getSpecialistCalls);

// ✅ المكالمات القادمة للمستخدم
router.get('/upcoming', getUpcomingCalls);

// ✅ المكالمات السابقة للمستخدم
router.get('/past', getPastCalls);

// ============================================================
// ✅ مسارات المكالمات في الطلب
// ============================================================

// ✅ جلب مكالمات طلب محدد
router.get('/request/:requestId', getRequest, getRequestCalls);

// ✅ جدولة مكالمة جديدة
router.post('/request/:requestId', getRequest, scheduleCall);

// ✅ الانضمام إلى مكالمة
router.post('/:callId/join', joinCall);

// ✅ تحديث حالة المكالمة
router.patch('/:callId/status', updateCallStatus);

// ✅ إلغاء مكالمة
router.patch('/:callId/cancel', cancelCall);

export default router;