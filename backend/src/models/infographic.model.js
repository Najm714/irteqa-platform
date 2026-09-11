// backend/src/models/infographic.model.js
import mongoose from 'mongoose';

const InfographicSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  // === معلومات الإنفوجرافيك ===
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  thumbnailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  // === المعلومات الأساسية ===
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  titleAr: {
    type: String,
    required: [true, 'Arabic title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  descriptionAr: {
    type: String,
    trim: true,
    default: '',
  },
  // === التصنيفات ===
  category: {
    type: String,
    enum: [
      'educational',   // تعليمي
      'statistical',   // إحصائي
      'process',       // عمليات
      'comparison',    // مقارنات
      'timeline',      // تسلسل زمني
      'hierarchy',     // هرمي
      'geographical',  // جغرافي
      'other',         // أخرى
    ],
    default: 'educational',
    index: true,
  },
  categoryAr: {
    type: String,
    default: 'تعليمي',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  // === حالة النشر ===
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  // === إحصائيات ===
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  // === ترتيب ===
  order: {
    type: Number,
    default: 0,
  },
  // === بيانات إضافية ===
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
}, {
  timestamps: true,
});

// ✅ الفهارس
InfographicSchema.index({ portalId: 1, category: 1 });
InfographicSchema.index({ portalId: 1, isPublished: 1 });
InfographicSchema.index({ portalId: 1, isFeatured: 1 });
InfographicSchema.index({ title: 'text', titleAr: 'text', description: 'text', descriptionAr: 'text' });

// ✅ Pre-save middleware
InfographicSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Infographic = mongoose.models.Infographic || 
  mongoose.model('Infographic', InfographicSchema);