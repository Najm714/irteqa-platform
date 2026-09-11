// backend/src/controllers/legal.controller.js
import { LegalPage } from '../models/LegalPage.model.js';

// ============================================================
// جلب صفحة قانونية
// ============================================================

export const getLegalPage = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { type } = req.params;

    const page = await LegalPage.findOne({
      portalId,
      type,
      isPublished: true,
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Legal page not found',
      });
    }

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('❌ Get legal page error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get legal page',
    });
  }
};

// ============================================================
// جلب جميع الصفحات القانونية
// ============================================================

export const getAllLegalPages = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { isPublished } = req.query;

    const query = { portalId };
    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    const pages = await LegalPage.find(query)
      .sort({ type: 1 })
      .select('type title titleAr isPublished version effectiveDate updatedAt');

    res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error('❌ Get all legal pages error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get legal pages',
    });
  }
};

// ============================================================
// إنشاء صفحة قانونية (للمشرفين)
// ============================================================

export const createLegalPage = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const {
      type,
      title,
      titleAr,
      content,
      contentAr,
      excerpt,
      excerptAr,
      effectiveDate,
      seo,
    } = req.body;

    // التحقق من عدم وجود صفحة بنفس النوع
    const existing = await LegalPage.findOne({ portalId, type });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Legal page of type '${type}' already exists`,
      });
    }

    const page = new LegalPage({
      portalId,
      type,
      title,
      titleAr,
      content,
      contentAr,
      excerpt: excerpt || '',
      excerptAr: excerptAr || '',
      effectiveDate: effectiveDate || new Date(),
      seo: seo || {},
      createdBy: userId,
    });

    await page.save();

    res.status(201).json({
      success: true,
      message: 'Legal page created successfully',
      data: page,
    });
  } catch (error) {
    console.error('❌ Create legal page error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create legal page',
    });
  }
};

// ============================================================
// تحديث صفحة قانونية (للمشرفين)
// ============================================================

export const updateLegalPage = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const { type } = req.params;
    const {
      title,
      titleAr,
      content,
      contentAr,
      excerpt,
      excerptAr,
      isPublished,
      effectiveDate,
      seo,
      changeNote,
    } = req.body;

    const page = await LegalPage.findOne({ portalId, type });
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Legal page not found',
      });
    }

    // تحديث الحقول
    if (title) page.title = title;
    if (titleAr) page.titleAr = titleAr;
    if (content) page.content = content;
    if (contentAr) page.contentAr = contentAr;
    if (excerpt !== undefined) page.excerpt = excerpt;
    if (excerptAr !== undefined) page.excerptAr = excerptAr;
    if (isPublished !== undefined) page.isPublished = isPublished;
    if (effectiveDate) page.effectiveDate = effectiveDate;
    if (seo) page.seo = { ...page.seo, ...seo };

    // إضافة تغيير في السجل
    if (changeNote) {
      page.addChangeLog(changeNote, userId);
    } else {
      page.updatedBy = userId;
      page.updatedAt = new Date();
    }

    await page.save();

    res.status(200).json({
      success: true,
      message: 'Legal page updated successfully',
      data: page,
    });
  } catch (error) {
    console.error('❌ Update legal page error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update legal page',
    });
  }
};

// ============================================================
// حذف صفحة قانونية (للمشرفين)
// ============================================================

export const deleteLegalPage = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { type } = req.params;

    const page = await LegalPage.findOne({ portalId, type });
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Legal page not found',
      });
    }

    // حذف منطقي
    page.isPublished = false;
    await page.save();

    res.status(200).json({
      success: true,
      message: 'Legal page deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete legal page error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete legal page',
    });
  }
};

// ============================================================
// الصفحات القانونية العامة (بدون مصادقة)
// ============================================================

export const getPublicLegalPage = async (req, res) => {
  try {
    const { type } = req.params;
    const { portalId } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const page = await LegalPage.findOne({
      portalId,
      type,
      isPublished: true,
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Legal page not found',
      });
    }

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('❌ Get public legal page error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get legal page',
    });
  }
};

// ✅ تصدير جميع الدوال
export default {
  getLegalPage,
  getAllLegalPages,
  createLegalPage,
  updateLegalPage,
  deleteLegalPage,
  getPublicLegalPage,
};