// backend/src/routes/payment.routes.js
import express from 'express';
import {
  createPayment,
  getMyPayments,
  getPaymentById,
  getPayments,
  updatePayment,
  updatePaymentStatus,
  uploadPaymentProof,
  verifyPayment,
  deletePayment,
  getPaymentStats, // ✅ إضافة دالة الإحصائيات
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';
import multer from 'multer';

const router = express.Router();

// ✅ تكوين multer لرفع إثباتات الدفع
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع صورة أو PDF أو وورد.'), false);
    }
  },
});

// ✅ جميع المسارات تحتاج مصادقة وسياق بوابة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات الدفع للعميل
// ============================================================

// ✅ إنشاء دفعة جديدة
router.post('/', createPayment);

// ✅ جلب مدفوعات المستخدم الحالي
router.get('/my', getMyPayments);

// ✅ جلب دفعة محددة (مع التحقق من الصلاحية)
router.get('/:id', getPaymentById);

// ✅ رفع إثبات دفع (للعميل)
router.post('/:id/proof', upload.single('proof'), uploadPaymentProof);

// ============================================================
// ✅ مسارات الدفع للمدير (تتطلب صلاحيات إدارة)
// ============================================================

// ✅ جلب جميع المدفوعات (للمدير)
router.get('/', requirePermission(['manage_payments', 'manage_subscriptions']), getPayments);

// ✅ إحصائيات المدفوعات (للمدير)
router.get('/stats', requirePermission(['manage_payments', 'manage_subscriptions']), getPaymentStats);

// ✅ تحديث دفعة (للمدير)
router.put('/:id', requirePermission(['manage_payments', 'manage_subscriptions']), updatePayment);

// ✅ تحديث حالة الدفع (للمدير)
router.patch('/:id/status', requirePermission(['manage_payments', 'manage_subscriptions']), updatePaymentStatus);

// ✅ ✅ التحقق من الدفع (موافقة/رفض) - دمج مع updatePaymentStatus
// ملاحظة: verifyPayment و updatePaymentStatus لهما نفس الوظيفة
// يمكن الاحتفاظ بأحدهما فقط
router.put('/:id/verify', requirePermission(['manage_payments', 'manage_subscriptions']), verifyPayment);

// ✅ حذف دفعة (للمدير)
router.delete('/:id', requirePermission(['manage_payments', 'manage_subscriptions']), deletePayment);

export default router;