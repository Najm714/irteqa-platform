// backend/src/controllers/service.controller.js
import { Service } from '../models/Service.model.js';
import { Section } from '../models/Section.model.js';

// ============================================================
// ✅ Helper: توليد slug
// ============================================================
const generateSlug = (text) => {
  if (!text || text.trim() === '') return 'service-' + Date.now();
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ============================================================
// ✅ إنشاء خدمة جديدة
// ============================================================
export const createService = async (req, res) => {
  try {
    const portalId = req.portalId;
    const userId = req.user?.id || req.accountId;

    const {
      name,
      nameAr,
      description,
      descriptionAr,
      sectionId,
      icon,
      image,        // ✅ أضف هذا
      slug,
      isPublished,
      isFeatured,
      order,
      pricing,
    } = req.body;

    console.log('📝 Creating service...');
    console.log('  - Portal:', portalId);
    console.log('  - User:', userId);
    console.log('  - Name:', nameAr);
    console.log('  - Image:', image);  // ✅ للتشخيص

    // ✅ التحقق من portalId
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    // ✅ التحقق من الاسم
    if (!nameAr || nameAr.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Arabic name is required',
      });
    }

    // ✅ التحقق من القسم
    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Section ID is required',
      });
    }

    const section = await Section.findOne({
      _id: sectionId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // ✅ توليد slug
    let finalSlug = slug;
    if (!finalSlug || finalSlug.trim() === '') {
      finalSlug = generateSlug(nameAr || name || 'service');
    }

    // ✅ التحقق من slug مكرر
    const existingService = await Service.findOne({
      portalId,
      slug: finalSlug,
      isDeleted: { $ne: true },
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: `Slug "${finalSlug}" already exists.`,
      });
    }

    // ✅ إنشاء الخدمة
    const service = new Service({
      portalId,
      sectionId,
      name: name || nameAr || '',
      nameAr: nameAr || name || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      icon: icon || 'fa-cog',
      image: image || '',        // ✅ أضف هذا
      slug: finalSlug,
      isPublished: isPublished !== undefined ? isPublished : true,
      isFeatured: isFeatured || false,
      order: order || 0,
      pricing: pricing || { type: 'custom', defaultPrice: 0 },
      createdBy: userId,
    });

    await service.save();

    console.log('✅ Service created successfully:', service._id);
    console.log('   - Image saved:', service.image);  // ✅ للتشخيص

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    console.error('❌ Create service error:', error);

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
      message: error.message || 'Failed to create service',
    });
  }
};

// ============================================================
// ✅ جلب جميع الخدمات
// ============================================================
export const getServices = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { sectionId, isPublished, isFeatured } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = {
      portalId,
      isDeleted: { $ne: true },
    };

    if (sectionId) query.sectionId = sectionId;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    const services = await Service.find(query)
      .populate('sectionId', 'name nameAr description descriptionAr icon image')  // ✅ image للأقسام
      .sort({ order: 1, nameAr: 1 });

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('❌ Get services error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get services',
    });
  }
};

// ============================================================
// ✅ جلب خدمة واحدة
// ============================================================
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const service = await Service.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    }).populate('sectionId', 'name nameAr description descriptionAr icon image');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('❌ Get service error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get service',
    });
  }
};

// ============================================================
// ✅ تحديث خدمة
// ============================================================
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const updates = { ...req.body };

    console.log('📝 Updating service:', id);
    console.log('  - Image in updates:', updates.image);  // ✅ للتشخيص

    const service = await Service.findOne({ _id: id, portalId });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // ✅ التحقق من القسم إذا تم تحديثه
    if (updates.sectionId && updates.sectionId !== service.sectionId.toString()) {
      const section = await Section.findOne({
        _id: updates.sectionId,
        portalId,
        isDeleted: { $ne: true },
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found',
        });
      }
    }

    // ✅ التحقق من slug
    if (updates.slug && updates.slug !== service.slug) {
      const existing = await Service.findOne({
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

    // ✅ الحقول المسموح بتحديثها
    const allowedFields = [
      'name',
      'nameAr',
      'description',
      'descriptionAr',
      'sectionId',
      'icon',
      'image',       // ✅ أضف هذا
      'slug',
      'isPublished',
      'isFeatured',
      'order',
      'pricing',
    ];

    // ✅ تحديث الحقول المسموح بها فقط
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        service[field] = updates[field];
      }
    });

    service.updatedAt = new Date();
    await service.save();

    console.log('✅ Service updated:', service._id);
    console.log('   - Image now:', service.image);  // ✅ للتشخيص

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('❌ Update service error:', error);

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

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update service',
    });
  }
};

// ============================================================
// ✅ حذف خدمة
// ============================================================
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const service = await Service.findOne({ _id: id, portalId });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    service.isDeleted = true;
    service.deletedAt = new Date();
    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete service error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete service',
    });
  }
};

// ============================================================
// ✅ تبديل حالة النشر
// ============================================================
export const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const service = await Service.findOne({ _id: id, portalId });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    service.isPublished = !service.isPublished;
    service.updatedAt = new Date();
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isPublished ? 'published' : 'unpublished'} successfully`,
      data: service,
    });
  } catch (error) {
    console.error('❌ Toggle service status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle service status',
    });
  }
};

// ============================================================
// ✅ تبديل حالة التميز
// ============================================================
export const toggleServiceFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const service = await Service.findOne({ _id: id, portalId });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    service.isFeatured = !service.isFeatured;
    service.updatedAt = new Date();
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: service,
    });
  } catch (error) {
    console.error('❌ Toggle service featured error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle service featured',
    });
  }
};