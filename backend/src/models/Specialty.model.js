// backend/src/models/Specialty.model.js
import mongoose from 'mongoose';

const SpecialtySchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: true,
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Specialty name is required'],
    trim: true,
  },
  nameAr: {
    type: String,
    required: [true, 'Specialty name in Arabic is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  descriptionAr: {
    type: String,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  icon: {
    type: String,
    default: 'fa-tag',
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: {
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

SpecialtySchema.index({ portalId: 1, collegeId: 1, slug: 1 }, { unique: true });
SpecialtySchema.index({ portalId: 1, collegeId: 1, isActive: 1 });

SpecialtySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/ /g, '-');
  }
  next();
});

export const Specialty = mongoose.models.Specialty || 
  mongoose.model('Specialty', SpecialtySchema);