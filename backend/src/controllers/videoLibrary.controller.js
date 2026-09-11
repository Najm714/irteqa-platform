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
    const portalId = req.portalId || req.headers['x-portal-id'];
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
    const portalId = req.portalId || req.headers['x-portal-id'];
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
    const portalId = req.portalId || req.headers['x-portal-id'];

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
    const portalId = req.portalId || req.headers['x-portal-id'];
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
    const portalId = req.portalId || req.headers['x-portal-id'];
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
// ✅ تشغيل/تحميل فيديو من المكتبة (مُصلح)
// ============================================================
export const streamVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.headers['x-portal-id'] || req.query.portalId;
    
    console.log('🎬 Streaming library video:', id);
    console.log('  - Portal:', portalId);
    
    // ✅ الحصول على التوكن من Query String
    const tokenFromQuery = req.query.token;
    let account = null;
    
    if (tokenFromQuery) {
      try {
        const decoded = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via query token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from query invalid:', err.message);
      }
    }
    
    // ✅ إذا لم يتم العثور على حساب من التوكن، استخدم req.account
    if (!account) {
      account = req.account;
    }

    if (!account) {
      console.log('❌ No account found, unauthorized');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
        code: 'NO_TOKEN',
      });
    }

    // ✅ البحث عن الفيديو
    const video = await VideoLibrary.findOne({ 
      _id: id, 
      isDeleted: { $ne: true } 
    }).populate('fileId');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in library',
      });
    }

    // ✅ التحقق من البوابة
    const accountPortalId = account.portalId?.toString() || account.portalId;
    if (video.portalId.toString() !== (portalId || accountPortalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Invalid portal',
      });
    }

    if (!video.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'This video is not available',
      });
    }

    // ✅ التحقق من الصلاحية
    const subscription = await Subscription.findOne({
      portalId: video.portalId,
      accountId: account._id,
      status: 'active',
    });

    if (!video.canView(account, subscription)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this video',
        code: 'ACCESS_DENIED',
      });
    }

    // ✅ زيادة عدد المشاهدات
    video.views += 1;
    await video.save();

    // ✅ إذا كان هناك fileId، استخدم التخزين
    if (video.fileId) {
      const fileBuffer = await storageService.getFile(video.fileId);
      
      res.setHeader('Content-Type', video.fileId.mimeType || 'video/mp4');
      res.setHeader('Content-Length', video.fileId.size);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(video.fileId.originalName)}"`);
      
      return res.send(fileBuffer);
    }

    // ✅ إذا كان هناك videoUrl
    if (video.videoUrl) {
      return res.redirect(video.videoUrl);
    }

    return res.status(404).json({
      success: false,
      message: 'Video file not found',
    });
  } catch (error) {
    console.error('❌ Error in streamVideo:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================================
// ✅ الحصول على إحصائيات مكتبة الفيديوهات
// ============================================================
export const getVideoStats = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'];

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