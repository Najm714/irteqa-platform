// backend/src/controllers/offer.controller.js
import { Offer } from '../models/offer.model.js';
import { File } from '../models/File.model.js';
import storageService from '../services/storage.service.js';

// ============================================================
// ✅ إضافة عرض جديد
// ============================================================
export const addOffer = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;
    const {
      title,
      titleAr,
      description,
      descriptionAr,
      imageId,
      discountType,
      discountValue,
      originalPrice,
      currency,
      startDate,
      endDate,
      category,
      categoryAr,
      tags,
      isPublished,
      isFeatured,
      isActive,
      order,
    } = req.body;

    console.log('📤 Adding new offer...');
    console.log('  - Portal:', portalId);
    console.log('  - Title:', title);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!title || !titleAr) {
      return res.status(400).json({
        success: false,
        message: 'Title and Arabic title are required',
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date is required',
      });
    }

    // ✅ التحقق من وجود الصورة
    let image = null;
    if (imageId) {
      image = await File.findOne({ _id: imageId, portalId, isDeleted: { $ne: true } });
      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image file not found',
        });
      }
    }

    const offer = new Offer({
      portalId,
      title,
      titleAr,
      description: description || '',
      descriptionAr: descriptionAr || '',
      imageId: imageId || null,
      discountType: discountType || 'percentage',
      discountValue: discountValue || 0,
      originalPrice: originalPrice || 0,
      currency: currency || 'SAR',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      category: category || 'service',
      categoryAr: categoryAr || 'خدمات',
      tags: tags || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      isFeatured: isFeatured || false,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      createdBy: accountId,
    });

    await offer.save();

    // ✅ جلب البيانات الكاملة
    const populated = await Offer.findById(offer._id)
      .populate('imageId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    console.log('✅ Offer added:', offer._id);

    res.status(201).json({
      success: true,
      data: populated,
      message: 'تم إضافة العرض بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in addOffer:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب جميع العروض
// ============================================================
export const getOffers = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { 
      category, 
      search, 
      isPublished, 
      isFeatured, 
      isActive,
      page = 1, 
      limit = 20 
    } = req.query;

    console.log('📤 Fetching offers for portal:', portalId);

    const query = { portalId, isDeleted: { $ne: true } };
    if (category) query.category = category;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let offersQuery = Offer.find(query)
      .populate('imageId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName')
      .sort({ isFeatured: -1, order: 1, createdAt: -1 });

    if (search) {
      offersQuery = offersQuery.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { titleAr: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { descriptionAr: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const [offers, total] = await Promise.all([
      offersQuery.skip(skip).limit(parseInt(limit)),
      Offer.countDocuments(query),
    ]);

    // ✅ إضافة معلومات إضافية لكل عرض
    const offersWithStatus = offers.map(offer => ({
      ...offer.toObject(),
      isActiveOffer: offer.isActiveOffer(),
      discountPercentage: offer.getDiscountPercentage(),
      savings: offer.getSavings(),
    }));

    res.json({
      success: true,
      data: offersWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getOffers:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب عرض محدد
// ============================================================
export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const offer = await Offer.findOne({ _id: id, portalId, isDeleted: { $ne: true } })
      .populate('imageId', 'originalName size mimeType storageKey')
      .populate('createdBy', 'profile.fullName');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    // ✅ زيادة عدد المشاهدات
    offer.views += 1;
    await offer.save();

    const offerData = {
      ...offer.toObject(),
      isActiveOffer: offer.isActiveOffer(),
      discountPercentage: offer.getDiscountPercentage(),
      savings: offer.getSavings(),
    };

    res.json({
      success: true,
      data: offerData,
    });
  } catch (error) {
    console.error('❌ Error in getOfferById:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================================
// ✅ تحديث عرض
// ============================================================
export const updateOffer = async (req, res) => {
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

    const offer = await Offer.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    // ========================================================
    // التحقق من imageId الجديد
    // يجب أن تكون الصورة تابعة لنفس الـ Portal
    // ========================================================
    if (updates.imageId !== undefined) {
      if (updates.imageId === null || updates.imageId === '') {
        offer.imageId = null;
      } else {
        const image = await File.findOne({
          _id: updates.imageId,
          portalId,
          isDeleted: { $ne: true },
        });

        if (!image) {
          return res.status(403).json({
            success: false,
            message:
              'Image file is not authorized for this portal.',
            code: 'IMAGE_PORTAL_ACCESS_DENIED',
          });
        }

        offer.imageId = image._id;
      }
    }

    const allowedFields = [
      'title',
      'titleAr',
      'description',
      'descriptionAr',
      'discountType',
      'discountValue',
      'originalPrice',
      'currency',
      'startDate',
      'endDate',
      'category',
      'categoryAr',
      'tags',
      'isPublished',
      'isFeatured',
      'isActive',
      'order',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        offer[field] = updates[field];
      }
    }

    if (updates.startDate) {
      offer.startDate = new Date(updates.startDate);
    }

    if (updates.endDate) {
      offer.endDate = new Date(updates.endDate);
    }

    offer.updatedAt = new Date();

    await offer.save();

    const populated = await Offer.findOne({
      _id: offer._id,
      portalId,
      isDeleted: { $ne: true },
    })
      .populate(
        'imageId',
        'originalName size mimeType storageKey portalId isDeleted'
      )
      .populate('createdBy', 'profile.fullName');

    res.json({
      success: true,
      data: populated,
      message: 'تم تحديث العرض بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in updateOffer:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update offer',
    });
  }
};

// ============================================================
// ✅ حذف عرض
// ============================================================
export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;

    const offer = await Offer.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    offer.isDeleted = true;
    offer.deletedAt = new Date();
    offer.deletedBy = accountId;
    await offer.save();

    res.json({
      success: true,
      message: 'تم حذف العرض بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in deleteOffer:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================================
// ✅ عرض صورة العرض
// ============================================================
export const viewOfferImage = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    console.log('🖼️ Viewing offer image:', id);
    console.log('  - Portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // ✅ البحث عن العرض داخل الـ Portal المحدد فقط
    const offer = await Offer.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    }).populate({
      path: 'imageId',
      select:
        'originalName size mimeType storageKey portalId accountId isDeleted',
      match: {
        portalId,
        isDeleted: { $ne: true },
      },
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    if (!offer.isPublished || !offer.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This offer is not available',
      });
    }

    if (!offer.imageId) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in this portal',
        code: 'IMAGE_PORTAL_MISMATCH',
      });
    }

    // ✅ دفاع إضافي:
    // يجب أن يكون ملف الصورة تابعًا لنفس Portal الخاص بالعرض
    if (
      !offer.imageId.portalId ||
      offer.imageId.portalId.toString() !== portalId.toString()
    ) {
      console.warn(
        `🚫 Offer image portal mismatch: ` +
        `offer=${offer._id}, ` +
        `image=${offer.imageId._id}, ` +
        `requestedPortal=${portalId}`
      );

      return res.status(403).json({
        success: false,
        message: 'Image does not belong to this portal',
        code: 'IMAGE_PORTAL_ACCESS_DENIED',
      });
    }

    // ✅ جلب الصورة من التخزين
    const fileBuffer = await storageService.getFile(
      offer.imageId
    );

    res.setHeader(
      'Content-Type',
      offer.imageId.mimeType || 'image/jpeg'
    );

    res.setHeader(
      'Content-Length',
      fileBuffer.length
    );

    res.setHeader(
      'Cache-Control',
      'public, max-age=86400'
    );

    res.setHeader(
      'Access-Control-Allow-Origin',
      '*'
    );

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(
        offer.imageId.originalName
      )}"`
    );

    return res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Error in viewOfferImage:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to view offer image',
    });
  }
};

// ============================================================
// ✅ الحصول على إحصائيات العروض
// ============================================================
export const getOfferStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    const [total, published, featured, active, byCategory] = await Promise.all([
      Offer.countDocuments({ portalId, isDeleted: { $ne: true } }),
      Offer.countDocuments({ portalId, isDeleted: { $ne: true }, isPublished: true }),
      Offer.countDocuments({ portalId, isDeleted: { $ne: true }, isFeatured: true }),
      Offer.countDocuments({ 
        portalId, 
        isDeleted: { $ne: true }, 
        isPublished: true, 
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }),
      Offer.aggregate([
        { $match: { portalId, isDeleted: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalViews = await Offer.aggregate([
      { $match: { portalId, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        published,
        featured,
        active,
        categories: byCategory,
        totalViews: totalViews[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('❌ Error in getOfferStats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تسجيل نقرة على العرض
// ============================================================
export const trackOfferClick = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const offer = await Offer.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    offer.clicks += 1;
    await offer.save();

    res.json({
      success: true,
      data: { clicks: offer.clicks },
    });
  } catch (error) {
    console.error('❌ Error in trackOfferClick:', error);
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
  addOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  viewOfferImage,
  getOfferStats,
  trackOfferClick,
};