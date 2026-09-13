// src/models/Notification.model.js
import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  // المستخدم المستهدف
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  // نوع الإشعار
  type: {
    type: String,
    enum: [
      'request_created',
      'request_assigned',
      'request_updated',
      'request_completed',
      'request_cancelled',
      'scope_approved',
      'payment_received',
      'payment_verified',
      'payment_failed',
      'new_message',
      'new_call',
      'call_scheduled',
      'delivery_submitted',
      'delivery_reviewed',
      'modification_requested',
      'subscription_created',
      'subscription_expiring',
      'subscription_expired',
      'subscription_cancelled',
      'content_available',
      'review_requested',
      'system_alert',
      'support_reply',
    ],
    required: true,
  },
  // العنوان والرسالة
  title: {
    type: String,
    required: true,
    trim: true,
  },
  titleAr: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  messageAr: {
    type: String,
    required: true,
    trim: true,
  },
  // البيانات المرتبطة
  data: {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Call',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    url: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  // حالة الإشعار
  isRead: {
    type: Boolean,
    default: false,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  // القنوات
  channels: {
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true },
  },
  // الأولوية
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  // تاريخ الانتهاء (للإشعارات المؤقتة)
  expiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// الفهارس
NotificationSchema.index({ portalId: 1, accountId: 1 });
NotificationSchema.index({ portalId: 1, accountId: 1, isRead: 1 });
NotificationSchema.index({ accountId: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

NotificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ دالة مساعدة لإنشاء إشعار
NotificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};
// ✅ دالة لجلب الإشعارات غير المقروءة
NotificationSchema.statics.getUnreadCount = async function(accountId, portalId) {
  // ✅ حوّل String → ObjectId
  const mongoose = (await import('mongoose')).default;
  const accountObjectId = mongoose.Types.ObjectId.isValid(accountId)
    ? new mongoose.Types.ObjectId(accountId)
    : accountId;
  const portalObjectId = mongoose.Types.ObjectId.isValid(portalId)
    ? new mongoose.Types.ObjectId(portalId)
    : portalId;

  return this.countDocuments({
    accountId: accountObjectId,
    portalId: portalObjectId,
    isRead: false,
  });
};

export const Notification = mongoose.models.Notification || 
  mongoose.model('Notification', NotificationSchema);