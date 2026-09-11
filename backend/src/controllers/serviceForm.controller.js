// backend/src/controllers/serviceForm.controller.js
import { ServiceForm } from '../models/ServiceForm.model.js';
import { Service } from '../models/Service.model.js';
import { Section } from '../models/Section.model.js';
import { File } from '../models/File.model.js';
import storageService from '../services/storage.service.js';
import mongoose from 'mongoose';

// ============================================================
// ✅ دالة مساعدة لحفظ الملف
// ============================================================

const saveFile = async ({ file, portalId, accountId, category = 'service_form', metadata = {}, requestId = null }) => {
  console.log('💾 saveFile called...');
  console.log('  - portalId:', portalId);
  console.log('  - accountId:', accountId);
  console.log('  - category:', category);
  console.log('  - filename:', file.originalname);
  console.log('  - size:', file.size);
  console.log('  - mimetype:', file.mimetype);

  if (!portalId) {
    throw new Error('portalId is required');
  }

  if (!file) {
    throw new Error('File is required');
  }

  // ✅ استخدام storageService مباشرة
  const result = await storageService.uploadFile(
    file,
    portalId,
    accountId,
    category,
    requestId,
    metadata
  );

  return result.file;
};

// ============================================================
// ✅ رفع ملف النموذج (مُحسَّن)
// ============================================================

export const uploadServiceFormFile = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId;
    const accountId = req.accountId || req.user?.id;

    console.log('📤 Uploading service form file...');
    console.log('  - Portal:', portalId);
    console.log('  - Account:', accountId);

    // ✅ التحقق من وجود portalId
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required. Please provide X-Portal-Id header.',
      });
    }

    // ✅ التحقق من وجود ملف
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    console.log('  - File:', req.file.originalname);
    console.log('  - Size:', req.file.size);
    console.log('  - MimeType:', req.file.mimetype);

    // ✅ رفع الملف
    const file = await saveFile({
      file: req.file,
      portalId,
      accountId,
      category: 'service_form',
    });

    console.log('✅ File uploaded successfully:', file._id);

    res.status(201).json({
      success: true,
      data: {
        fileId: file._id,
        filename: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
      },
      message: 'File uploaded successfully',
    });

  } catch (error) {
    console.error('❌ Upload service form file error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
      details: error.stack,
    });
  }
};

// ============================================================
// ✅ إنشاء نموذج خدمة
// ============================================================

export const createServiceForm = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId;
    const { id: userId } = req.user || {};

    const {
      sectionId,
      serviceId,
      name,
      nameAr,
      description,
      descriptionAr,
      fileId,
      filename,
      fileSize,
      fileMimeType,
      isPublished,
      order,
    } = req.body;

    console.log('📝 Creating service form...');
    console.log('  - Portal:', portalId);
    console.log('  - Service:', serviceId);
    console.log('  - File:', filename);

    // ✅ التحقق من وجود portalId
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    // ✅ التحقق من وجود الخدمة
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'serviceId is required',
      });
    }

    const service = await Service.findOne({ _id: serviceId, portalId, isDeleted: { $ne: true } });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // ✅ التحقق من وجود القسم
    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: 'sectionId is required',
      });
    }

    const section = await Section.findOne({ _id: sectionId, portalId, isDeleted: { $ne: true } });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // ✅ التحقق من وجود الملف
    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required. Please upload a file first.',
      });
    }

    const file = await File.findOne({ _id: fileId, portalId });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const serviceForm = new ServiceForm({
      portalId,
      sectionId,
      serviceId,
      name: name || filename || 'نموذج الخدمة',
      nameAr: nameAr || filename || 'نموذج الخدمة',
      description: description || '',
      descriptionAr: descriptionAr || '',
      fileId,
      filename: filename || file.originalName,
      fileSize: fileSize || file.size,
      fileMimeType: fileMimeType || file.mimeType,
      isPublished: isPublished !== undefined ? isPublished : true,
      order: order || 0,
      createdBy: userId,
    });

    await serviceForm.save();

    // ✅ جلب النموذج مع البيانات الكاملة
    const populatedForm = await ServiceForm.findById(serviceForm._id)
      .populate('sectionId', 'name nameAr')
      .populate('serviceId', 'name nameAr icon')
      .populate('fileId', 'originalName size mimeType');

    console.log('✅ Service form created successfully:', serviceForm._id);

    res.status(201).json({
      success: true,
      message: 'Service form created successfully',
      data: populatedForm,
    });

  } catch (error) {
    console.error('❌ Create service form error:', error);
    
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

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create service form',
    });
  }
};

// ============================================================
// ✅ الحصول على جميع نماذج الخدمات
// ============================================================

export const getServiceForms = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.query.portalId;
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

    const serviceForms = await ServiceForm.find(query)
      .populate('sectionId', 'name nameAr')
      .populate('serviceId', 'name nameAr icon')
      .populate('fileId', 'originalName size mimeType')
      .populate('createdBy', 'profile.fullName')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: serviceForms,
    });
  } catch (error) {
    console.error('❌ Get service forms error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get service forms',
    });
  }
};

// ============================================================
// ✅ الحصول على نموذج خدمة واحد
// ============================================================

export const getServiceFormById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];

    const serviceForm = await ServiceForm.findOne({ 
      _id: id, 
      portalId,
      isDeleted: { $ne: true },
    })
      .populate('sectionId', 'name nameAr')
      .populate('serviceId', 'name nameAr icon')
      .populate('fileId', 'originalName size mimeType')
      .populate('createdBy', 'profile.fullName');

    if (!serviceForm) {
      return res.status(404).json({
        success: false,
        message: 'Service form not found',
      });
    }

    res.status(200).json({
      success: true,
      data: serviceForm,
    });
  } catch (error) {
    console.error('❌ Get service form error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get service form',
    });
  }
};

// ============================================================
// ✅ تحديث نموذج الخدمة
// ============================================================

export const updateServiceForm = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];
    const updates = req.body;

    const serviceForm = await ServiceForm.findOne({ _id: id, portalId });
    if (!serviceForm) {
      return res.status(404).json({
        success: false,
        message: 'Service form not found',
      });
    }

    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'portalId' && key !== 'createdAt' && key !== 'createdBy') {
        serviceForm[key] = updates[key];
      }
    });

    serviceForm.updatedAt = new Date();
    await serviceForm.save();

    const populatedForm = await ServiceForm.findById(serviceForm._id)
      .populate('sectionId', 'name nameAr')
      .populate('serviceId', 'name nameAr icon')
      .populate('fileId', 'originalName size mimeType');

    res.status(200).json({
      success: true,
      message: 'Service form updated successfully',
      data: populatedForm,
    });
  } catch (error) {
    console.error('❌ Update service form error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update service form',
    });
  }
};

// ============================================================
// ✅ حذف نموذج الخدمة
// ============================================================

export const deleteServiceForm = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];

    const serviceForm = await ServiceForm.findOne({ _id: id, portalId });
    if (!serviceForm) {
      return res.status(404).json({
        success: false,
        message: 'Service form not found',
      });
    }

    serviceForm.isDeleted = true;
    serviceForm.deletedAt = new Date();
    await serviceForm.save();

    res.status(200).json({
      success: true,
      message: 'Service form deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete service form error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete service form',
    });
  }
};

// ============================================================
// ✅ تبديل حالة النشر
// ============================================================

export const toggleServiceFormStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];

    const serviceForm = await ServiceForm.findOne({ _id: id, portalId });
    if (!serviceForm) {
      return res.status(404).json({
        success: false,
        message: 'Service form not found',
      });
    }

    serviceForm.isPublished = !serviceForm.isPublished;
    serviceForm.updatedAt = new Date();
    await serviceForm.save();

    res.status(200).json({
      success: true,
      message: `Service form ${serviceForm.isPublished ? 'published' : 'unpublished'} successfully`,
      data: serviceForm,
    });
  } catch (error) {
    console.error('❌ Toggle service form status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle service form status',
    });
  }
};