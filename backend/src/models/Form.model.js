// backend/src/models/Form.model.js
import mongoose from 'mongoose';

// تعريف الحقل الديناميكي
const FormFieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox', 'multiple_select', 'file_upload'],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  labelAr: {
    type: String,
    required: true,
  },
  placeholder: String,
  placeholderAr: String,
  helpText: String,
  helpTextAr: String,
  required: {
    type: Boolean,
    default: false,
  },
  defaultValue: mongoose.Schema.Types.Mixed,
  options: [{
    label: String,
    labelAr: String,
    value: String,
  }],
  // للحقول الشرطية
  conditional: {
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'greater', 'less'],
    },
    value: mongoose.Schema.Types.Mixed,
  },
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    maxSize: Number, // للملفات
    acceptedTypes: [String], // للملفات
  },
  order: {
    type: Number,
    default: 0,
  },
  // للتنظيم
  section: String,
  sectionAr: String,
  isVisible: {
    type: Boolean,
    default: true,
  },
});

const FormSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
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
    trim: true,
  },
  descriptionAr: {
    type: String,
    trim: true,
  },
  // الحقول
  fields: [FormFieldSchema],
  // إصدار النموذج
  version: {
    type: Number,
    default: 1,
  },
  // حالة النشر
  isPublished: {
    type: Boolean,
    default: true,
  },
  // البيانات الوصفية
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

// الفهارس
FormSchema.index({ portalId: 1, name: 1 });
FormSchema.index({ portalId: 1, isPublished: 1 });

FormSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ دالة لإنشاء نسخة (Snapshot) من النموذج
FormSchema.methods.createSnapshot = function() {
  return {
    formId: this._id,
    version: this.version,
    fields: this.fields.map(field => field.toObject()),
    name: this.name,
    nameAr: this.nameAr,
    description: this.description,
    descriptionAr: this.descriptionAr,
    createdAt: new Date(),
  };
};

// ✅ دالة لإضافة إصدار جديد
FormSchema.methods.newVersion = function() {
  this.version += 1;
  this.updatedAt = new Date();
  return this;
};

export const Form = mongoose.models.Form || 
  mongoose.model('Form', FormSchema);