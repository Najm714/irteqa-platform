// backend/src/controllers/about.controller.js
import { About } from '../models/about.model.js';
import { File } from '../models/File.model.js';
import storageService from '../services/storage.service.js';

// ============================================================
// ✅ إنشاء أو تحديث صفحة نبذة عنا
// ============================================================
export const upsertAbout = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;
    const data = req.body;

    console.log('📤 Saving about page...');
    console.log('  - Portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    // ✅ البحث عن الصفحة أو إنشاء جديدة
    let about = await About.findOne({ portalId, isDeleted: { $ne: true } });

    if (!about) {
      about = new About({
        portalId,
        createdBy: accountId,
      });
    }

    // ✅ تحديث الحقول
    const allowedFields = [
      'platformName', 'platformNameAr', 'platformDescription', 'platformDescriptionAr',
      'platformLogo', 'platformCover',
      'story', 'storyAr', 'foundedDate',
      'vision', 'visionAr',
      'mission', 'missionAr',
      'values', 'stats', 'team', 'achievements', 'testimonials',
      'contactInfo', 'profileFileId',
      'isPublished',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        about[field] = data[field];
      }
    }

    about.updatedBy = accountId;
    about.updatedAt = new Date();

    await about.save();

    // ✅ جلب البيانات مع الصور
    const populated = await About.findById(about._id)
      .populate('platformLogo', 'originalName size mimeType storageKey')
      .populate('platformCover', 'originalName size mimeType storageKey')
      .populate('profileFileId', 'originalName size mimeType storageKey')
      .populate('team.imageId', 'originalName size mimeType storageKey')
      .populate('achievements.imageId', 'originalName size mimeType storageKey')
      .populate('testimonials.imageId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName')
      .populate('updatedBy', 'profile.fullName');

    console.log('✅ About page saved:', about._id);

    res.json({
      success: true,
      data: populated,
      message: 'تم حفظ صفحة نبذة عنا بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in upsertAbout:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب صفحة نبذة عنا
// ============================================================
export const getAbout = async (req, res) => {
  try {
    const portalId = req.portalId;

    console.log('📤 Fetching about page for portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const about = await About.findOne({ portalId, isDeleted: { $ne: true } })
      .populate('platformLogo', 'originalName size mimeType storageKey')
      .populate('platformCover', 'originalName size mimeType storageKey')
      .populate('profileFileId', 'originalName size mimeType storageKey')
      .populate('team.imageId', 'originalName size mimeType storageKey')
      .populate('achievements.imageId', 'originalName size mimeType storageKey')
      .populate('testimonials.imageId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName')
      .populate('updatedBy', 'profile.fullName');

    if (!about) {
      // ✅ إرجاع بيانات افتراضية إذا لم تكن الصفحة موجودة
      return res.json({
        success: true,
        data: {
          platformName: '',
          platformNameAr: '',
          platformDescription: '',
          platformDescriptionAr: '',
          story: '',
          storyAr: '',
          vision: '',
          visionAr: '',
          mission: '',
          missionAr: '',
          values: [],
          stats: [],
          team: [],
          achievements: [],
          testimonials: [],
          contactInfo: {
            email: '',
            phone: '',
            address: '',
            addressAr: '',
            mapUrl: '',
            workingHours: '',
            workingHoursAr: '',
            socialMedia: {
              facebook: '',
              twitter: '',
              instagram: '',
              youtube: '',
              linkedin: '',
              whatsapp: '',
            },
          },
          isPublished: false,
        },
        message: 'لم يتم إعداد صفحة نبذة عنا بعد',
      });
    }

    res.json({
      success: true,
      data: about,
    });
  } catch (error) {
    console.error('❌ Error in getAbout:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================================
// ✅ جلب ملفات الصور
// Portal-isolated + authentication-aware
// ============================================================
export const getAboutFile = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    console.log('🖼️ Getting about file:', id);
    console.log('  - Portal:', portalId);
    console.log('  - Account:', req.account?._id);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // ========================================================
    // البحث عن الملف داخل الـ Portal المحدد فقط
    // ========================================================
    const file = await File.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in this portal',
        code: 'FILE_NOT_FOUND',
      });
    }

    // ========================================================
    // حماية إضافية للتأكد من تطابق Portal
    // ========================================================
    if (
      !file.portalId ||
      file.portalId.toString() !== portalId.toString()
    ) {
      console.warn(
        `🚫 About file portal mismatch: ` +
        `file=${file._id}, ` +
        `filePortal=${file.portalId}, ` +
        `requestedPortal=${portalId}`
      );

      return res.status(403).json({
        success: false,
        message: 'File does not belong to this portal',
        code: 'FILE_PORTAL_ACCESS_DENIED',
      });
    }

    const fileBuffer = await storageService.getFile(file);

    res.setHeader(
      'Content-Type',
      file.mimeType || 'application/octet-stream'
    );

    res.setHeader(
      'Content-Length',
      fileBuffer.length
    );

    res.setHeader(
      'Cache-Control',
      'public, max-age=86400'
    );

    res.setHeader(
      'Access-Control-Allow-Origin',
      '*'
    );

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(
        file.originalName
      )}"`
    );

    console.log(
      '✅ About file served successfully:',
      file._id,
      '| Portal:',
      portalId
    );

    return res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Error in getAboutFile:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get about file',
      });
    }

    res.end();
  }
};