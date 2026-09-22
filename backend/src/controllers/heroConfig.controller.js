// backend/src/controllers/heroConfig.controller.js
import { HeroConfig } from '../models/HeroConfig.model.js';
import { Request } from '../models/Request.model.js';
import { Account } from '../models/Account.model.js';
import { Service } from '../models/Service.model.js';
import { File } from '../models/File.model.js';
import storageService from '../services/storage.service.js';
import multer from 'multer';

// ============================================================
// ✅ إعداد multer لرفع ملفات Hero
// ============================================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedImages = [
      'image/jpeg', 'image/jpg', 'image/png',
      'image/webp', 'image/gif', 'image/svg+xml',
    ];
    const allowedVideos = [
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    ];

    if ([...allowedImages, ...allowedVideos].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'), false);
    }
  },
});

// ============================================================
// ✅ جلب إعدادات Hero
// ============================================================
export const getHeroConfig = async (req, res) => {
  try {
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    let config = await HeroConfig.findOne({ portalId });

    // ✅ إنشاء إعدادات افتراضية
    if (!config) {
      config = new HeroConfig({
        portalId,
        mainContent: {
          title: 'منصة ارتقاء الأكاديمية',
          titleHighlight: 'ارتقاء',
          description: 'نقدم خدمات أكاديمية متخصصة تجمع بين الخبرة والجودة في بيئة رقمية متكاملة، صُممت لتواكب احتياجاتك.',
        },
        ctas: [
          { text: 'استعراض الأقسام', link: '/services', variant: 'primary', order: 0, isActive: true },
          { text: 'انضم الآن', link: '/register', variant: 'secondary', order: 1, isActive: true },
        ],
        badges: [
          { text: 'موثوق من قبل 10K+ باحث', icon: 'fa-check-circle', color: '#10b981', order: 0, isActive: true },
          { text: '⭐ 4.9/5 تقييم', color: '#f59e0b', order: 1, isActive: true },
          { text: 'خدمات عالمية', icon: 'fa-globe', color: '#3b82f6', order: 2, isActive: true },
        ],
        liveStats: {
          enabled: true,
          items: [
            { label: 'المستخدمون', dynamicKey: 'users', isDynamic: true, color: '#7c3aed', order: 0 },
            { label: 'الطلبات المكتملة', dynamicKey: 'requests', isDynamic: true, color: '#10b981', order: 1 },
            { label: 'الخدمات', dynamicKey: 'services', isDynamic: true, color: '#3b82f6', order: 2 },
            { label: 'التقييم', dynamicKey: 'rating', isDynamic: true, suffix: '/5', color: '#f59e0b', order: 3 },
          ],
        },
        layout: 'cinematic',
        background: {
          type: 'animated',
          starsEnabled: true,
          overlayOpacity: 0.3,
        },
      });
      await config.save();
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('❌ Get hero config error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get hero config',
    });
  }
};

// ============================================================
// ✅ تحديث إعدادات Hero
// ============================================================
export const updateHeroConfig = async (req, res) => {
  try {
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    const updates = req.body;

    const config = await HeroConfig.findOneAndUpdate(
      { portalId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Hero config updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('❌ Update hero config error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update hero config',
    });
  }
};

// ============================================================
// ✅ ✅ ✅ رفع ملف Hero (صورة/فيديو)
// ============================================================
export const uploadHeroFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      const portalId = req.portalId;
      const accountId = req.accountId;

      if (!portalId) {
        return res.status(400).json({
          success: false,
          message: 'Portal context is required',
        });
      }

      if (!accountId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      console.log('📤 Uploading hero file:');
      console.log('  - Name:', req.file.originalname);
      console.log('  - Size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('  - Type:', req.file.mimetype);

      // ✅ تحديد الفئة بناءً على النوع والـ category من الطلب
      const isVideo = req.file.mimetype.startsWith('video/');
      const requestedCategory = req.body.category || 'main';

      let category = 'hero-image';
      if (isVideo) {
        category = 'hero-video';
      } else if (requestedCategory === 'popup') {
        category = 'popup-image';
      } else if (requestedCategory === 'sideBanner') {
        category = 'side-banner-image';
      }

      // ✅ رفع الملف
      const result = await storageService.uploadFile(
        req.file,
        portalId,
        accountId,
        category,
        null,
        {
          originalName: req.file.originalname,
          uploadedAt: new Date().toISOString(),
          requestedCategory,
        }
      );

      // ✅ بناء URL عام
      const protocol =
        req.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
        req.protocol ||
        'https';
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const fileUrl = `${baseUrl}/api/files/thumbnail/${result.file._id}?portalId=${portalId}`;

      console.log('✅ Hero file uploaded:', result.file._id);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileId: result.file._id,
          url: fileUrl,
          type: isVideo ? 'video' : 'image',
          category,
          mimeType: req.file.mimetype,
          size: req.file.size,
          originalName: req.file.originalname,
        },
      });
    } catch (error) {
      console.error('❌ Upload hero file error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload file',
      });
    }
  },
];

// ============================================================
// ✅ جلب الإحصائيات المباشرة
// ============================================================
export const getLiveStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    const [users, requests, services] = await Promise.all([
      Account.countDocuments({ portalId, isActive: true, isDeleted: { $ne: true } }),
      Request.countDocuments({ portalId, isDeleted: { $ne: true } }),
      Service.countDocuments({ portalId, isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        requests,
        services,
        rating: 4.9,
      },
    });
  } catch (error) {
    console.error('❌ Get live stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get live stats',
    });
  }
};

// ============================================================
// ✅ إعادة تعيين الإعدادات
// ============================================================
export const resetHeroConfig = async (req, res) => {
  try {
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    await HeroConfig.deleteOne({ portalId });

    res.status(200).json({
      success: true,
      message: 'Hero config reset successfully',
    });
  } catch (error) {
    console.error('❌ Reset hero config error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset hero config',
    });
  }
};

export default {
  getHeroConfig,
  updateHeroConfig,
  uploadHeroFile,
  getLiveStats,
  resetHeroConfig,
};