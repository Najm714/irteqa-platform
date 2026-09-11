// backend/src/models/Section.model.js
import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  nameAr: {
    type: String,
    required: [true, 'Name in Arabic is required'],
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
  icon: {
    type: String,
    default: 'fa-folder',
  },
  image: {
    type: String,
    default: '',
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    lowercase: true,
    trim: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// ✅ فهرس فريد لمنع تكرار slug
SectionSchema.index({ portalId: 1, slug: 1 }, { unique: true });

export const Section = mongoose.models.Section || 
  mongoose.model('Section', SectionSchema);