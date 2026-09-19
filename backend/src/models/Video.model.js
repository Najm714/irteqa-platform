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

  // ============================================================
  // ✅ ✅ ✅ Live Stream Fields
  // ============================================================

  isLive: {
    type: Boolean,
    default: false,
    index: true,
  },

  liveStreamUid: {
    type: String,
    default: null,
    index: true,
    sparse: true,
  },

  liveRtmpUrl: {
    type: String,
    default: null,
  },

liveRtmpKey: {
  type: String,
  default: null,
},

  livePlaybackUrl: {
    type: String,
    default: null,
  },

  liveStatus: {
    type: String,
    enum: ['idle', 'live', 'ended', 'error'],
    default: 'idle',
    index: true,
  },

  liveSchedule: {
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: 0 },
  },

  liveRecording: {
    enabled: { type: Boolean, default: true },
    videoUid: { type: String, default: null },
    videoUrl: { type: String, default: null },
  },

  liveViewers: {
    type: Number,
    default: 0,
    min: 0,
  },

  liveMaxViewers: {
    type: Number,
    default: 0,
  },

  liveStats: {
    peakViewers: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalWatchTime: { type: Number, default: 0 },
  },

  liveCreatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null,
  },

  liveAccessType: {
    type: String,
    enum: ['public', 'subscription', 'private'],
    default: 'subscription',
  },

  liveChat: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    userName: { type: String },
    message: { type: String, maxlength: 500 },
    timestamp: { type: Date, default: Date.now },
  }],

}, {
  timestamps: true,
});

// ✅ الفهارس
VideoSchema.index({ portalId: 1, materialId: 1, isPublished: 1 });
VideoSchema.index({ portalId: 1, isPublished: 1, order: 1 });
VideoSchema.index({ slug: 1, portalId: 1 }, { unique: true });
VideoSchema.index({ portalId: 1, isLive: 1, liveStatus: 1 });
VideoSchema.index({ portalId: 1, isLive: 1, 'liveSchedule.scheduledAt': -1 });

// ✅ Pre-save
VideoSchema.pre('save', function (next) {
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

// ✅ روابط
VideoSchema.methods.getVideoUrl = function (baseUrl = '') {
  if (!this.videoUrl || this.videoUrl.trim() === '') return null;

  if (this.videoUrl.startsWith('http://') || this.videoUrl.startsWith('https://')) {
    return this.videoUrl;
  }

  if (this.videoUrl.match(/^[0-9a-fA-F]{24}$/)) {
    return `${baseUrl}/api/files/${this.videoUrl}/download-direct`;
  }

  return this.videoUrl;
};

VideoSchema.methods.hasValidUrl = function () {
  return this.videoUrl && this.videoUrl.trim() !== '';
};

// ✅ دوال مساعدة للبث
VideoSchema.methods.isCurrentlyLive = function () {
  return this.isLive && this.liveStatus === 'live';
};

VideoSchema.methods.canView = function (user, subscription) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.role === 'portal_admin') return true;

  // ✅ البث العام
  if (this.isLive && this.liveAccessType === 'public') {
    return true;
  }

  // ✅ البث للمشتركين
  if (this.isLive && this.liveAccessType === 'subscription') {
    return subscription && subscription.status === 'active';
  }

  // ✅ الفيديو العادي
  if (!this.isEncrypted) return true;
  if (subscription && subscription.status === 'active') return true;

  return false;
};

export const Video = mongoose.models.Video ||
  mongoose.model('Video', VideoSchema);