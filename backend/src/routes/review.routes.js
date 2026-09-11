// backend/src/routes/review.routes.js
import express from 'express';
import {
  createReview,
  getSpecialistReviews,
  getRequestReviews,
  updateReview,
  deleteReview,
  reportReview,
} from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ جميع Routes تحتاج مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// Routes العامة
// ============================================================

// إنشاء تقييم (العميل فقط)
router.post('/', requirePermission('create_review'), createReview);

// جلب تقييمات الطلب
router.get('/request/:requestId', requirePermission('view_reviews'), getRequestReviews);

// جلب تقييمات المختص
router.get('/specialist/:specialistId', requirePermission('view_reviews'), getSpecialistReviews);

// ============================================================
// Routes للتعديل والحذف
// ============================================================

// تحديث تقييم (صاحب التقييم فقط)
router.put('/:id', requirePermission('update_review'), updateReview);

// الإبلاغ عن تقييم
router.post('/:id/report', requirePermission('report_review'), reportReview);

// حذف تقييم (للمشرفين فقط)
router.delete(
  '/:id',
  requirePermission('manage_reviews'),
  deleteReview
);

export default router;