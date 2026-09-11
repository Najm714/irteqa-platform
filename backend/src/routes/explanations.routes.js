// backend/src/routes/explanations.routes.js
import express from 'express';
import {
  // Universities
  getUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  // Colleges
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  // Specialties
  getSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  // Materials
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  // Videos - من explanations.controller.js
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  // Subscriptions
  getSubscriptions,
  getMySubscriptions,
  getActiveSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  activateSubscription,
} from '../controllers/explanations.controller.js';

// ✅ ✅ استيراد دوال الفيديو من video.controller.js
import {
  uploadVideo,
  getVideoForPlayback,
  createLiveStream,
  getLiveStreamInfo,
} from '../controllers/video.controller.js';

import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';
import multer from 'multer';

const router = express.Router();

// ============================================================
// ✅ تكوين multer لرفع الفيديوهات
// ============================================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
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

// ✅ جميع Routes تحتاج مصادقة وسياق بوابة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ Routes العامة (لجميع المستخدمين المصادقين)
// ============================================================

// ✅ قراءة الجامعات
router.get('/universities', getUniversities);
router.get('/universities/:id', getUniversityById);

// ✅ قراءة الكليات
router.get('/colleges', getColleges);
router.get('/colleges/:id', getCollegeById);

// ✅ قراءة التخصصات
router.get('/specialties', getSpecialties);
router.get('/specialties/:id', getSpecialtyById);

// ✅ قراءة المواد
router.get('/materials', getMaterials);
router.get('/materials/:id', getMaterialById);

// ============================================================
// ✅ ✅ Routes الفيديوهات (مدمجة بالكامل)
// ============================================================

// ✅ قراءة الفيديوهات (من explanations.controller.js)
router.get('/videos', getVideos);

// ✅ ✅ تشغيل فيديو (من video.controller.js)
router.get('/videos/:id/playback', getVideoForPlayback);

// ============================================================
// ✅ ✅ Routes الإدارية للفيديوهات
// ============================================================

// ✅ رفع فيديو جديد (من video.controller.js)
router.post(
  '/videos/upload',
  requirePermission(['manage_explanations', 'manage_videos']),
  upload.single('video'),
  uploadVideo
);

// ✅ إنشاء فيديو (من explanations.controller.js - للمحتوى التعليمي)
router.post(
  '/videos',
  requirePermission(['manage_explanations']),
  createVideo
);

// ✅ تحديث فيديو (من explanations.controller.js)
router.put(
  '/videos/:id',
  requirePermission(['manage_explanations']),
  updateVideo
);

// ✅ حذف فيديو (من explanations.controller.js)
router.delete(
  '/videos/:id',
  requirePermission(['manage_explanations']),
  deleteVideo
);

// ============================================================
// ✅ ✅ Routes البث المباشر (من video.controller.js)
// ============================================================

// ✅ إنشاء بث مباشر جديد
router.post(
  '/videos/live',
  requirePermission(['manage_explanations', 'manage_videos', 'manage_live']),
  createLiveStream
);

// ✅ الحصول على معلومات البث المباشر
router.get(
  '/videos/live/:id',
  getLiveStreamInfo
);

// ✅ إنهاء البث المباشر
router.post(
  '/videos/live/:id/end',
  requirePermission(['manage_explanations', 'manage_videos', 'manage_live']),
  async (req, res) => {
    try {
      // TODO: إنهاء البث المباشر
      res.status(200).json({
        success: true,
        message: 'تم إنهاء البث المباشر بنجاح',
      });
    } catch (error) {
      console.error('❌ End live stream error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'فشل إنهاء البث المباشر',
      });
    }
  }
);

// ============================================================
// ✅ ✅ Routes الاشتراكات
// ============================================================

// ✅ مسار العميل - يجب أن يكون قبل مسار :id
router.get('/subscriptions/my', getMySubscriptions);
router.get('/subscriptions/active', getActiveSubscription);

// ✅ مسارات الاشتراكات (للمدير)
router.get('/subscriptions', requirePermission(['manage_subscriptions', 'manage_explanations']), getSubscriptions);

// ✅ إنشاء اشتراك جديد (للعميل)
router.post('/subscriptions', createSubscription);

// ✅ تحديث وإلغاء وتفعيل اشتراك (للمدير)
router.put('/subscriptions/:id', requirePermission(['manage_subscriptions', 'manage_explanations']), updateSubscription);
router.delete('/subscriptions/:id', requirePermission(['manage_subscriptions', 'manage_explanations']), deleteSubscription);
router.put('/subscriptions/:id/activate', requirePermission(['manage_subscriptions', 'manage_explanations']), activateSubscription);

// ============================================================
// ✅ ✅ Routes الإدارية (للمدير فقط)
// ============================================================

// ✅ Universities - Admin
router.post('/universities', requirePermission(['manage_explanations']), createUniversity);
router.put('/universities/:id', requirePermission(['manage_explanations']), updateUniversity);
router.delete('/universities/:id', requirePermission(['manage_explanations']), deleteUniversity);

// ✅ Colleges - Admin
router.post('/colleges', requirePermission(['manage_explanations']), createCollege);
router.put('/colleges/:id', requirePermission(['manage_explanations']), updateCollege);
router.delete('/colleges/:id', requirePermission(['manage_explanations']), deleteCollege);

// ✅ Specialties - Admin
router.post('/specialties', requirePermission(['manage_explanations']), createSpecialty);
router.put('/specialties/:id', requirePermission(['manage_explanations']), updateSpecialty);
router.delete('/specialties/:id', requirePermission(['manage_explanations']), deleteSpecialty);

// ✅ Materials - Admin
router.post('/materials', requirePermission(['manage_explanations']), createMaterial);
router.put('/materials/:id', requirePermission(['manage_explanations']), updateMaterial);
router.delete('/materials/:id', requirePermission(['manage_explanations']), deleteMaterial);

export default router;