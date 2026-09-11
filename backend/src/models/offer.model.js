// backend/src/models/offer.model.js
import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: [true, 'Portal ID is required'],
    index: true,
  },
  // === معلومات العرض ===
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  titleAr: {
    type: String,
    required: [true, 'Arabic title is required'],
    trim: true,
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
  // === صورة العرض ===
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  },
  // === تفاصيل العرض ===
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'free'],
    default: 'percentage',
  },
  discountValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountValueAr: {
    type: String,
    default: '',
  },
  // === سعر العرض ===
  originalPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  offerPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'SAR',
  },
  // === الفترة الزمنية ===
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  // === التصنيفات ===
  category: {
    type: String,
    enum: [
      'service',      // خدمات
      'product',      // منتجات
      'subscription', // اشتراكات
      'event',        // فعاليات
      'course',       // دورات
      'other',        // أخرى
    ],
    default: 'service',
    index: true,
  },
  categoryAr: {
    type: String,
    default: 'خدمات',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  // === حالة العرض ===
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  // === إحصائيات ===
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  clicks: {
    type: Number,
    default: 0,
    min: 0,
  },
  // === ترتيب ===
  order: {
    type: Number,
    default: 0,
  },
  // === بيانات إضافية ===
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
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
OfferSchema.index({ portalId: 1, category: 1 });
OfferSchema.index({ portalId: 1, isPublished: 1 });
OfferSchema.index({ portalId: 1, isFeatured: 1 });
OfferSchema.index({ portalId: 1, isActive: 1 });
OfferSchema.index({ startDate: 1, endDate: 1 });
OfferSchema.index({ title: 'text', titleAr: 'text', description: 'text', descriptionAr: 'text' });

// ✅ Pre-save middleware
OfferSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // ✅ حساب السعر بعد الخصم
  if (this.discountType === 'percentage' && this.discountValue > 0) {
    this.offerPrice = this.originalPrice - (this.originalPrice * (this.discountValue / 100));
    this.discountValueAr = `${this.discountValue}%`;
  } else if (this.discountType === 'fixed' && this.discountValue > 0) {
    this.offerPrice = this.originalPrice - this.discountValue;
    this.discountValueAr = `${this.discountValue} ريال`;
  } else if (this.discountType === 'free') {
    this.offerPrice = 0;
    this.discountValueAr = 'مجاني';
  }
  
  // ✅ التأكد من أن offerPrice لا يقل عن 0
  if (this.offerPrice < 0) {
    this.offerPrice = 0;
  }
  
  next();
});

// ✅ طريقة للتحقق من أن العرض نشط
OfferSchema.methods.isActiveOffer = function() {
  const now = new Date();
  return this.isPublished && this.isActive && 
    this.startDate <= now && this.endDate >= now;
};

// ✅ طريقة للحصول على نسبة الخصم
OfferSchema.methods.getDiscountPercentage = function() {
  if (this.discountType === 'percentage') {
    return this.discountValue;
  }
  if (this.discountType === 'fixed' && this.originalPrice > 0) {
    return Math.round((this.discountValue / this.originalPrice) * 100);
  }
  if (this.discountType === 'free') {
    return 100;
  }
  return 0;
};

// ✅ طريقة للحصول على المبلغ المحفوظ
OfferSchema.methods.getSavings = function() {
  return this.originalPrice - this.offerPrice;
};

export const Offer = mongoose.models.Offer || 
  mongoose.model('Offer', OfferSchema);