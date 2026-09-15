// backend/src/controllers/videoLibrary.controller.js
import { VideoLibrary } from '../models/videoLibrary.model.js';
import { File } from '../models/File.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Account } from '../models/Account.model.js';
import storageService from '../services/storage.service.js';
import jwt from 'jsonwebtoken';

// ============================================================
// ✅ إضافة فيديو إلى مكتبة الفيديوهات
// ============================================================
export const addVideo = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;
    const {
      fileId,
      thumbnailId,
      title,
      titleAr,
      description,
      descriptionAr,
      instructor,
      category,
      categoryAr,
      tags,
      duration,
      durationFormatted,
      isPublished,
      isFeatured,
      isEncrypted,
      order,
      videoUrl,
    } = req.body;

    console.log('📤 Adding video to library...');
    console.log('  - Portal:', portalId);
    console.log('  - Title:', title);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    let file = null;
    if (fileId) {
      file = await File.findOne({ _id: fileId, portalId, isDeleted: { $ne: true } });
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'Video file not found',
        });
      }
    }

    let thumbnail = null;
    if (thumbnailId) {
      thumbnail = await File.findOne({ _id: thumbnailId, portalId, isDeleted: { $ne: true } });
      if (!thumbnail) {
        return res.status(404).json({
          success: false,
          message: 'Thumbnail file not found',
        });
      }
    }

    if (fileId) {
      const existing = await VideoLibrary.findOne({ portalId, fileId, isDeleted: { $ne: true } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This video is already in the library',
        });
      }
    }

    const video = new VideoLibrary({
      portalId,
      fileId: fileId || null,
      thumbnailId: thumbnailId || null,
      title: title || (file?.originalName || 'فيديو'),
      titleAr: titleAr || (file?.originalName || 'فيديو'),
      description: description || '',
      descriptionAr: descriptionAr || '',
      instructor: instructor || '',
      videoUrl: videoUrl || '',
      thumbnail: thumbnailId ? `/api/files/${thumbnailId}/download-direct` : '',
      duration: duration || 0,
      durationFormatted: durationFormatted || '00:00',
      category: category || 'tutorial',
      categoryAr: categoryAr || 'درس تعليمي',
      tags: tags || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      isFeatured: isFeatured || false,
      isEncrypted: isEncrypted || false,
      order: order || 0,
      createdBy: accountId,
    });

    await video.save();

    const populated = await VideoLibrary.findById(video._id)
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('thumbnailId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    console.log('✅ Video added to library:', video._id);

    res.status(201).json({
      success: true,
      data: populated,
      message: 'تم إضافة الفيديو إلى المكتبة بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in addVideo:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب جميع فيديوهات المكتبة
// ============================================================
export const getVideos = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { category, search, isPublished, isFeatured, page = 1, limit = 20 } = req.query;

    console.log('📤 Fetching library videos for portal:', portalId);

    const query = { portalId, isDeleted: { $ne: true } };
    if (category) query.category = category;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let videosQuery = VideoLibrary.find(query)
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('thumbnailId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName')
      .sort({ isFeatured: -1, order: 1, createdAt: -1 });

    if (search) {
      videosQuery = videosQuery.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { titleAr: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { descriptionAr: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const [videos, total] = await Promise.all([
      videosQuery.skip(skip).limit(parseInt(limit)),
      VideoLibrary.countDocuments(query),
    ]);

    const account = req.account;
    const subscription = await Subscription.findOne({
      portalId,
      accountId: account?.id,
      status: 'active',
    });

    const videosWithAccess = videos.map(video => ({
      ...video.toObject(),
      canView: video.canView(account, subscription),
      videoUrl: video.getVideoUrl(req.protocol + '://' + req.get('host')),
    }));

    res.json({
      success: true,
      data: videosWithAccess,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getVideos:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب فيديو محدد من المكتبة
// ============================================================
export const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const video = await VideoLibrary.findOne({ _id: id, portalId, isDeleted: { $ne: true } })
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('thumbnailId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in library',
      });
    }

    video.views += 1;
    await video.save();

    const account = req.account;
    const subscription = await Subscription.findOne({
      portalId,
      accountId: account?.id,
      status: 'active',
    });

    const videoData = {
      ...video.toObject(),
      canView: video.canView(account, subscription),
      videoUrl: video.getVideoUrl(req.protocol + '://' + req.get('host')),
    };

    res.json({
      success: true,
      data: videoData,
    });
  } catch (error) {
    console.error('❌ Error in getVideoById:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تحديث فيديو في المكتبة
// ============================================================
export const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const updates = req.body;

    const video = await VideoLibrary.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in library',
      });
    }

    const allowedFields = [
      'title', 'titleAr', 'description', 'descriptionAr', 'instructor',
      'category', 'categoryAr', 'tags', 'isPublished', 'isFeatured',
      'isEncrypted', 'order', 'duration', 'durationFormatted',
      'thumbnailId', 'videoUrl', 'thumbnail',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        video[field] = updates[field];
      }
    }

    video.updatedAt = new Date();
    await video.save();

    const populated = await VideoLibrary.findById(video._id)
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('thumbnailId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    res.json({
      success: true,
      data: populated,
      message: 'تم تحديث الفيديو بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in updateVideo:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ حذف فيديو من المكتبة
// ============================================================
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;

    const video = await VideoLibrary.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in library',
      });
    }

    video.isDeleted = true;
    video.deletedAt = new Date();
    video.deletedBy = accountId;
    await video.save();

    res.json({
      success: true,
      message: 'تم حذف الفيديو من المكتبة بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in deleteVideo:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================================
// تشغيل فيديو من مكتبة الفيديوهات
// Portal-isolated + authentication-aware
// ============================================================
export const streamVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const account = req.account;

    console.log('🎬 Streaming library video:', id);
    console.log('  - Portal:', portalId);
    console.log('  - Account:', account?._id);
    console.log('  - Role:', account?.role);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
        code: 'UNAUTHORIZED',
      });
    }

    // ========================================================
    // البحث عن الفيديو داخل الـ Portal المحدد فقط
    // ========================================================
    const video = await VideoLibrary.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    }).populate({
      path: 'fileId',
      select:
        'originalName size mimeType storageKey portalId accountId isDeleted',
      match: {
        portalId,
        isDeleted: { $ne: true },
      },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in this portal',
        code: 'VIDEO_NOT_FOUND',
      });
    }

    // ========================================================
    // التأكد مرة أخرى من أن الفيديو يتبع الـ Portal
    // ========================================================
    if (
      !video.portalId ||
      video.portalId.toString() !== portalId.toString()
    ) {
      console.warn(
        `🚫 Video portal mismatch: video=${video._id}, ` +
        `videoPortal=${video.portalId}, requestedPortal=${portalId}`
      );

      return res.status(403).json({
        success: false,
        message: 'Video does not belong to this portal',
        code: 'VIDEO_PORTAL_ACCESS_DENIED',
      });
    }

    // ========================================================
    // الفيديو يجب أن يكون منشورًا
    // ========================================================
    if (!video.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'This video is not available',
        code: 'VIDEO_NOT_PUBLISHED',
      });
    }

    // ========================================================
    // الاشتراك يجب أن يكون من نفس الـ Portal
    // ========================================================
    const subscription = await Subscription.findOne({
      portalId,
      accountId: account._id,
      status: 'active',
    });

    // ========================================================
    // التحقق من صلاحية مشاهدة الفيديو
    // ========================================================
    if (!video.canView(account, subscription)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this video',
        code: 'ACCESS_DENIED',
      });
    }

    // ========================================================
    // إذا كان الفيديو مخزنًا كملف
    // ========================================================
    if (video.fileId) {
      // حماية إضافية: File يجب أن يكون من نفس الـ Portal
      if (
        !video.fileId.portalId ||
        video.fileId.portalId.toString() !== portalId.toString()
      ) {
        console.warn(
          `🚫 Video/File portal mismatch: ` +
          `video=${video._id}, ` +
          `file=${video.fileId._id}, ` +
          `requestedPortal=${portalId}`
        );

        return res.status(403).json({
          success: false,
          message: 'Video file does not belong to this portal',
          code: 'VIDEO_FILE_PORTAL_ACCESS_DENIED',
        });
      }

      // زيادة عدد المشاهدات بعد نجاح التحقق
      video.views += 1;
      await video.save();

      const fileBuffer = await storageService.getFile(
        video.fileId
      );

      res.setHeader(
        'Content-Type',
        video.fileId.mimeType || 'video/mp4'
      );

      res.setHeader(
        'Content-Length',
        fileBuffer.length
      );

      res.setHeader('Accept-Ranges', 'bytes');

      res.setHeader(
        'Cache-Control',
        'private, no-store, no-cache, must-revalidate'
      );

      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.setHeader(
        'Access-Control-Allow-Origin',
        '*'
      );

      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, OPTIONS'
      );

      res.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, X-Portal-Id, Range'
      );

      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(
          video.fileId.originalName
        )}"`
      );

      console.log(
        '✅ Library video streamed successfully:',
        video._id,
        '| Portal:',
        portalId
      );

      return res.send(fileBuffer);
    }

    // ========================================================
    // إذا كان الفيديو يعتمد على رابط خارجي
    // ========================================================
    if (video.videoUrl) {
      video.views += 1;
      await video.save();

      return res.redirect(video.videoUrl);
    }

    return res.status(404).json({
      success: false,
      message: 'Video file not found',
      code: 'VIDEO_FILE_NOT_FOUND',
    });
  } catch (error) {
    console.error('❌ Error in streamVideo:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to stream video',
      });
    }

    res.end();
  }
};

// ============================================================
// ✅ الحصول على إحصائيات مكتبة الفيديوهات
// ============================================================
export const getVideoStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    const [total, published, featured, byCategory] = await Promise.all([
      VideoLibrary.countDocuments({ portalId, isDeleted: { $ne: true } }),
      VideoLibrary.countDocuments({ portalId, isDeleted: { $ne: true }, isPublished: true }),
      VideoLibrary.countDocuments({ portalId, isDeleted: { $ne: true }, isFeatured: true }),
      VideoLibrary.aggregate([
        { $match: { portalId, isDeleted: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalViews = await VideoLibrary.aggregate([
      { $match: { portalId, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        published,
        featured,
        categories: byCategory,
        totalViews: totalViews[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('❌ Error in getVideoStats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================
export default {
  addVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  streamVideo,
  getVideoStats,
};