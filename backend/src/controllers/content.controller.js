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
export const getVideos = async (req, res) => {
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

    const videos = await Video.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'profile.fullName');

    const total = await Video.countDocuments(query);

    // ✅ تصفية الفيديوهات حسب صلاحية المستخدم
    const filteredVideos = await filterContentByAccess(videos, req.user);

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