// src/models/Account.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const AccountSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
  },
  identityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerIdentity',
    required: [true, 'Identity ID is required'],
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    // ✅ تم إزالة index: true و unique: true
  },
  nationalId: {
    type: String,
    trim: true,
    sparse: true,
    // ✅ تم إزالة index: true و unique: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },
  role: {
    type: String,
    enum: ['customer', 'specialist', 'portal_admin', 'super_admin'],
    default: 'customer',
  },
  portalPermissions: [{
    portalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
  }],
  permissions: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: Date,
  profile: {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    specialization: String,
    title: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
    },
  },
  specialistDetails: {
    specializations: [String],
    qualifications: [{
      degree: String,
      institution: String,
      year: Number,
    }],
    experience: {
      type: Number,
      default: 0,
    },
    hourlyRate: Number,
    isApproved: {
      type: Boolean,
      default: false,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    availableDays: [{
      day: String,
      startTime: String,
      endTime: String,
    }],
  },
  preferences: {
    language: { type: String, default: 'ar' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
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
  preferences: {
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  pushNotifications: {
    type: Boolean,
    default: true,
  },
  orderUpdates: {
    type: Boolean,
    default: true,
  },
  promotionalEmails: {
    type: Boolean,
    default: false,
  },
  twoFactorAuth: {
    type: Boolean,
    default: false,
  },
  language: {
    type: String,
    enum: ['ar', 'en'],
    default: 'ar',
  },
  theme: {
    type: String,
    enum: ['auto', 'light', 'dark'],
    default: 'auto',
  },
},
});

// ✅ الفهارس الموحدة - هنا فقط
AccountSchema.index({ portalId: 1, email: 1 }, { unique: true });
AccountSchema.index({ portalId: 1, username: 1 }, { unique: true });
AccountSchema.index({ identityId: 1 });
AccountSchema.index({ nationalId: 1 }, { unique: true, sparse: true });

// ✅ دالة للتحقق من صلاحيات البوابة
AccountSchema.methods.hasPortalPermission = function(portalId, permission) {
  if (this.role === 'super_admin') {
    return true;
  }
  
  const portalPerm = this.portalPermissions.find(
    p => p.portalId.toString() === portalId.toString()
  );
  
  if (!portalPerm) {
    return false;
  }
  
  if (portalPerm.permissions.includes('*')) {
    return true;
  }
  
  return portalPerm.permissions.includes(permission);
};

// ✅ دالة للحصول على صلاحيات البوابة
AccountSchema.methods.getPortalPermissions = function(portalId) {
  if (this.role === 'super_admin') {
    return ['*'];
  }
  
  const portalPerm = this.portalPermissions.find(
    p => p.portalId.toString() === portalId.toString()
  );
  
  return portalPerm ? portalPerm.permissions : [];
};

// ✅ دالة لمنح صلاحيات لبوابة
AccountSchema.methods.grantPortalPermissions = async function(portalId, permissions, grantedBy) {
  const existing = this.portalPermissions.find(
    p => p.portalId.toString() === portalId.toString()
  );
  
  if (existing) {
    existing.permissions = permissions;
    existing.grantedAt = new Date();
    if (grantedBy) existing.grantedBy = grantedBy;
  } else {
    this.portalPermissions.push({
      portalId,
      permissions,
      grantedAt: new Date(),
      grantedBy,
    });
  }
  
  await this.save();
};

// ✅ Pre-save middleware
AccountSchema.pre('save', async function(next) {
  if (this.isModified('passwordHash')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  this.updatedAt = new Date();
  next();
});

// ✅ Compare password method
AccountSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const Account = mongoose.model('Account', AccountSchema);