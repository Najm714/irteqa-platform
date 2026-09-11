// backend/src/routes/message.routes.js
import express from 'express';
import {
  sendMessage,
  getMessages,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  getUnreadCount,
  getSpecialistMessages,
} from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';
import { getRequest } from '../middleware/requestAuth.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات المختص
// ============================================================

// ✅ جلب رسائل المختص (الطلبات المسندة إليه)
router.get('/specialist', getSpecialistMessages);

// ============================================================
// ✅ مسارات الرسائل
// ============================================================

// ✅ جلب رسائل الطلب
router.get('/request/:requestId', getRequest, getMessages);

// ✅ إرسال رسالة
router.post('/request/:requestId', getRequest, sendMessage);

// ✅ تحديد رسالة كمقروءة
router.patch('/:id/read', markAsRead);

// ✅ تحديد جميع رسائل الطلب كمقروءة
router.patch('/request/:requestId/read-all', getRequest, markAllAsRead);

// ✅ حذف رسالة (للمدير أو مرسل الرسالة)
router.delete('/:id', deleteMessage);

// ✅ عدد الرسائل غير المقروءة
router.get('/unread/count', getUnreadCount);

export default router;