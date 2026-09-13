// backend/src/routes/explanations.routes.js
import express from 'express';
import {
  getUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  getSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  getSubscriptions,
  getMySubscriptions,
  getActiveSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  activateSubscription,
} from '../controllers/explanations.controller.js';

import {
  uploadVideo,
  getVideoForPlayback,
  createLiveStream,
  getLiveStreamInfo,
} from '../controllers/video.controller.js';

import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';
import multer from 'multer';

const router = express.Router();

// ✅ تكوين multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime',
      'video/x-msvideo', 'video/x-matroska', 'video/x-flv',
      'video/mpeg', 'video/ogg', 'video/3gpp',
    ];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع ملف فيديو فقط.'), false);
    }
  },
});

// ============================================================
// ✅ المسارات العامة (بدون مصادقة - للزوار)
// ============================================================

// ✅ قراءة الجامعات
router.get('/universities', optionalAuth, requirePortalContext, getUniversities);
router.get('/universities/:id', optionalAuth, requirePortalContext, getUniversityById);

// ✅ قراءة الكليات
router.get('/colleges', optionalAuth, requirePortalContext, getColleges);
router.get('/colleges/:id', optionalAuth, requirePortalContext, getCollegeById);

// ✅ قراءة التخصصات
router.get('/specialties', optionalAuth, requirePortalContext, getSpecialties);
router.get('/specialties/:id', optionalAuth, requirePortalContext, getSpecialtyById);

// ✅ قراءة المواد
router.get('/materials', optionalAuth, requirePortalContext, getMaterials);
router.get('/materials/:id', optionalAuth, requirePortalContext, getMaterialById);

// ✅ قراءة الفيديوهات
router.get('/videos', optionalAuth, requirePortalContext, getVideos);
router.get('/videos/:id/playback', optionalAuth, requirePortalContext, getVideoForPlayback);
router.get('/videos/live/:id', optionalAuth, requirePortalContext, getLiveStreamInfo);

// ============================================================
// ✅ مسارات الاشتراكات (تتطلب مصادقة)
// ============================================================

router.get('/subscriptions/my', authenticate, requirePortalContext, getMySubscriptions);
router.get('/subscriptions/active', authenticate, requirePortalContext, getActiveSubscription);
router.get(
  '/subscriptions',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_subscriptions', 'manage_explanations']),
  getSubscriptions
);
router.post('/subscriptions', authenticate, requirePortalContext, createSubscription);
router.put(
  '/subscriptions/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_subscriptions', 'manage_explanations']),
  updateSubscription
);
router.delete(
  '/subscriptions/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_subscriptions', 'manage_explanations']),
  deleteSubscription
);
router.put(
  '/subscriptions/:id/activate',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_subscriptions', 'manage_explanations']),
  activateSubscription
);

// ============================================================
// ✅ Routes الإدارية (للمدير فقط)
// ============================================================

// Universities
router.post(
  '/universities',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  createUniversity
);
router.put(
  '/universities/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  updateUniversity
);
router.delete(
  '/universities/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  deleteUniversity
);

// Colleges
router.post(
  '/colleges',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  createCollege
);
router.put(
  '/colleges/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  updateCollege
);
router.delete(
  '/colleges/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  deleteCollege
);

// Specialties
router.post(
  '/specialties',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  createSpecialty
);
router.put(
  '/specialties/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  updateSpecialty
);
router.delete(
  '/specialties/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  deleteSpecialty
);

// Materials
router.post(
  '/materials',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  createMaterial
);
router.put(
  '/materials/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  updateMaterial
);
router.delete(
  '/materials/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  deleteMaterial
);

// Videos - Admin
router.post(
  '/videos/upload',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations', 'manage_videos']),
  upload.single('video'),
  uploadVideo
);
router.post(
  '/videos',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  createVideo
);
router.put(
  '/videos/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  updateVideo
);
router.delete(
  '/videos/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations']),
  deleteVideo
);

// Live Stream
router.post(
  '/videos/live',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations', 'manage_videos', 'manage_live']),
  createLiveStream
);
router.post(
  '/videos/live/:id/end',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_explanations', 'manage_videos', 'manage_live']),
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'تم إنهاء البث المباشر بنجاح',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'فشل إنهاء البث المباشر',
      });
    }
  }
);

export default router;