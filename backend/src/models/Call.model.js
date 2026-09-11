// backend/src/models/Call.model.js
import mongoose from 'mongoose';

const CallSchema = new mongoose.Schema({
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
  // المشاركون
  initiatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  // معلومات المكالمة
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // الموعد
  scheduledAt: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // بالدقائق
    default: 30,
  },
  // الحالة
  status: {
    type: String,
    enum: ['scheduled', 'started', 'completed', 'cancelled', 'missed'],
    default: 'scheduled',
  },
  // نوع المكالمة
  type: {
    type: String,
    enum: ['audio', 'video', 'screen_share'],
    default: 'video',
  },
  // بيانات المكالمة
  meetingId: String,
  meetingUrl: String,
  // التسجيل
  recording: {
    enabled: { type: Boolean, default: false },
    url: String,
  },
  // الملاحظات
  notes: {
    type: String,
    trim: true,
  },
  // التقييم (بعد المكالمة)
  rating: {
    value: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    reviewedAt: Date,
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
CallSchema.index({ portalId: 1, requestId: 1 });
CallSchema.index({ portalId: 1, initiatorId: 1 });
CallSchema.index({ portalId: 1, participantId: 1 });
CallSchema.index({ scheduledAt: 1 });
CallSchema.index({ status: 1 });

CallSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ دالة لبدء المكالمة
CallSchema.methods.start = function() {
  this.status = 'started';
  this.updatedAt = new Date();
  return this;
};

// ✅ دالة لإكمال المكالمة
CallSchema.methods.complete = function() {
  this.status = 'completed';
  this.updatedAt = new Date();
  return this;
};

export const Call = mongoose.models.Call || 
  mongoose.model('Call', CallSchema);