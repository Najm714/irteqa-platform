// backend/src/routes/order.routes.js
import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePortalContext } from '../middleware/portalContext.js'
import { requireRequestOwnership } from '../middleware/resourceOwnership.js'
import { requirePermission } from '../middleware/authorization.js'
import {
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  uploadOrderFiles,
  downloadOrderFile,
  getOrderStats,
  updateOrderStatus,
  assignSpecialist,
  defineScope,
  verifyPayment,
  rejectPayment,
} from '../controllers/order.controller.js'
import multer from 'multer'

const router = express.Router()

// ✅ تكوين Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('نوع الملف غير مدعوم'), false)
    }
  },
})

// ===== مسارات العميل =====
router.get('/my', authenticate, requirePortalContext, getMyOrders)
router.get('/my/:id', authenticate, requirePortalContext, requireRequestOwnership, getOrderById)
router.post('/', authenticate, requirePortalContext, createOrder)
router.put('/:id', authenticate, requirePortalContext, requireRequestOwnership, updateOrder)
router.delete('/:id', authenticate, requirePortalContext, requireRequestOwnership, deleteOrder)

// ===== ملفات الطلب (مع دعم تحديد الفئة) =====
router.post(
  '/:id/upload',
  authenticate,
  requirePortalContext,
  requireRequestOwnership,
  upload.array('files', 10),
  uploadOrderFiles
)
router.get('/:id/files/:fileIndex', authenticate, requirePortalContext, requireRequestOwnership, downloadOrderFile)

// ===== مسارات المدير =====
router.get('/all', authenticate, requirePortalContext, requirePermission(['manage_requests']), getMyOrders)
router.get('/stats', authenticate, requirePortalContext, requirePermission(['manage_requests']), getOrderStats)
router.patch('/:id/status', authenticate, requirePortalContext, requirePermission(['manage_requests']), updateOrderStatus)
router.patch('/:id/assign', authenticate, requirePortalContext, requirePermission(['manage_requests']), assignSpecialist)
router.post('/:id/scope', authenticate, requirePortalContext, requirePermission(['manage_requests']), defineScope)
router.patch('/:id/payment/verify', authenticate, requirePortalContext, requirePermission(['manage_requests']), verifyPayment)
router.patch('/:id/payment/reject', authenticate, requirePortalContext, requirePermission(['manage_requests']), rejectPayment)

export default router