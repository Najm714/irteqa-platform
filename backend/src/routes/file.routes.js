// backend/src/routes/file.routes.js
import express from 'express';
import {
  uploadFile,
  downloadFileDirect,
  getFile,
  streamVideo,
  streamVideoSecure,
  deleteFile,
  getFileInfo,
  reuploadFile,
  viewFile,
  getThumbnailPublic,
} from '../controllers/file.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';
import multer from 'multer';
import { File } from '../models/File.model.js';
import storageService from '../services/storage.service.js';

const router = express.Router();

// ============================================================
// ✅ تكوين Multer
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
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
      'video/mp4', 'video/webm', 'video/ogg',
    ];

    if (allowedTypes.includes(file.mimetype) ||
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'), false);
    }
  },
});

// ============================================================
// ✅ مسار عام للصور الشخصية (قبل المصادقة)
// ============================================================
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const requestedPortalId =
      req.headers['x-portal-id'] ||
      req.query?.portalId ||
      null;

    if (!requestedPortalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    console.log(
      '📸 Fetching public file:',
      id,
      '| Portal:',
      requestedPortalId
    );

    const file = await File.findOne({
      _id: id,
      portalId: requestedPortalId,
      category: 'profile',
      isDeleted: { $ne: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const fileBuffer = await storageService.getFile(file);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Public file error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get file',
    });
  }
});

// ============================================================
// ✅ ✅ مسار جلب ملفات المختص (يجب أن يكون قبل /:id)
// ============================================================

router.get('/specialist', authenticate, requirePortalContext, async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { category, search, page = 1, limit = 20 } = req.query;

    console.log('📤 Fetching specialist files for:', accountId);

    // التحقق من أن المستخدم مختص
    if (req.account?.role !== 'specialist' && req.account?.role !== 'portal_admin' && req.account?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only specialists can access this endpoint',
      });
    }

    const query = {
      portalId,
      uploadedBy: accountId,
      isDeleted: { $ne: true },
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // جلب الملفات مع معلومات الطلب المرتبطة
    const files = await File.find(query)
      .populate('requestId', 'requestNumber title status')
      .populate('uploadedBy', 'profile.fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await File.countDocuments(query);

    // تنسيق البيانات
    const formattedFiles = files.map(file => ({
      _id: file._id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      requestId: file.requestId?._id,
      requestNumber: file.requestId?.requestNumber,
      requestTitle: file.requestId?.title,
      requestStatus: file.requestId?.status,
      createdAt: file.createdAt,
      uploadedBy: file.uploadedBy,
      storageKey: file.storageKey,
    }));

    res.json({
      success: true,
      data: formattedFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching specialist files:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch files',
    });
  }
});

router.get('/thumbnail/:id', getThumbnailPublic);
// ============================================================
// ✅ جميع المسارات التالية تتطلب مصادقة وسياق بوابة
// ============================================================

router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// 🔐 مسارات قراءة وتحميل وبث الملفات
// تتطلب المصادقة + سياق البوابة
// ============================================================

router.get('/:id/download-direct', downloadFileDirect);
router.get('/:id/stream', streamVideo);
router.get('/:id/stream-secure', streamVideoSecure);
router.get('/:id/view', viewFile);
// ============================================================
// ✅ مسارات رفع الملفات
// ============================================================

router.post('/upload', upload.single('file'), uploadFile);
router.post('/upload-multiple', upload.array('files', 10), uploadFile);

// ============================================================
// ✅ مسارات تحميل وقراءة الملفات (تتطلب مصادقة)
// ============================================================

router.get('/:id/info', getFileInfo);
router.get('/:id', getFile);

// ============================================================
// ✅ مسار إعادة رفع الملفات المفقودة (للمدير فقط)
// ============================================================

router.post(
  '/:id/reupload',
  requirePermission(['manage_files', 'manage_requests']),
  upload.single('file'),
  reuploadFile
);

// ============================================================
// ✅ مسار حذف الملفات (للمدير فقط)
// ============================================================

router.delete('/:id', requirePermission(['manage_files', 'manage_requests']), deleteFile);

export default router;