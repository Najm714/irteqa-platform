// backend/src/routes/videoLibrary.routes.js
import express from 'express';
import {
  addVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  streamVideo,
  getVideoStats,
} from '../controllers/videoLibrary.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ مسار تشغيل الفيديو - عام (لا يتطلب مصادقة مسبقة)
// يتم التحقق من التوكن داخل الدالة نفسها
router.get(
  '/:id/stream',
  optionalAuth,
  requirePortalContext,
  streamVideo
);
// ✅ جميع المسارات الأخرى تتطلب مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات العميل (مشاهدة المكتبة)
// ============================================================
router.get('/', getVideos);
router.get('/stats', getVideoStats);
router.get('/:id', getVideoById);

// ============================================================
// ✅ مسارات المدير (إدارة المكتبة)
// ============================================================
router.post('/', requirePermission(['manage_videos']), addVideo);
router.put('/:id', requirePermission(['manage_videos']), updateVideo);
router.delete('/:id', requirePermission(['manage_videos']), deleteVideo);

export default router;