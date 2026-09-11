// backend/src/controllers/dashboard.controller.js
import mongoose from 'mongoose';
import { Request } from '../models/Request.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Payment } from '../models/Payment.model.js';
import { File } from '../models/File.model.js';
import { Message } from '../models/Message.model.js';
import { Notification } from '../models/Notification.model.js';
import { getNotificationService } from '../services/notification.service.js';

// ============================================================
// ✅ دالة مساعدة: جلب الإشعارات الأخيرة
// ============================================================
const getRecentNotifications = async (accountId, portalId, limit = 5) => {
  try {
    if (!accountId || !portalId) {
      console.log('⚠️ Missing accountId or portalId for notifications');
      return [];
    }

    const notificationService = getNotificationService();
    
    const result = await notificationService.getUserNotifications(
      accountId,
      portalId,
      {
        limit: limit,
        page: 1,
        isRead: undefined,
      }
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
// ✅ جلب إحصائيات لوحة التحكم (العميل)
// ============================================================
export const getDashboardStats = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    console.log('📊 Fetching dashboard stats for user:', accountId);

    if (!accountId || !portalId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and Portal ID are required',
      });
    }

    // ============================================================
    // 1. إحصائيات الطلبات
    // ============================================================

    const totalRequests = await Request.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    });

    const inProgressRequests = await Request.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: { 
        $in: ['new', 'under_review', 'assigned', 'scope_definition', 
              'awaiting_approval', 'awaiting_payment', 'in_progress', 
              'under_review_2', 'modification'] 
      },
    });

    const completedRequests = await Request.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: { $in: ['completed', 'closed'] },
    });

    const cancelledRequests = await Request.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: 'cancelled',
    });

    // ============================================================
    // 2. إحصائيات الاشتراكات
    // ============================================================

    const totalSubscriptions = await Subscription.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    });

    const activeSubscriptions = await Subscription.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: 'active',
    });

    const pendingSubscriptions = await Subscription.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: 'pending',
    });

    const expiredSubscriptions = await Subscription.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: 'expired',
    });

    const cancelledSubscriptions = await Subscription.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: 'cancelled',
    });

    // ============================================================
    // 3. إحصائيات المدفوعات
    // ============================================================

    const totalPayments = await Payment.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    });

    const totalAmount = await Payment.aggregate([
      {
        $match: {
          portalId: new mongoose.Types.ObjectId(portalId),
          accountId: new mongoose.Types.ObjectId(accountId),
          isDeleted: { $ne: true },
          status: 'verified',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const paidPayments = await Payment.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: 'verified',
    });

    const pendingPayments = await Payment.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: { $in: ['pending', 'submitted'] },
    });

    const rejectedPayments = await Payment.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: 'rejected',
    });

    const refundedPayments = await Payment.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: 'refunded',
    });

    // ============================================================
    // 4. إحصائيات الملفات والرسائل
    // ============================================================

    const totalFiles = await File.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    });

    // جلب معرفات الطلبات للمستخدم
    const userRequests = await Request.find({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    }).select('_id');

    const requestIds = userRequests.map(r => r._id);

    const unreadMessages = await Message.countDocuments({
      portalId,
      requestId: { $in: requestIds },
      isDeleted: false,
      isRead: false,
      senderId: { $ne: accountId },
    });

    const totalMessages = await Message.countDocuments({
      portalId,
      requestId: { $in: requestIds },
      isDeleted: false,
    });

    // ============================================================
    // 5. الإشعارات
    // ============================================================

    const recentNotifications = await getRecentNotifications(accountId, portalId, 5);

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

    const totalNotifications = await Notification.countDocuments({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    });

    // ============================================================
    // 6. آخر الطلبات
    // ============================================================

    const recentRequests = await Request.find({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    })
      .populate('serviceId', 'name nameAr icon')
      .populate('specialistId', 'profile.fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ============================================================
    // 7. آخر المدفوعات
    // ============================================================

    const recentPayments = await Payment.find({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    })
      .populate('subscriptionId', 'materialId status')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ============================================================
    // 8. آخر الاشتراكات
    // ============================================================

    const recentSubscriptions = await Subscription.find({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    })
      .populate('materialId', 'name nameAr code')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // ============================================================
    // ✅ الرد النهائي
    // ============================================================

    res.json({
      success: true,
      data: {
        // الطلبات
        totalRequests,
        inProgress: inProgressRequests,
        completed: completedRequests,
        cancelled: cancelledRequests,
        
        // الاشتراكات
        totalSubscriptions,
        activeSubscriptions,
        pendingSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions,
        
        // المدفوعات
        totalPayments,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        paidPayments,
        pendingPayments,
        rejectedPayments,
        refundedPayments,
        
        // الملفات والرسائل
        totalFiles,
        totalMessages,
        unreadMessages,
        
        // الإشعارات
        totalNotifications,
        unreadNotificationsCount,
        recentNotifications,
        
        // البيانات الأخيرة
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
      },
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
// ✅ جلب إحصائيات المختص
// ============================================================
export const getSpecialistStats = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    console.log('📊 Fetching specialist stats for:', accountId);

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

    // ✅ الطلبات المسندة
    const totalAssigned = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
    });

    const inProgress = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      status: { $in: ['assigned', 'scope_definition', 'in_progress', 'modification'] },
    });

    const completed = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      status: { $in: ['completed', 'closed'] },
    });

    const pendingReview = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      status: 'under_review_2',
    });

    // ✅ المكالمات القادمة
    const upcomingCalls = await Request.aggregate([
      {
        $match: {
          portalId: new mongoose.Types.ObjectId(portalId),
          specialistId: new mongoose.Types.ObjectId(accountId),
          isDeleted: { $ne: true },
          'calls.status': 'scheduled',
        },
      },
      { $unwind: '$calls' },
      { $match: { 'calls.status': 'scheduled' } },
      { $count: 'total' },
    ]);

    // ✅ الملفات
    const totalFiles = await File.countDocuments({
      portalId,
      uploadedBy: accountId,
      isDeleted: { $ne: true },
    });

    // ✅ الرسائل غير المقروءة
    const requests = await Request.find({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
    }).select('_id');

    const requestIds = requests.map(r => r._id);

    const unreadMessages = await Message.countDocuments({
      portalId,
      requestId: { $in: requestIds },
      isDeleted: false,
      isRead: false,
      senderId: { $ne: accountId },
    });

    // ✅ آخر الطلبات
    const recentRequests = await Request.find({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
    })
      .populate('serviceId', 'name nameAr')
      .populate('accountId', 'profile.fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        totalAssigned,
        inProgress,
        completed,
        pendingReview,
        upcomingCalls: upcomingCalls.length > 0 ? upcomingCalls[0].total : 0,
        totalFiles,
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
      },
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
// ✅ جلب إحصائيات المدير
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

    const [
      totalRequests,
      totalUsers,
      totalSpecialists,
      totalAdmins,
      totalSubscriptions,
      totalPayments,
      totalRevenue,
      pendingPayments,
    ] = await Promise.all([
      Request.countDocuments({ portalId, isDeleted: { $ne: true } }),
      Account.countDocuments({ portalId, isDeleted: { $ne: true }, role: 'customer' }),
      Account.countDocuments({ portalId, isDeleted: { $ne: true }, role: 'specialist' }),
      Account.countDocuments({ 
        portalId, 
        isDeleted: { $ne: true }, 
        role: { $in: ['portal_admin', 'super_admin'] } 
      }),
      Subscription.countDocuments({ portalId, isDeleted: { $ne: true } }),
      Payment.countDocuments({ portalId, isDeleted: { $ne: true } }),
      Payment.aggregate([
        { 
          $match: { 
            portalId: new mongoose.Types.ObjectId(portalId), 
            isDeleted: { $ne: true }, 
            status: 'verified' 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ 
        portalId, 
        isDeleted: { $ne: true }, 
        status: { $in: ['pending', 'submitted'] } 
      }),
    ]);

    const activeSubscriptions = await Subscription.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      status: 'active',
    });

    const completedRequests = await Request.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      status: { $in: ['completed', 'closed'] },
    });

    res.json({
      success: true,
      data: {
        totalRequests,
        completedRequests,
        totalUsers,
        totalSpecialists,
        totalAdmins,
        totalSubscriptions,
        activeSubscriptions,
        totalPayments,
        pendingPayments,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      },
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
// ✅ جلب النشاطات الأخيرة
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

    const activities = [];

    // ✅ آخر الطلبات
    const requests = await Request.find({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

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

    // ✅ آخر المدفوعات
    const payments = await Payment.find({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

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

    // ✅ آخر الاشتراكات
    const subscriptions = await Subscription.find({
      portalId,
      accountId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

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

    // ✅ ترتيب حسب التاريخ (الأحدث أولاً)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: activities.slice(0, 10),
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
// ✅ تصدير جميع الدوال
// ============================================================
export default {
  getDashboardStats,
  getSpecialistStats,
  getAdminStats,
  getRecentActivity,
};