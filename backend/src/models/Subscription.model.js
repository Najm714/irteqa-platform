// backend/src/models/Subscription.model.js
import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
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
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'Material ID is required'],
    index: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null,
    index: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
    default: 0,
  },
  currency: {
    type: String,
    default: 'SAR',
    enum: ['SAR', 'USD', 'EUR'],
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'mada', 'paypal', 'bank_transfer', 'manual', 'free'],
    default: 'manual',
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled'],
    default: 'pending',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  description: {
    type: String,
    default: '',
  },
  descriptionAr: {
    type: String,
    default: '',
  },
  benefits: {
    type: [String],
    default: [],
  },
  benefitsAr: {
    type: [String],
    default: [],
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

// ✅ الفهارس
SubscriptionSchema.index({ portalId: 1, accountId: 1, status: 1 });
SubscriptionSchema.index({ portalId: 1, materialId: 1, status: 1 });
SubscriptionSchema.index({ portalId: 1, status: 1, endDate: 1 });
SubscriptionSchema.index({ paymentId: 1 });

// ✅ Pre-save middleware
SubscriptionSchema.pre('save', function(next) {
  if (!this.endDate) {
    this.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

export const Subscription = mongoose.models.Subscription || 
  mongoose.model('Subscription', SubscriptionSchema);