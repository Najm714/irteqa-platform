// backend/src/controllers/section.controller.js
import mongoose from 'mongoose';
import { Section } from '../models/Section.model.js';

// ============================================================
// ✅ Helper: تنظيف parentId
// ============================================================
const sanitizeParentId = (parentId) => {
  // تحويل "" أو "null" أو "undefined" أو undefined → null
  if (
    parentId === undefined ||
    parentId === null ||
    parentId === '' ||
    parentId === 'null' ||
    parentId === 'undefined' ||
    (typeof parentId === 'string' && parentId.trim() === '')
  ) {
    return null;
  }

  // التحقق من ObjectId صالح
  if (!mongoose.Types.ObjectId.isValid(parentId)) {
    throw new Error('parentId غير صالح');
  }

  return parentId;
};

// ============================================================
// ✅ Helper: توليد slug
// ============================================================
const generateSlug = (text) => {
  if (!text || text.trim() === '') return 'section-' + Date.now();
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ============================================================
// ✅ Helper: جلب كل الأبناء (لمنع الدورات)
// ============================================================
async function getDescendantIds(sectionId, portalId) {
  const descendants = [];
  const queue = [sectionId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await Section.find({
      parentId: currentId,
      portalId,
      isDeleted: { $ne: true },
    }).select('_id');

    for (const child of children) {
      const childId = child._id.toString();
      if (!descendants.includes(childId)) {
        descendants.push(childId);
        queue.push(child._id);
      }
    }
  }

  return descendants;
}

// ============================================================
// ✅ إنشاء قسم جديد
// ============================================================
export const createSection = async (req, res) => {
  try {
    const portalId = req.portalId;
    const userId = req.user?.id || req.accountId;

    const {
      name,
      nameAr,
      description,
      descriptionAr,
      icon,
      image,
      slug,
      parentId,
      order,
      isPublished,
    } = req.body;

    console.log('📝 Creating section...');
    console.log('  - Portal:', portalId);
    console.log('  - User:', userId);
    console.log('  - Name:', nameAr);
    console.log('  - Raw parentId:', JSON.stringify(parentId));

    // ✅ التحقق من portalId
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    // ✅ التحقق من الاسم
    if (!nameAr || nameAr.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Arabic name is required',
      });
    }

    // ✅ تنظيف parentId
    let cleanParentId = null;
    try {
      cleanParentId = sanitizeParentId(parentId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // ✅ توليد slug
    let finalSlug = slug;
    if (!finalSlug || finalSlug.trim() === '') {
      finalSlug = generateSlug(nameAr || name || 'section');
    }

    // ✅ التحقق من عدم وجود slug مكرر
    const existingSection = await Section.findOne({
      portalId,
      slug: finalSlug,
      isDeleted: { $ne: true },
    });

    if (existingSection) {
      return res.status(400).json({
        success: false,
        message: `Slug "${finalSlug}" already exists. Please use a different slug.`,
      });
    }

    // ✅ التحقق من وجود القسم الرئيسي
    if (cleanParentId) {
      const parentSection = await Section.findOne({
        _id: cleanParentId,
        portalId,
        isDeleted: { $ne: true },
      });

      if (!parentSection) {
        return res.status(404).json({
          success: false,
          message: 'Parent section not found',
        });
      }
    }

    // ✅ إنشاء القسم
    const section = new Section({
      portalId,
      name: name || nameAr || '',
      nameAr: nameAr || name || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      icon: icon || 'fa-folder',
      image: image || '',
      slug: finalSlug,
      parentId: cleanParentId,
      order: order || 0,
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: userId,
    });

    await section.save();

    console.log('✅ Section created successfully:', section._id);

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: section,
    });
  } catch (error) {
    console.error('❌ Create section error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate slug. Please use a unique slug.',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create section',
    });
  }
};

// ============================================================
// ✅ جلب جميع الأقسام
// ============================================================
export const getSections = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { isPublished, parentId } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    const query = {
      portalId,
      isDeleted: { $ne: true },
    };

    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    if (parentId !== undefined) {
      query.parentId = parentId === 'null' ? null : parentId;
    }

    const sections = await Section.find(query)
      .populate('parentId', 'name nameAr')
      .sort({ order: 1, nameAr: 1 });

    // ✅ بناء شجرة الأقسام
    const buildTree = (items, parentId = null) => {
      return items
        .filter((item) => {
          const itemParentId =
            item.parentId?._id?.toString() ||
            item.parentId?.toString() ||
            null;
          return itemParentId === parentId;
        })
        .map((item) => {
          const children = buildTree(items, item._id.toString());
          const itemObj = item.toObject();
          if (children.length > 0) {
            itemObj.children = children;
          }
          return itemObj;
        });
    };

    const tree = buildTree(sections);

    res.status(200).json({
      success: true,
      data: tree,
    });
  } catch (error) {
    console.error('❌ Get sections error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sections',
    });
  }
};

// ============================================================
// ✅ جلب قسم واحد
// ============================================================
export const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID',
      });
    }

    const section = await Section.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    }).populate('parentId', 'name nameAr');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    res.status(200).json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error('❌ Get section error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get section',
    });
  }
};

// ============================================================
// ✅ تحديث قسم
// ============================================================
export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const updates = { ...req.body };

    console.log('📝 Updating section:', id);
    console.log('  - Raw parentId:', JSON.stringify(updates.parentId));

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID',
      });
    }

    // ✅ تنظيف parentId (تحويل "" إلى null)
    if (updates.parentId !== undefined) {
      try {
        updates.parentId = sanitizeParentId(updates.parentId);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // ✅ منع تعيين القسم كوالد لنفسه
      if (updates.parentId === id) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن تعيين القسم كوالد لنفسه',
        });
      }
    }

    // ✅ إزالة الحقول غير القابلة للتحديث
    delete updates._id;
    delete updates.portalId;
    delete updates.createdAt;
    delete updates.createdBy;
    delete updates.__v;

    // ✅ إيجاد القسم
    const section = await Section.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // ✅ منع الدورات (Circular)
    if (updates.parentId) {
      const descendants = await getDescendantIds(id, portalId);
      if (descendants.includes(updates.parentId.toString())) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن تعيين قسم فرعي كوالد (سيسبب حلقة لا نهائية)',
        });
      }
    }

    // ✅ منع slug مكرر
    if (updates.slug && updates.slug !== section.slug) {
      const existing = await Section.findOne({
        portalId,
        slug: updates.slug,
        _id: { $ne: id },
        isDeleted: { $ne: true },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists',
        });
      }
    }

    // ✅ تطبيق التحديثات
    Object.keys(updates).forEach((key) => {
      section[key] = updates[key];
    });

    section.updatedAt = new Date();
    await section.save();

    console.log('✅ Section updated:', section._id);

    res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      data: section,
    });
  } catch (error) {
    console.error('❌ Update section error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate slug. Please use a unique slug.',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update section',
    });
  }
};

// ============================================================
// ✅ حذف قسم (حذف منطقي + الأبناء)
// ============================================================
export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID',
      });
    }

    const section = await Section.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // ✅ التحقق من الأبناء
    const children = await Section.find({
      parentId: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete section with ${children.length} child sections. Delete children first.`,
      });
    }

    // ✅ حذف منطقي
    section.isDeleted = true;
    section.deletedAt = new Date();
    await section.save();

    res.status(200).json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete section error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete section',
    });
  }
};

// ============================================================
// ✅ تبديل حالة النشر
// ============================================================
export const toggleSectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section ID',
      });
    }

    const section = await Section.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    section.isPublished = !section.isPublished;
    section.updatedAt = new Date();
    await section.save();

    res.status(200).json({
      success: true,
      message: `Section ${
        section.isPublished ? 'published' : 'unpublished'
      } successfully`,
      data: section,
    });
  } catch (error) {
    console.error('❌ Toggle section status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle section status',
    });
  }
};