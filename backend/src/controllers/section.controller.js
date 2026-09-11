// backend/src/controllers/section.controller.js
import { Section } from '../models/Section.model.js';

// ===== دالة مساعدة لتوليد slug =====
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

// ===== إنشاء قسم جديد =====
export const createSection = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId;
    const { id: userId } = req.user || {};

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

    // ✅ التحقق من وجود portalId
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    // ✅ التحقق من وجود اسم
    if (!nameAr || nameAr.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Arabic name is required',
      });
    }

    // ✅ توليد slug تلقائياً إذا لم يتم توفيره
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

    // ✅ التحقق من وجود القسم الرئيسي (إذا تم تحديده)
    if (parentId && parentId !== '') {
      const parentSection = await Section.findOne({ 
        _id: parentId, 
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
      parentId: parentId || null,
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
    
    // ✅ معالجة أخطاء التحقق
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
      });
    }

    // ✅ معالجة أخطاء التكرار
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

// ===== الحصول على جميع الأقسام =====
export const getSections = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.query.portalId;
    const { isPublished, parentId } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = { 
      portalId, 
      isDeleted: { $ne: true } 
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

    // ✅ بناء شجرة الأقسام (JavaScript بدون TypeScript)
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => {
          const itemParentId = item.parentId?._id?.toString() || item.parentId?.toString() || null;
          return itemParentId === parentId;
        })
        .map(item => {
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

// ===== الحصول على قسم واحد =====
export const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];

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

// ===== تحديث قسم =====
export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];
    const updates = req.body;

    const section = await Section.findOne({ _id: id, portalId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // ✅ منع تحديث slug إذا كان مكرراً
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

    // ✅ تحديث الحقول
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'portalId' && key !== 'createdAt' && key !== 'createdBy') {
        section[key] = updates[key];
      }
    });

    section.updatedAt = new Date();
    await section.save();

    res.status(200).json({
      success: true,
      message: 'Section updated successfully',
      data: section,
    });
  } catch (error) {
    console.error('❌ Update section error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update section',
    });
  }
};

// ===== حذف قسم =====
export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];

    const section = await Section.findOne({ _id: id, portalId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // ✅ التحقق من وجود أقسام فرعية
    const children = await Section.find({ parentId: id, portalId });
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

// ===== تبديل حالة النشر =====
export const toggleSectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];

    const section = await Section.findOne({ _id: id, portalId });
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
      message: `Section ${section.isPublished ? 'published' : 'unpublished'} successfully`,
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