// src/pages/RequestWorkspace/types.ts

// ============================================================
// ✅ Request Types
// ============================================================

export interface RequestAccount {
  _id: string;
  profile?: {
    fullName?: string;
    avatar?: string;
  };
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface RequestFileEntry {
  fileId: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
    storageKey?: string;
  };
  category: 'request' | 'proof' | 'delivery' | 'modification' | 'final' | 'support';
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
}

export interface PaymentProof {
  fileId: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  filename: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface RequestMessage {
  _id?: string;
  senderId: RequestAccount | string;
  senderRole: string;
  message: string;
  attachments: { fileId: string; filename: string }[];
  readBy: { accountId: string; readAt: Date }[];
  createdAt: Date;
}

export interface RequestScope {
  description: string;
  deliverables: string[];
  requirements: string[];
  estimatedDuration: string;
  price: number;
  currency: string;
  modificationsIncluded: number;
  exclusions: string[];
  approvedBy?: string;
  approvedAt?: Date;
}

export interface RequestCall {
  _id?: string;
  requestedBy: string;
  requestedRole: string;
  scheduledAt: Date;
  duration: number;
  purpose: string;
  notes: string;
  status: 'scheduled' | 'started' | 'completed' | 'cancelled' | 'missed';
  callUrl: string;
  recordingUrl: string;
  type?: 'audio' | 'video';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  requestedByInfo?: RequestAccount;
}

export interface ActivityLogEntry {
  action: string;
  actorId: string | RequestAccount;
  actorRole: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  timestamp: Date;
}

export interface Request {
  _id: string;
  requestNumber: string;
  portalId: string;
  accountId: RequestAccount;
  serviceId: {
    _id: string;
    name: string;
    nameAr: string;
    icon?: string;
    image?: string;
  };
  requestTypeId?: {
    _id: string;
    name: string;
    nameAr: string;
  };
  specialistId?: RequestAccount;
  title: string;
  description: string;
  status:
    | 'new'
    | 'under_review'
    | 'assigned'
    | 'scope_definition'
    | 'awaiting_approval'
    | 'awaiting_payment'
    | 'in_progress'
    | 'under_review_2'
    | 'modification'
    | 'completed'
    | 'closed'
    | 'cancelled';
  paymentStatus:
    | 'pending'
    | 'submitted'
    | 'verified'
    | 'rejected'
    | 'refunded'
    | 'not_required';
  scope?: RequestScope;
  price: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  formData: any;
  formSchemaSnapshot: any;
  files: RequestFileEntry[];
  paymentProofs: PaymentProof[];
  messages: RequestMessage[];
  calls: RequestCall[];
  activityLog: ActivityLogEntry[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// ============================================================
// ✅ Call / WebRTC Types
// ============================================================

export type CallType = 'audio' | 'video';

export interface CallState {
  isInCall: boolean;
  isCalling: boolean;
  isRinging: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOn: boolean;
  callStatus: 'idle' | 'calling' | 'ringing' | 'in-progress' | 'ended';
  callType: CallType;
}

export interface IncomingCallData {
  show: boolean;
  callerId: string;
  callerName: string;
  callerSocketId: string;
  type: CallType;
  requestId: string;
  offer: RTCSessionDescriptionInit;
  isScheduled?: boolean;
  scheduledAt?: Date;
}

// ============================================================
// ✅ Toast Types
// ============================================================

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// ============================================================
// ✅ UI Types
// ============================================================

export type TabId =
  | 'overview'
  | 'messages'
  | 'files'
  | 'scope'
  | 'payment'
  | 'calls'
  | 'activity';

export interface TabConfig {
  id: TabId;
  label: string;
}

export type FileCategory =
  | 'request'
  | 'proof'
  | 'delivery'
  | 'modification'
  | 'final'
  | 'support';