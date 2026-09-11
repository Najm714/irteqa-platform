// src/models/Modification.model.js
import mongoose from 'mongoose';

const ModificationSchema = new mongoose.Schema({
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
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  requesterRole: {
    type: String,
    enum: ['customer', 'specialist', 'portal_admin'],
    required: true,
  },
  type: {
    type: String,
    enum: ['revision', 'correction', 'enhancement', 'additional_work'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  files: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    filename: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending',
  },
  response: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    respondedAt: Date,
  },
  deadline: Date,
  completedAt: Date,
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
ModificationSchema.index({ requestId: 1, deliveryId: 1 });
ModificationSchema.index({ portalId: 1, status: 1 });
ModificationSchema.index({ requesterId: 1 });
ModificationSchema.index({ priority: 1 });

ModificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Modification = mongoose.model('Modification', ModificationSchema);