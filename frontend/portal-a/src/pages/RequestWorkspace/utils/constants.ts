// src/pages/RequestWorkspace/utils/constants.ts
import type { TabId, FileCategory, CallType } from '../types';

// ============================================================
// ✅ Status Maps
// ============================================================
export const STATUS_TEXT: Record<string, string> = {
  new: 'جديد',
  under_review: 'قيد المراجعة',
  assigned: 'تم الإسناد',
  scope_definition: 'تحديد النطاق',
  awaiting_approval: 'بانتظار الموافقة',
  awaiting_payment: 'بانتظار الدفع',
  in_progress: 'قيد التنفيذ',
  under_review_2: 'مراجعة التسليم',
  modification: 'تعديل',
  completed: 'مكتمل',
  closed: 'مغلق',
  cancelled: 'ملغي',
};

export const STATUS_COLOR: Record<string, string> = {
  new: 'bg-blue-500',
  under_review: 'bg-yellow-500',
  assigned: 'bg-purple-500',
  scope_definition: 'bg-indigo-500',
  awaiting_approval: 'bg-orange-500',
  awaiting_payment: 'bg-pink-500',
  in_progress: 'bg-blue-500',
  under_review_2: 'bg-yellow-500',
  modification: 'bg-red-500',
  completed: 'bg-green-500',
  closed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

// ============================================================
// ✅ Status Transitions (للـ UI فقط — Backend يفرض القيود)
// ============================================================
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['under_review', 'cancelled'],
  under_review: ['assigned', 'cancelled'],
  assigned: ['scope_definition', 'cancelled'],
  scope_definition: ['awaiting_approval', 'cancelled'],
  awaiting_approval: ['awaiting_payment', 'modification', 'cancelled'],
  awaiting_payment: ['in_progress', 'cancelled'],
  in_progress: ['under_review_2', 'completed', 'cancelled'],
  under_review_2: ['modification', 'completed', 'cancelled'],
  modification: ['in_progress', 'completed', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
};

// ============================================================
// ✅ Call Status
// ============================================================
export const CALL_STATUS_TEXT: Record<string, string> = {
  scheduled: 'مجدولة',
  started: 'بدأت',
  completed: 'مكتملة',
  cancelled: 'ملغية',
  missed: 'فائتة',
};

export const CALL_STATUS_COLOR: Record<string, string> = {
  scheduled:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  started:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  missed:
    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

// ============================================================
// ✅ Payment Status
// ============================================================
export const PAYMENT_STATUS_TEXT: Record<string, string> = {
  verified: '✅ مدفوع',
  submitted: '📤 تم الإرسال',
  pending: '⏳ قيد الانتظار',
  rejected: '❌ مرفوض',
  refunded: '↩️ مسترجع',
  not_required: 'غير مطلوب',
};

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
  verified:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  submitted:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  rejected:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  not_required:
    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

// ============================================================
// ✅ User Roles
// ============================================================
export const USER_ROLE_TEXT: Record<string, string> = {
  customer: 'عميل',
  specialist: 'مختص',
  portal_admin: 'مدير',
  super_admin: 'مشرف',
  system: 'النظام',
};

// ============================================================
// ✅ Activity Actions
// ============================================================
export const ACTION_TEXT: Record<string, string> = {
  request_created: 'أنشأ الطلب',
  request_updated: 'حدث الطلب',
  status_changed: 'غير الحالة',
  specialist_assigned: 'أسند المختص',
  scope_defined: 'حدد النطاق',
  scope_approved: 'وافق على النطاق',
  payment_submitted: 'قدم الدفع',
  payment_verified: 'أكد الدفع',
  payment_rejected: 'رفض الدفع',
  work_delivered: 'سلم العمل',
  modification_requested: 'طلب تعديل',
  request_completed: 'أكمل الطلب',
  request_closed: 'أغلق الطلب',
  deleted: 'حذف الطلب',
  file_uploaded: 'رفع ملف',
  message_sent: 'أرسل رسالة',
  call_scheduled: 'جدول مكالمة',
  call_started: 'بدأ المكالمة',
  call_completed: 'أكمل مكالمة',
  call_updated: 'حدث المكالمة',
  call_cancelled: 'ألغى المكالمة',
  call_missed: 'فوت المكالمة',
};

// ============================================================
// ✅ File Categories
// ============================================================
export const FILE_CATEGORY_TEXT: Record<FileCategory, string> = {
  request: '📄 مرفقات الطلب',
  proof: '💳 إثبات الدفع',
  delivery: '📦 تسليم العمل',
  modification: '✏️ تعديلات',
  final: '🏁 نهائي',
  support: '🆘 دعم',
};

export const FILE_CATEGORIES_BY_ROLE: Record<string, FileCategory[]> = {
  customer: ['request', 'proof'],
  specialist: ['request', 'proof', 'delivery', 'modification'],
  portal_admin: ['request', 'proof', 'delivery', 'modification', 'final'],
  super_admin: ['request', 'proof', 'delivery', 'modification', 'final'],
};

// ============================================================
// ✅ Tabs
// ============================================================
export const ALL_TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: '📋 نظرة عامة' },
  { id: 'messages', label: '💬 الرسائل' },
  { id: 'files', label: '📁 الملفات' },
  { id: 'scope', label: '📐 النطاق' },
  { id: 'payment', label: '💰 الدفع' },
  { id: 'calls', label: '📞 المكالمات' },
  { id: 'activity', label: '📋 سجل النشاط' },
];

// ============================================================
// ✅ WebRTC
// ============================================================
export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CALL_TYPE_TEXT: Record<CallType, string> = {
  audio: '🎤 صوتية',
  video: '📹 فيديو',
};

// ============================================================
// ✅ Limits
// ============================================================
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;