// backend/src/controllers/liveStream.controller.js
import { Video } from '../models/Video.model.js';
import { Account } from '../models/Account.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Material } from '../models/Material.model.js';
import { streamService } from '../services/stream.service.js';
import { getNotificationService } from '../services/notification.service.js';

// ============================================================
// ✅ إنشاء بث مباشر جديد (للمدير)
// ============================================================
export const createLiveStream = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId;
    const {
      title,
      titleAr,
      description = '',
      descriptionAr = '',
      instructor,
      materialId,
      universityId,
      collegeId,
      specialtyId,
      scheduledAt,
      recording = true,
      accessType = 'subscription',
      thumbnail = '',
    } = req.body;

    // ✅ التحقق
    if (!title || !titleAr) {
      return res.status(400).json({
        success: false,
        message: 'العنوان مطلوب (بالإنجليزية والعربية)',
        code: 'TITLE_REQUIRED',
      });
    }

    if (!materialId) {
      return res.status(400).json({
        success: false,
        message: 'المادة مطلوبة',
        code: 'MATERIAL_REQUIRED',
      });
    }

    // ✅ التحقق من المادة
    const material = await Material.findOne({
      _id: materialId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'المادة غير موجودة',
        code: 'MATERIAL_NOT_FOUND',
      });
    }

    // ✅ إنشاء البث في Cloudflare
    const liveResult = await streamService.createLiveStream({
      metadata: {
        title,
        titleAr,
        portalId: portalId.toString(),
        instructor: instructor || '',
        materialId: materialId.toString(),
        createdBy: accountId.toString(),
      },
      recording,
      requireSignedURLs: accessType === 'private',
    });

    if (!liveResult.success) {
      throw new Error('Failed to create live stream');
    }

    console.log('✅ Live stream created in Cloudflare:', liveResult.uid);

    // ✅ إنشاء Video document
    const video = new Video({
      portalId,
      universityId,
      collegeId,
      specialtyId,
      materialId,
      title,
      titleAr,
      description,
      descriptionAr,
      instructor: instructor || 'غير محدد',
      
      isLive: true,
      liveStreamUid: liveResult.uid,
      liveRtmpUrl: liveResult.rtmpUrl,
      liveRtmpKey: liveResult.rtmpKey,
      livePlaybackUrl: liveResult.playbackUrl,
      liveStatus: 'idle',
      liveAccessType: accessType,
      liveRecording: {
        enabled: recording,
        videoUid: null,
        videoUrl: null,
      },
      liveSchedule: {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        startedAt: null,
        endedAt: null,
        duration: 0,
      },
      liveCreatedBy: accountId,
      liveViewers: 0,
      liveStats: {
        peakViewers: 0,
        totalViews: 0,
        totalWatchTime: 0,
      },
      
      videoUrl: '',
      thumbnail,
      duration: 0,
      isEncrypted: accessType !== 'public',
      isPublished: true,
      views: 0,
      createdBy: accountId,
    });

    await video.save();

    console.log('✅ Live video saved:', video._id);

    // ✅ إشعار المدير
    try {
      const notificationService = getNotificationService(req.app?.get('io'));
      await notificationService.sendNotification({
        portalId,
        accountId,
        type: 'system_alert',
        title: 'Live stream created',
        titleAr: 'تم إنشاء بث مباشر',
        message: `Live stream "${title}" created`,
        messageAr: `تم إنشاء بث مباشر "${titleAr}"`,
        data: { videoId: video._id },
        priority: 'high',
      });
    } catch (err) {
      console.warn('⚠️ Notification failed:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء البث المباشر بنجاح',
      data: {
        video,
        streaming: {
          rtmpUrl: liveResult.rtmpUrl,
          rtmpKey: liveResult.rtmpKey,
          srtUrl: liveResult.srtUrl,
          srtKey: liveResult.srtKey,
        },
        playbackUrl: liveResult.playbackUrl,
      },
    });
  } catch (error) {
    console.error('❌ Create live stream error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'فشل إنشاء البث المباشر',
    });
  }
};

// ============================================================
// ✅ جلب جميع البثوث المباشرة
// ============================================================
export const getLiveStreams = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { status, materialId } = req.query;

    const query = {
      portalId,
      isLive: true,
      isDeleted: { $ne: true },
    };

    if (status) query.liveStatus = status;
    if (materialId) query.materialId = materialId;

    const liveStreams = await Video.find(query)
      .populate('materialId', 'name nameAr code')
      .populate('liveCreatedBy', 'profile.fullName email')
      .sort({ 'liveSchedule.scheduledAt': -1, createdAt: -1 });

    // ✅ لا نرسل RTMP keys
    const sanitized = liveStreams.map((v) => {
      const obj = v.toObject();
      delete obj.liveRtmpKey;
      return obj;
    });

    res.status(200).json({
      success: true,
      data: sanitized,
    });
  } catch (error) {
    console.error('❌ Get live streams error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'فشل جلب البثوث المباشرة',
    });
  }
};

// ============================================================
// ✅ جلب بث محدد
// ============================================================
export const getLiveStreamById = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { id } = req.params;
    const accountId = req.accountId;

    const video = await Video.findOne({
      _id: id,
      portalId,
      isLive: true,
      isDeleted: { $ne: true },
    })
      .populate('materialId', 'name nameAr code price')
      .populate('liveCreatedBy', 'profile.fullName email');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'البث غير موجود',
        code: 'LIVE_STREAM_NOT_FOUND',
      });
    }

    // ✅ التحقق من الصلاحية
    const isOwner = video.liveCreatedBy?._id?.toString() === accountId?.toString();
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isAdmin && video.liveAccessType === 'subscription') {
      const subscription = await Subscription.findOne({
        portalId,
        accountId,
        materialId: video.materialId?._id,
        status: 'active',
        paymentStatus: 'paid',
        isDeleted: { $ne: true },
        endDate: { $gt: new Date() },
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'تحتاج اشتراكاً نشطاً لمشاهدة هذا البث',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }
    }

    const obj = video.toObject();

    // ✅ إخفاء RTMP key
    if (!isAdmin && !isOwner) {
      delete obj.liveRtmpKey;
    }

    res.status(200).json({
      success: true,
      data: obj,
    });
  } catch (error) {
    console.error('❌ Get live stream error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'فشل جلب البث',
    });
  }
};

// ============================================================
// ✅ جلب تفاصيل البث (من Cloudflare)
// ============================================================
export const getLiveStreamDetails = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { id } = req.params;
    const accountId = req.accountId;

    const video = await Video.findOne({
      _id: id,
      portalId,
      isLive: true,
      isDeleted: { $ne: true },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'البث غير موجود',
      });
    }

    const isOwner = video.liveCreatedBy?.toString() === accountId?.toString();
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح',
      });
    }

    // ✅ جلب من Cloudflare
    const cfInfo = await streamService.getLiveStreamInfo(video.liveStreamUid);

    res.status(200).json({
      success: true,
      data: {
        video,
        cloudflare: cfInfo,
      },
    });
  } catch (error) {
    console.error('❌ Get live details error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ بدء البث
// ============================================================
export const startLiveStream = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId;
    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      portalId,
      isLive: true,
      isDeleted: { $ne: true },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'البث غير موجود',
      });
    }

    const isOwner = video.liveCreatedBy?.toString() === accountId?.toString();
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح',
      });
    }

    if (video.liveStatus === 'live') {
      return res.status(400).json({
        success: false,
        message: 'البث يعمل بالفعل',
      });
    }

    // ✅ تحديث
    video.liveStatus = 'live';
    video.liveSchedule.startedAt = new Date();
    await video.save();

    // ✅ إشعار الجميع
    try {
      const notificationService = getNotificationService(req.app?.get('io'));
      const io = req.app?.get('io');

      // ✅ Socket.IO
      if (io) {
        io.to(`portal-${portalId}`).emit('live-started', {
          videoId: video._id,
          titleAr: video.titleAr,
          instructor: video.instructor,
          playbackUrl: video.livePlaybackUrl,
        });
      }

      // ✅ إشعار المشتركين
      const subscriptions = await Subscription.find({
        portalId,
        materialId: video.materialId,
        status: 'active',
        paymentStatus: 'paid',
        isDeleted: { $ne: true },
      }).select('accountId');

      for (const sub of subscriptions) {
        await notificationService.sendNotification({
          portalId,
          accountId: sub.accountId,
          type: 'system_alert',
          title: 'Live stream started',
          titleAr: 'بدأ البث المباشر',
          message: `Live stream "${video.title}" has started`,
          messageAr: `بدأ البث المباشر "${video.titleAr}"`,
          data: { videoId: video._id, url: `/live/${video._id}` },
          priority: 'high',
        });
      }

      console.log(`✅ Notified ${subscriptions.length} subscribers`);
    } catch (err) {
      console.warn('⚠️ Notification error:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'تم بدء البث بنجاح',
      data: video,
    });
  } catch (error) {
    console.error('❌ Start live stream error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'فشل بدء البث',
    });
  }
};

// ============================================================
// ✅ إنهاء البث
// ============================================================
export const endLiveStream = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId;
    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      portalId,
      isLive: true,
      isDeleted: { $ne: true },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'البث غير موجود',
      });
    }

    const isOwner = video.liveCreatedBy?.toString() === accountId?.toString();
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح',
      });
    }

    if (video.liveStatus !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'البث ليس قائماً',
      });
    }

    // ✅ إنهاء البث في Cloudflare
    try {
      await streamService.deleteLiveStream(video.liveStreamUid);
    } catch (err) {
      console.warn('⚠️ CF delete failed:', err.message);
    }

    // ✅ حساب المدة
    const startedAt = video.liveSchedule.startedAt;
    const endedAt = new Date();
    const duration = startedAt
      ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
      : 0;

    video.liveStatus = 'ended';
    video.liveSchedule.endedAt = endedAt;
    video.liveSchedule.duration = duration;
    video.liveViewers = 0;

    await video.save();

    // ✅ Socket.IO
    const io = req.app?.get('io');
    if (io) {
      io.to(`portal-${portalId}`).emit('live-ended', {
        videoId: video._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم إنهاء البث بنجاح',
      data: video,
    });
  } catch (error) {
    console.error('❌ End live stream error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'فشل إنهاء البث',
    });
  }
};

// ============================================================
// ✅ حذف بث
// ============================================================
export const deleteLiveStream = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      portalId,
      isLive: true,
      isDeleted: { $ne: true },
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'البث غير موجود',
      });
    }

    // ✅ حذف من Cloudflare إذا لم ينته
    if (video.liveStatus !== 'ended') {
      try {
        await streamService.deleteLiveStream(video.liveStreamUid);
      } catch (err) {
        console.warn('⚠️ CF delete failed:', err.message);
      }
    }

    video.isDeleted = true;
    video.deletedAt = new Date();
    video.deletedBy = req.accountId;
    await video.save();

    res.status(200).json({
      success: true,
      message: 'تم حذف البث بنجاح',
    });
  } catch (error) {
    console.error('❌ Delete live stream error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'فشل حذف البث',
    });
  }
};

// ============================================================
// ✅ تحديث عدد المشاهدين
// ============================================================
export const updateViewers = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['join', 'leave'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action يجب أن يكون join أو leave',
      });
    }

    const video = await Video.findById(id);

    if (!video || video.liveStatus !== 'live') {
      return res.status(404).json({
        success: false,
        message: 'البث غير نشط',
      });
    }

    if (action === 'join') {
      video.liveViewers = (video.liveViewers || 0) + 1;
      video.liveStats.totalViews = (video.liveStats.totalViews || 0) + 1;
      if (video.liveViewers > (video.liveStats.peakViewers || 0)) {
        video.liveStats.peakViewers = video.liveViewers;
      }
    } else {
      video.liveViewers = Math.max(0, (video.liveViewers || 0) - 1);
    }

    await video.save();

    // ✅ Socket.IO
    const io = req.app?.get('io');
    if (io) {
      io.to(`live-${video._id}`).emit('viewers-update', {
        videoId: video._id,
        viewers: video.liveViewers,
        peak: video.liveStats.peakViewers,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        viewers: video.liveViewers,
        peak: video.liveStats.peakViewers,
      },
    });
  } catch (error) {
    console.error('❌ Update viewers error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ حفظ رسالة دردشة
// ============================================================
export const saveLiveChatMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const accountId = req.accountId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'الرسالة مطلوبة',
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'الرسالة طويلة جداً (الحد 500 حرف)',
      });
    }

    const video = await Video.findById(id);

    if (!video || video.liveStatus !== 'live') {
      return res.status(404).json({
        success: false,
        message: 'البث غير نشط',
      });
    }

    // ✅ حفظ الرسالة (آخر 100 رسالة فقط)
    if (!video.liveChat) video.liveChat = [];
    
    video.liveChat.push({
      userId: accountId,
      userName: req.account?.profile?.fullName || 'مستخدم',
      message: message.trim(),
      timestamp: new Date(),
    });

    // ✅ الاحتفاظ بآخر 100 رسالة
    if (video.liveChat.length > 100) {
      video.liveChat = video.liveChat.slice(-100);
    }

    await video.save();

    res.status(200).json({
      success: true,
      data: video.liveChat[video.liveChat.length - 1],
    });
  } catch (error) {
    console.error('❌ Save chat message error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب رسائل الدردشة
// ============================================================
export const getLiveChat = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id).select('liveChat');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'البث غير موجود',
      });
    }

    res.status(200).json({
      success: true,
      data: video.liveChat || [],
    });
  } catch (error) {
    console.error('❌ Get chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ إحصائيات البث
// ============================================================
export const getLiveStats = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { id } = req.params;

    const video = await Video.findOne({
      _id: id,
      portalId,
      isLive: true,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'البث غير موجود',
      });
    }

    const now = new Date();
    const startedAt = video.liveSchedule.startedAt;
    const currentDuration = startedAt
      ? Math.floor((now.getTime() - startedAt.getTime()) / 1000)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        status: video.liveStatus,
        viewers: video.liveViewers,
        peakViewers: video.liveStats.peakViewers,
        totalViews: video.liveStats.totalViews,
        duration: currentDuration,
        scheduledAt: video.liveSchedule.scheduledAt,
        startedAt: video.liveSchedule.startedAt,
        endedAt: video.liveSchedule.endedAt,
      },
    });
  } catch (error) {
    console.error('❌ Get live stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تصدير
// ============================================================
export default {
  createLiveStream,
  getLiveStreams,
  getLiveStreamById,
  getLiveStreamDetails,
  startLiveStream,
  endLiveStream,
  deleteLiveStream,
  updateViewers,
  saveLiveChatMessage,
  getLiveChat,
  getLiveStats,
};