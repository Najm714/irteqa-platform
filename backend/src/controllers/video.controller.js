// src/controllers/video.controller.js
import { Video } from '../models/Video.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { streamService } from '../services/stream.service.js';
import multer from 'multer';

// إعداد multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB للفيديوهات
  },
});

// ✅ رفع فيديو جديد
export const uploadVideo = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const {
      title,
      titleAr,
      description,
      descriptionAr,
      category,
      categoryAr,
      subject,
      subjectAr,
      materialId,
      accessType = 'free',
      isPublished = true,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    // رفع الفيديو إلى Cloudflare Stream
    const uploadResult = await streamService.uploadVideo(
      req.file.buffer,
      req.file.originalname,
      {
        contentType: req.file.mimetype,
        metadata: {
          title: title,
          portalId: portalId.toString(),
          uploadedBy: userId,
        },
        requireSignedURLs: accessType !== 'free',
      }
    );

    // حفظ في قاعدة البيانات
    const video = new Video({
      portalId,
      title,
      titleAr,
      description,
      descriptionAr,
      streamUid: uploadResult.uid,
      streamUrl: uploadResult.url,
      thumbnail: uploadResult.thumbnail,
      duration: uploadResult.duration,
      processingStatus: uploadResult.ready ? 'ready' : 'processing',
      category,
      categoryAr,
      subject,
      subjectAr,
      materialId: materialId || null,
      accessType,
      isPublished,
      createdBy: userId,
    });

    await video.save();

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        video,
        streamUid: uploadResult.uid,
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

// ✅ الحصول على فيديو للتشغيل
export const getVideoForPlayback = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;
    const { id: userId } = req.user;

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

    const canView = video.canView(req.user, subscription);

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this video',
        code: 'ACCESS_DENIED',
      });
    }

    // زيادة عدد المشاهدات
    video.views += 1;
    await video.save();

    // الحصول على رابط التشغيل
    let playbackUrl = video.streamUrl;

    // إذا كان الفيديو مدفوع، استخدم Signed URL
    if (video.accessType === 'subscription' || video.accessType === 'private') {
      const signedToken = await streamService.getSignedUrl(video.streamUid, 3600);
      if (signedToken) {
        playbackUrl = `${video.streamUrl}?token=${signedToken}`;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        video: {
          id: video._id,
          title: video.title,
          titleAr: video.titleAr,
          description: video.description,
          thumbnail: video.thumbnail,
          duration: video.duration,
          accessType: video.accessType,
          views: video.views,
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

// ✅ جلب جميع الفيديوهات
export const getVideos = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const {
      category,
      materialId,
      accessType,
      limit = 20,
      page = 1,
    } = req.query;

    const query = {
      portalId,
      isPublished: true,
    };

    if (category) query.category = category;
    if (materialId) query.materialId = materialId;
    if (accessType) query.accessType = accessType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const videos = await Video.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('materialId', 'title code')
      .populate('createdBy', 'profile.fullName');

    const total = await Video.countDocuments(query);

    // تصفية حسب صلاحية المستخدم
    const subscription = await Subscription.findOne({
      portalId,
      accountId: req.user.id,
      status: 'active',
    });

    const filteredVideos = videos.map(video => ({
      ...video.toObject(),
      canView: video.canView(req.user, subscription),
    }));

    res.status(200).json({
      success: true,
      data: filteredVideos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get videos error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get videos',
    });
  }
};

// ✅ حذف فيديو
export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;

    const video = await Video.findOne({ _id: id, portalId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }

    // حذف من Cloudflare Stream
    await streamService.deleteVideo(video.streamUid);

    // حذف من قاعدة البيانات (منطقي)
    video.isPublished = false;
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

// ✅ إنشاء بث مباشر
export const createLiveStream = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
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

    // إنشاء البث في Cloudflare Stream
    const liveResult = await streamService.createLiveStream({
      metadata: {
        title,
        portalId: portalId.toString(),
        createdBy: userId,
      },
      recording,
    });

    // حفظ في قاعدة البيانات
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

// ✅ الحصول على معلومات البث المباشر
export const getLiveStreamInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;

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

    const liveInfo = await streamService.getLiveStreamInfo(video.liveStreamUid || video.streamUid);

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