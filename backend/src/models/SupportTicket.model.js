
// backend/src/models/SupportTicket.model.js
import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  // صاحب التذكرة
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  // المرتبط بالتذكرة (اختياري)
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
  },
  // معلومات التذكرة
  category: {
    type: String,
    enum: [
      'account',
      'technical',
      'payment',
      'subscription',
      'request',
      'content',
      'general',
      'complaint',
      'other',
    ],
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  subjectAr: {
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
  // الحالة
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'],
    default: 'open',
  },
  // الأولوية
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  // المختص المسند
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  // الردود
  replies: [{
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
    attachments: [{
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
      filename: String,
    }],
    isInternal: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // سجل النشاط
  activityLog: [{
    action: {
      type: String,
      enum: ['created', 'assigned', 'status_changed', 'replied', 'resolved', 'closed'],
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  // بيانات إضافية
  metadata: mongoose.Schema.Types.Mixed,
  resolvedAt: Date,
  closedAt: Date,
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
SupportTicketSchema.index({ portalId: 1, accountId: 1 });
SupportTicketSchema.index({ portalId: 1, status: 1 });
SupportTicketSchema.index({ portalId: 1, assignedTo: 1 });
SupportTicketSchema.index({ portalId: 1, priority: 1 });
SupportTicketSchema.index({ portalId: 1, category: 1 });

SupportTicketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ دالة لإضافة رد
SupportTicketSchema.methods.addReply = function(replyData) {
  this.replies.push(replyData);
  this.status = 'in_progress';
  this.updatedAt = new Date();
  
  this.activityLog.push({
    action: 'replied',
    actorId: replyData.senderId,
    details: {
      message: replyData.message?.substring(0, 100),
    },
    timestamp: new Date(),
  });
  
  return this;
};

// ✅ دالة لتغيير الحالة
SupportTicketSchema.methods.changeStatus = function(newStatus, actorId) {
  this.status = newStatus;
  this.updatedAt = new Date();
  
  if (newStatus === 'resolved') {
    this.resolvedAt = new Date();
  }
  if (newStatus === 'closed') {
    this.closedAt = new Date();
  }
  
  this.activityLog.push({
    action: 'status_changed',
    actorId,
    details: { newStatus },
    timestamp: new Date(),
  });
  
  return this;
};

// ✅ دالة لإسناد التذكرة
SupportTicketSchema.methods.assignTo = function(assignedTo, actorId) {
  this.assignedTo = assignedTo;
  this.status = 'in_progress';
  this.updatedAt = new Date();
  
  this.activityLog.push({
    action: 'assigned',
    actorId,
    details: { assignedTo },
    timestamp: new Date(),
  });
  
  return this;
};

export const SupportTicket = mongoose.models.SupportTicket || 
  mongoose.model('SupportTicket', SupportTicketSchema);