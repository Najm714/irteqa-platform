// backend/src/controllers/notification.controller.js
import { Notification } from '../models/Notification.model.js';
import { getNotificationService } from '../services/notification.service.js';

// ============================================================
// ✅ جلب إشعارات المستخدم
// ============================================================
export const getNotifications = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;
    const {
      limit = 20,
      page = 1,
      isRead,
      type,
    } = req.query;

    console.log('📤 Fetching notifications for user:', accountId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const notificationService = getNotificationService();
    
    const result = await notificationService.getUserNotifications(
      accountId,
      portalId,
      {
        limit: parseInt(limit),
        page: parseInt(page),
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        type,
      }
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notifications',
    });
  }
};
export const getUnreadCount = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const notificationService = getNotificationService();
    const result = await notificationService.getUserNotifications(
      accountId,
      portalId,
      { limit: 1 }
    );

    // ✅ أعد count + unreadCount (backward compatible)
    res.status(200).json({
      success: true,
      count: result.unreadCount,        // ← للتوافق مع Header
      unreadCount: result.unreadCount,  // ← للتوافق مع كود قديم
    });
  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unread count',
    });
  }
};

// ============================================================
// ✅ تحديد إشعار كمقروء
// ============================================================
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.accountId || req.user?.id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const notificationService = getNotificationService();
    const notification = await notificationService.markAsRead(id, accountId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
};

// ============================================================
// ✅ تحديد جميع الإشعارات كمقروءة
// ============================================================
export const markAllAsRead = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const notificationService = getNotificationService();
    const result = await notificationService.markAllAsRead(accountId, portalId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: result,
    });
  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read',
    });
  }
};

// ============================================================
// ✅ حذف إشعار
// ============================================================
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.accountId || req.user?.id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const notificationService = getNotificationService();
    await notificationService.deleteNotification(id, accountId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification',
    });
  }
};

// ============================================================
// ✅ حذف جميع الإشعارات
// ============================================================
export const deleteAllNotifications = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const notificationService = getNotificationService();
    await notificationService.deleteAllNotifications(accountId, portalId);

    res.status(200).json({
      success: true,
      message: 'All notifications deleted',
    });
  } catch (error) {
    console.error('❌ Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete all notifications',
    });
  }
};

// ============================================================
// ✅ إنشاء إشعار (للإدارة)
// ============================================================
export const createNotification = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;
    const {
      targetAccountId,
      type,
      title,
      titleAr,
      message,
      messageAr,
      data = {},
      channels = { inApp: true, email: false, push: true, sms: false },
      priority = 'medium',
      expiresAt = null,
    } = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!targetAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Target account ID is required',
      });
    }

    const notificationService = getNotificationService(req.app?.get('io'));
    
    const notification = await notificationService.sendNotification({
      portalId,
      accountId: targetAccountId,
      type,
      title,
      titleAr,
      message,
      messageAr,
      data: {
        ...data,
        actorId: accountId,
      },
      channels,
      priority,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification,
    });
  } catch (error) {
    console.error('❌ Create notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send notification',
    });
  }
};

// ============================================================
// ✅ الحصول على إشعار محدد
// ============================================================
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.accountId || req.user?.id;
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const notificationService = getNotificationService();
    const notification = await notificationService.getNotificationById(id, accountId, portalId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('❌ Get notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notification',
    });
  }
};

// ============================================================
// ✅ إرسال إشعار جماعي (للإدارة)
// ============================================================
export const sendBulkNotifications = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;
    const {
      accountIds,
      type,
      title,
      titleAr,
      message,
      messageAr,
      data = {},
      channels = { inApp: true, email: false, push: true, sms: false },
      priority = 'medium',
      expiresAt = null,
    } = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one target account ID is required',
      });
    }

    const notificationService = getNotificationService(req.app?.get('io'));
    
    const results = [];
    for (const targetAccountId of accountIds) {
      const notification = await notificationService.sendNotification({
        portalId,
        accountId: targetAccountId,
        type,
        title,
        titleAr,
        message,
        messageAr,
        data: {
          ...data,
          actorId: accountId,
        },
        channels,
        priority,
        expiresAt,
      });
      results.push(notification);
    }

    res.status(201).json({
      success: true,
      message: `${results.length} notifications sent successfully`,
      data: results,
    });
  } catch (error) {
    console.error('❌ Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send bulk notifications',
    });
  }
};