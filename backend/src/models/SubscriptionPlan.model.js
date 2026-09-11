// backend/src/models/SubscriptionPlan.model.js
import mongoose from 'mongoose';

const SubscriptionPlanSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  nameAr: {
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
  // نوع الخطة
  type: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
    required: true,
  },
  // السعر
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'SAR',
  },
  // المدة بالأيام
  durationDays: {
    type: Number,
    required: true,
  },
  // المميزات
  features: [{
    name: String,
    nameAr: String,
    included: { type: Boolean, default: true },
  }],
  // نطاق الخطة
  scope: {
    contentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
    }],
    materialIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
    }],
    videoIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
    }],
    serviceIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    }],
    unlimitedContent: {
      type: Boolean,
      default: false,
    },
  },
  // حدود الاستخدام
  limits: {
    maxRequests: { type: Number, default: 0 },
    maxDownloads: { type: Number, default: 0 },
    maxCalls: { type: Number, default: 0 },
  },
  // حالة النشر
  isActive: {
    type: Boolean,
    default: true,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  order: {
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
SubscriptionPlanSchema.index({ portalId: 1, type: 1 });
SubscriptionPlanSchema.index({ portalId: 1, isActive: 1 });
SubscriptionPlanSchema.index({ portalId: 1, isPopular: 1 });

SubscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const SubscriptionPlan = mongoose.models.SubscriptionPlan || 
  mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);