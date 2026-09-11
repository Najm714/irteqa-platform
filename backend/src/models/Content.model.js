// src/models/Content.model.js
import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['video', 'summary', 'article', 'document', 'presentation'],
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
  descriptionAr: {
    type: String,
    trim: true,
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
  // للفيديوهات
  videoUrl: {
    type: String,
    trim: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 0,
  },
  // للملخصات
  summaryText: {
    type: String,
    trim: true,
  },
  summaryFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
  },
  // الملفات المرفقة
  attachments: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    filename: String,
    type: String,
  }],
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
ContentSchema.index({ portalId: 1, category: 1 });
ContentSchema.index({ portalId: 1, subject: 1 });
ContentSchema.index({ portalId: 1, accessType: 1 });
ContentSchema.index({ portalId: 1, isPublished: 1 });
ContentSchema.index({ portalId: 1, isFeatured: 1 });
ContentSchema.index({ portalId: 1, universityId: 1, collegeId: 1, specialtyId: 1 });

ContentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Content = mongoose.model('Content', ContentSchema);