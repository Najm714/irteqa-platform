// backend/src/controllers/dashboard.controller.js
import mongoose from 'mongoose';
import { Request } from '../models/Request.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Payment } from '../models/Payment.model.js';
import { File } from '../models/File.model.js';
import { Message } from '../models/Message.model.js';
import { Notification } from '../models/Notification.model.js';
import { Account } from '../models/Account.model.js';
import { getNotificationService } from '../services/notification.service.js';

// ============================================================
// ✅ Cache للنظام (لمنع الاستعلامات المتكررة)
// ============================================================
const statsCache = new Map();
const CACHE_DURATION = 60 * 1000; // 60 ثانية

const getCachedStats = (key) => {
  const cached = statsCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    statsCache.delete(key);
    return null;
  }
  return cached.data;
};

const setCachedStats = (key, data) => {
  statsCache.set(key, { data, timestamp: Date.now() });
};

const clearUserCache = (accountId, portalId) => {
  // مسح cache المستخدم (عند التحديث)
  const prefix = `${portalId}:${accountId}:`;
  for (const key of statsCache.keys()) {
    if (key.startsWith(prefix)) {
      statsCache.delete(key);
    }
  }
};

// ============================================================
// ✅ دالة مساعدة: جلب الإشعارات الأخيرة
// ============================================================
const getRecentNotifications = async (accountId, portalId, limit = 5) => {
  try {
    if (!accountId || !portalId) return [];

    const notificationService = getNotificationService();
    const result = await notificationService.getUserNotifications(
      accountId,
      portalId,
      { limit, page: 1, isRead: undefined }
    );

    return result.notifications.map(notif => ({
      _id: notif._id,
      message: notif.messageAr || notif.message || 'إشعار جديد',
      read: notif.isRead || false,
      createdAt: notif.createdAt,
      type: notif.type || 'general',
      data: notif.data || {},
      title: notif.titleAr || notif.title || '',
    }));
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return [];
  }
};

// ============================================================
// ✅ جلب إحصائيات لوحة التحكم (محسّن)
// ============================================================
export const getDashboardStats = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    if (!accountId || !portalId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and Portal ID are required',
      });
    }

    // ✅ 1. افحص Cache أولاً
    const cacheKey = `${portalId}:${accountId}:stats`;
    const cached = getCachedStats(cacheKey);
    if (cached) {
      console.log('✅ Returning CACHED dashboard stats');
      return res.json({ success: true, data: cached, cached: true });
    }

    console.log('📊 Fetching dashboard stats for:', accountId);

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    const portalObjectId = new mongoose.Types.ObjectId(portalId);

    // ✅ 2. كل الاستعلامات بالتوازي (Promise.all)
    const [
      requestStats,
      subscriptionStats,
      paymentStats,
      fileCount,
      userRequests,
    ] = await Promise.all([
      // --- إحصائيات الطلبات (استعلام واحد بدل 4) ---
      Request.aggregate([
        {
          $match: {
            portalId: portalObjectId,
            accountId: accountObjectId,
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            inProgress: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      ['new', 'under_review', 'assigned', 'scope_definition',
                       'awaiting_approval', 'awaiting_payment', 'in_progress',
                       'under_review_2', 'modification']
                    ]
                  },
                  1, 0
                ]
              }
            },
            completed: {
              $sum: { $cond: [{ $in: ['$status', ['completed', 'closed']] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
          },
        },
      ]),

      // --- إحصائيات الاشتراكات (استعلام واحد بدل 5) ---
      Subscription.aggregate([
        {
          $match: {
            portalId: portalObjectId,
            accountId: accountObjectId,
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          },
        },
      ]),

      // --- إحصائيات المدفوعات (استعلام واحد بدل 6) ---
      Payment.aggregate([
        {
          $match: {
            portalId: portalObjectId,
            accountId: accountObjectId,
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'verified'] }, '$amount', 0] }
            },
            paid: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
            pending: {
              $sum: { $cond: [{ $in: ['$status', ['pending', 'submitted']] }, 1, 0] }
            },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            refunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
          },
        },
      ]),

      // --- عدد الملفات ---
      File.countDocuments({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      }),

      // --- طلبات المستخدم (للرسائل) ---
      Request.find({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      }).select('_id').lean(),
    ]);

    // ✅ 3. استخراج النتائج مع قيم افتراضية
    const reqStats = requestStats[0] || { total: 0, inProgress: 0, completed: 0, cancelled: 0 };
    const subStats = subscriptionStats[0] || { total: 0, active: 0, pending: 0, expired: 0, cancelled: 0 };
    const payStats = paymentStats[0] || { total: 0, totalAmount: 0, paid: 0, pending: 0, rejected: 0, refunded: 0 };

    // ✅ 4. الاستعلامات المعتمدة على requestIds (بالتوازي)
    const requestIds = userRequests.map(r => r._id);

    const [
      messagesStats,
      totalNotifications,
      recentRequests,
      recentPayments,
      recentSubscriptions,
      recentNotifications,
    ] = await Promise.all([
      // --- الرسائل ---
      Message.aggregate([
        {
          $match: {
            portalId: portalObjectId,
            requestId: { $in: requestIds },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$isRead', false] },
                      { $ne: ['$senderId', accountObjectId] },
                    ]
                  },
                  1, 0
                ]
              }
            },
          },
        },
      ]),

      // --- الإشعارات ---
      Notification.countDocuments({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      }),

      // --- آخر الطلبات ---
      Request.find({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      })
        .populate('serviceId', 'name nameAr icon')
        .populate('specialistId', 'profile.fullName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // --- آخر المدفوعات ---
      Payment.find({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      })
        .populate('subscriptionId', 'materialId status')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // --- آخر الاشتراكات ---
      Subscription.find({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      })
        .populate('materialId', 'name nameAr code')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // --- الإشعارات الأخيرة ---
      getRecentNotifications(accountId, portalId, 5),
    ]);

    const msgStats = messagesStats[0] || { total: 0, unread: 0 };

    // ✅ 5. الإشعارات غير المقروءة
    let unreadNotificationsCount = 0;
    try {
      const notificationService = getNotificationService();
      const result = await notificationService.getUserNotifications(
        accountId,
        portalId,
        { limit: 1, isRead: false }
      );
      unreadNotificationsCount = result.unreadCount || 0;
    } catch (err) {
      console.log('⚠️ Could not fetch unread count:', err.message);
    }

    // ✅ 6. تجميع النتيجة النهائية
    const statsData = {
      totalRequests: reqStats.total,
      inProgress: reqStats.inProgress,
      completed: reqStats.completed,
      cancelled: reqStats.cancelled,

      totalSubscriptions: subStats.total,
      activeSubscriptions: subStats.active,
      pendingSubscriptions: subStats.pending,
      expiredSubscriptions: subStats.expired,
      cancelledSubscriptions: subStats.cancelled,

      totalPayments: payStats.total,
      totalAmount: payStats.totalAmount,
      paidPayments: payStats.paid,
      pendingPayments: payStats.pending,
      rejectedPayments: payStats.rejected,
      refundedPayments: payStats.refunded,

      totalFiles: fileCount,
      totalMessages: msgStats.total,
      unreadMessages: msgStats.unread,

      totalNotifications,
      unreadNotificationsCount,
      recentNotifications,

      recentRequests: recentRequests.map(r => ({
        _id: r._id,
        title: r.formData?.title || r.title || 'طلب',
        status: r.status,
        serviceName: r.serviceId?.nameAr || r.serviceId?.name || 'خدمة',
        specialistName: r.specialistId?.profile?.fullName || 'غير معين',
        createdAt: r.createdAt,
        requestNumber: r.requestNumber,
      })),

      recentPayments: recentPayments.map(p => ({
        _id: p._id,
        amount: p.amount,
        currency: p.currency || 'SAR',
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
        reference: p.reference,
      })),

      recentSubscriptions: recentSubscriptions.map(s => ({
        _id: s._id,
        materialName: s.materialId?.nameAr || s.materialId?.name || 'مادة',
        materialCode: s.materialId?.code || '',
        status: s.status,
        price: s.price,
        startDate: s.startDate,
        endDate: s.endDate,
        createdAt: s.createdAt,
      })),
    };

    // ✅ 7. حفظ في Cache
    setCachedStats(cacheKey, statsData);

    console.log('✅ Dashboard stats fetched in optimized way');

    res.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    console.error('❌ Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get dashboard stats',
    });
  }
};

// ============================================================
// ✅ جلب إحصائيات المختص (محسّن)
// ============================================================
export const getSpecialistStats = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    if (!accountId || !portalId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and Portal ID are required',
      });
    }

    if (req.account?.role !== 'specialist') {
      return res.status(403).json({
        success: false,
        message: 'Only specialists can access this endpoint',
      });
    }

    // ✅ Cache
    const cacheKey = `${portalId}:${accountId}:specialist-stats`;
    const cached = getCachedStats(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    const portalObjectId = new mongoose.Types.ObjectId(portalId);

    // ✅ كل الاستعلامات بالتوازي
    const [requestStats, fileCount, upcomingCalls, requests] = await Promise.all([
      Request.aggregate([
        {
          $match: {
            portalId: portalObjectId,
            specialistId: accountObjectId,
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            inProgress: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['assigned', 'scope_definition', 'in_progress', 'modification']] },
                  1, 0
                ]
              }
            },
            completed: {
              $sum: { $cond: [{ $in: ['$status', ['completed', 'closed']] }, 1, 0] }
            },
            pendingReview: {
              $sum: { $cond: [{ $eq: ['$status', 'under_review_2'] }, 1, 0] }
            },
          },
        },
      ]),
      File.countDocuments({
        portalId: portalObjectId,
        uploadedBy: accountObjectId,
        isDeleted: { $ne: true },
      }),
      Request.aggregate([
        {
          $match: {
            portalId: portalObjectId,
            specialistId: accountObjectId,
            isDeleted: { $ne: true },
            'calls.status': 'scheduled',
          },
        },
        { $unwind: '$calls' },
        { $match: { 'calls.status': 'scheduled' } },
        { $count: 'total' },
      ]),
      Request.find({
        portalId: portalObjectId,
        specialistId: accountObjectId,
        isDeleted: { $ne: true },
      }).select('_id').lean(),
    ]);

    const reqStats = requestStats[0] || { total: 0, inProgress: 0, completed: 0, pendingReview: 0 };
    const requestIds = requests.map(r => r._id);

    const [unreadMessages, recentRequests] = await Promise.all([
      Message.countDocuments({
        portalId: portalObjectId,
        requestId: { $in: requestIds },
        isDeleted: false,
        isRead: false,
        senderId: { $ne: accountObjectId },
      }),
      Request.find({
        portalId: portalObjectId,
        specialistId: accountObjectId,
        isDeleted: { $ne: true },
      })
        .populate('serviceId', 'name nameAr')
        .populate('accountId', 'profile.fullName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const statsData = {
      totalAssigned: reqStats.total,
      inProgress: reqStats.inProgress,
      completed: reqStats.completed,
      pendingReview: reqStats.pendingReview,
      upcomingCalls: upcomingCalls.length > 0 ? upcomingCalls[0].total : 0,
      totalFiles: fileCount,
      unreadMessages,
      recentRequests: recentRequests.map(r => ({
        _id: r._id,
        title: r.formData?.title || r.title || 'طلب',
        status: r.status,
        serviceName: r.serviceId?.nameAr || r.serviceId?.name || 'خدمة',
        customerName: r.accountId?.profile?.fullName || 'عميل',
        createdAt: r.createdAt,
        requestNumber: r.requestNumber,
      })),
      notifications: [],
    };

    setCachedStats(cacheKey, statsData);

    res.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    console.error('❌ Error in getSpecialistStats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get specialist stats',
    });
  }
};

// ============================================================
// ✅ جلب إحصائيات المدير (محسّن)
// ============================================================
export const getAdminStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const cacheKey = `${portalId}:admin:stats`;
    const cached = getCachedStats(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const portalObjectId = new mongoose.Types.ObjectId(portalId);

    const [
      requestStats,
      accountStats,
      subscriptionStats,
      paymentStats,
      completedRequests,
      activeSubscriptions,
    ] = await Promise.all([
      // الطلبات
      Request.aggregate([
        { $match: { portalId: portalObjectId, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),

      // الحسابات (مجموعة واحدة)
      Account.aggregate([
        { $match: { portalId: portalObjectId, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
            totalSpecialists: { $sum: { $cond: [{ $eq: ['$role', 'specialist'] }, 1, 0] } },
            totalAdmins: {
              $sum: {
                $cond: [{ $in: ['$role', ['portal_admin', 'super_admin']] }, 1, 0]
              }
            },
          },
        },
      ]),

      // الاشتراكات
      Subscription.aggregate([
        { $match: { portalId: portalObjectId, isDeleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: 1 } } },
      ]),

      // المدفوعات (مجموعة واحدة)
      Payment.aggregate([
        { $match: { portalId: portalObjectId, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $in: ['$status', ['pending', 'submitted']] }, 1, 0] }
            },
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'verified'] }, '$amount', 0] }
            },
          },
        },
      ]),

      // الطلبات المكتملة
      Request.countDocuments({
        portalId: portalObjectId,
        isDeleted: { $ne: true },
        status: { $in: ['completed', 'closed'] },
      }),

      // الاشتراكات النشطة
      Subscription.countDocuments({
        portalId: portalObjectId,
        isDeleted: { $ne: true },
        status: 'active',
      }),
    ]);

    const reqStats = requestStats[0] || { total: 0 };
    const accStats = accountStats[0] || { totalUsers: 0, totalSpecialists: 0, totalAdmins: 0 };
    const subStats = subscriptionStats[0] || { total: 0 };
    const payStats = paymentStats[0] || { total: 0, pending: 0, totalRevenue: 0 };

    const statsData = {
      totalRequests: reqStats.total,
      completedRequests,
      totalUsers: accStats.totalUsers,
      totalSpecialists: accStats.totalSpecialists,
      totalAdmins: accStats.totalAdmins,
      totalSubscriptions: subStats.total,
      activeSubscriptions,
      totalPayments: payStats.total,
      pendingPayments: payStats.pending,
      totalRevenue: payStats.totalRevenue,
    };

    setCachedStats(cacheKey, statsData);

    res.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    console.error('❌ Error in getAdminStats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admin stats',
    });
  }
};

// ============================================================
// ✅ جلب النشاطات الأخيرة (محسّن)
// ============================================================
export const getRecentActivity = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    if (!accountId || !portalId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and Portal ID are required',
      });
    }

    const cacheKey = `${portalId}:${accountId}:recent-activity`;
    const cached = getCachedStats(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const accountObjectId = new mongoose.Types.ObjectId(accountId);
    const portalObjectId = new mongoose.Types.ObjectId(portalId);

    // ✅ كل الاستعلامات بالتوازي
    const [requests, payments, subscriptions] = await Promise.all([
      Request.find({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Payment.find({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),

      Subscription.find({
        portalId: portalObjectId,
        accountId: accountObjectId,
        isDeleted: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .limit(2)
        .lean(),
    ]);

    const activities = [];

    requests.forEach(r => {
      activities.push({
        action: 'request_created',
        description: `تم إنشاء طلب جديد: ${r.formData?.title || r.title || 'طلب'}`,
        createdAt: r.createdAt,
        link: `/request/${r._id}`,
        type: 'request',
        data: { requestId: r._id, status: r.status },
      });
    });

    payments.forEach(p => {
      activities.push({
        action: 'payment_submitted',
        description: `تم تقديم دفع بقيمة ${p.amount} ريال`,
        createdAt: p.createdAt,
        link: `/payments/${p._id}`,
        type: 'payment',
        data: { paymentId: p._id, amount: p.amount, status: p.status },
      });
    });

    subscriptions.forEach(s => {
      activities.push({
        action: 'subscription_created',
        description: `تم الاشتراك في مادة جديدة`,
        createdAt: s.createdAt,
        link: `/subscriptions/${s._id}`,
        type: 'subscription',
        data: { subscriptionId: s._id, status: s.status },
      });
    });

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const result = activities.slice(0, 10);
    setCachedStats(cacheKey, result);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Error in getRecentActivity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recent activity',
    });
  }
};

// ============================================================
// ✅ دالة لمسح Cache (عند التحديثات)
// ============================================================
export const invalidateUserCache = (accountId, portalId) => {
  clearUserCache(accountId, portalId);
};

// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================
export default {
  getDashboardStats,
  getSpecialistStats,
  getAdminStats,
  getRecentActivity,
  invalidateUserCache,
};