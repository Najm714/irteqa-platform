// backend/src/controllers/review.controller.js
import { Review } from '../models/Review.model.js';
import { Request } from '../models/Request.model.js';
import { Service } from '../models/Service.model.js';
import { Account } from '../models/Account.model.js';
import { getNotificationService } from '../services/notification.service.js';

// ============================================================
// إنشاء تقييم
// ============================================================

export const createReview = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: reviewerId } = req.user;
    const {
      requestId,
      rating,
      comment,
      aspects = {},
    } = req.body;

    // ✅ التحقق من وجود الطلب
    const request = await Request.findOne({
      _id: requestId,
      portalId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // ✅ التحقق من أن الطلب مكتمل
    if (request.status !== 'completed' && request.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot review a request that is not completed',
      });
    }

    // ✅ التحقق من أن المستخدم هو صاحب الطلب
    if (request.accountId.toString() !== reviewerId) {
      return res.status(403).json({
        success: false,
        message: 'Only the request owner can review',
      });
    }

    // ✅ التحقق من عدم وجود تقييم مكرر
    const existingReview = await Review.findOne({
      portalId,
      requestId,
      reviewerId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this request',
      });
    }

    // ✅ التحقق من وجود المختص
    if (!request.specialistId) {
      return res.status(400).json({
        success: false,
        message: 'No specialist assigned to this request',
      });
    }

    // ✅ إنشاء التقييم
    const review = new Review({
      portalId,
      requestId,
      serviceId: request.serviceId,
      reviewerId,
      revieweeId: request.specialistId,
      rating,
      comment: comment || '',
      aspects: {
        quality: aspects.quality || rating,
        communication: aspects.communication || rating,
        timeliness: aspects.timeliness || rating,
        value: aspects.value || rating,
      },
      status: 'published',
    });

    await review.save();

    // ✅ تحديث متوسط تقييم المختص
    await updateSpecialistRating(request.specialistId);

    // ✅ إرسال إشعار للمختص
    try {
      const notificationService = getNotificationService(req.app.get('io'));
      const specialist = await Account.findById(request.specialistId);
      
      await notificationService.sendNotification({
        portalId,
        accountId: request.specialistId,
        type: 'review_requested',
        title: 'تقييم جديد',
        titleAr: 'تقييم جديد',
        message: `تم تقييمك من قبل ${specialist?.profile?.fullName || 'عميل'} على طلب #${request._id}`,
        messageAr: `تم تقييمك من قبل ${specialist?.profile?.fullName || 'عميل'} على طلب #${request._id}`,
        data: {
          requestId: request._id,
          reviewId: review._id,
          rating,
        },
        priority: 'medium',
      });
    } catch (error) {
      console.error('❌ Failed to send review notification:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    console.error('❌ Create review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create review',
    });
  }
};

// ============================================================
// جلب تقييمات المختص
// ============================================================

export const getSpecialistReviews = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { specialistId } = req.params;
    const {
      limit = 10,
      page = 1,
      minRating,
      maxRating,
    } = req.query;

    const query = {
      portalId,
      revieweeId: specialistId,
      status: 'published',
    };

    if (minRating) query.rating = { ...query.rating, $gte: parseInt(minRating) };
    if (maxRating) query.rating = { ...query.rating, $lte: parseInt(maxRating) };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewerId', 'profile.fullName email')
        .populate('requestId', 'title status createdAt')
        .populate('serviceId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(query),
    ]);

    // ✅ حساب إحصائيات التقييمات
    const stats = await Review.aggregate([
      { $match: { portalId, revieweeId: specialistId, status: 'published' } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
          distribution: {
            $push: '$rating',
          },
        },
      },
    ]);

    const ratingDistribution = stats[0]?.distribution?.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {}) || {};

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      stats: {
        average: stats[0]?.average || 0,
        count: stats[0]?.count || 0,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('❌ Get specialist reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get specialist reviews',
    });
  }
};

// ============================================================
// جلب تقييمات الطلب
// ============================================================

export const getRequestReviews = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { requestId } = req.params;
    const { id: userId } = req.user;

    // ✅ التحقق من وجود الطلب وصلاحية المستخدم
    const request = await Request.findOne({
      _id: requestId,
      portalId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    const isAuthorized =
      request.accountId.toString() === userId ||
      request.specialistId?.toString() === userId ||
      req.user.role === 'portal_admin' ||
      req.user.role === 'super_admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these reviews',
      });
    }

    const reviews = await Review.find({
      portalId,
      requestId,
      status: 'published',
    })
      .populate('reviewerId', 'profile.fullName email')
      .populate('revieweeId', 'profile.fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('❌ Get request reviews error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get request reviews',
    });
  }
};

// ============================================================
// تحديث تقييم
// ============================================================

export const updateReview = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const { id } = req.params;
    const { rating, comment, aspects } = req.body;

    const review = await Review.findOne({
      _id: id,
      portalId,
      reviewerId: userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not the reviewer',
      });
    }

    // ✅ منع التعديل بعد فترة (مثلاً 7 أيام)
    const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be modified within 7 days of creation',
      });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (aspects) {
      if (aspects.quality) review.aspects.quality = aspects.quality;
      if (aspects.communication) review.aspects.communication = aspects.communication;
      if (aspects.timeliness) review.aspects.timeliness = aspects.timeliness;
      if (aspects.value) review.aspects.value = aspects.value;
    }

    await review.save();

    // ✅ تحديث متوسط تقييم المختص
    await updateSpecialistRating(review.revieweeId);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    console.error('❌ Update review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update review',
    });
  }
};

// ============================================================
// حذف تقييم (للمشرفين فقط)
// ============================================================

export const deleteReview = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id } = req.params;

    const review = await Review.findOne({
      _id: id,
      portalId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // ✅ حذف منطقي (تغيير الحالة)
    review.status = 'hidden';
    await review.save();

    // ✅ تحديث متوسط تقييم المختص
    await updateSpecialistRating(review.revieweeId);

    res.status(200).json({
      success: true,
      message: 'Review hidden successfully',
    });
  } catch (error) {
    console.error('❌ Delete review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete review',
    });
  }
};

// ============================================================
// الإبلاغ عن تقييم غير مناسب
// ============================================================

export const reportReview = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    const review = await Review.findOne({
      _id: id,
      portalId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // ✅ تغيير حالة التقييم إلى مبلغ عنه
    review.status = 'reported';
    review.metadata = {
      ...review.metadata,
      reportedBy: userId,
      reportedAt: new Date(),
      reportReason: reason || 'غير محدد',
    };

    await review.save();

    // ✅ إرسال إشعار للمشرفين
    try {
      const notificationService = getNotificationService(req.app.get('io'));
      
      // جلب المشرفين
      const admins = await Account.find({
        portalId,
        role: { $in: ['portal_admin', 'super_admin'] },
        isActive: true,
      });

      for (const admin of admins) {
        await notificationService.sendNotification({
          portalId,
          accountId: admin._id,
          type: 'system_alert',
          title: 'تقييم مبلغ عنه',
          titleAr: 'تقييم مبلغ عنه',
          message: `تم الإبلاغ عن تقييم غير مناسب من قبل مستخدم`,
          messageAr: `تم الإبلاغ عن تقييم غير مناسب من قبل مستخدم`,
          data: {
            reviewId: review._id,
            requestId: review.requestId,
            reportedBy: userId,
          },
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('❌ Failed to send report notification:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Review reported successfully, admin will review it',
    });
  } catch (error) {
    console.error('❌ Report review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to report review',
    });
  }
};

// ============================================================
// دوال مساعدة
// ============================================================

/**
 * تحديث متوسط تقييم المختص
 */
async function updateSpecialistRating(specialistId) {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          revieweeId: specialistId,
          status: 'published',
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    await Account.findByIdAndUpdate(specialistId, {
      'specialistDetails.rating.average': stats[0]?.average || 0,
      'specialistDetails.rating.count': stats[0]?.count || 0,
    });
  } catch (error) {
    console.error('❌ Update specialist rating error:', error);
  }
}

export default {
  createReview,
  getSpecialistReviews,
  getRequestReviews,
  updateReview,
  deleteReview,
  reportReview,
};