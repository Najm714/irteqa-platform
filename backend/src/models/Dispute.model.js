// backend/src/models/Dispute.model.js
import mongoose from 'mongoose';

const DisputeSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  // منشئ النزاع
  initiatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  initiatorRole: {
    type: String,
    enum: ['customer', 'specialist', 'portal_admin'],
    required: true,
  },
  // الطرف الآخر
  respondentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  respondentRole: {
    type: String,
    enum: ['customer', 'specialist', 'portal_admin'],
    required: true,
  },
  // معلومات النزاع
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
  description: {
    type: String,
    required: true,
    trim: true,
  },
  descriptionAr: {
    type: String,
    required: true,
    trim: true,
  },
  // نوع النزاع
  type: {
    type: String,
    enum: [
      'scope_disagreement',
      'quality_issue',
      'delivery_issue',
      'payment_dispute',
      'timeline_dispute',
      'miscommunication',
      'other',
    ],
    required: true,
  },
  // المرفقات
  attachments: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    filename: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    uploadedAt: Date,
  }],
  // الحالة
  status: {
    type: String,
    enum: ['open', 'under_review', 'negotiation', 'resolution_proposed', 'resolved', 'closed'],
    default: 'open',
  },
  // الرسائل
  messages: [{
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
    message: {
      type: String,
      required: true,
      trim: true,
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
  // الحل المقترح
  resolution: {
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    proposedAt: Date,
    description: String,
    descriptionAr: String,
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    acceptedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    rejectedAt: Date,
  },
  // سجل النشاط
  activityLog: [{
    action: {
      type: String,
      enum: ['created', 'message', 'status_changed', 'resolution_proposed', 'resolution_accepted', 'resolution_rejected', 'closed'],
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
DisputeSchema.index({ portalId: 1, requestId: 1 });
DisputeSchema.index({ portalId: 1, initiatorId: 1 });
DisputeSchema.index({ portalId: 1, respondentId: 1 });
DisputeSchema.index({ portalId: 1, status: 1 });
DisputeSchema.index({ portalId: 1, type: 1 });

DisputeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ دالة لإضافة رسالة
DisputeSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  this.status = 'negotiation';
  this.updatedAt = new Date();
  
  this.activityLog.push({
    action: 'message',
    actorId: messageData.senderId,
    details: {
      message: messageData.message?.substring(0, 100),
    },
    timestamp: new Date(),
  });
  
  return this;
};

// ✅ دالة لتغيير الحالة
DisputeSchema.methods.changeStatus = function(newStatus, actorId) {
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

// ✅ دالة لاقتراح حل
DisputeSchema.methods.proposeResolution = function(proposedBy, description) {
  this.resolution = {
    proposedBy,
    proposedAt: new Date(),
    description,
    descriptionAr: description,
  };
  this.status = 'resolution_proposed';
  this.updatedAt = new Date();
  
  this.activityLog.push({
    action: 'resolution_proposed',
    actorId: proposedBy,
    details: { description: description?.substring(0, 100) },
    timestamp: new Date(),
  });
  
  return this;
};

export const Dispute = mongoose.models.Dispute || 
  mongoose.model('Dispute', DisputeSchema);