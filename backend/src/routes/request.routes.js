// backend/src/routes/request.routes.js
import express from 'express';
import {
  // ===== Client =====
  getMyRequests,
  createRequest,
  // ===== Specialist =====
  getSpecialistRequests,
  // ===== Admin =====
  getAllRequests,
  getRequestStats,
  // ===== Single Request =====
  getRequestById,
  updateRequest,
  updateRequestStatus,
  assignSpecialist,
  deleteRequest,
  // ===== Workspace: Messages =====
  getRequestMessages,
  addRequestMessage,
  // ===== Workspace: Files =====
  getRequestFiles,
  addRequestFile,
  // ===== Workspace: Scope =====
  defineRequestScope,
  adminDefineScope,
  approveRequestScope,
  // ===== Workspace: Payment =====
  submitPayment,
  verifyPayment,
  rejectPayment,
  // ===== Workspace: Calls =====
  addRequestCall,
  getRequestCalls,
  getUpcomingCallsForRequest,
  getPastCallsForRequest,
  startScheduledCall,
  updateRequestCall,
  cancelRequestCall,
  // ===== Workspace: Activity =====
  getRequestActivity,
} from '../controllers/request.controller.js';

import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';
import {
  getRequest,
  requireSpecialistAccess,
  requireCustomerAccess,
  canTransitionStatus,
} from '../middleware/requestAuth.js';

const router = express.Router();

// ============================================================
// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة
// ============================================================
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// 🔵 القسم 1: مسارات ثابتة (بدون :id)
// مهم: يجب أن تكون قبل /:id
// ============================================================

// ===== العميل =====
router.get('/my', getMyRequests);
router.post('/', createRequest);

// ===== المختص =====
router.get('/specialist', getSpecialistRequests);

// ===== المدير =====
router.get(
  '/all',
  requirePermission(['manage_requests', 'view_all_requests']),
  getAllRequests
);
router.get(
  '/stats',
  requirePermission(['manage_requests', 'view_reports']),
  getRequestStats
);

// ============================================================
// 🟢 القسم 2: مسارات الطلب المحدد (:id)
// ============================================================

// ===== جلب وتحديث الطلب =====
router.get('/:id', getRequest, getRequestById);
router.put('/:id', getRequest, updateRequest);

// ===== تغيير الحالة =====
router.patch(
  '/:id/status',
  getRequest,
  canTransitionStatus,
  updateRequestStatus
);

// ===== إسناد مختص (للمدير) =====
router.patch(
  '/:id/assign',
  getRequest,
  requirePermission(['manage_requests', 'assign_specialist']),
  assignSpecialist
);

// ===== حذف الطلب =====
router.delete('/:id', getRequest, deleteRequest);

// ============================================================
// 🟡 القسم 3: مسارات غرفة الطلب (Workspace)
// ============================================================

// ===== 💬 الرسائل =====
router.get('/:id/messages', getRequest, getRequestMessages);
router.post('/:id/messages', getRequest, addRequestMessage);

// ===== 📁 الملفات =====
router.get('/:id/files', getRequest, getRequestFiles);
router.post('/:id/files', getRequest, addRequestFile);

// ===== 📐 النطاق =====
// ✅ الحل: توحيد المسار
// - للمدير: adminDefineScope (يمكنه تحديد النطاق)
// - للمختص: defineRequestScope (يمكنه تحديد النطاق)
// - نستخدم controller موحّد يتحقق من الصلاحية داخلياً

router.post('/:id/scope', getRequest, (req, res, next) => {
  // ✅ فحص داخلي: مدير أو مختص
  const isAdmin =
    req.account?.role === 'portal_admin' ||
    req.account?.role === 'super_admin';

  if (isAdmin) {
    return adminDefineScope(req, res, next);
  }

  return requireSpecialistAccess(req, res, () =>
    defineRequestScope(req, res, next)
  );
});

router.patch(
  '/:id/scope/approve',
  getRequest,
  requireCustomerAccess,
  approveRequestScope
);

// ===== 💰 الدفع =====
router.post(
  '/:id/payment',
  getRequest,
  requireCustomerAccess,
  submitPayment
);

router.patch(
  '/:id/payment/verify',
  getRequest,
  requirePermission(['manage_requests']),
  verifyPayment
);

router.patch(
  '/:id/payment/reject',
  getRequest,
  requirePermission(['manage_requests']),
  rejectPayment
);

// ============================================================
// 📞 القسم 4: مسارات المكالمات (Calls)
// ============================================================

// ✅ جلب جميع مكالمات الطلب
router.get('/:id/calls', getRequest, getRequestCalls);

// ✅ جلب المكالمات القادمة
router.get(
  '/:id/calls/upcoming',
  getRequest,
  getUpcomingCallsForRequest
);

// ✅ جلب المكالمات السابقة
router.get('/:id/calls/past', getRequest, getPastCallsForRequest);

// ✅ جدولة مكالمة جديدة
router.post('/:id/calls', getRequest, addRequestCall);

// ✅ بدء مكالمة مجدولة
router.post(
  '/:id/calls/:callId/start',
  getRequest,
  startScheduledCall
);

// ✅ تحديث مكالمة
router.patch(
  '/:id/calls/:callId',
  getRequest,
  updateRequestCall
);

// ✅ إلغاء مكالمة
router.delete(
  '/:id/calls/:callId',
  getRequest,
  cancelRequestCall
);

// ============================================================
// 📋 القسم 5: سجل النشاط
// ============================================================
router.get('/:id/activity', getRequest, getRequestActivity);

// ============================================================
// ✅ تصدير المسارات
// ============================================================
export default router;