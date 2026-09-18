// backend/src/controllers/video.controller.js
import { Video } from '../models/Video.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { streamService } from '../services/stream.service.js';
import thumbnailService from '../services/thumbnail.service.js';
import storageService from '../services/storage.service.js';
import multer from 'multer';

// إعداد multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB للفيديوهات
  },
});

// ============================================================
// ✅ رفع فيديو جديد (مع استخراج الصورة المصغرة تلقائياً)
// ============================================================
export const uploadVideo = async (req, res) => {
  try {
    const portalId = req.portal?._id || req.portalId;
    const userId = req.accountId || req.user?.id;

    const {
      title,
      titleAr,
      description,
      descriptionAr,
      instructor,
      universityId,
      collegeId,
      specialtyId,
      materialId,
      isEncrypted,
      isPublished,
      order,
    } = req.body;

    // ============================================================
    // التحقق من المدخلات
    // ============================================================
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    console.log('🎬 Upload video:');
    console.log('  - Original name:', req.file.originalname);
    console.log('  - Size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('  - MIME:', req.file.mimetype);
    console.log('  - Portal:', portalId);
    console.log('  - Account:', userId);

    // ============================================================
    // 1. رفع الفيديو إلى R2
    // ============================================================
    const videoFile = await storageService.uploadFile(
      req.file,
      portalId,
      userId,
      'video',
      null,
      {
        title: title || '',
        instructor: instructor || '',
        originalName: req.file.originalname,
      }
    );

    console.log('✅ Video uploaded to R2:', videoFile.file._id);

    // ============================================================
    // 2. استخراج الصورة المصغرة
    // ============================================================
    let thumbnailFileId = null;
    let thumbnailError = null;

    try {
      console.log('🎬 Extracting thumbnail...');
      const startTime = Date.now();

      const thumbnailFile = await thumbnailService.extractAndUpload(
        req.file.buffer,
        portalId,
        userId,
        {
          width: 640,
          height: 360,
        }
      );

      thumbnailFileId = thumbnailFile._id;
      const duration = Date.now() - startTime;
      console.log(
        `✅ Thumbnail extracted and uploaded in ${duration}ms:`,
        thumbnailFileId
      );
    } catch (thumbError) {
      thumbnailError = thumbError.message;
      console.warn(
        '⚠️ Thumbnail extraction failed (non-blocking):',
        thumbError.message
      );
      // ✅ لا نوقف العملية — نكمل بدون صورة مصغرة
    }

    // ============================================================
    // 3. حفظ الفيديو في قاعدة البيانات
    // ============================================================
    const video = new Video({
      portalId,
      universityId,
      collegeId,
      specialtyId,
      materialId,
      title: title || '',
      titleAr: titleAr || title || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      instructor: instructor || '',
      videoUrl: videoFile.file._id.toString(), // ← fileId للفيديو
      thumbnail: thumbnailFileId ? thumbnailFileId.toString() : '', // ← fileId للصورة
      duration: 0,
      isEncrypted: isEncrypted === 'true' || isEncrypted === true,
      isPublished: isPublished !== 'false' && isPublished !== false,
      order: parseInt(order) || 0,
      createdBy: userId,
    });

    await video.save();

    console.log('✅ Video saved to DB:', video._id);

    res.status(201).json({
      success: true,
      message: thumbnailFileId
        ? 'Video uploaded successfully with thumbnail'
        : 'Video uploaded successfully (thumbnail failed)',
      data: {
        video,
        thumbnailGenerated: !!thumbnailFileId,
        thumbnailError: thumbnailError || null,
      },
    });
  } catch (error) {
    console.error('❌ Upload video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload video',
    });
  }
};

// ============================================================
// ✅ الحصول على فيديو للتشغيل
// ============================================================
export const getVideoForPlayback = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portal?._id || req.portalId;
    const userId = req.accountId || req.user?.id;

    // البحث عن الفيديو
    const video = await Video.findOne({
      _id: id,
      portalId,
      isPublished: true,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // التحقق من الصلاحية
    const subscription = await Subscription.findOne({
      portalId,
      accountId: userId,
      status: 'active',
    });

    const canView = video.canView
      ? video.canView(req.user, subscription)
      : true;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this video',
        code: 'ACCESS_DENIED',
      });
    }

    // زيادة عدد المشاهدات
    video.views = (video.views || 0) + 1;
    await video.save();

    // الحصول على رابط التشغيل
    let playbackUrl = null;

    // إذا كان videoUrl هو fileId (24 hex)
    if (video.videoUrl && /^[0-9a-fA-F]{24}$/.test(video.videoUrl)) {
      const protocol =
        req.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
        req.protocol ||
        'https';
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      playbackUrl = `${baseUrl}/api/files/${video.videoUrl}/stream-secure?portalId=${encodeURIComponent(
        portalId.toString()
      )}`;
    } else {
      playbackUrl = video.videoUrl;
    }

    // ✅ رابط الصورة المصغرة
    let thumbnailUrl = null;

    if (video.thumbnail && /^[0-9a-fA-F]{24}$/.test(video.thumbnail)) {
      const protocol =
        req.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
        req.protocol ||
        'https';
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      thumbnailUrl = `${baseUrl}/api/files/${video.thumbnail}/download-direct?portalId=${encodeURIComponent(
        portalId.toString()
      )}`;
    } else if (video.thumbnail) {
      thumbnailUrl = video.thumbnail;
    }

    res.status(200).json({
      success: true,
      data: {
        video: {
          id: video._id,
          title: video.title,
          titleAr: video.titleAr,
          description: video.description,
          descriptionAr: video.descriptionAr,
          thumbnail: thumbnailUrl, // ✅ رابط الصورة
          duration: video.duration,
          accessType: video.accessType,
          views: video.views,
          instructor: video.instructor,
        },
        playbackUrl,
        streamUid: video.streamUid,
        isLive: video.isLive || false,
      },
    });
  } catch (error) {
    console.error('❌ Get video playback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get video',
    });
  }
};

// ============================================================
// ✅ جلب جميع الفيديوهات
// ============================================================
// ============================================================
// ✅ إدارة الفيديوهات
// ============================================================

export const getVideos = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.query.portalId || req.portal?._id;
    const { materialId, isPublished } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = { portalId, isDeleted: { $ne: true } };
    if (materialId) query.materialId = materialId;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const videos = await Video.find(query)
      .populate('universityId', 'name nameAr')
      .populate('collegeId', 'name nameAr')
      .populate('specialtyId', 'name nameAr code')
      .populate('materialId', 'name nameAr code')
      .populate('createdBy', 'profile.fullName')
      .sort({ order: 1, createdAt: -1 });

    const protocol =
      req.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
      req.protocol ||
      'https';

    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const videosWithUrls = videos.map(video => {
      const videoObj = video.toObject();

      // Video URL
      if (video.videoUrl && video.videoUrl.match(/^[0-9a-fA-F]{24}$/)) {
        videoObj.videoUrl = `${baseUrl}/api/files/${video.videoUrl}/stream-secure?portalId=${encodeURIComponent(portalId.toString())}`;
      } else if (video.videoUrl) {
        videoObj.videoUrl = video.videoUrl;
      } else {
        videoObj.videoUrl = null;
      }

      videoObj.hasValidUrl = !!videoObj.videoUrl;

      // ✅ Thumbnail URL
      let finalThumbnail = null;

      if (videoObj.thumbnail && videoObj.thumbnail.trim() !== '') {
        const raw = videoObj.thumbnail.trim();

        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          finalThumbnail = raw;
        } else if (/^[0-9a-fA-F]{24}$/.test(raw)) {
          finalThumbnail = `${baseUrl}/api/files/thumbnail/${raw}?portalId=${encodeURIComponent(portalId.toString())}`;
        } else {
          finalThumbnail = `${baseUrl}/${raw.replace(/^\/+/, '')}`;
        }
      }

      if (!finalThumbnail) {
        finalThumbnail = '/default-thumbnail.svg';
      }

      videoObj.thumbnail = finalThumbnail;
      videoObj.hasThumbnail = !!finalThumbnail;
      videoObj.views = Number(videoObj.views) || 0;
      videoObj.duration = Number(videoObj.duration) || 0;

      return videoObj;
    });

    res.status(200).json({
      success: true,
      data: videosWithUrls,
    });
  } catch (error) {
    console.error('❌ Get videos error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get videos',
    });
  }
};

// ============================================================
// ✅ حذف فيديو
// ============================================================
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portal?._id || req.portalId;

    const video = await Video.findOne({ _id: id, portalId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // حذف من Cloudflare Stream (إن وُجد)
    if (video.streamUid) {
      try {
        await streamService.deleteVideo(video.streamUid);
      } catch (err) {
        console.warn('⚠️ Failed to delete from Stream:', err.message);
      }
    }

    // حذف منطقي
    video.isPublished = false;
    video.isDeleted = true;
    await video.save();

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete video',
    });
  }
};

// ============================================================
// ✅ إنشاء بث مباشر
// ============================================================
export const createLiveStream = async (req, res) => {
  try {
    const portalId = req.portal?._id || req.portalId;
    const userId = req.accountId || req.user?.id;

    const {
      title,
      titleAr,
      description,
      descriptionAr,
      materialId,
      accessType = 'subscription',
      startTime,
      endTime,
      recording = true,
    } = req.body;

    const liveResult = await streamService.createLiveStream({
      metadata: {
        title,
        portalId: portalId.toString(),
        createdBy: userId,
      },
      recording,
    });

    const video = new Video({
      portalId,
      title,
      titleAr,
      description,
      descriptionAr,
      streamUid: liveResult.uid,
      streamUrl: liveResult.playbackUrl,
      isLive: true,
      liveStreamUid: liveResult.uid,
      liveSchedule: {
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        isRecording: recording,
      },
      accessType,
      materialId: materialId || null,
      isPublished: true,
      createdBy: userId,
      processingStatus: 'ready',
    });

    await video.save();

    res.status(201).json({
      success: true,
      message: 'Live stream created successfully',
      data: {
        video,
        rtmpUrl: liveResult.rtmpUrl,
        rtmpKey: liveResult.rtmpKey,
        playbackUrl: liveResult.playbackUrl,
      },
    });
  } catch (error) {
    console.error('❌ Create live stream error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create live stream',
    });
  }
};

// ============================================================
// ✅ الحصول على معلومات البث المباشر
// ============================================================
export const getLiveStreamInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portal?._id || req.portalId;

    const video = await Video.findOne({
      _id: id,
      portalId,
      isLive: true,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    const liveInfo = await streamService.getLiveStreamInfo(
      video.liveStreamUid || video.streamUid
    );

    res.status(200).json({
      success: true,
      data: {
        video,
        liveInfo,
      },
    });
  } catch (error) {
    console.error('❌ Get live stream info error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get live stream info',
    });
  }
};

// ============================================================
// ✅ زيادة عدد المشاهدات
// ============================================================
export const incrementVideoViews = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portal?._id || req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    const video = await Video.findOneAndUpdate(
      {
        _id: id,
        portalId,
        isDeleted: { $ne: true },
      },
      {
        $inc: { views: 1 },
      },
      {
        new: true,
      }
    ).select('views');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    return res.status(200).json({
      success: true,
      views: video.views,
    });
  } catch (error) {
    console.error('❌ Increment video views error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update video views',
      error: error.message,
    });
  }
};
export const getThumbnailPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.query.portalId || req.headers['x-portal-id'];

    if (!portalId) {
      return res.status(400).json({ success: false, message: 'portalId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }

    const file = await File.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
      category: 'thumbnail',
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'Thumbnail not found' });
    }

    const { stream, contentLength } = await storageService.getFileStream(file);

    res.setHeader('Content-Type', file.mimeType || 'image/jpeg');
    res.setHeader('Content-Length', contentLength || file.size);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.writeHead(204).end();

    stream.on('error', (error) => {
      if (!res.headersSent) res.status(500).end();
      else res.destroy(error);
    });

    stream.pipe(res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================
export default {
  uploadVideo,
  getVideoForPlayback,
  getVideos,
  deleteVideo,
  createLiveStream,
  getLiveStreamInfo,
  incrementVideoViews,
  getThumbnailPublic,
};