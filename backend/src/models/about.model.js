// backend/src/models/about.model.js
import mongoose from 'mongoose';

const AboutSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    unique: true,
    index: true,
  },
  // === التعريف بالمنصة ===
  platformName: {
    type: String,
    trim: true,
    default: '',
  },
  platformNameAr: {
    type: String,
    trim: true,
    default: '',
  },
  platformDescription: {
    type: String,
    default: '',
  },
  platformDescriptionAr: {
    type: String,
    default: '',
  },
  platformLogo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  platformCover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  // === قصة التأسيس ===
  story: {
    type: String,
    default: '',
  },
  storyAr: {
    type: String,
    default: '',
  },
  foundedDate: {
    type: Date,
    default: null,
  },
  // === الرؤية ===
  vision: {
    type: String,
    default: '',
  },
  visionAr: {
    type: String,
    default: '',
  },
  // === الرسالة ===
  mission: {
    type: String,
    default: '',
  },
  missionAr: {
    type: String,
    default: '',
  },
  // === القيم الجوهرية ===
  values: [{
    title: String,
    titleAr: String,
    description: String,
    descriptionAr: String,
    icon: String,
    order: { type: Number, default: 0 },
  }],
  // === أرقام وإحصائيات ===
  stats: [{
    label: String,
    labelAr: String,
    value: String,
    icon: String,
    order: { type: Number, default: 0 },
  }],
  // === فريق العمل ===
  team: [{
    name: String,
    nameAr: String,
    position: String,
    positionAr: String,
    bio: String,
    bioAr: String,
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    email: String,
    linkedin: String,
    twitter: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  }],
  // === الإنجازات والجوائز ===
  achievements: [{
    title: String,
    titleAr: String,
    description: String,
    descriptionAr: String,
    date: Date,
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  }],
  // === آراء العملاء ===
  testimonials: [{
    name: String,
    nameAr: String,
    position: String,
    positionAr: String,
    content: String,
    contentAr: String,
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  }],
  // === معلومات الاتصال ===
  contactInfo: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    addressAr: { type: String, default: '' },
    mapUrl: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    workingHoursAr: { type: String, default: '' },
    socialMedia: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
  },
  // === ملف التعريف (PDF) ===
  profileFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  // === حالة النشر ===
  isPublished: {
    type: Boolean,
    default: true,
  },
  // === بيانات إضافية ===
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
}, {
  timestamps: true,
});

// ✅ الفهارس
AboutSchema.index({ portalId: 1 }, { unique: true });

// ✅ Pre-save middleware
AboutSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const About = mongoose.models.About || 
  mongoose.model('About', AboutSchema);