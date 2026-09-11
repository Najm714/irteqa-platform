// backend/src/models/University.model.js
import mongoose from 'mongoose';

const UniversitySchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'University name is required'],
    trim: true,
  },
  nameAr: {
    type: String,
    required: [true, 'University name in Arabic is required'],
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
  icon: {
    type: String,
    default: 'fa-university',
  },
  logo: {
    type: String,
    default: '',
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    lowercase: true,
    trim: true,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
}, {
  timestamps: true,
});

// ✅ فهرس مركب لضمان uniqueness مع portalId
UniversitySchema.index({ portalId: 1, slug: 1 }, { unique: true });
UniversitySchema.index({ portalId: 1, isActive: 1 });
UniversitySchema.index({ slug: 1 });

// ✅ Pre-save hook لتوليد slug تلقائياً
UniversitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (!this.slug || this.slug.trim() === '') {
    const baseName = this.nameAr || this.name || 'university';
    this.slug = baseName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (!this.slug) {
      this.slug = 'university-' + Date.now();
    }
  }
  
  next();
});

export const University = mongoose.models.University || 
  mongoose.model('University', UniversitySchema);