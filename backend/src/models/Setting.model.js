// backend/src/models/Setting.model.js
import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
    unique: true,
  },
  general: {
    siteName: { type: String, default: 'ارتقاء' },
    siteNameAr: { type: String, default: 'ارتقاء' },
    siteDescription: { type: String, default: 'منصة تعليمية متكاملة' },
    siteDescriptionAr: { type: String, default: 'منصة تعليمية متكاملة' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    address: { type: String, default: '' },
    addressAr: { type: String, default: '' },
  },
  appearance: {
    primaryColor: { type: String, default: '#7C3AED' },
    secondaryColor: { type: String, default: '#6D28D9' },
    accentColor: { type: String, default: '#F59E0B' },
    darkMode: { type: Boolean, default: true },
  },
  auth: {
    registrationEnabled: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    defaultRole: { type: String, default: 'customer' },
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 30 },
  },
  payment: {
    enabled: { type: Boolean, default: true },
    currency: { type: String, default: 'SAR' },
    stripeEnabled: { type: Boolean, default: false },
    paytabsEnabled: { type: Boolean, default: false },
    manualPaymentEnabled: { type: Boolean, default: true },
  },
  content: {
    enableVideos: { type: Boolean, default: true },
    enableSummaries: { type: Boolean, default: true },
    maxVideoSize: { type: Number, default: 500 },
    maxFileSize: { type: Number, default: 50 },
    allowedFileTypes: { type: [String], default: ['pdf', 'doc', 'docx', 'jpg', 'png'] },
  },
  notifications: {
    emailEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    newRequest: { type: Boolean, default: true },
    requestUpdate: { type: Boolean, default: true },
    paymentReceived: { type: Boolean, default: true },
    newMessage: { type: Boolean, default: true },
  },
  system: {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: '' },
    maintenanceMessageAr: { type: String, default: '' },
    debugMode: { type: Boolean, default: false },
  },
  seo: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: [String], default: [] },
    googleAnalytics: { type: String, default: '' },
    facebookPixel: { type: String, default: '' },
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  updatedBy: {
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

SettingSchema.index({ portalId: 1 }, { unique: true });

SettingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Setting = mongoose.models.Setting || 
  mongoose.model('Setting', SettingSchema);