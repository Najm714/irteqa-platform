// src/models/Delivery.model.js
import mongoose from 'mongoose';

const DeliverySchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  portalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portal',
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  files: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    filename: String,
    size: Number,
    mimeType: String,
  }],
  message: {
    type: String,
    trim: true,
  },
  deliveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  deliveredAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending_review', 'accepted', 'modification_requested', 'rejected'],
    default: 'pending_review',
  },
  reviewComment: {
    type: String,
    trim: true,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  reviewedAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
  isLatest: {
    type: Boolean,
    default: true,
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
DeliverySchema.index({ requestId: 1, version: 1 }, { unique: true });
DeliverySchema.index({ requestId: 1, isLatest: 1 });
DeliverySchema.index({ portalId: 1, status: 1 });
DeliverySchema.index({ deliveredBy: 1 });

DeliverySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Delivery = mongoose.model('Delivery', DeliverySchema);