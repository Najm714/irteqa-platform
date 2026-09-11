// backend/src/models/ServiceForm.model.js
import mongoose from 'mongoose';

const ServiceFormSchema = new mongoose.Schema({
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
  },
  name: {
    type: String,
    required: [true, 'Form name is required'],
    trim: true,
  },
  nameAr: {
    type: String,
    required: [true, 'Form name in Arabic is required'],
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
  // ملف النموذج
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: [true, 'File ID is required'],
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  fileMimeType: {
    type: String,
    default: '',
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  order: {
    type: Number,
    default: 0,
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
ServiceFormSchema.index({ portalId: 1, serviceId: 1 });
ServiceFormSchema.index({ portalId: 1, serviceId: 1, order: 1 });

export const ServiceForm = mongoose.models.ServiceForm || 
  mongoose.model('ServiceForm', ServiceFormSchema);