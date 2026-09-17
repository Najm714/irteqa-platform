// src/controllers/content.controller.js
import { Content } from '../models/Content.model.js';
import { Video } from '../models/Video.model.js';
import { Summary } from '../models/Summary.model.js';
import { Subscription } from '../models/Subscription.model.js';

// ✅ جلب المحتوى حسب البوابة والتصنيف
export const getContent = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { category, subject, accessType, limit = 20, page = 1 } = req.query;

    const query = {
      portalId,
      isPublished: true,
    };

    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (accessType) query.accessType = accessType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const content = await Content.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'profile.fullName')
      .populate('attachments.fileId', 'originalName size');

    const total = await Content.countDocuments(query);

    // ✅ تصفية المحتوى حسب صلاحية المستخدم
    const filteredContent = await filterContentByAccess(content, req.user);

    res.status(200).json({
      success: true,
      data: filteredContent,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get content error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get content',
    });
  }
};

// ✅ جلب محتوى واحد
export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;

    const content = await Content.findOne({
      _id: id,
      portalId,
      isPublished: true,
    })
    .populate('createdBy', 'profile.fullName')
    .populate('attachments.fileId', 'originalName size');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // ✅ التحقق من صلاحية الوصول
    const hasAccess = await checkContentAccess(content, req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this content',
      });
    }

    // ✅ زيادة عدد المشاهدات
    content.views += 1;
    await content.save();

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('❌ Get content by id error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get content',
    });
  }
};

// ✅ جلب الفيديوهات
// ============================================================
// ✅ جلب الفيديوهات (مع روابط الصور والفيديو)
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

    // ✅ بناء baseUrl
    const protocol =
      req.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
      req.protocol ||
      'https';

    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // ✅ معالجة كل فيديو
    const videosWithUrls = videos.map((video) => {
      const videoObj = video.toObject();

      // ============================================================
      // VIDEO URL
      // ============================================================
      let finalVideoUrl = null;

      if (
        typeof videoObj.videoUrl === 'string' &&
        videoObj.videoUrl.trim() !== ''
      ) {
        const raw = videoObj.videoUrl.trim();

        // رابط كامل
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          finalVideoUrl = raw;
        }
        // fileId (24 hex)
        else if (/^[0-9a-fA-F]{24}$/.test(raw)) {
          finalVideoUrl =
            `${baseUrl}/api/files/${raw}/stream-secure` +
            `?portalId=${encodeURIComponent(portalId.toString())}`;
        }
        // مسار آخر
        else {
          finalVideoUrl = `${baseUrl}/api/files/${raw}/download-direct`;
        }
      }

      // ============================================================
      // ✅ THUMBNAIL
      // ============================================================
      let finalThumbnail = null;

      if (
        typeof videoObj.thumbnail === 'string' &&
        videoObj.thumbnail.trim() !== ''
      ) {
        const raw = videoObj.thumbnail.trim();

        // رابط كامل
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
          finalThumbnail = raw;
        }
        // fileId (24 hex) — الحالة الشائعة
        else if (/^[0-9a-fA-F]{24}$/.test(raw)) {
          finalThumbnail =
            `${baseUrl}/api/files/${raw}/download-direct` +
            `?portalId=${encodeURIComponent(portalId.toString())}`;
        }
        // مسار محلي
        else {
          finalThumbnail = `${baseUrl}/${raw.replace(/^\/+/, '')}`;
        }
      }

      // ✅ صورة افتراضية
      if (!finalThumbnail) {
        finalThumbnail = '/default-thumbnail.svg';
      }

      // ============================================================
      // VIEWS
      // ============================================================
      const views = Number.isFinite(Number(videoObj.views))
        ? Number(videoObj.views)
        : 0;

      // ============================================================
      // DURATION
      // ============================================================
      const duration = Number.isFinite(Number(videoObj.duration))
        ? Number(videoObj.duration)
        : 0;

      return {
        ...videoObj,
        videoUrl: finalVideoUrl,
        thumbnail: finalThumbnail,
        views,
        duration,
        hasValidUrl: Boolean(finalVideoUrl),
        hasThumbnail: Boolean(finalThumbnail),
      };
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

// ✅ جلب الملخصات
export const getSummaries = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { category, subject, materialId, limit = 20, page = 1 } = req.query;

    const query = {
      portalId,
      isPublished: true,
    };

    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (materialId) query.materialId = materialId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const summaries = await Summary.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'profile.fullName')
      .populate('summaryFile', 'originalName size');

    const total = await Summary.countDocuments(query);

    // ✅ تصفية الملخصات حسب صلاحية المستخدم
    const filteredSummaries = await filterContentByAccess(summaries, req.user);

    res.status(200).json({
      success: true,
      data: filteredSummaries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get summaries error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get summaries',
    });
  }
};

// ✅ إنشاء محتوى جديد (للمشرفين)
export const createContent = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;

    const contentData = {
      ...req.body,
      portalId,
      createdBy: userId,
    };

    const content = new Content(contentData);
    await content.save();

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content,
    });
  } catch (error) {
    console.error('❌ Create content error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create content',
    });
  }
};

// ✅ تحديث محتوى (للمشرفين)
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;

    const content = await Content.findOne({ _id: id, portalId });
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    Object.assign(content, req.body);
    await content.save();

    res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      data: content,
    });
  } catch (error) {
    console.error('❌ Update content error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update content',
    });
  }
};

// ✅ حذف محتوى (للمشرفين)
export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;

    const content = await Content.findOne({ _id: id, portalId });
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // ✅ حذف منطقي (soft delete)
    content.isPublished = false;
    await content.save();

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete content error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete content',
    });
  }
};

// ===== دوال مساعدة =====

// ✅ التحقق من صلاحية الوصول للمحتوى
const checkContentAccess = async (content, user) => {
  if (!user) return content.accessType === 'free' || content.accessType === 'trial';

  if (content.accessType === 'free' || content.accessType === 'trial') {
    return true;
  }

  if (content.accessType === 'private') {
    return user.role === 'portal_admin' || user.role === 'super_admin';
  }

  if (content.accessType === 'subscription') {
    // التحقق من وجود اشتراك نشط
    const subscription = await Subscription.findOne({
      accountId: user.id,
      portalId: content.portalId,
      status: 'active',
      'planIds': { $in: content.subscriptionPlanIds || [] },
      endDate: { $gt: new Date() },
    });
    return !!subscription;
  }

  return false;
};

// ✅ تصفية المحتوى حسب صلاحية المستخدم
const filterContentByAccess = async (contentList, user) => {
  const filtered = [];
  for (const item of contentList) {
    const hasAccess = await checkContentAccess(item, user);
    if (hasAccess) {
      filtered.push(item);
    }
  }
  return filtered;
};