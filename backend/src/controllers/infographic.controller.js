// backend/src/controllers/infographic.controller.js
import { Infographic } from '../models/infographic.model.js';
import { File } from '../models/File.model.js';
import storageService from '../services/storage.service.js';

// ============================================================
// ✅ إضافة إنفوجرافيك
// ============================================================
export const addInfographic = async (req, res) => {
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
      category,
      categoryAr,
      tags,
      isPublished,
      isFeatured,
      order,
    } = req.body;

    console.log('📤 Adding infographic...');
    console.log('  - Portal:', portalId);
    console.log('  - Title:', title);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required',
      });
    }

    // ✅ التحقق من وجود الملف
    const file = await File.findOne({ _id: fileId, portalId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Infographic file not found',
      });
    }

    // ✅ التحقق من وجود الصورة المصغرة
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

    // ✅ التحقق من عدم التكرار
    const existing = await Infographic.findOne({ portalId, fileId, isDeleted: { $ne: true } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This infographic is already in the library',
      });
    }

    const infographic = new Infographic({
      portalId,
      fileId,
      thumbnailId: thumbnailId || null,
      title: title || file.originalName,
      titleAr: titleAr || file.originalName,
      description: description || '',
      descriptionAr: descriptionAr || '',
      category: category || 'educational',
      categoryAr: categoryAr || 'تعليمي',
      tags: tags || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      isFeatured: isFeatured || false,
      order: order || 0,
      createdBy: accountId,
    });

    await infographic.save();

    // ✅ جلب البيانات الكاملة
    const populated = await Infographic.findById(infographic._id)
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('thumbnailId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    console.log('✅ Infographic added:', infographic._id);

    res.status(201).json({
      success: true,
      data: populated,
      message: 'تم إضافة الإنفوجرافيك بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in addInfographic:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب جميع الإنفوجرافيك
// ============================================================
export const getInfographics = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { category, search, isPublished, isFeatured, page = 1, limit = 20 } = req.query;

    console.log('📤 Fetching infographics for portal:', portalId);

    const query = { portalId, isDeleted: { $ne: true } };
    if (category) query.category = category;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let infographicsQuery = Infographic.find(query)
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('thumbnailId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName')
      .sort({ isFeatured: -1, order: 1, createdAt: -1 });

    if (search) {
      infographicsQuery = infographicsQuery.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { titleAr: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { descriptionAr: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const [infographics, total] = await Promise.all([
      infographicsQuery.skip(skip).limit(parseInt(limit)),
      Infographic.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: infographics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getInfographics:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب إنفوجرافيك محدد
// ============================================================
export const getInfographicById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const infographic = await Infographic.findOne({ _id: id, portalId, isDeleted: { $ne: true } })
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('thumbnailId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    if (!infographic) {
      return res.status(404).json({
        success: false,
        message: 'Infographic not found',
      });
    }

    // ✅ زيادة عدد المشاهدات
    infographic.views += 1;
    await infographic.save();

    res.json({
      success: true,
      data: infographic,
    });
  } catch (error) {
    console.error('❌ Error in getInfographicById:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================================
// ✅ تحديث إنفوجرافيك
// ============================================================
export const updateInfographic = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const updates = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const infographic = await Infographic.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!infographic) {
      return res.status(404).json({
        success: false,
        message: 'Infographic not found',
      });
    }

    // ========================================================
    // التحقق من thumbnailId الجديد
    // يجب أن يكون الملف تابعًا لنفس الـ Portal
    // ========================================================
    if (updates.thumbnailId !== undefined) {
      if (updates.thumbnailId === null || updates.thumbnailId === '') {
        infographic.thumbnailId = null;
      } else {
        const thumbnail = await File.findOne({
          _id: updates.thumbnailId,
          portalId,
          isDeleted: { $ne: true },
        });

        if (!thumbnail) {
          return res.status(403).json({
            success: false,
            message:
              'Thumbnail file is not authorized for this portal.',
            code: 'THUMBNAIL_PORTAL_ACCESS_DENIED',
          });
        }

        infographic.thumbnailId = thumbnail._id;
      }
    }

    const allowedFields = [
      'title',
      'titleAr',
      'description',
      'descriptionAr',
      'category',
      'categoryAr',
      'tags',
      'isPublished',
      'isFeatured',
      'order',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        infographic[field] = updates[field];
      }
    }

    infographic.updatedAt = new Date();

    await infographic.save();

    const populated = await Infographic.findOne({
      _id: infographic._id,
      portalId,
      isDeleted: { $ne: true },
    })
      .populate('fileId', 'originalName size mimeType storageKey portalId')
      .populate(
        'thumbnailId',
        'originalName size mimeType storageKey portalId'
      )
      .populate('createdBy', 'profile.fullName');

    res.json({
      success: true,
      data: populated,
      message: 'تم تحديث الإنفوجرافيك بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in updateInfographic:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update infographic',
    });
  }
};

// ============================================================
// ✅ حذف إنفوجرافيك
// ============================================================
export const deleteInfographic = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;

    const infographic = await Infographic.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!infographic) {
      return res.status(404).json({
        success: false,
        message: 'Infographic not found',
      });
    }

    infographic.isDeleted = true;
    infographic.deletedAt = new Date();
    infographic.deletedBy = accountId;
    await infographic.save();

    res.json({
      success: true,
      message: 'تم حذف الإنفوجرافيك بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in deleteInfographic:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const viewInfographic = async (req, res) => {
  try {
    const { id } = req.params;
    const account = req.account;
    const portalId = req.portalId;

    console.log('🖼️ Viewing infographic:', id);
    console.log(
      '  - Account:',
      account?._id,
      '| Role:',
      account?.role,
      '| Portal:',
      portalId
    );

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const infographic = await Infographic.findOne({
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

    if (!infographic) {
      return res.status(404).json({
        success: false,
        message: 'Infographic not found',
      });
    }

    if (!infographic.fileId) {
      return res.status(404).json({
        success: false,
        message: 'Infographic file not found in this portal',
        code: 'INFOGRAPHIC_FILE_NOT_FOUND',
      });
    }

    if (!infographic.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'This infographic is not available',
      });
    }

    infographic.views += 1;
    await infographic.save();

    const fileBuffer = await storageService.getFile(
      infographic.fileId
    );

    res.setHeader(
      'Content-Type',
      infographic.fileId.mimeType || 'image/png'
    );

    res.setHeader(
      'Content-Length',
      infographic.fileId.size
    );

    res.setHeader(
      'Cache-Control',
      'private, no-store, no-cache, must-revalidate'
    );

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(
        infographic.fileId.originalName
      )}"`
    );

    return res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Error in viewInfographic:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to view infographic',
    });
  }
};
export const downloadInfographic = async (req, res) => {
  try {
    const { id } = req.params;
    const account = req.account;
    const portalId = req.portalId;

    console.log('📥 Downloading infographic:', id);
    console.log(
      '  - Account:',
      account?._id,
      '| Role:',
      account?.role,
      '| Portal:',
      portalId
    );

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const infographic = await Infographic.findOne({
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

    if (!infographic) {
      return res.status(404).json({
        success: false,
        message: 'Infographic not found',
      });
    }

    if (!infographic.fileId) {
      return res.status(404).json({
        success: false,
        message: 'Infographic file not found in this portal',
        code: 'INFOGRAPHIC_FILE_NOT_FOUND',
      });
    }

    if (!infographic.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'This infographic is not available',
      });
    }

    infographic.downloads += 1;
    await infographic.save();

    const fileBuffer = await storageService.getFile(
      infographic.fileId
    );

    res.setHeader(
      'Content-Type',
      infographic.fileId.mimeType || 'image/png'
    );

    res.setHeader(
      'Content-Length',
      infographic.fileId.size
    );

    res.setHeader(
      'Cache-Control',
      'private, no-store, no-cache, must-revalidate'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(
        infographic.fileId.originalName
      )}"`
    );

    return res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Error in downloadInfographic:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to download infographic',
    });
  }
};

// ============================================================
// ✅ الحصول على إحصائيات الإنفوجرافيك
// ============================================================
export const getInfographicStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    const [total, published, featured, byCategory] = await Promise.all([
      Infographic.countDocuments({ portalId, isDeleted: { $ne: true } }),
      Infographic.countDocuments({ portalId, isDeleted: { $ne: true }, isPublished: true }),
      Infographic.countDocuments({ portalId, isDeleted: { $ne: true }, isFeatured: true }),
      Infographic.aggregate([
        { $match: { portalId, isDeleted: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalViews = await Infographic.aggregate([
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
    console.error('❌ Error in getInfographicStats:', error);
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
  addInfographic,
  getInfographics,
  getInfographicById,
  updateInfographic,
  deleteInfographic,
  viewInfographic,
  downloadInfographic,
  getInfographicStats,
};