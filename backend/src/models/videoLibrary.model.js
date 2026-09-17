// backend/src/models/videoLibrary.model.js
import mongoose from 'mongoose';
import { extractPortalId } from '../utils/portalHelpers.js';

const VideoLibrarySchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  // === معلومات الفيديو ===
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
  instructor: {
    type: String,
    trim: true,
    default: '',
  },
  // === رابط الفيديو (للتوافق مع النظام القديم) ===
  videoUrl: {
    type: String,
    trim: true,
    default: '',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 0,
    min: 0,
  },
  durationFormatted: {
    type: String,
    default: '00:00',
  },
  // === التصنيفات ===
  category: {
    type: String,
    enum: [
      'tutorial',    // درس تعليمي
      'lecture',     // محاضرة
      'workshop',    // ورشة عمل
      'webinar',     // ندوة عبر الإنترنت
      'presentation', // عرض تقديمي
      'interview',   // مقابلة
      'other',       // أخرى
    ],
    default: 'tutorial',
    index: true,
  },
  categoryAr: {
    type: String,
    default: 'درس تعليمي',
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
  isEncrypted: {
    type: Boolean,
    default: false,
  },
  // === إحصائيات ===
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  likes: {
    type: Number,
    default: 0,
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
  // === Slug ===
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
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
VideoLibrarySchema.index({ portalId: 1, category: 1 });
VideoLibrarySchema.index({ portalId: 1, isPublished: 1 });
VideoLibrarySchema.index({ portalId: 1, isFeatured: 1 });
VideoLibrarySchema.index({ slug: 1, portalId: 1 }, { unique: true, sparse: true });
VideoLibrarySchema.index({ title: 'text', titleAr: 'text', description: 'text', descriptionAr: 'text' });

// ✅ Pre-save middleware
VideoLibrarySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (!this.slug && (this.titleAr || this.title)) {
    this.slug = (this.titleAr || this.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  if (this.duration && this.duration > 0) {
    const mins = Math.floor(this.duration / 60);
    const secs = Math.floor(this.duration % 60);
    this.durationFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  next();
});

// ✅ طريقة للحصول على رابط الفيديو الكامل
VideoLibrarySchema.methods.getVideoUrl = function(baseUrl = '') {
  if (this.fileId) {
    return `${baseUrl}/api/files/${this.fileId}/download-direct`;
  }
  
  if (!this.videoUrl || this.videoUrl.trim() === '') {
    return null;
  }
  
  if (this.videoUrl.startsWith('http://') || this.videoUrl.startsWith('https://')) {
    return this.videoUrl;
  }
  
  if (this.videoUrl.match(/^[0-9a-fA-F]{24}$/)) {
    return `${baseUrl}/api/files/${this.videoUrl}/download-direct`;
  }
  
  return this.videoUrl;
};

// ✅ طريقة للتحقق من وجود رابط صالح
VideoLibrarySchema.methods.hasValidUrl = function() {
  return !!(this.fileId || (this.videoUrl && this.videoUrl.trim() !== ''));
};

// ✅ طريقة للتحقق من الصلاحية
// ✅ طريقة للتحقق من صلاحية مشاهدة الفيديو
VideoLibrarySchema.methods.canView = function(user, subscription) {
  if (!user) return false;

  if (user.role === 'super_admin') return true;

  const videoPortalId = extractPortalId(this.portalId);
  const userPortalId = extractPortalId(user.portalId);

  if (!videoPortalId || !userPortalId || videoPortalId !== userPortalId) {
    return false;
  }

  if (user.role === 'portal_admin') return true;
  if (!this.isEncrypted) return true;

  if (
    subscription &&
    subscription.status === 'active' &&
    subscription.paymentStatus === 'paid'
  ) {
    return true;
  }

  return false;
};

export const VideoLibrary = mongoose.models.VideoLibrary || 
  mongoose.model('VideoLibrary', VideoLibrarySchema);