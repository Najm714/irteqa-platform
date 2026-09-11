// backend/src/models/Material.model.js
import mongoose from 'mongoose';

const MaterialSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    required: [true, 'University ID is required'],
    index: true,
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'College ID is required'],
    index: true,
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: [true, 'Specialty ID is required'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true,
  },
  nameAr: {
    type: String,
    required: [true, 'Material name in Arabic is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Material code is required'],
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  descriptionAr: {
    type: String,
    trim: true,
    default: '',
  },
  icon: {
    type: String,
    default: 'fa-book',
  },
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true,
  },
  instructorBio: {
    type: String,
    trim: true,
    default: '',
  },
  duration: {
    type: String,
    default: '0',
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  features: {
    type: [String],
    default: [],
  },
  featuresAr: {
    type: [String],
    default: [],
  },
  // ✅ الوحدات الدراسية مع الملفات
  units: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    title: {
      type: String,
      default: '',
    },
    titleAr: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    descriptionAr: {
      type: String,
      default: '',
    },
    files: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: [true, 'File ID is required'],
      },
      filename: {
        type: String,
        required: [true, 'Filename is required'],
      },
      isEncrypted: {
        type: Boolean,
        default: false,
      },
      size: {
        type: Number,
        default: 0,
      },
      mimeType: {
        type: String,
        default: '',
      },
    }],
    order: {
      type: Number,
      default: 0,
    },
  }],
  // ✅ الملخصات مع الملفات
  summaries: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'File ID is required'],
    },
    title: {
      type: String,
      default: '',
    },
    titleAr: {
      type: String,
      default: '',
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  }],
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    lowercase: true,
    trim: true,
    unique: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
}, {
  timestamps: true,
});

// ✅ الفهارس (Indexes)
MaterialSchema.index({ portalId: 1, specialtyId: 1, slug: 1 });
MaterialSchema.index({ portalId: 1, specialtyId: 1, isPublished: 1 });
MaterialSchema.index({ portalId: 1, universityId: 1, collegeId: 1 });
MaterialSchema.index({ portalId: 1, isPublished: 1, order: 1 });

// ✅ Pre-save middleware
MaterialSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // توليد slug تلقائياً إذا لم يكن موجوداً
  if (!this.slug || this.slug.trim() === '') {
    const baseName = this.nameAr || this.name || 'material';
    this.slug = baseName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // التأكد من وجود _id لكل وحدة وملف
  if (this.units) {
    this.units.forEach(unit => {
      if (!unit._id) {
        unit._id = new mongoose.Types.ObjectId();
      }
      if (unit.files) {
        unit.files.forEach(file => {
          if (!file._id) {
            file._id = new mongoose.Types.ObjectId();
          }
        });
      }
    });
  }
  
  if (this.summaries) {
    this.summaries.forEach(summary => {
      if (!summary._id) {
        summary._id = new mongoose.Types.ObjectId();
      }
    });
  }
  
  next();
});

// ✅ Pre-update middleware
MaterialSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// ✅ دالة مساعدة للتحقق من وجود الملف
MaterialSchema.methods.hasFile = function(fileId) {
  for (const unit of this.units || []) {
    for (const file of unit.files || []) {
      if (file.fileId && file.fileId.toString() === fileId.toString()) {
        return true;
      }
    }
  }
  for (const summary of this.summaries || []) {
    if (summary.fileId && summary.fileId.toString() === fileId.toString()) {
      return true;
    }
  }
  return false;
};

// ✅ دالة مساعدة للحصول على جميع الملفات
MaterialSchema.methods.getAllFiles = function() {
  const files = [];
  for (const unit of this.units || []) {
    for (const file of unit.files || []) {
      if (file.fileId) {
        files.push({
          fileId: file.fileId,
          filename: file.filename,
          isEncrypted: file.isEncrypted,
          unitId: unit._id,
          unitTitle: unit.titleAr || unit.title,
        });
      }
    }
  }
  for (const summary of this.summaries || []) {
    if (summary.fileId) {
      files.push({
        fileId: summary.fileId,
        filename: summary.title || summary.titleAr || 'ملخص',
        isEncrypted: summary.isEncrypted,
        summaryId: summary._id,
        summaryTitle: summary.titleAr || summary.title,
      });
    }
  }
  return files;
};

export const Material = mongoose.models.Material || 
  mongoose.model('Material', MaterialSchema);