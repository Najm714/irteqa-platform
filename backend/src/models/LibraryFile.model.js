// backend/src/models/LibraryFile.model.js
import mongoose from 'mongoose';

const LibraryFileSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  // === معلومات الملف ===
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: [true, 'File ID is required'],
  },
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
    default: '',
  },
  descriptionAr: {
    type: String,
    default: '',
  },
  // === التصنيفات ===
  category: {
    type: String,
    enum: [
      'guide',      // دليل
      'template',   // نموذج
      'policy',     // سياسة
      'manual',     // دليل إرشادي
      'report',     // تقرير
      'presentation', // عرض تقديمي
      'research',   // بحث
      'other',      // أخرى
    ],
    default: 'other',
    index: true,
  },
  categoryAr: {
    type: String,
    default: 'أخرى',
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
  downloads: {
    type: Number,
    default: 0,
  },
  views: {
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

// ✅ فهارس
LibraryFileSchema.index({ portalId: 1, category: 1 });
LibraryFileSchema.index({ portalId: 1, isPublished: 1 });
LibraryFileSchema.index({ portalId: 1, isFeatured: 1 });
LibraryFileSchema.index({ title: 'text', titleAr: 'text', description: 'text', descriptionAr: 'text' });

export const LibraryFile = mongoose.models.LibraryFile || 
  mongoose.model('LibraryFile', LibraryFileSchema);