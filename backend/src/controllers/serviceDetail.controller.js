// backend/src/controllers/serviceDetail.controller.js
import { ServiceDetail } from '../models/ServiceDetail.model.js';
import { Service } from '../models/Service.model.js';
import { Section } from '../models/Section.model.js';

// ============================================================
// ✅ إنشاء تفاصيل الخدمة
// ============================================================
export const createServiceDetail = async (req, res) => {
  try {
    const portalId = req.portalId;
    const userId = req.user?.id || req.accountId;

    const {
      sectionId,
      serviceId,
      overview,
      overviewAr,
      whatIsService,
      whatIsServiceAr,
      whoBenefits,
      whoBenefitsAr,
      methodologies,
      methodologiesAr,
      gallery,
      requestTypes,
      faqs,
      isPublished,
    } = req.body;

    console.log('📝 Creating service detail...');
    console.log('  - Portal:', portalId);
    console.log('  - Service:', serviceId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const service = await Service.findOne({ _id: serviceId, portalId });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    const section = await Section.findOne({ _id: sectionId, portalId });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    const existing = await ServiceDetail.findOne({ portalId, serviceId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Service details already exist for this service',
      });
    }

    const serviceDetail = new ServiceDetail({
      portalId,
      sectionId,
      serviceId,
      overview: overview || '',
      overviewAr: overviewAr || '',
      whatIsService: whatIsService || '',
      whatIsServiceAr: whatIsServiceAr || '',
      whoBenefits: whoBenefits || '',
      whoBenefitsAr: whoBenefitsAr || '',
      methodologies: methodologies || '',
      methodologiesAr: methodologiesAr || '',
      gallery: gallery || [],
      requestTypes: requestTypes || [],
      faqs: faqs || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: userId,
    });

    await serviceDetail.save();

    console.log('✅ Service detail created successfully:', serviceDetail._id);

    res.status(201).json({
      success: true,
      message: 'Service details created successfully',
      data: serviceDetail,
    });
  } catch (error) {
    console.error('❌ Create service detail error:', error);

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
      message: error.message || 'Failed to create service details',
    });
  }
};

// ============================================================
// ✅ جلب جميع تفاصيل الخدمات
// ============================================================
export const getServiceDetails = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { sectionId, serviceId, isPublished } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = { portalId, isDeleted: { $ne: true } };
    if (sectionId) query.sectionId = sectionId;
    if (serviceId) query.serviceId = serviceId;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const serviceDetails = await ServiceDetail.find(query)
      .populate('sectionId', 'name nameAr icon image')
      .populate('serviceId', 'name nameAr icon image')  // ✅ أضف image
      .populate('createdBy', 'profile.fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: serviceDetails,
    });
  } catch (error) {
    console.error('❌ Get service details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get service details',
    });
  }
};

// ============================================================
// ✅ جلب تفاصيل خدمة واحدة
// ============================================================
export const getServiceDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    // ✅ ابحث باستخدام serviceId (وليس _id)
    const serviceDetail = await ServiceDetail.findOne({
      serviceId: id,
      portalId,
      isDeleted: { $ne: true },
    })
      .populate('sectionId', 'name nameAr icon image')
      .populate('serviceId', 'name nameAr icon image')  // ✅ أضف image
      .populate('createdBy', 'profile.fullName');

    if (!serviceDetail) {
      return res.status(404).json({
        success: false,
        message: 'Service details not found',
      });
    }

    res.status(200).json({
      success: true,
      data: serviceDetail,
    });
  } catch (error) {
    console.error('❌ Get service detail error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get service details',
    });
  }
};

// ============================================================
// ✅ تحديث تفاصيل الخدمة
// ============================================================
export const updateServiceDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const updates = req.body;

    const serviceDetail = await ServiceDetail.findOne({ _id: id, portalId });
    if (!serviceDetail) {
      return res.status(404).json({
        success: false,
        message: 'Service details not found',
      });
    }

    Object.keys(updates).forEach((key) => {
      if (
        key !== '_id' &&
        key !== 'portalId' &&
        key !== 'createdAt' &&
        key !== 'createdBy'
      ) {
        serviceDetail[key] = updates[key];
      }
    });

    serviceDetail.updatedAt = new Date();
    await serviceDetail.save();

    res.status(200).json({
      success: true,
      message: 'Service details updated successfully',
      data: serviceDetail,
    });
  } catch (error) {
    console.error('❌ Update service detail error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update service details',
    });
  }
};

// ============================================================
// ✅ حذف تفاصيل الخدمة
// ============================================================
export const deleteServiceDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const serviceDetail = await ServiceDetail.findOne({ _id: id, portalId });
    if (!serviceDetail) {
      return res.status(404).json({
        success: false,
        message: 'Service details not found',
      });
    }

    serviceDetail.isDeleted = true;
    serviceDetail.deletedAt = new Date();
    await serviceDetail.save();

    res.status(200).json({
      success: true,
      message: 'Service details deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete service detail error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete service details',
    });
  }
};

// ============================================================
// ✅ تبديل حالة النشر
// ============================================================
export const toggleServiceDetailStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const serviceDetail = await ServiceDetail.findOne({ _id: id, portalId });
    if (!serviceDetail) {
      return res.status(404).json({
        success: false,
        message: 'Service details not found',
      });
    }

    serviceDetail.isPublished = !serviceDetail.isPublished;
    serviceDetail.updatedAt = new Date();
    await serviceDetail.save();

    res.status(200).json({
      success: true,
      message: `Service details ${
        serviceDetail.isPublished ? 'published' : 'unpublished'
      } successfully`,
      data: serviceDetail,
    });
  } catch (error) {
    console.error('❌ Toggle service detail status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle service detail status',
    });
  }
};