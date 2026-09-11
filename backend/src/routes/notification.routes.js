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
// ✅ مسارات المستخدم
// ============================================================

// ✅ جلب الإشعارات
router.get('/', getNotifications);

// ✅ جلب عدد الإشعارات غير المقروءة
router.get('/unread/count', getUnreadCount);

// ✅ جلب إشعار محدد
router.get('/:id', getNotificationById);

// ✅ تحديد إشعار كمقروء
router.patch('/:id/read', markAsRead);

// ✅ تحديد جميع الإشعارات كمقروءة
router.patch('/read-all', markAllAsRead);

// ✅ حذف إشعار
router.delete('/:id', deleteNotification);

// ✅ حذف جميع الإشعارات
router.delete('/', deleteAllNotifications);

// ============================================================
// ✅ مسارات الإدارة (للمديرين فقط)
// ============================================================

// ✅ إنشاء إشعار (للمدير)
router.post('/', requirePermission(['manage_notifications']), createNotification);

// ✅ إرسال إشعارات جماعية (للمدير)
router.post('/bulk', requirePermission(['manage_notifications']), sendBulkNotifications);

export default router;