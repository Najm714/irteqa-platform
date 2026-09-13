// backend/src/models/CustomerIdentity.model.js
import mongoose from 'mongoose';

const CustomerIdentitySchema = new mongoose.Schema({
  // بيانات الهوية الأساسية
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  nationalId: {
    type: String,
    trim: true,
    sparse: true,
  },
  // الحسابات المرتبطة بهذه الهوية
  linkedAccounts: [{
    portalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portal',
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // بيانات إضافية
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

// الفهارس
CustomerIdentitySchema.index({ email: 1 }, { unique: true });
CustomerIdentitySchema.index({ nationalId: 1 }, { unique: true, sparse: true });
CustomerIdentitySchema.index({ 'linkedAccounts.portalId': 1 });

CustomerIdentitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ دالة لربط حساب جديد
CustomerIdentitySchema.methods.linkAccount = function(portalId, accountId) {
  const existing = this.linkedAccounts.find(
    a => a.portalId.toString() === portalId.toString()
  );
  
  if (!existing) {
    this.linkedAccounts.push({
      portalId,
      accountId,
      linkedAt: new Date(),
    });
  }
  
  return this;
};

// ✅ دالة للتحقق من وجود حساب في بوابة
CustomerIdentitySchema.methods.hasAccountInPortal = function(portalId) {
  return this.linkedAccounts.some(
    a => a.portalId.toString() === portalId.toString()
  );
};

// ✅ دالة للحصول على حساب في بوابة
CustomerIdentitySchema.methods.getAccountInPortal = function(portalId) {
  const account = this.linkedAccounts.find(
    a => a.portalId.toString() === portalId.toString()
  );
  return account ? account.accountId : null;
};

export const CustomerIdentity = mongoose.models.CustomerIdentity || 
  mongoose.model('CustomerIdentity', CustomerIdentitySchema);

