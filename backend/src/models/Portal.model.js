// backend/src/models/Portal.model.js
import mongoose from 'mongoose';

const PortalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Portal name is required'],
    trim: true,
    minlength: [3, 'Portal name must be at least 3 characters'],
    maxlength: [100, 'Portal name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Portal slug is required'],
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    // ✅ إزالة unique: true
  },
  url: {
    type: String,
    required: [true, 'Portal URL is required'],
    trim: true,
    // ✅ إزالة unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  logo: String,
  favicon: String,
  theme: {
    primaryColor: { type: String, default: '#2563eb' },
    secondaryColor: { type: String, default: '#7c3aed' },
    accentColor: { type: String, default: '#f59e0b' },
    fontFamily: { type: String, default: 'Inter' },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    registrationEnabled: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    defaultRole: { type: String, default: 'customer' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: String,
  },
  seo: {
    title: String,
    description: String,
    keywords: [String],
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ فهارس موحدة - هنا فقط
PortalSchema.index({ slug: 1 }, { unique: true });
PortalSchema.index({ url: 1 }, { unique: true });

// Pre-save middleware
PortalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Portal = mongoose.model('Portal', PortalSchema);