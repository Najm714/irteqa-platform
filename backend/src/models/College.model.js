// backend/src/models/College.model.js
import mongoose from 'mongoose';

const CollegeSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: [true, 'College name is required'],
    trim: true,
  },
  nameAr: {
    type: String,
    required: [true, 'College name in Arabic is required'],
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
  icon: {
    type: String,
    default: 'fa-school',
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

CollegeSchema.index({ portalId: 1, universityId: 1, slug: 1 }, { unique: true });
CollegeSchema.index({ portalId: 1, universityId: 1, isActive: 1 });

CollegeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/ /g, '-');
  }
  next();
});

export const College = mongoose.models.College || 
  mongoose.model('College', CollegeSchema);