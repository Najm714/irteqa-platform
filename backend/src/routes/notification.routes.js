// backend/src/routes/notification.routes.js
import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
  sendBulkNotifications,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات محددة أولاً (قبل /:id)
// ============================================================

// ✅ جلب الإشعارات
router.get('/', getNotifications);

// ✅ جلب عدد الإشعارات غير المقروءة (قبل /:id)
router.get('/unread/count', getUnreadCount);

// ✅ تحديد جميع الإشعارات كمقروءة (قبل /:id)
router.put('/read-all', markAllAsRead);
router.patch('/read-all', markAllAsRead);  // ✅ للتوافق

// ✅ إرسال إشعارات جماعية (قبل /:id)
router.post('/bulk', requirePermission(['manage_notifications']), sendBulkNotifications);

// ============================================================
// ✅ مسارات /:id (بعد المسارات المحددة)
// ============================================================

// ✅ جلب إشعار محدد
router.get('/:id', getNotificationById);

// ✅ تحديد إشعار كمقروء
router.put('/:id/read', markAsRead);      // ✅ PUT
router.patch('/:id/read', markAsRead);    // ✅ PATCH (للتوافق)

// ✅ حذف إشعار
router.delete('/:id', deleteNotification);

// ✅ حذف جميع الإشعارات
router.delete('/', deleteAllNotifications);

// ============================================================
// ✅ مسارات الإدارة
// ============================================================

// ✅ إنشاء إشعار (للمدير)
router.post('/', requirePermission(['manage_notifications']), createNotification);

export default router;