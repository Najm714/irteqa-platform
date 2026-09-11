// backend/src/models/RequestType.model.js
import mongoose from 'mongoose';

const RequestTypeSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service ID is required'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Request type name is required'],
    trim: true,
  },
  nameAr: {
    type: String,
    required: [true, 'Request type name in Arabic is required'],
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
  // النموذج المرتبط
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
  },
  // الإعدادات
  settings: {
    requiresPayment: {
      type: Boolean,
      default: false,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    requiresScope: {
      type: Boolean,
      default: true,
    },
    autoAssign: {
      type: Boolean,
      default: false,
    },
    defaultSpecialistRole: {
      type: String,
      enum: ['specialist', 'admin'],
      default: 'specialist',
    },
  },
  // حالة النشر
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
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
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
}, {
  timestamps: true,
});

// ✅ الفهارس
RequestTypeSchema.index({ portalId: 1, serviceId: 1 });
RequestTypeSchema.index({ portalId: 1, isActive: 1 });

export const RequestType = mongoose.models.RequestType || 
  mongoose.model('RequestType', RequestTypeSchema);