// backend/src/controllers/report.controller.js
import { Request } from '../models/Request.model.js';
import { Account } from '../models/Account.model.js';
import { Payment } from '../models/Payment.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Review } from '../models/Review.model.js';
import { Content } from '../models/Content.model.js';
import { Service } from '../models/Service.model.js';
import { Section } from '../models/Section.model.js';
import { Video } from '../models/Video.model.js';
import { Summary } from '../models/Summary.model.js';

// ============================================================
// ✅ تقرير الطلبات
// ============================================================

export const getRequestsReport = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { startDate, endDate, status, specialistId } = req.query;

    console.log('📊 Generating requests report for portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const match = { portalId, isDeleted: { $ne: true } };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
    if (status) match.status = status;
    if (specialistId) match.specialistId = specialistId;

    // ✅ إحصائيات الطلبات
    const [total, byStatus, byService, bySpecialist, timeline] = await Promise.all([
      Request.countDocuments(match),
      
      // حسب الحالة
      Request.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      
      // حسب الخدمة
      Request.aggregate([
        { $match: match },
        { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$service.name', nameAr: '$service.nameAr', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      
      // حسب المختص
      Request.aggregate([
        { $match: { ...match, specialistId: { $exists: true, $ne: null } } },
        { $group: { _id: '$specialistId', count: { $sum: 1 } } },
        { $lookup: { from: 'accounts', localField: '_id', foreignField: '_id', as: 'specialist' } },
        { $unwind: { path: '$specialist', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$specialist.fullName', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      
      // الجدول الزمني (يومي)
      Request.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        byService,
        bySpecialist,
        timeline,
        summary: {
          new: byStatus.find(s => s._id === 'new')?.count || 0,
          under_review: byStatus.find(s => s._id === 'under_review')?.count || 0,
          assigned: byStatus.find(s => s._id === 'assigned')?.count || 0,
          in_progress: byStatus.find(s => s._id === 'in_progress')?.count || 0,
          completed: byStatus.find(s => s._id === 'completed')?.count || 0,
          cancelled: byStatus.find(s => s._id === 'cancelled')?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('❌ Get requests report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get requests report',
    });
  }
};

// ============================================================
// ✅ تقرير المدفوعات
// ============================================================

export const getPaymentsReport = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { startDate, endDate, status } = req.query;

    console.log('📊 Generating payments report for portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const match = { portalId, isDeleted: { $ne: true } };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
    if (status) match.status = status;

    // ✅ إحصائيات المدفوعات
    const [total, byStatus, byMethod, dailyRevenue] = await Promise.all([
      Payment.countDocuments(match),
      
      // حسب الحالة
      Payment.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
        { $sort: { count: -1 } },
      ]),
      
      // حسب طريقة الدفع
      Payment.aggregate([
        { $match: { ...match, status: 'verified' } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } },
        { $sort: { count: -1 } },
      ]),
      
      // الإيرادات اليومية
      Payment.aggregate([
        { $match: { ...match, status: 'verified' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    // ✅ حساب الإجماليات
    const totalRevenue = byStatus
      .filter(s => s._id === 'verified' || s._id === 'paid')
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const pendingAmount = byStatus
      .filter(s => s._id === 'pending' || s._id === 'submitted')
      .reduce((sum, s) => sum + (s.total || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        total,
        totalRevenue,
        pendingAmount,
        byStatus,
        byMethod,
        dailyRevenue,
        summary: {
          verified: byStatus.find(s => s._id === 'verified' || s._id === 'paid')?.count || 0,
          pending: byStatus.find(s => s._id === 'pending')?.count || 0,
          rejected: byStatus.find(s => s._id === 'rejected')?.count || 0,
          refunded: byStatus.find(s => s._id === 'refunded')?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('❌ Get payments report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payments report',
    });
  }
};

// ============================================================
// ✅ تقرير المستخدمين
// ============================================================

export const getUsersReport = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { startDate, endDate, role } = req.query;

    console.log('📊 Generating users report for portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const match = { portalId, isDeleted: { $ne: true } };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
    if (role) match.role = role;

    // ✅ إحصائيات المستخدمين
    const [total, byRole, byStatus, newUsersTimeline, topSpecialists] = await Promise.all([
      Account.countDocuments(match),
      
      // حسب الدور
      Account.aggregate([
        { $match: match },
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      
      // حسب الحالة
      Account.aggregate([
        { $match: match },
        { $group: { _id: '$isActive', count: { $sum: 1 } } },
      ]),
      
      // المستخدمين الجدد (يومي)
      Account.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      
      // أفضل المختصين (حسب التقييم)
      Account.aggregate([
        { $match: { portalId, role: 'specialist', isActive: true } },
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'specialistId', as: 'reviews' } },
        { $project: { 
          name: '$fullName',
          email: 1,
          rating: { $avg: '$reviews.rating' },
          reviews: { $size: '$reviews' },
        } },
        { $sort: { rating: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const activeUsers = byStatus.find(s => s._id === true)?.count || 0;
    const inactiveUsers = byStatus.find(s => s._id === false)?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        activeUsers,
        inactiveUsers,
        byRole,
        newUsersTimeline,
        topSpecialists,
        summary: {
          customers: byRole.find(r => r._id === 'customer')?.count || 0,
          specialists: byRole.find(r => r._id === 'specialist')?.count || 0,
          admins: byRole.find(r => r._id === 'portal_admin')?.count || 0,
          superAdmins: byRole.find(r => r._id === 'super_admin')?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('❌ Get users report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get users report',
    });
  }
};

// ============================================================
// ✅ تقرير المحتوى
// ============================================================

export const getContentReport = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { startDate, endDate } = req.query;

    console.log('📊 Generating content report for portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const match = { portalId, isDeleted: { $ne: true } };
    if (startDate) match.createdAt = { $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };

    // ✅ إحصائيات المحتوى
    const [videos, summaries] = await Promise.all([
      Video.countDocuments(match),
      Summary.countDocuments(match),
    ]);

    const totalContent = videos + summaries;

    res.status(200).json({
      success: true,
      data: {
        total: totalContent,
        videos,
        summaries,
        byType: [
          { _id: 'video', count: videos },
          { _id: 'summary', count: summaries },
        ],
        summary: {
          videos,
          summaries,
          total: totalContent,
        },
      },
    });
  } catch (error) {
    console.error('❌ Get content report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get content report',
    });
  }
};

// ============================================================
// ✅ تقرير شامل (Full Report)
// ============================================================

export const getFullReport = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { period = '30d' } = req.query;

    console.log('📊 Generating full report for portal:', portalId);
    console.log('  - Period:', period);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    // ✅ تحديد الفترة الزمنية
    let days = 30;
    if (period === '7d') days = 7;
    if (period === '30d') days = 30;
    if (period === '90d') days = 90;
    if (period === '365d') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // ✅ 1. إحصائيات الطلبات
    const totalRequests = await Request.countDocuments({
      portalId,
      isDeleted: { $ne: true },
    });

    const newRequests = await Request.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      createdAt: { $gte: startDate },
    });

    const previousRequests = await Request.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      createdAt: { $gte: previousStartDate, $lt: startDate },
    });

    // ✅ 2. إحصائيات المستخدمين
    const totalUsers = await Account.countDocuments({
      portalId,
      isDeleted: { $ne: true },
    });

    const newUsers = await Account.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      createdAt: { $gte: startDate },
    });

    const previousUsers = await Account.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      createdAt: { $gte: previousStartDate, $lt: startDate },
    });

    const activeUsers = await Account.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      lastLogin: { $gte: startDate },
    });

    // ✅ 3. إحصائيات المدفوعات
    const totalRevenue = await Payment.aggregate([
      {
        $match: {
          portalId,
          isDeleted: { $ne: true },
          status: { $in: ['verified', 'paid'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const revenue = await Payment.aggregate([
      {
        $match: {
          portalId,
          isDeleted: { $ne: true },
          status: { $in: ['verified', 'paid'] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const previousRevenue = await Payment.aggregate([
      {
        $match: {
          portalId,
          isDeleted: { $ne: true },
          status: { $in: ['verified', 'paid'] },
          createdAt: { $gte: previousStartDate, $lt: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const pendingPayments = await Payment.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      status: 'pending',
    });

    // ✅ 4. إحصائيات المحتوى
    const videos = await Video.countDocuments({
      portalId,
      isDeleted: { $ne: true },
    });

    const summaries = await Summary.countDocuments({
      portalId,
      isDeleted: { $ne: true },
    });

    const totalContent = videos + summaries;

    const newContent = await Video.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      createdAt: { $gte: startDate },
    }) + await Summary.countDocuments({
      portalId,
      isDeleted: { $ne: true },
      createdAt: { $gte: startDate },
    });

    // ✅ 5. الأقسام والخدمات
    const sections = await Section.aggregate([
      {
        $match: { portalId, isDeleted: { $ne: true } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: ['$isPublished', 1, 0] } },
        },
      },
    ]);

    const services = await Service.aggregate([
      {
        $match: { portalId, isDeleted: { $ne: true } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: ['$isPublished', 1, 0] } },
        },
      },
    ]);

    // ✅ 6. حالة الطلبات
    const requestStatuses = await Request.aggregate([
      {
        $match: { portalId, isDeleted: { $ne: true } },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ✅ 7. أدوار المستخدمين
    const userRoles = await Account.aggregate([
      {
        $match: { portalId, isDeleted: { $ne: true } },
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ✅ 8. أفضل الخدمات
    const topServices = await Request.aggregate([
      {
        $match: {
          portalId,
          isDeleted: { $ne: true },
          serviceId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$serviceId',
          count: { $sum: 1 },
          revenue: { $sum: '$price' },
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: '$service.name',
          nameAr: '$service.nameAr',
          count: 1,
          revenue: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // ✅ 9. الإحصائيات اليومية
    const dailyStats = await Request.aggregate([
      {
        $match: {
          portalId,
          isDeleted: { $ne: true },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          requests: { $sum: 1 },
          revenue: { $sum: '$price' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    // ✅ 10. حساب النمو
    const calcGrowth = (current, previous) => {
      if (previous === 0) return { current, previous, change: 0, trend: 'stable' };
      const change = ((current - previous) / previous) * 100;
      const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
      return { current, previous, change: Math.round(change * 10) / 10, trend };
    };

    res.json({
      success: true,
      data: {
        period: days,
        startDate,
        endDate: new Date(),
        metrics: {
          newRequests,
          totalRequests,
          newUsers,
          totalUsers,
          newContent,
          totalContent,
          revenue: revenue[0]?.total || 0,
          totalRevenue: totalRevenue[0]?.total || 0,
          activeUsers,
          pendingPayments,
        },
        sections: {
          total: sections[0]?.total || 0,
          published: sections[0]?.published || 0,
        },
        services: {
          total: services[0]?.total || 0,
          published: services[0]?.published || 0,
        },
        growth: {
          requests: calcGrowth(newRequests, previousRequests),
          users: calcGrowth(newUsers, previousUsers),
          revenue: calcGrowth(revenue[0]?.total || 0, previousRevenue[0]?.total || 0),
        },
        topServices: topServices || [],
        dailyStats: dailyStats || [],
        requestStatuses: requestStatuses || [],
        userRoles: userRoles || [],
      },
    });
  } catch (error) {
    console.error('❌ Error in getFullReport:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate report',
    });
  }
};

// ============================================================
// ✅ تصدير التقارير
// ============================================================

export const exportReport = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { format = 'csv', period = '30d' } = req.query;

    console.log('📊 Exporting report for portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    // ✅ جلب بيانات التقارير
    const reportData = await getFullReportData(portalId, period);

    if (format === 'csv') {
      // ✅ تصدير CSV
      const csv = generateCSV(reportData);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=report-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      // ✅ تصدير JSON
      res.json({
        success: true,
        data: reportData,
      });
    }
  } catch (error) {
    console.error('❌ Error in exportReport:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export report',
    });
  }
};

// ============================================================
// ✅ دوال مساعدة
// ============================================================

const getFullReportData = async (portalId, period) => {
  let days = 30;
  if (period === '7d') days = 7;
  if (period === '30d') days = 30;
  if (period === '90d') days = 90;
  if (period === '365d') days = 365;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totalRequests, newRequests, totalUsers, newUsers, totalRevenue, revenue] = await Promise.all([
    Request.countDocuments({ portalId, isDeleted: { $ne: true } }),
    Request.countDocuments({ portalId, isDeleted: { $ne: true }, createdAt: { $gte: startDate } }),
    Account.countDocuments({ portalId, isDeleted: { $ne: true } }),
    Account.countDocuments({ portalId, isDeleted: { $ne: true }, createdAt: { $gte: startDate } }),
    Payment.aggregate([
      { $match: { portalId, isDeleted: { $ne: true }, status: { $in: ['verified', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { portalId, isDeleted: { $ne: true }, status: { $in: ['verified', 'paid'] }, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    period: days,
    startDate,
    endDate: new Date(),
    metrics: {
      newRequests,
      totalRequests,
      newUsers,
      totalUsers,
      revenue: revenue[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
  };
};

const generateCSV = (data) => {
  const rows = [];
  rows.push('المقياس,القيمة');
  rows.push(`إجمالي الطلبات,${data.metrics.totalRequests}`);
  rows.push(`الطلبات الجديدة,${data.metrics.newRequests}`);
  rows.push(`إجمالي المستخدمين,${data.metrics.totalUsers}`);
  rows.push(`المستخدمين الجدد,${data.metrics.newUsers}`);
  rows.push(`الإيرادات,${data.metrics.revenue}`);
  rows.push(`إجمالي الإيرادات,${data.metrics.totalRevenue}`);
  rows.push(`الفترة,${data.period} يوم`);
  rows.push(`تاريخ التقرير,${new Date().toLocaleDateString('ar-SA')}`);

  return rows.join('\n');
};

export default {
  getRequestsReport,
  getPaymentsReport,
  getUsersReport,
  getContentReport,
  getFullReport,
  exportReport,
};