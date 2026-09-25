// backend/src/models/File.model.js
import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account ID is required'],
    index: true,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    default: null,
    index: true,
  },
  originalName: {
    type: String,
    required: [true, 'Original name is required'],
    trim: true,
  },
  storageKey: {
    type: String,
    required: [true, 'Storage key is required'],
    unique: true,
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
  },
  category: {
    type: String,
  enum: [
    'user',
    'work',
    'final',
    'revision',
    'platform_sample',
    'learning_content',
    'profile',
    'request_file',
    'request',
    'proof',
    'delivery',
    'modification',
    'support',
    'payment_proof',
    'video',
    'summary',
    'service_form',
    'content',
    'attachment',
    'message',
    'library',
    'library_file',
    'document',
    'image',
    'infographic',
    'thumbnail',
    // ✅ أضف هذه الفئات الجديدة هنا
    'about',
    'offer',
    'promotion',
    'banner',
    'slide',
    'cover',
    'logo',
    'hero-image',
    'hero-video',
    'popup-image',
    'side-banner-image',
    'sections-bg',
    'sections-pattern',
    ],
    required: [true, 'Category is required'],
    default: 'user',
    index: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'subscription', 'restricted'],
    default: 'private',
  },
  isEncrypted: {
    type: Boolean,
    default: false,
  },
  storageProvider: {
    type: String,
    enum: ['local', 'r2'],
    default: 'local',
  },
  accessRules: {
    roles: [String],
    accounts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    }],
  },
  version: {
    type: Number,
    default: 1,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// ✅ الفهارس
FileSchema.index({ storageKey: 1 }, { unique: true });
FileSchema.index({ portalId: 1, category: 1 });
FileSchema.index({ accountId: 1, category: 1 });
FileSchema.index({ requestId: 1 });
FileSchema.index({ portalId: 1, isDeleted: 1 });

// ✅ Pre-save middleware
FileSchema.pre('save', function(next) {
  if (this.isModified('isDeleted') && this.isDeleted === true) {
    this.deletedAt = new Date();
  }
  next();
});

export const File = mongoose.models.File || 
  mongoose.model('File', FileSchema);