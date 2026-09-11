// src/models/Summary.model.js
import mongoose from 'mongoose';

const SummarySchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
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
    trim: true,
  },
  // المحتوى
  content: {
    type: String,
    required: true,
  },
  contentAr: {
    type: String,
    required: true,
  },
  // الملفات
  summaryFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
  },
  attachments: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    filename: String,
    type: String,
  }],
  // التصنيف
  category: {
    type: String,
    required: true,
    trim: true,
  },
  categoryAr: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
  },
  subjectAr: {
    type: String,
    trim: true,
  },
  // للمواد الأكاديمية
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
  },
  // أنواع الوصول
  accessType: {
    type: String,
    enum: ['free', 'trial', 'subscription', 'private'],
    default: 'free',
  },
  subscriptionPlanIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
  }],
  // حالة النشر
  isPublished: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
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
SummarySchema.index({ portalId: 1, category: 1 });
SummarySchema.index({ portalId: 1, subject: 1 });
SummarySchema.index({ portalId: 1, accessType: 1 });
SummarySchema.index({ portalId: 1, isPublished: 1 });
SummarySchema.index({ portalId: 1, materialId: 1 });

SummarySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Summary = mongoose.models.Summary || mongoose.model('Summary', SummarySchema);