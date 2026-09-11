// backend/src/routes/request.routes.js
import express from 'express';
import {
  getMyRequests,
  getSpecialistRequests,
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  updateRequestStatus,
  assignSpecialist,
  deleteRequest,
  getRequestStats,
  addRequestFile,
  addRequestMessage,
  defineRequestScope,
  approveRequestScope,
  submitPayment,
  getRequestMessages,
  getRequestFiles,
  verifyPayment,
  rejectPayment,
  adminDefineScope,
  addRequestCall,              // ✅ جدولة مكالمة
  getRequestCalls,             // ✅ جلب المكالمات
  updateRequestCall,           // ✅ تحديث مكالمة
  cancelRequestCall,           // ✅ إلغاء مكالمة
  startScheduledCall,          // ✅ ✅ بدء مكالمة مجدولة (جديد)
  getUpcomingCallsForRequest,
  getPastCallsForRequest,
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

// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات العميل
// ============================================================
router.get('/my', getMyRequests);
router.post('/', createRequest);

// ============================================================
// ✅ مسارات المختص
// ============================================================
router.get('/specialist', getSpecialistRequests);

// ============================================================
// ✅ مسارات المدير
// ============================================================
router.get('/all', requirePermission(['manage_requests', 'view_all_requests']), getAllRequests);
router.get('/stats', requirePermission(['manage_requests', 'view_reports']), getRequestStats);

// ============================================================
// ✅ مسارات الطلب المحدد (مع التحقق من الصلاحية)
// ============================================================
router.get('/:id', getRequest, getRequestById);
router.put('/:id', getRequest, updateRequest);
router.patch('/:id/status', getRequest, canTransitionStatus, updateRequestStatus);
router.patch('/:id/assign', getRequest, requirePermission(['manage_requests', 'assign_specialist']), assignSpecialist);
router.delete('/:id', getRequest, deleteRequest);
router.patch('/:id/payment/verify', getRequest, requirePermission(['manage_requests']), verifyPayment);
router.patch('/:id/payment/reject', getRequest, requirePermission(['manage_requests']), rejectPayment);

// ===== تحديد النطاق (للمدير أو المختص) =====
router.post('/:id/scope', getRequest, adminDefineScope);

// ============================================================
// ✅ مسارات غرفة الطلب (Workspace)
// ============================================================

// ===== الرسائل =====
router.get('/:id/messages', getRequest, getRequestMessages);
router.post('/:id/messages', getRequest, addRequestMessage);

// ===== الملفات =====
router.get('/:id/files', getRequest, getRequestFiles);
router.post('/:id/files', getRequest, addRequestFile);

// ===== النطاق =====
router.post('/:id/scope', getRequest, requireSpecialistAccess, defineRequestScope);
router.patch('/:id/scope/approve', getRequest, requireCustomerAccess, approveRequestScope);

// ===== الدفع =====
router.post('/:id/payment', getRequest, requireCustomerAccess, submitPayment);

// ============================================================
// ✅ ✅ مسارات المكالمات (Calls) - محدثة بالكامل
// ============================================================

// ✅ جلب جميع مكالمات الطلب
router.get('/:id/calls', getRequest, getRequestCalls);

// ✅ جلب المكالمات القادمة للطلب
router.get('/:id/calls/upcoming', getRequest, getUpcomingCallsForRequest);

// ✅ جلب المكالمات السابقة للطلب
router.get('/:id/calls/past', getRequest, getPastCallsForRequest);

// ✅ جدولة مكالمة جديدة (للعميل فقط)
router.post('/:id/calls', getRequest, addRequestCall);

// ✅ ✅ بدء مكالمة مجدولة (للمختص فقط) - جديد
router.post('/:id/calls/:callId/start', getRequest, startScheduledCall);

// ✅ تحديث مكالمة (باستخدام callId)
router.patch('/:id/calls/:callId', getRequest, updateRequestCall);

// ✅ إلغاء مكالمة
router.delete('/:id/calls/:callId', getRequest, cancelRequestCall);

// ============================================================
// ✅ مسارات سجل النشاط (Activity)
// ============================================================
router.get('/:id/activity', getRequest, getRequestActivity);

// ============================================================
// ✅ تصدير المسارات
// ============================================================
export default router;