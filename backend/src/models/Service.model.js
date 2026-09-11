// backend/src/models/Service.model.js
import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: [true, 'Section ID is required'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
  },
  nameAr: {
    type: String,
    required: [true, 'Service name in Arabic is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  descriptionAr: {
    type: String,
    default: '',
    trim: true,
  },
  icon: {
    type: String,
    default: 'fa-cog',
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    lowercase: true,
    trim: true,
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  pricing: {
    type: {
      type: String,
      enum: ['free', 'fixed', 'custom', 'hourly'],
      default: 'custom',
    },
    defaultPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
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
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
}, {
  timestamps: true,
});

// ✅ فهارس
ServiceSchema.index({ portalId: 1, sectionId: 1 });
ServiceSchema.index({ portalId: 1, slug: 1 }, { unique: true });
ServiceSchema.index({ portalId: 1, isPublished: 1, order: 1 });

// ✅ Pre-save middleware
ServiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (!this.slug || this.slug.trim() === '') {
    const baseName = this.nameAr || this.name || 'service';
    this.slug = baseName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  next();
});

export const Service = mongoose.models.Service || 
  mongoose.model('Service', ServiceSchema);