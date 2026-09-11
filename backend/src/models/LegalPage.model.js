// backend/src/models/LegalPage.model.js
import mongoose from 'mongoose';

const LegalPageSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  // نوع الصفحة
  type: {
    type: String,
    enum: [
      'terms',
      'privacy',
      'cookie',
      'refund',
      'modification',
      'complaints',
      'intellectual_property',
      'academic_charter',
      'quality_assurance',
      'service_policies',
      'about',
      'contact',
      'faq',
    ],
    required: true,
    unique: true,
  },
  // العنوان
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
  // المحتوى
  content: {
    type: String,
    required: true,
  },
  contentAr: {
    type: String,
    required: true,
  },
  // ملخص (للـ SEO)
  excerpt: {
    type: String,
    trim: true,
  },
  excerptAr: {
    type: String,
    trim: true,
  },
  // حالة النشر
  isPublished: {
    type: Boolean,
    default: true,
  },
  // الإصدار
  version: {
    type: Number,
    default: 1,
  },
  // تاريخ التحديث
  effectiveDate: {
    type: Date,
    default: Date.now,
  },
  // بيانات SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
  },
  // سجل التغييرات
  changeLog: [{
    version: Number,
    changes: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
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
LegalPageSchema.index({ portalId: 1, type: 1 }, { unique: true });
LegalPageSchema.index({ portalId: 1, isPublished: 1 });

LegalPageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ دالة لإضافة تغيير
LegalPageSchema.methods.addChangeLog = function(changes, changedBy) {
  this.version += 1;
  this.changeLog.push({
    version: this.version,
    changes,
    changedBy,
    changedAt: new Date(),
  });
  this.updatedAt = new Date();
  return this;
};

export const LegalPage = mongoose.models.LegalPage || 
  mongoose.model('LegalPage', LegalPageSchema);