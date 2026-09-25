// backend/src/models/Request.model.js
import mongoose from 'mongoose';

// ============================================================
// ✅ سجل النشاط
// ============================================================
const ActivityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'request_created',
      'request_updated',
      'status_changed',
      'specialist_assigned',
      'scope_defined',
      'scope_approved',
      'payment_submitted',
      'payment_verified',
      'payment_rejected',
      'work_delivered',
      'modification_requested',
      'request_completed',
      'request_closed',
      'deleted',
      'file_uploaded',
      'message_sent',
      'call_scheduled',
      'call_started',
      'call_completed',
      'call_updated',
      'call_cancelled',
      'call_missed',
    ],
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  actorRole: {
    type: String,
    enum: ['customer', 'specialist', 'portal_admin', 'super_admin', 'system'],
    default: 'customer',
  },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// ============================================================
// ✅ نموذج الملفات في الطلب
// ============================================================
const FileSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
  },
  category: {
    type: String,
    enum: [
      'request',
      'proof',
      'delivery',
      'modification',
      'support',
      'final',
      'user',
      'attachment',
    ],
    default: 'request',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  description: {
    type: String,
    default: '',
  },
});

// ============================================================
// ✅ نموذج الرسائل في الطلب
// ============================================================
const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['customer', 'specialist', 'portal_admin', 'super_admin'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachments: [
    {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
      filename: String,
    },
  ],
  readBy: [
    {
      accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ============================================================
// ✅ نموذج المكالمات
// ============================================================
const CallSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  requestedRole: {
    type: String,
    enum: ['customer', 'specialist', 'portal_admin'],
    required: true,
  },
  type: {
    type: String,
    enum: ['audio', 'video'],
    default: 'video',
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    default: 30,
  },
  purpose: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['scheduled', 'started', 'completed', 'cancelled', 'missed'],
    default: 'scheduled',
  },
  callUrl: {
    type: String,
    default: '',
  },
  recordingUrl: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

// ============================================================
// ✅ نموذج الطلب الرئيسي
// ============================================================
const RequestSchema = new mongoose.Schema(
  {
    // ============================================================
    // === معلومات أساسية ===
    // ============================================================
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
    identityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerIdentity',
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service ID is required'],
      index: true,
    },
    requestTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RequestType',
      index: true,
    },
    specialistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
    },
    requestNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // ============================================================
    // === بيانات النموذج ===
    // ============================================================
    // ✅ formData لم يعد required — لأن الخدمات العامة
    //    يمكن أن تُنشأ بدون نموذج
    formSchemaSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // ✅ قيمة افتراضية بدل required
    },

    // ============================================================
    // === عنوان الطلب ووصفه ===
    // ============================================================
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },

    // ============================================================
    // === نطاق العمل ===
    // ============================================================
    scope: {
      description: { type: String, default: '' },
      deliverables: { type: [String], default: [] },
      requirements: { type: [String], default: [] },
      estimatedDuration: { type: String, default: '' },
      price: { type: Number, default: 0 },
      currency: { type: String, default: 'SAR' },
      modificationsIncluded: { type: Number, default: 0 },
      exclusions: { type: [String], default: [] },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
      approvedAt: { type: Date },
    },

    // ============================================================
    // === الملفات ===
    // ============================================================
    files: [FileSchema],

    // ============================================================
    // === إثباتات الدفع ===
    // ============================================================
    paymentProofs: [
      {
        fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
        filename: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
        verifiedAt: { type: Date },
        rejectionReason: { type: String, default: '' },
      },
    ],

    // ============================================================
    // === الرسائل ===
    // ============================================================
    messages: [MessageSchema],

    // ============================================================
    // === المكالمات ===
    // ============================================================
    calls: [CallSchema],

    // ============================================================
    // === الحالات ===
    // ============================================================
    status: {
      type: String,
      enum: [
        'new',
        'under_review',
        'assigned',
        'scope_definition',
        'awaiting_approval',
        'awaiting_payment',
        'in_progress',
        'under_review_2',
        'modification',
        'completed',
        'closed',
        'cancelled',
      ],
      default: 'new',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        'pending',
        'submitted',
        'verified',
        'rejected',
        'refunded',
        'not_required',
      ],
      default: 'pending',
      index: true,
    },

    // ============================================================
    // === التواريخ ===
    // ============================================================
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'SAR' },
    scopeApprovedAt: { type: Date },
    paymentVerifiedAt: { type: Date },
    startedAt: { type: Date },
    deliveredAt: { type: Date },
    completedAt: { type: Date },
    closedAt: { type: Date },

    // ============================================================
    // === سجل النشاط ===
    // ============================================================
    activityLog: [ActivityLogSchema],

    // ============================================================
    // === بيانات إضافية ===
    // ============================================================
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  },
  { timestamps: true }
);

// ============================================================
// ✅ الفهارس
// ============================================================
RequestSchema.index({ portalId: 1, accountId: 1 });
RequestSchema.index({ portalId: 1, specialistId: 1 });
RequestSchema.index({ portalId: 1, status: 1 });
RequestSchema.index({ portalId: 1, createdAt: -1 });
RequestSchema.index({ paymentStatus: 1 });
RequestSchema.index({ requestNumber: 1 }, { unique: true, sparse: true });

// ============================================================
// ✅ Pre-save Middleware
// ============================================================
RequestSchema.pre('save', async function (next) {
  this.updatedAt = new Date();

  if (!this.requestNumber) {
    try {
      const RequestModel = mongoose.model('Request');
      const count = await RequestModel.countDocuments({
        portalId: this.portalId,
      });
      const year = new Date().getFullYear().toString().slice(-2);
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      this.requestNumber = `REQ-${year}${month}-${String(count + 1).padStart(
        4,
        '0'
      )}`;
    } catch (err) {
      console.error('❌ Error generating request number:', err);
    }
  }

  next();
});

// ============================================================
// ✅ الدوال (Methods)
// ============================================================

// ============================================================
// إضافة نشاط
// ============================================================
RequestSchema.methods.addActivity = function (
  action,
  actorId,
  actorRole,
  oldValue,
  newValue,
  metadata = {}
) {
  if (!this.activityLog) this.activityLog = [];

  this.activityLog.push({
    action: action || 'request_updated',
    actorId: actorId || this.accountId,
    actorRole: actorRole || 'customer',
    oldValue: oldValue !== undefined ? oldValue : null,
    newValue: newValue !== undefined ? newValue : null,
    metadata: metadata || {},
    timestamp: new Date(),
  });

  this.updatedAt = new Date();
  return this;
};

// ============================================================
// التحقق من إمكانية الانتقال إلى حالة جديدة
// ============================================================
RequestSchema.methods.canTransitionTo = function (newStatus) {
  const transitions = {
    new: ['under_review', 'cancelled'],
    under_review: ['assigned', 'cancelled'],
    assigned: ['scope_definition', 'cancelled'],
    scope_definition: ['awaiting_approval', 'cancelled'],
    awaiting_approval: ['awaiting_payment', 'scope_definition', 'cancelled'],
    awaiting_payment: ['in_progress', 'cancelled'],
    in_progress: ['under_review_2', 'completed', 'cancelled'],
    under_review_2: ['modification', 'completed', 'cancelled'],
    modification: ['in_progress', 'completed', 'cancelled'],
    completed: ['closed'],
    closed: [],
    cancelled: [],
  };
  return transitions[this.status]?.includes(newStatus) || false;
};

// ============================================================
// التحقق من صلاحية الوصول
// ============================================================
RequestSchema.methods.canUserAccess = function (accountId, role) {
  if (!accountId) return false;

  const requestAccountId = this.accountId?.toString();
  const requestSpecialistId = this.specialistId?.toString();
  const currentAccountId = accountId.toString();

  const isOwner = requestAccountId === currentAccountId;
  const isSpecialist = requestSpecialistId === currentAccountId;
  const isAdmin = role === 'portal_admin' || role === 'super_admin';

  return isOwner || isSpecialist || isAdmin;
};

// ============================================================
// إضافة ملف
// ============================================================
RequestSchema.methods.addFile = function (
  fileId,
  category,
  uploadedBy,
  description = ''
) {
  if (!this.files) this.files = [];

  this.files.push({
    fileId,
    category: category || 'request',
    uploadedAt: new Date(),
    uploadedBy,
    description,
  });

  this.addActivity('file_uploaded', uploadedBy, 'user', null, {
    fileId,
    category,
  });
  return this;
};

// ============================================================
// إضافة رسالة
// ============================================================
RequestSchema.methods.addMessage = function (
  senderId,
  senderRole,
  message,
  attachments = []
) {
  if (!this.messages) this.messages = [];

  this.messages.push({
    senderId,
    senderRole,
    message,
    attachments,
    createdAt: new Date(),
  });

  this.addActivity('message_sent', senderId, senderRole, null, { message });
  return this;
};

// ============================================================
// ✅ دوال المكالمات
// ============================================================

// ✅ إضافة مكالمة جديدة
RequestSchema.methods.addCall = function (callData) {
  if (!this.calls) this.calls = [];

  const newCall = {
    ...callData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  this.calls.push(newCall);

  this.addActivity(
    'call_scheduled',
    callData.requestedBy,
    callData.requestedRole || 'customer',
    null,
    { purpose: callData.purpose, scheduledAt: callData.scheduledAt }
  );

  return this;
};

// ✅ الحصول على مكالمة بواسطة المعرف
RequestSchema.methods.getCallById = function (callId) {
  if (!this.calls || this.calls.length === 0) return null;
  return this.calls.find((c) => c._id?.toString() === callId) || null;
};

// ✅ تحديث مكالمة بواسطة المعرف
RequestSchema.methods.updateCallById = function (callId, updateData) {
  if (!this.calls || this.calls.length === 0) {
    throw new Error('No calls found for this request');
  }

  const callIndex = this.calls.findIndex((c) => c._id?.toString() === callId);

  if (callIndex === -1) {
    throw new Error('Call not found');
  }

  const call = this.calls[callIndex];
  const oldStatus = call.status;

  if (updateData.status !== undefined) {
    const validStatuses = [
      'scheduled',
      'started',
      'completed',
      'cancelled',
      'missed',
    ];
    if (!validStatuses.includes(updateData.status)) {
      throw new Error(`Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }
    call.status = updateData.status;
  }

  if (updateData.notes !== undefined) {
    call.notes = updateData.notes;
  }

  if (updateData.callUrl !== undefined) {
    call.callUrl = updateData.callUrl;
  }

  if (updateData.recordingUrl !== undefined) {
    call.recordingUrl = updateData.recordingUrl;
  }

  if (updateData.duration !== undefined) {
    call.duration = updateData.duration;
  }

  call.updatedAt = new Date();

  if (call.status === 'completed' && oldStatus !== 'completed') {
    call.completedAt = new Date();
  }

  if (updateData.status !== undefined && updateData.status !== oldStatus) {
    this.addActivity(
      'call_updated',
      updateData.updatedBy || call.requestedBy,
      updateData.updatedRole || call.requestedRole || 'customer',
      oldStatus,
      call.status,
      { callId, purpose: call.purpose }
    );
  }

  this.updatedAt = new Date();
  return this;
};

// ✅ حذف مكالمة بواسطة المعرف (إلغاء)
RequestSchema.methods.cancelCallById = function (
  callId,
  cancelledBy,
  cancelledRole
) {
  if (!this.calls || this.calls.length === 0) {
    throw new Error('No calls found for this request');
  }

  const callIndex = this.calls.findIndex((c) => c._id?.toString() === callId);

  if (callIndex === -1) {
    throw new Error('Call not found');
  }

  const call = this.calls[callIndex];

  if (call.status === 'completed') {
    throw new Error('Cannot cancel a completed call');
  }

  const oldStatus = call.status;
  call.status = 'cancelled';
  call.updatedAt = new Date();

  this.addActivity(
    'call_updated',
    cancelledBy || call.requestedBy,
    cancelledRole || call.requestedRole || 'customer',
    oldStatus,
    'cancelled',
    { callId, purpose: call.purpose, reason: 'Cancelled by user' }
  );

  this.updatedAt = new Date();
  return this;
};

// ✅ بدء مكالمة
RequestSchema.methods.startCallById = function (
  callId,
  startedBy,
  startedRole
) {
  if (!this.calls || this.calls.length === 0) {
    throw new Error('No calls found for this request');
  }

  const callIndex = this.calls.findIndex((c) => c._id?.toString() === callId);

  if (callIndex === -1) {
    throw new Error('Call not found');
  }

  const call = this.calls[callIndex];

  if (call.status !== 'scheduled') {
    throw new Error(`Cannot start a call with status: ${call.status}`);
  }

  const oldStatus = call.status;
  call.status = 'started';
  call.updatedAt = new Date();

  this.addActivity(
    'call_updated',
    startedBy || call.requestedBy,
    startedRole || call.requestedRole || 'customer',
    oldStatus,
    'started',
    { callId, purpose: call.purpose }
  );

  this.updatedAt = new Date();
  return this;
};

// ✅ إنهاء مكالمة
RequestSchema.methods.completeCallById = function (
  callId,
  completedBy,
  completedRole
) {
  if (!this.calls || this.calls.length === 0) {
    throw new Error('No calls found for this request');
  }

  const callIndex = this.calls.findIndex((c) => c._id?.toString() === callId);

  if (callIndex === -1) {
    throw new Error('Call not found');
  }

  const call = this.calls[callIndex];

  if (call.status !== 'started' && call.status !== 'scheduled') {
    throw new Error(`Cannot complete a call with status: ${call.status}`);
  }

  const oldStatus = call.status;
  call.status = 'completed';
  call.completedAt = new Date();
  call.updatedAt = new Date();

  this.addActivity(
    'call_completed',
    completedBy || call.requestedBy,
    completedRole || call.requestedRole || 'customer',
    oldStatus,
    'completed',
    { callId, purpose: call.purpose }
  );

  this.updatedAt = new Date();
  return this;
};

// ✅ الحصول على جميع المكالمات مع معلومات المرسل (مع إصلاح N+1)
RequestSchema.methods.getCallsWithSenderInfo = async function () {
  if (!this.calls || this.calls.length === 0) return [];

  const Account = mongoose.model('Account');

  // ✅ جلب جميع الحسابات مرة واحدة (بدل N+1)
  const uniqueAccountIds = [
    ...new Set(
      this.calls
        .map((c) => c.requestedBy?.toString())
        .filter(Boolean)
    ),
  ];

  const accounts = await Account.find({
    _id: { $in: uniqueAccountIds },
  }).select('profile.fullName email');

  const accountMap = new Map(
    accounts.map((a) => [a._id.toString(), a])
  );

  return this.calls.map((call) => ({
    ...call.toObject(),
    requestedByInfo: call.requestedBy
      ? accountMap.get(call.requestedBy.toString()) || null
      : null,
  }));
};

// ✅ الحصول على المكالمات القادمة
RequestSchema.methods.getUpcomingCalls = function () {
  if (!this.calls || this.calls.length === 0) return [];

  const now = new Date();
  return this.calls
    .filter(
      (call) =>
        call.status === 'scheduled' && new Date(call.scheduledAt) >= now
    )
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
};

// ✅ الحصول على المكالمات السابقة
RequestSchema.methods.getPastCalls = function () {
  if (!this.calls || this.calls.length === 0) return [];

  const now = new Date();
  return this.calls
    .filter(
      (call) =>
        call.status === 'completed' ||
        call.status === 'cancelled' ||
        call.status === 'missed' ||
        (call.status === 'scheduled' && new Date(call.scheduledAt) < now)
    )
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
};

// ============================================================
// تعيين الرسائل كمقروءة
// ============================================================
RequestSchema.methods.markAsRead = function (accountId) {
  if (!this.messages) return this;

  for (const msg of this.messages) {
    if (msg.senderId?.toString() !== accountId) {
      const alreadyRead = msg.readBy?.some(
        (r) => r.accountId?.toString() === accountId
      );
      if (!alreadyRead) {
        if (!msg.readBy) msg.readBy = [];
        msg.readBy.push({ accountId, readAt: new Date() });
      }
    }
  }
  return this;
};

// ============================================================
// الحصول على عدد الملفات
// ============================================================
RequestSchema.methods.getFileCount = function (category) {
  if (!this.files) return 0;
  if (category) {
    return this.files.filter((f) => f.category === category).length;
  }
  return this.files.length;
};

// ============================================================
// الحصول على عدد الرسائل
// ============================================================
RequestSchema.methods.getMessageCount = function () {
  return this.messages?.length || 0;
};

// ============================================================
// الحصول على عدد المكالمات
// ============================================================
RequestSchema.methods.getCallCount = function () {
  return this.calls?.length || 0;
};

// ============================================================
// الحصول على إحصائيات الطلب
// ============================================================
RequestSchema.methods.getStats = function () {
  return {
    id: this._id,
    number: this.requestNumber,
    status: this.status,
    paymentStatus: this.paymentStatus,
    price: this.price,
    fileCount: this.getFileCount(),
    messageCount: this.getMessageCount(),
    callCount: this.getCallCount(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================================
// ✅ تصدير النموذج
// ============================================================
export const Request =
  mongoose.models.Request || mongoose.model('Request', RequestSchema);