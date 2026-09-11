// src/services/notification.service.js
import { Notification } from '../models/Notification.model.js';
import { Account } from '../models/Account.model.js';

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * إنشاء وإرسال إشعار
   */
  async sendNotification(data) {
    try {
      const {
        portalId,
        accountId,
        type,
        title,
        titleAr,
        message,
        messageAr,
        data: notificationData = {},
        channels = { inApp: true, email: false, push: true, sms: false },
        priority = 'medium',
        expiresAt = null,
      } = data;

      // التحقق من وجود المستخدم
      const account = await Account.findById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // إنشاء الإشعار في قاعدة البيانات
      const notification = new Notification({
        portalId,
        accountId,
        type,
        title,
        titleAr,
        message,
        messageAr,
        data: notificationData,
        channels,
        priority,
        expiresAt,
      });

      await notification.save();

      // إرسال الإشعار عبر WebSocket
      if (channels.inApp && this.io) {
        this.io.to(`user_${accountId}`).emit('notification', {
          id: notification._id,
          type,
          title,
          titleAr,
          message,
          messageAr,
          data: notificationData,
          priority,
          createdAt: notification.createdAt,
        });
      }

      // إرسال عبر البريد الإلكتروني (سيتم تنفيذه لاحقاً)
      if (channels.email) {
        await this._sendEmail(account, notification);
      }

      // إرسال عبر SMS (سيتم تنفيذه لاحقاً)
      if (channels.sms) {
        await this._sendSms(account, notification);
      }

      return notification;
    } catch (error) {
      console.error('❌ Send notification error:', error);
      throw error;
    }
  }

  /**
   * جلب إشعارات المستخدم
   */
  async getUserNotifications(accountId, portalId, options = {}) {
    const {
      limit = 20,
      page = 1,
      isRead,
      type,
      startDate,
      endDate,
    } = options;

    const query = {
      accountId,
      portalId,
    };

    if (isRead !== undefined) query.isRead = isRead;
    if (type) query.type = type;
    if (startDate) query.createdAt = { $gte: new Date(startDate) };
    if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('data.actorId', 'profile.fullName email'),
      Notification.countDocuments(query),
      Notification.getUnreadCount(accountId, portalId),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  /**
   * تحديد إشعار كمقروء
   */
  async markAsRead(notificationId, accountId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      accountId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  async markAllAsRead(accountId, portalId) {
    const result = await Notification.updateMany(
      {
        accountId,
        portalId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return result;
  }

  /**
   * حذف إشعار
   */
  async deleteNotification(notificationId, accountId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      accountId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  /**
   * حذف جميع الإشعارات
   */
  async deleteAllNotifications(accountId, portalId) {
    const result = await Notification.deleteMany({
      accountId,
      portalId,
    });

    return result;
  }

  /**
   * إرسال إشعارات مجمعة (للمستخدمين المتعددين)
   */
  async sendBulkNotifications(data) {
    const { accountIds, ...notificationData } = data;
    const results = [];

    for (const accountId of accountIds) {
      try {
        const result = await this.sendNotification({
          ...notificationData,
          accountId,
        });
        results.push({ accountId, success: true, notification: result });
      } catch (error) {
        results.push({ accountId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * إرسال إشعارات لأعضاء دور معين
   */
  async sendNotificationToRole(portalId, role, data) {
    const accounts = await Account.find({
      portalId,
      role,
      isActive: true,
    });

    const accountIds = accounts.map(a => a._id);
    return this.sendBulkNotifications({
      ...data,
      portalId,
      accountIds,
    });
  }

  // ===== دوال خاصة (سيتم تنفيذها لاحقاً) =====

  async _sendEmail(account, notification) {
    // TODO: تنفيذ إرسال البريد الإلكتروني
    console.log(`📧 Email notification to ${account.email}: ${notification.title}`);
  }

  async _sendSms(account, notification) {
    // TODO: تنفيذ إرسال SMS
    console.log(`📱 SMS notification to ${account.phone}: ${notification.title}`);
  }
}

// ✅ تصدير نسخة واحدة من الخدمة
let notificationServiceInstance = null;

export const getNotificationService = (io) => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService(io);
  }
  return notificationServiceInstance;
};

export default NotificationService;