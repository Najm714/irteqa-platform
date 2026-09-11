// backend/src/models/Video.model.js
import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: [true, 'University ID is required'],
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College ID is required'],
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: [true, 'Specialty ID is required'],
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'Material ID is required'],
    index: true,
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
    required: [true, 'Instructor is required'],
    trim: true,
  },
  // ✅ videoUrl يخزن معرف الملف (fileId) أو الرابط الكامل
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
  isEncrypted: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
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
}, {
  timestamps: true,
});

// ✅ الفهارس
VideoSchema.index({ portalId: 1, materialId: 1, isPublished: 1 });
VideoSchema.index({ portalId: 1, isPublished: 1, order: 1 });
VideoSchema.index({ slug: 1, portalId: 1 }, { unique: true });

// ✅ Pre-save middleware
VideoSchema.pre('save', function(next) {
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
  next();
});

// ✅ طريقة للحصول على رابط الفيديو الكامل
VideoSchema.methods.getVideoUrl = function(baseUrl = '') {
  // ✅ إذا كان videoUrl فارغاً
  if (!this.videoUrl || this.videoUrl.trim() === '') {
    return null;
  }
  
  // ✅ إذا كان videoUrl رابطاً كاملاً (http أو https)
  if (this.videoUrl.startsWith('http://') || this.videoUrl.startsWith('https://')) {
    return this.videoUrl;
  }
  
  // ✅ إذا كان videoUrl هو معرف ملف (ObjectId)
  if (this.videoUrl.match(/^[0-9a-fA-F]{24}$/)) {
    return `${baseUrl}/api/files/${this.videoUrl}/download-direct`;
  }
  
  // ✅ إذا كان videoUrl هو مسار في R2
  if (this.videoUrl.includes('r2.cloudflarestorage.com')) {
    return this.videoUrl;
  }
  
  // ✅ افتراضياً، إرجاع المسار مع baseUrl
  return `${baseUrl}/api/files/${this.videoUrl}/download-direct`;
};

// ✅ طريقة للتحقق من وجود رابط صالح
VideoSchema.methods.hasValidUrl = function() {
  return this.videoUrl && this.videoUrl.trim() !== '';
};

export const Video = mongoose.models.Video || 
  mongoose.model('Video', VideoSchema);