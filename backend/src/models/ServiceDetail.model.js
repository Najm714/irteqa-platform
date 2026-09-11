// backend/src/models/ServiceDetail.model.js
import mongoose from 'mongoose';

const ServiceDetailSchema = new mongoose.Schema({
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
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required'],
    index: true,
    unique: true,
  },
  // نبذة الخدمة
  overview: {
    type: String,
    default: '',
  },
  overviewAr: {
    type: String,
    default: '',
  },
  // ما هي الخدمة؟
  whatIsService: {
    type: String,
    default: '',
  },
  whatIsServiceAr: {
    type: String,
    default: '',
  },
  // من يستفيد من هذه الخدمة؟
  whoBenefits: {
    type: String,
    default: '',
  },
  whoBenefitsAr: {
    type: String,
    default: '',
  },
  // المنهجيات والأساليب المستخدمة
  methodologies: {
    type: String,
    default: '',
  },
  methodologiesAr: {
    type: String,
    default: '',
  },
  // معرض الخدمة (صور)
  gallery: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    caption: String,
    captionAr: String,
    order: { type: Number, default: 0 },
  }],
  // أنواع الطلبات المتاحة
  requestTypes: [{
    type: {
      type: String,
      enum: ['online', 'in_person', 'phone', 'email'],
    },
    label: String,
    labelAr: String,
    isActive: { type: Boolean, default: true },
  }],
  // الأسئلة الشائعة
  faqs: [{
    question: String,
    questionAr: String,
    answer: String,
    answerAr: String,
    order: { type: Number, default: 0 },
  }],
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
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
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
}, {
  timestamps: true,
});

// ✅ فهارس
ServiceDetailSchema.index({ portalId: 1, serviceId: 1 });

export const ServiceDetail = mongoose.models.ServiceDetail || 
  mongoose.model('ServiceDetail', ServiceDetailSchema);