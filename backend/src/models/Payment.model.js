// backend/src/models/Payment.model.js
import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account ID is required'],
    index: true,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    default: null,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  currency: {
    type: String,
    default: 'SAR',
    enum: ['SAR', 'USD', 'EUR'],
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'mada', 'paypal', 'bank_transfer', 'manual', 'free'],
    required: [true, 'Payment method is required'],
  },
  accountNumber: {
    type: String,
    default: '',
    trim: true,
  },
  accountName: {
    type: String,
    default: '',
    trim: true,
  },
  bankName: {
    type: String,
    default: '',
    trim: true,
  },
  reference: {
    type: String,
    unique: true,
    index: true,
  },
  proof: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'rejected', 'refunded'],
    default: 'pending',
    index: true,
  },
  notes: {
    type: String,
    default: '',
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  paidAt: {
    type: Date,
    default: null,
  },
  refundedAt: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null,
  },
}, {
  timestamps: true,
});

// ✅ الفهارس
PaymentSchema.index({ portalId: 1, accountId: 1, status: 1 });
PaymentSchema.index({ portalId: 1, subscriptionId: 1 });
PaymentSchema.index({ reference: 1 }, { unique: true });
PaymentSchema.index({ status: 1, createdAt: -1 });

// ✅ دوال مساعدة

// ✅ التحقق من أن الدفع قابل للتحقق
PaymentSchema.methods.isVerifiable = function() {
  return this.status === 'submitted' || this.status === 'pending';
};

// ✅ التحقق من أن الدفع قابل للإلغاء
PaymentSchema.methods.isCancelable = function() {
  return this.status === 'pending' || this.status === 'submitted';
};

// ✅ تحديث حالة الدفع إلى verified
PaymentSchema.methods.markAsVerified = function(verifiedBy) {
  this.status = 'verified';
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  this.paidAt = new Date();
  return this;
};

// ✅ تحديث حالة الدفع إلى rejected
PaymentSchema.methods.markAsRejected = function(verifiedBy, reason) {
  this.status = 'rejected';
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  if (reason) this.rejectionReason = reason;
  return this;
};

// ✅ تحديث حالة الدفع إلى refunded
PaymentSchema.methods.markAsRefunded = function() {
  this.status = 'refunded';
  this.refundedAt = new Date();
  return this;
};

// ✅ الحصول على حالة الدفع كنص
PaymentSchema.methods.getStatusLabel = function() {
  const labels = {
    'pending': 'قيد الانتظار',
    'submitted': 'تم الإرسال',
    'verified': 'مؤكد',
    'rejected': 'مرفوض',
    'refunded': 'مسترجع',
  };
  return labels[this.status] || this.status;
};

// ✅ الحصول على لون حالة الدفع
PaymentSchema.methods.getStatusColor = function() {
  const colors = {
    'pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'submitted': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'verified': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'refunded': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  return colors[this.status] || 'bg-gray-100 text-gray-700';
};

export const Payment = mongoose.models.Payment || 
  mongoose.model('Payment', PaymentSchema);