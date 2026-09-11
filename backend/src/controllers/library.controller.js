// backend/src/controllers/library.controller.js
import { LibraryFile } from '../models/LibraryFile.model.js';
import { File } from '../models/File.model.js';
import storageService from '../services/storage.service.js';


// backend/src/controllers/library.controller.js

// ===== رفع ملف =====
const uploadFileToLibrary = async (file, portalId, accountId) => {
  // ✅ استخدام category: 'library' بدلاً من 'library_file'
  const result = await storageService.uploadFile(
    file,
    portalId,
    accountId,
    'library', // ✅ الفئة الصحيحة
    null,
    { source: 'library' }
  );
  return result.file;
};
// ============================================================
// ✅ إضافة ملف إلى المكتبة
// ============================================================
export const addLibraryFile = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'];
    const accountId = req.accountId || req.user?.id;
    const {
      fileId,
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

    console.log('📤 Adding file to library...');
    console.log('  - Portal:', portalId);
    console.log('  - File ID:', fileId);
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
        message: 'File not found',
      });
    }

    // ✅ التحقق من عدم التكرار
    const existing = await LibraryFile.findOne({ portalId, fileId, isDeleted: { $ne: true } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This file is already in the library',
      });
    }

    const libraryFile = new LibraryFile({
      portalId,
      fileId,
      title: title || file.originalName,
      titleAr: titleAr || file.originalName,
      description: description || '',
      descriptionAr: descriptionAr || '',
      category: category || 'other',
      categoryAr: categoryAr || 'أخرى',
      tags: tags || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      isFeatured: isFeatured || false,
      order: order || 0,
      createdBy: accountId,
    });

    await libraryFile.save();

    // ✅ جلب البيانات الكاملة
    const populated = await LibraryFile.findById(libraryFile._id)
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    console.log('✅ Library file added:', libraryFile._id);

    res.status(201).json({
      success: true,
      data: populated,
      message: 'تم إضافة الملف إلى المكتبة بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in addLibraryFile:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب جميع ملفات المكتبة
// ============================================================
export const getLibraryFiles = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'];
    const { category, search, isPublished, isFeatured, page = 1, limit = 20 } = req.query;

    console.log('📤 Fetching library files for portal:', portalId);

    const query = { portalId, isDeleted: { $ne: true } };
    if (category) query.category = category;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filesQuery = LibraryFile.find(query)
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName')
      .sort({ isFeatured: -1, order: 1, createdAt: -1 });

    // ✅ بحث نصي
    if (search) {
      filesQuery = filesQuery.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { titleAr: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { descriptionAr: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const [files, total] = await Promise.all([
      filesQuery.skip(skip).limit(parseInt(limit)),
      LibraryFile.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getLibraryFiles:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب ملف مكتبة محدد
// ============================================================
export const getLibraryFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];

    const file = await LibraryFile.findOne({ _id: id, portalId, isDeleted: { $ne: true } })
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in library',
      });
    }

    // ✅ زيادة عدد المشاهدات
    file.views += 1;
    await file.save();

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error('❌ Error in getLibraryFileById:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تحديث ملف المكتبة
// ============================================================
export const updateLibraryFile = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];
    const updates = req.body;

    const file = await LibraryFile.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in library',
      });
    }

    const allowedFields = [
      'title', 'titleAr', 'description', 'descriptionAr',
      'category', 'categoryAr', 'tags', 'isPublished',
      'isFeatured', 'order',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        file[field] = updates[field];
      }
    }

    file.updatedAt = new Date();
    await file.save();

    const populated = await LibraryFile.findById(file._id)
      .populate('fileId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    res.json({
      success: true,
      data: populated,
      message: 'تم تحديث الملف بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in updateLibraryFile:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ حذف ملف من المكتبة
// ============================================================
export const deleteLibraryFile = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];
    const accountId = req.accountId || req.user?.id;

    const file = await LibraryFile.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in library',
      });
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    file.deletedBy = accountId;
    await file.save();

    res.json({
      success: true,
      message: 'تم حذف الملف من المكتبة بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in deleteLibraryFile:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تحميل ملف من المكتبة
// ============================================================
export const downloadLibraryFile = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];
    const account = req.account;

    const libraryFile = await LibraryFile.findOne({ _id: id, portalId, isDeleted: { $ne: true } })
      .populate('fileId');

    if (!libraryFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found in library',
      });
    }

    if (!libraryFile.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'This file is not available',
      });
    }

    const file = libraryFile.fileId;
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // ✅ زيادة عدد التحميلات
    libraryFile.downloads += 1;
    await libraryFile.save();

    // ✅ تحميل الملف
    const fileBuffer = await storageService.getFile(file);

    const filename = encodeURIComponent(file.originalName);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Error in downloadLibraryFile:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ الحصول على إحصائيات المكتبة
// ============================================================
export const getLibraryStats = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'];

    const [total, published, featured, byCategory] = await Promise.all([
      LibraryFile.countDocuments({ portalId, isDeleted: { $ne: true } }),
      LibraryFile.countDocuments({ portalId, isDeleted: { $ne: true }, isPublished: true }),
      LibraryFile.countDocuments({ portalId, isDeleted: { $ne: true }, isFeatured: true }),
      LibraryFile.aggregate([
        { $match: { portalId, isDeleted: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total,
        published,
        featured,
        categories: byCategory,
      },
    });
  } catch (error) {
    console.error('❌ Error in getLibraryStats:', error);
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
  addLibraryFile,
  getLibraryFiles,
  getLibraryFileById,
  updateLibraryFile,
  deleteLibraryFile,
  downloadLibraryFile,
  getLibraryStats,
};