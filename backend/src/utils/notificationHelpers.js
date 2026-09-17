// backend/src/utils/notificationHelpers.js
import { Account } from '../models/Account.model.js';
import { getNotificationService } from '../services/notification.service.js';

/**
 * إرسال إشعار لجميع المدراء في البوابة
 */
export const notifyAdmins = async (io, {
  portalId,
  senderId = null,
  type,
  title,
  titleAr,
  message,
  messageAr,
  data = {},
  priority = 'medium',
}) => {
  try {
    // ✅ جلب جميع المدراء
    const admins = await Account.find({
      portalId,
      role: { $in: ['portal_admin', 'super_admin'] },
      isActive: true,
      isDeleted: { $ne: true },
    }).select('_id');

    if (admins.length === 0) {
      console.log('ℹ️ No admins found to notify');
      return [];
    }

    console.log(`📢 Notifying ${admins.length} admins`);

    const notificationService = getNotificationService(io);

    const notifications = [];
    for (const admin of admins) {
      try {
        const notification = await notificationService.sendNotification({
          portalId,
          accountId: admin._id,
          type,
          title: title || titleAr,
          titleAr: titleAr || title,
          message: message || messageAr,
          messageAr: messageAr || message,
          data: {
            ...data,
            actorId: senderId,
          },
          channels: { inApp: true, email: false, push: false, sms: false },
          priority,
        });
        notifications.push(notification);
      } catch (err) {
        console.error(`❌ Failed to notify admin ${admin._id}:`, err.message);
      }
    }

    console.log(`✅ Sent ${notifications.length} admin notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ notifyAdmins error:', error);
    return [];
  }
};

/**
 * إرسال إشعار لمستخدم محدد
 */
export const notifyUser = async (io, {
  portalId,
  accountId,
  senderId = null,
  type,
  title,
  titleAr,
  message,
  messageAr,
  data = {},
  priority = 'medium',
}) => {
  try {
    const notificationService = getNotificationService(io);

    const notification = await notificationService.sendNotification({
      portalId,
      accountId,
      type,
      title: title || titleAr,
      titleAr: titleAr || title,
      message: message || messageAr,
      messageAr: messageAr || message,
      data: {
        ...data,
        actorId: senderId,
      },
      channels: { inApp: true, email: false, push: false, sms: false },
      priority,
    });

    return notification;
  } catch (error) {
    console.error('❌ notifyUser error:', error);
    return null;
  }
};