// backend/src/models/Message.model.js
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  // الطلب المرتبط (إذا كان موجوداً)
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
  },
  // المرسل
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['customer', 'specialist', 'portal_admin', 'super_admin'],
    required: true,
  },
  // المستقبل
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  // المحتوى
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
  },
  // المرفقات
  attachments: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    filename: String,
    size: Number,
    mimeType: String,
  }],
  // حالة الرسالة
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  // نوع الرسالة
  type: {
    type: String,
    enum: ['text', 'file', 'system', 'notification'],
    default: 'text',
  },
  // للردود
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  metadata: mongoose.Schema.Types.Mixed,
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
MessageSchema.index({ portalId: 1, requestId: 1 });
MessageSchema.index({ portalId: 1, senderId: 1 });
MessageSchema.index({ portalId: 1, receiverId: 1 });
MessageSchema.index({ requestId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });

MessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Message = mongoose.models.Message || 
  mongoose.model('Message', MessageSchema);