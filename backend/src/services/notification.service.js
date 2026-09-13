// src/services/notification.service.js
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.model.js';
import { Account } from '../models/Account.model.js';

// ✅ دالة مساعدة: تحويل String → ObjectId
const toObjectId = (id) => {
  if (!id) return id;
  // إذا كان ObjectId بالفعل، أرجعه
  if (id instanceof mongoose.Types.ObjectId) return id;
  // إذا كان String صالحاً، حوّله
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
};

class NotificationService {
  constructor(io) {
    this.io = io;
  }

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

      const account = await Account.findById(toObjectId(accountId));
      if (!account) {
        throw new Error('Account not found');
      }

      const notification = new Notification({
        portalId: toObjectId(portalId),
        accountId: toObjectId(accountId),
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

      if (channels.email) {
        await this._sendEmail(account, notification);
      }

      if (channels.sms) {
        await this._sendSms(account, notification);
      }

      return notification;
    } catch (error) {
      console.error('❌ Send notification error:', error);
      throw error;
    }
  }

  async getUserNotifications(accountId, portalId, options = {}) {
    const {
      limit = 20,
      page = 1,
      isRead,
      type,
      startDate,
      endDate,
    } = options;

    // ✅ حوّل String → ObjectId
    const query = {
      accountId: toObjectId(accountId),
      portalId: toObjectId(portalId),
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

  async markAsRead(notificationId, accountId) {
    const notification = await Notification.findOne({
      _id: toObjectId(notificationId),
      accountId: toObjectId(accountId),
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  async markAllAsRead(accountId, portalId) {
    const result = await Notification.updateMany(
      {
        accountId: toObjectId(accountId),
        portalId: toObjectId(portalId),
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return result;
  }

  async deleteNotification(notificationId, accountId) {
    const notification = await Notification.findOneAndDelete({
      _id: toObjectId(notificationId),
      accountId: toObjectId(accountId),
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  async deleteAllNotifications(accountId, portalId) {
    const result = await Notification.deleteMany({
      accountId: toObjectId(accountId),
      portalId: toObjectId(portalId),
    });

    return result;
  }

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

  async sendNotificationToRole(portalId, role, data) {
    const accounts = await Account.find({
      portalId: toObjectId(portalId),
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

  async _sendEmail(account, notification) {
    console.log(`📧 Email notification to ${account.email}: ${notification.title}`);
  }

  async _sendSms(account, notification) {
    console.log(`📱 SMS notification to ${account.phone}: ${notification.title}`);
  }
}

let notificationServiceInstance = null;

export const getNotificationService = (io) => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService(io);
  }
  return notificationServiceInstance;
};

export default NotificationService;