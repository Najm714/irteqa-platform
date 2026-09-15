// backend/src/controllers/explanations.controller.js
import { University } from '../models/University.model.js';
import { College } from '../models/College.model.js';
import { Specialty } from '../models/Specialty.model.js';
import { Material } from '../models/Material.model.js';
import { Video } from '../models/Video.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Payment } from '../models/Payment.model.js';
import { File } from '../models/File.model.js';

// ============================================================
// ✅ دالة مساعدة لتوليد slug
// ============================================================
const generateSlug = (text) => {
  if (!text || text.trim() === '') return 'item-' + Date.now();
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ============================================================
// ✅ إدارة الجامعات
// ============================================================

export const getUniversities = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.query.portalId || req.portal?._id;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const { isActive } = req.query;
    const query = { portalId };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const universities = await University.find(query)
      .sort({ order: 1, nameAr: 1 });
    
    res.status(200).json({
      success: true,
      data: universities,
    });
  } catch (error) {
    console.error('❌ Get universities error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get universities',
    });
  }
};

export const getUniversityById = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const university = await University.findOne({ _id: id, portalId });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: university,
    });
  } catch (error) {
    console.error('❌ Get university error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get university',
    });
  }
};

export const createUniversity = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId || req.portal?._id || req.user?.portalId;
    const userId = req.accountId || req.user?.id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required. Please provide X-Portal-Id header or portalId in body',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const {
      name,
      nameAr,
      description,
      descriptionAr,
      icon,
      logo,
      slug,
      order,
      isActive,
    } = req.body;

    let finalSlug = slug;
    if (!finalSlug || finalSlug.trim() === '') {
      const baseName = nameAr || name || 'university';
      finalSlug = generateSlug(baseName);
    }

    // ✅ التحقق من عدم وجود slug مكرر
    const existing = await University.findOne({ portalId, slug: finalSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Slug "${finalSlug}" already exists. Please use a unique slug.`,
      });
    }

    const universityData = {
      name: name || '',
      nameAr: nameAr || name || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      icon: icon || 'fa-university',
      logo: logo || '',
      slug: finalSlug,
      portalId: portalId,
      order: parseInt(order) || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: userId,
    };

    const university = new University(universityData);
    await university.save();

    res.status(201).json({
      success: true,
      message: 'University created successfully',
      data: university,
    });
  } catch (error) {
    console.error('❌ Create university error:', error);
    
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

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for ${field}. Please use a unique value.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create university',
    });
  }
};

export const updateUniversity = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const university = await University.findOne({ _id: id, portalId });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found',
      });
    }
    
    const updates = req.body;
    const allowedUpdates = ['name', 'nameAr', 'description', 'descriptionAr', 'icon', 'logo', 'slug', 'order', 'isActive'];
    
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        university[key] = updates[key];
      }
    });
    
    university.updatedAt = new Date();
    await university.save();
    
    res.status(200).json({
      success: true,
      message: 'University updated successfully',
      data: university,
    });
  } catch (error) {
    console.error('❌ Update university error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update university',
    });
  }
};

export const deleteUniversity = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const university = await University.findOne({ _id: id, portalId });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found',
      });
    }
    
    university.isActive = false;
    university.updatedAt = new Date();
    await university.save();
    
    // ✅ تحديث الكليات المرتبطة
    await College.updateMany(
      { universityId: id, portalId },
      { isActive: false, updatedAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'University deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete university error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete university',
    });
  }
};

// ============================================================
// ✅ إدارة الكليات
// ============================================================

export const getColleges = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { universityId, isActive } = req.query;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = { portalId };
    if (universityId) query.universityId = universityId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const colleges = await College.find(query)
      .populate('universityId', 'name nameAr')
      .sort({ order: 1, nameAr: 1 });
    
    res.status(200).json({
      success: true,
      data: colleges,
    });
  } catch (error) {
    console.error('❌ Get colleges error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get colleges',
    });
  }
};

export const getCollegeById = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const college = await College.findOne({ _id: id, portalId })
      .populate('universityId', 'name nameAr');
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: college,
    });
  } catch (error) {
    console.error('❌ Get college error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get college',
    });
  }
};

export const createCollege = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId || req.portal?._id;
    const userId = req.accountId || req.user?.id;
    const { 
      name, nameAr, description, descriptionAr, 
      universityId, icon, order, slug, isActive 
    } = req.body;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const university = await University.findOne({ _id: universityId, portalId });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found',
      });
    }
    
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(nameAr || name || 'college');
    }

    // ✅ التحقق من عدم وجود slug مكرر
    const existing = await College.findOne({ portalId, slug: finalSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Slug "${finalSlug}" already exists. Please use a unique slug.`,
      });
    }
    
    const college = new College({
      portalId,
      universityId,
      name: name || '',
      nameAr: nameAr || name || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      icon: icon || 'fa-school',
      slug: finalSlug,
      order: parseInt(order) || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: userId,
    });
    
    await college.save();
    
    res.status(201).json({
      success: true,
      message: 'College created successfully',
      data: college,
    });
  } catch (error) {
    console.error('❌ Create college error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate slug. Please use a unique slug.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create college',
    });
  }
};

export const updateCollege = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const college = await College.findOne({ _id: id, portalId });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }
    
    const updates = req.body;
    const allowedUpdates = ['name', 'nameAr', 'description', 'descriptionAr', 'icon', 'slug', 'order', 'isActive'];
    
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        college[key] = updates[key];
      }
    });
    
    college.updatedAt = new Date();
    await college.save();
    
    res.status(200).json({
      success: true,
      message: 'College updated successfully',
      data: college,
    });
  } catch (error) {
    console.error('❌ Update college error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update college',
    });
  }
};

export const deleteCollege = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const college = await College.findOne({ _id: id, portalId });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }
    
    college.isActive = false;
    college.updatedAt = new Date();
    await college.save();
    
    // ✅ تحديث التخصصات المرتبطة
    await Specialty.updateMany(
      { collegeId: id, portalId },
      { isActive: false, updatedAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'College deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete college error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete college',
    });
  }
};

// ============================================================
// ✅ إدارة التخصصات
// ============================================================

export const getSpecialties = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { collegeId, isActive } = req.query;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = { portalId };
    if (collegeId) query.collegeId = collegeId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const specialties = await Specialty.find(query)
      .populate('universityId', 'name nameAr')
      .populate('collegeId', 'name nameAr')
      .sort({ order: 1, nameAr: 1 });
    
    res.status(200).json({
      success: true,
      data: specialties,
    });
  } catch (error) {
    console.error('❌ Get specialties error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get specialties',
    });
  }
};

export const getSpecialtyById = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const specialty = await Specialty.findOne({ _id: id, portalId })
      .populate('universityId', 'name nameAr')
      .populate('collegeId', 'name nameAr');
    
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Specialty not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: specialty,
    });
  } catch (error) {
    console.error('❌ Get specialty error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get specialty',
    });
  }
};

export const createSpecialty = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId || req.portal?._id;
    const userId = req.accountId || req.user?.id;
    const { 
      name, nameAr, description, descriptionAr, 
      universityId, collegeId, code, icon, order, slug, isActive 
    } = req.body;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const university = await University.findOne({ _id: universityId, portalId });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found',
      });
    }
    
    const college = await College.findOne({ _id: collegeId, portalId });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }
    
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(nameAr || name || code || 'specialty');
    }

    // ✅ التحقق من عدم وجود slug أو code مكرر
    const existing = await Specialty.findOne({ 
      portalId, 
      $or: [{ slug: finalSlug }, { code: code }] 
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate slug or code. Please use unique values.',
      });
    }
    
    const specialty = new Specialty({
      portalId,
      universityId,
      collegeId,
      name: name || '',
      nameAr: nameAr || name || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      code: code || '',
      icon: icon || 'fa-tag',
      slug: finalSlug,
      order: parseInt(order) || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: userId,
    });
    
    await specialty.save();
    
    res.status(201).json({
      success: true,
      message: 'Specialty created successfully',
      data: specialty,
    });
  } catch (error) {
    console.error('❌ Create specialty error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate slug or code. Please use unique values.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create specialty',
    });
  }
};

export const updateSpecialty = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const specialty = await Specialty.findOne({ _id: id, portalId });
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Specialty not found',
      });
    }
    
    const updates = req.body;
    const allowedUpdates = ['name', 'nameAr', 'description', 'descriptionAr', 'code', 'icon', 'slug', 'order', 'isActive'];
    
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        specialty[key] = updates[key];
      }
    });
    
    specialty.updatedAt = new Date();
    await specialty.save();
    
    res.status(200).json({
      success: true,
      message: 'Specialty updated successfully',
      data: specialty,
    });
  } catch (error) {
    console.error('❌ Update specialty error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update specialty',
    });
  }
};

export const deleteSpecialty = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const specialty = await Specialty.findOne({ _id: id, portalId });
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Specialty not found',
      });
    }
    
    specialty.isActive = false;
    specialty.updatedAt = new Date();
    await specialty.save();
    
    // ✅ تحديث المواد المرتبطة
    await Material.updateMany(
      { specialtyId: id, portalId },
      { isPublished: false, updatedAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'Specialty deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete specialty error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete specialty',
    });
  }
};

// ============================================================
// ✅ إدارة المواد
// ============================================================

export const getMaterials = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { specialtyId, universityId, collegeId, isPublished } = req.query;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = { portalId };
    if (specialtyId) query.specialtyId = specialtyId;
    if (universityId) query.universityId = universityId;
    if (collegeId) query.collegeId = collegeId;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    
    const materials = await Material.find(query)
      .populate('universityId', 'name nameAr')
      .populate('collegeId', 'name nameAr')
      .populate('specialtyId', 'name nameAr')
      .populate('createdBy', 'profile.fullName')
      .sort({ order: 1, nameAr: 1 });
    
    res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error) {
    console.error('❌ Get materials error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get materials',
    });
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const material = await Material.findOne({ _id: id, portalId })
      .populate('universityId', 'name nameAr')
      .populate('collegeId', 'name nameAr')
      .populate('specialtyId', 'name nameAr')
      .populate('createdBy', 'profile.fullName');
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error('❌ Get material error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get material',
    });
  }
};

export const createMaterial = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId || req.portal?._id;
    const userId = req.accountId || req.user?.id;
    const { 
      name, nameAr, code, description, descriptionAr, 
      universityId, collegeId, specialtyId, 
      icon, instructor, instructorBio, duration, 
      price, features, featuresAr, units, summaries,
      isPublished, isFeatured, order, slug
    } = req.body;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const university = await University.findOne({ _id: universityId, portalId });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found',
      });
    }
    
    const college = await College.findOne({ _id: collegeId, portalId });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }
    
    const specialty = await Specialty.findOne({ _id: specialtyId, portalId });
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Specialty not found',
      });
    }
    
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(nameAr || name || code || 'material');
    }

    // ✅ التحقق من عدم وجود slug أو code مكرر
    const existing = await Material.findOne({ 
      portalId, 
      $or: [{ slug: finalSlug }, { code: code }] 
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate slug or code. Please use unique values.',
      });
    }
    
    const material = new Material({
      portalId,
      universityId,
      collegeId,
      specialtyId,
      name: name || '',
      nameAr: nameAr || name || '',
      code: code || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      icon: icon || 'fa-book',
      instructor: instructor || '',
      instructorBio: instructorBio || '',
      duration: duration || '0',
      price: price || 0,
      features: features || [],
      featuresAr: featuresAr || [],
      slug: finalSlug,
      units: units || [],
      summaries: summaries || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      isFeatured: isFeatured || false,
      order: parseInt(order) || 0,
      createdBy: userId,
    });
    
    await material.save();
    
    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: material,
    });
  } catch (error) {
    console.error('❌ Create material error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate slug or code. Please use unique values.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create material',
    });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const material = await Material.findOne({ _id: id, portalId });
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }
    
    const updates = req.body;
    const allowedUpdates = [
      'name', 'nameAr', 'code', 'description', 'descriptionAr',
      'icon', 'instructor', 'instructorBio', 'duration',
      'price', 'features', 'featuresAr', 'units', 'summaries',
      'isPublished', 'isFeatured', 'order', 'slug'
    ];
    
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        material[key] = updates[key];
      }
    });
    
    material.updatedAt = new Date();
    await material.save();
    
    res.status(200).json({
      success: true,
      message: 'Material updated successfully',
      data: material,
    });
  } catch (error) {
    console.error('❌ Update material error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update material',
    });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const material = await Material.findOne({ _id: id, portalId });
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }
    
    material.isPublished = false;
    material.updatedAt = new Date();
    await material.save();
    
    // ✅ تحديث الفيديوهات المرتبطة
    await Video.updateMany(
      { materialId: id, portalId },
      { isPublished: false, updatedAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete material error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete material',
    });
  }
};

// ============================================================
// ✅ إدارة الفيديوهات
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

    // ✅ إضافة رابط الفيديو الصحيح
// ✅ استخدم x-forwarded-proto (بعد trust proxy يعمل تلقائياً)
// ============================================================
// إضافة رابط الفيديو مع Portal Context
// ============================================================

const protocol =
  req.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
  req.protocol ||
  'https';

const host = req.get('host');
const baseUrl = `${protocol}://${host}`;

if (!portalId) {
  return res.status(400).json({
    success: false,
    message: 'Portal context is required',
    code: 'PORTAL_ID_REQUIRED',
  });
}

const videosWithUrls = videos.map(video => {
  const videoObj = video.toObject();

  if (
    video.videoUrl &&
    video.videoUrl.match(/^[0-9a-fA-F]{24}$/)
  ) {
    videoObj.videoUrl =
      `${baseUrl}/api/files/${video.videoUrl}/stream-secure?portalId=${encodeURIComponent(
        portalId.toString()
      )}`;
  } else if (video.videoUrl) {
    videoObj.videoUrl = video.videoUrl;
  } else {
    videoObj.videoUrl = null;
  }

  videoObj.hasValidUrl = !!videoObj.videoUrl;

  if (!videoObj.thumbnail && videoObj.videoUrl) {
    videoObj.thumbnail = '/default-thumbnail.jpg';
  }

  return videoObj;
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

export const createVideo = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId || req.portal?._id;
    const userId = req.accountId || req.user?.id;
    const { 
      title, titleAr, description, descriptionAr,
      universityId, collegeId, specialtyId, materialId,
      instructor, videoUrl, thumbnail, duration,
      isEncrypted, isPublished, order, slug
    } = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // ✅ التحقق من وجود الجامعة والكلية والتخصص والمادة
    const university = await University.findOne({ _id: universityId, portalId });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: 'University not found',
      });
    }
    
    const college = await College.findOne({ _id: collegeId, portalId });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }
    
    const specialty = await Specialty.findOne({ _id: specialtyId, portalId });
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Specialty not found',
      });
    }
    
    const material = await Material.findOne({ _id: materialId, portalId });
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(titleAr || title || 'video');
    }

    const video = new Video({
      portalId,
      universityId,
      collegeId,
      specialtyId,
      materialId,
      title: title || '',
      titleAr: titleAr || title || '',
      description: description || '',
      descriptionAr: descriptionAr || '',
      instructor: instructor || '',
      videoUrl: videoUrl || '',
      thumbnail: thumbnail || '',
      duration: parseInt(duration) || 0,
      slug: finalSlug,
      isEncrypted: isEncrypted || false,
      isPublished: isPublished !== undefined ? isPublished : true,
      order: parseInt(order) || 0,
      createdBy: userId,
    });

    await video.save();

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: video,
    });
  } catch (error) {
    console.error('❌ Create video error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate slug. Please use a unique slug.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create video',
    });
  }
};

export const updateVideo = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const video = await Video.findOne({ _id: id, portalId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }
    
    const updates = req.body;
    const allowedUpdates = [
      'title', 'titleAr', 'description', 'descriptionAr',
      'instructor', 'videoUrl', 'thumbnail', 'duration',
      'isEncrypted', 'isPublished', 'order', 'slug'
    ];
    
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        video[key] = updates[key];
      }
    });
    
    video.updatedAt = new Date();
    await video.save();
    
    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: video,
    });
  } catch (error) {
    console.error('❌ Update video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update video',
    });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const video = await Video.findOne({ _id: id, portalId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
      });
    }
    
    video.isPublished = false;
    video.isDeleted = true;
    video.deletedAt = new Date();
    video.updatedAt = new Date();
    await video.save();
    
    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete video',
    });
  }
};

// ============================================================
// ✅ ✅ إدارة الاشتراكات - النسخة النهائية الكاملة
// ============================================================

// ===== جلب جميع الاشتراكات (للمدير) =====
export const getSubscriptions = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.query.portalId || req.portal?._id;
    const { materialId, accountId, status, page = 1, limit = 50 } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = { portalId, isDeleted: { $ne: true } };
    if (materialId) query.materialId = materialId;
    if (accountId) query.accountId = accountId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('accountId', 'profile.fullName email')
        .populate('materialId', 'name nameAr code price')
        .populate('paymentId', 'reference amount status proof accountNumber accountName bankName')
        .populate({
          path: 'paymentId',
          populate: {
            path: 'proof',
            select: 'originalName size mimeType _id'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Subscription.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get subscriptions',
    });
  }
};

// ===== جلب اشتراكات المستخدم الحالي =====
export const getMySubscriptions = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const accountId = req.accountId || req.user?.id;
    const { status, materialId, page = 1, limit = 50 } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const query = { 
      portalId, 
      accountId, 
      isDeleted: { $ne: true } 
    };
    
    if (status) query.status = status;
    if (materialId) query.materialId = materialId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate('accountId', 'profile.fullName email')
        .populate('materialId', 'name nameAr code price icon instructor')
        .populate('paymentId', 'reference amount status proof accountNumber accountName bankName')
        .populate({
          path: 'paymentId',
          populate: {
            path: 'proof',
            select: 'originalName size mimeType _id'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Subscription.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get my subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get subscriptions',
    });
  }
};

// ===== جلب اشتراك نشط للمستخدم =====
export const getActiveSubscription = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const accountId = req.accountId || req.user?.id;
    const { materialId } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const query = {
      portalId,
      accountId,
      status: 'active',
      isDeleted: { $ne: true },
    };
    if (materialId) query.materialId = materialId;

    const subscription = await Subscription.findOne(query)
      .populate('accountId', 'profile.fullName email')
      .populate('materialId', 'name nameAr code price icon instructor')
      .populate('paymentId', 'reference amount status');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('❌ Get active subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get active subscription',
    });
  }
};
// ===== إنشاء اشتراك جديد =====
export const createSubscription = async (req, res) => {
  try {
    // portalId يأتي من middleware الموثوق فقط
    const portalId = req.portalId;
    const userId = req.accountId;

    const {
      materialId,
      paymentMethod,
      paymentId,
      description,
      descriptionAr,
      benefits,
      benefitsAr,
    } = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!materialId) {
      return res.status(400).json({
        success: false,
        message: 'materialId is required',
      });
    }

    // ============================================================
    // 1. التحقق من المادة داخل نفس الـ Portal
    // ============================================================
    const material = await Material.findOne({
      _id: materialId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    // ============================================================
    // 2. منع وجود اشتراك pending أو active لنفس المستخدم والمادة
    // ============================================================
    const existingSubscription = await Subscription.findOne({
      portalId,
      accountId: userId,
      materialId,
      status: { $in: ['pending', 'active'] },
      isDeleted: { $ne: true },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message:
          'You already have an active or pending subscription for this material',
        data: existingSubscription,
      });
    }

    // ============================================================
    // 3. تحديد السعر من المادة فقط
    //    لا نثق بالسعر القادم من Frontend
    // ============================================================
    const price = Number(material.price || 0);
    const currency = 'SAR';

    // ============================================================
    // 4. تحديد طريقة الدفع
    // ============================================================
    const normalizedPaymentMethod = paymentMethod || (price === 0 ? 'free' : 'manual');

    const allowedPaymentMethods = [
      'credit_card',
      'mada',
      'paypal',
      'bank_transfer',
      'manual',
      'free',
    ];

    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }

    // ============================================================
    // 5. تحديد ما إذا كان الاشتراك مجانيًا
    // ============================================================
    const isFree = price === 0;

    // ============================================================
    // 6. التحقق من Payment إذا تم إرساله
    // ============================================================
    let payment = null;

    if (paymentId) {
      payment = await Payment.findOne({
        _id: paymentId,
        portalId,
        accountId: userId,
        isDeleted: { $ne: true },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found or does not belong to this account',
        });
      }

      // منع ربط Payment باشتراك آخر
      if (
        payment.subscriptionId &&
        payment.subscriptionId.toString() !== ''
      ) {
        return res.status(400).json({
          success: false,
          message: 'This payment is already linked to a subscription',
        });
      }

      // التحقق من تطابق المبلغ
      if (Number(payment.amount) !== price) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount does not match the material price',
        });
      }

      // التحقق من العملة
      if (payment.currency !== currency) {
        return res.status(400).json({
          success: false,
          message: 'Payment currency does not match the subscription currency',
        });
      }
    }

    // ============================================================
    // 7. الاشتراك المجاني
    //    فقط إذا كانت المادة مجانية
    // ============================================================
    if (isFree) {
      if (normalizedPaymentMethod !== 'free') {
        return res.status(400).json({
          success: false,
          message: 'Free materials must use the free payment method',
        });
      }

      if (paymentId) {
        return res.status(400).json({
          success: false,
          message: 'A free subscription cannot be linked to a payment',
        });
      }
    }

    // ============================================================
    // 8. الاشتراك المدفوع
    // ============================================================
    if (!isFree) {
      if (normalizedPaymentMethod === 'free') {
        return res.status(400).json({
          success: false,
          message: 'Paid materials cannot use the free payment method',
        });
      }

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment is required for a paid subscription',
        });
      }
    }

    // ============================================================
    // 9. تحديد الحالة من Backend
    //
    // مهم جدًا:
    // لا نأخذ status أو paymentStatus من req.body
    // ============================================================
    const subscriptionStatus = isFree ? 'active' : 'pending';
    const subscriptionPaymentStatus = isFree ? 'paid' : 'pending';

    // ============================================================
    // 10. تحديد مدة الاشتراك من Backend
    // ============================================================
    const startDate = new Date();
    const endDate = new Date(startDate);

    // النظام الحالي في Frontend يعرض الاشتراك لمدة 30 يوم
    endDate.setDate(endDate.getDate() + 30);

    // ============================================================
    // 11. إنشاء الاشتراك
    // ============================================================
    const subscription = new Subscription({
      portalId,
      accountId: userId,
      materialId,

      // السعر والعملات من Backend
      price,
      currency,

      paymentMethod: normalizedPaymentMethod,

      startDate,
      endDate,

      description: description || '',
      descriptionAr: descriptionAr || '',

      // لا نسمح للعميل بتحديد مزايا اشتراك مختلفة عن النظام
      benefits: Array.isArray(benefits) ? benefits : [],
      benefitsAr: Array.isArray(benefitsAr) ? benefitsAr : [],

      // الحالات يحددها Backend
      status: subscriptionStatus,
      paymentStatus: subscriptionPaymentStatus,

      paymentId: payment ? payment._id : null,
    });

    await subscription.save();

    // ============================================================
    // 12. ربط Payment بالاشتراك
    // ============================================================
    if (payment) {
      payment.subscriptionId = subscription._id;
      await payment.save();
    }

    // ============================================================
    // 13. جلب الاشتراك مع البيانات المرتبطة
    // ============================================================
    const populatedSubscription = await Subscription.findOne({
      _id: subscription._id,
      portalId,
    })
      .populate('accountId', 'profile.fullName email')
      .populate('materialId', 'name nameAr code price')
      .populate(
        'paymentId',
        'reference amount status proof accountNumber accountName bankName'
      )
      .populate({
        path: 'paymentId',
        populate: {
          path: 'proof',
          select: 'originalName size mimeType _id',
        },
      });

    return res.status(201).json({
      success: true,
      message: isFree
        ? 'Free subscription created successfully'
        : 'Subscription created successfully and is pending payment verification',
      data: populatedSubscription,
    });
  } catch (error) {
    console.error('❌ Create subscription error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create subscription',
    });
  }
};

// ===== تحديث اشتراك =====
export const updateSubscription = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    const updates = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const subscription = await Subscription.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    const allowedUpdates = [
      'status', 'paymentStatus', 'startDate', 'endDate',
      'description', 'descriptionAr', 'benefits', 'benefitsAr',
      'paymentMethod', 'price', 'currency'
    ];

    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        subscription[key] = updates[key];
      }
    });

    if (updates.status === 'active') {
      subscription.paymentStatus = 'paid';
    }

    if (updates.status === 'cancelled') {
      subscription.paymentStatus = 'refunded';
    }

    subscription.updatedAt = new Date();
    await subscription.save();

    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('accountId', 'profile.fullName email')
      .populate('materialId', 'name nameAr code price')
      .populate('paymentId', 'reference amount status proof accountNumber accountName bankName')
      .populate({
        path: 'paymentId',
        populate: {
          path: 'proof',
          select: 'originalName size mimeType _id'
        }
      });

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: populatedSubscription,
    });
  } catch (error) {
    console.error('❌ Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update subscription',
    });
  }
};

// ===== إلغاء اشتراك =====
export const deleteSubscription = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    const userId = req.accountId || req.user?.id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const subscription = await Subscription.findOne({ _id: id, portalId });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled',
      });
    }

    subscription.status = 'cancelled';
    subscription.paymentStatus = 'refunded';
    subscription.isDeleted = true;
    subscription.deletedAt = new Date();
    subscription.deletedBy = userId;
    subscription.updatedAt = new Date();
    await subscription.save();

    if (subscription.paymentId) {
      await Payment.findByIdAndUpdate(subscription.paymentId, {
        status: 'refunded',
        updatedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('❌ Delete subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel subscription',
    });
  }
};

// ===== ✅ تفعيل اشتراك (للمدير) =====
export const activateSubscription = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const subscription = await Subscription.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending subscriptions can be activated. Current status: ${subscription.status}`,
      });
    }

    subscription.status = 'active';
    subscription.paymentStatus = 'paid';
    subscription.updatedAt = new Date();
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('❌ Activate subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate subscription',
    });
  }
};

// ============================================================
// ✅ ✅ تصدير جميع الدوال
// ============================================================

export default {
  // Universities
  getUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  
  // Colleges
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  
  // Specialties
  getSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  
  // Materials
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  
  // Videos
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  
  // Subscriptions
  getSubscriptions,
  getMySubscriptions,
  getActiveSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  activateSubscription,
};