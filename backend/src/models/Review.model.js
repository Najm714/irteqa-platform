// backend/src/models/Review.model.js
import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  // المرتبط بالتقييم
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  // المقيم
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  // المقيّم
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  // التقييم
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  // جوانب التقييم
  aspects: {
    quality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
  },
  // حالة التقييم
  status: {
    type: String,
    enum: ['pending', 'published', 'hidden', 'reported'],
    default: 'pending',
  },
  // الرد على التقييم
  response: {
    comment: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    respondedAt: Date,
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
});

// الفهارس
ReviewSchema.index({ portalId: 1, requestId: 1 }, { unique: true });
ReviewSchema.index({ portalId: 1, revieweeId: 1 });
ReviewSchema.index({ portalId: 1, rating: 1 });
ReviewSchema.index({ portalId: 1, status: 1 });

ReviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Review = mongoose.models.Review || 
  mongoose.model('Review', ReviewSchema);