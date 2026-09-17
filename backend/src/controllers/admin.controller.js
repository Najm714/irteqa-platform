// backend/src/controllers/admin.controller.js
import { Setting } from '../models/Setting.model.js';
import { Request } from '../models/Request.model.js';
import { Account } from '../models/Account.model.js';
import { Payment } from '../models/Payment.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Content } from '../models/Content.model.js';
import { Video } from '../models/Video.model.js';
import { Summary } from '../models/Summary.model.js';
import { Section } from '../models/Section.model.js';
import { Service } from '../models/Service.model.js';
import { Material } from '../models/Material.model.js';
// ============================================================
// ✅ إحصائيات لوحة التحكم
// ============================================================

export const getDashboardStats = async (req, res) => {
  try {
    const portalId = req.portalId;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // إحصائيات الطلبات
    const requestsStats = await Request.aggregate([
      { $match: { portalId } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    // إحصائيات المستخدمين
    const usersStats = await Account.aggregate([
      { $match: { portalId } },
      { $group: {
        _id: '$role',
        count: { $sum: 1 }
      }}
    ]);

    // إحصائيات المدفوعات
    const paymentsStats = await Payment.aggregate([
      { $match: { portalId } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$amount' }
      }}
    ]);

    // إحصائيات الاشتراكات
    const subscriptionsStats = await Subscription.aggregate([
      { $match: { portalId } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
// ============================================================
// ✅ إحصائيات المحتوى (فيديوهات + ملخصات + وحدات)
// ============================================================

// 1. الفيديوهات
const totalVideos = await Video.countDocuments({
  portalId,
  isPublished: true,
  isDeleted: { $ne: true },
});

// 2. الملخصات
const totalSummaries = await Summary.countDocuments({
  portalId,
  isPublished: true,
});

// 3. الوحدات (من المواد)
const materials = await Material.find({
  portalId,
  isPublished: true,
  isDeleted: { $ne: true },
}).select('units');

let totalUnits = 0;
materials.forEach(m => {
  totalUnits += m.units?.length || 0;
});

// 4. المجموع
const contentStats = {
  videos: totalVideos,
  summaries: totalSummaries,
  units: totalUnits,
  total: totalVideos + totalSummaries + totalUnits,
};

console.log('📊 Content Stats:', contentStats);

    // إجمالي الإيرادات
    const totalRevenue = await Payment.aggregate([
      { $match: { portalId, status: 'verified' } },
      { $group: {
        _id: null,
        total: { $sum: '$amount' }
      }}
    ]);

// إحصائيات الأقسام والخدمات
const sectionsCount = await Section.countDocuments({ portalId });
const sectionsPublished = await Section.countDocuments({ portalId, isPublished: true });
const servicesCount = await Service.countDocuments({ portalId });
const servicesPublished = await Service.countDocuments({ portalId, isPublished: true });

// ============================================================
// ✅ إحصائيات realtime
// ============================================================

// 1. المستخدمون النشطون (سجلوا دخول خلال 24 ساعة)
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

const activeUsersCount = await Account.countDocuments({
  portalId,
  isActive: true,
  isDeleted: { $ne: true },
  lastLogin: { $gte: twentyFourHoursAgo },
});

// 2. الطلبات النشطة (قيد المعالجة)
const activeStatuses = [
  'new',
  'under_review',
  'assigned',
  'scope_definition',
  'awaiting_approval',
  'awaiting_payment',
  'in_progress',
  'under_review_2',
  'modification',
];

const activeRequestsCount = await Request.countDocuments({
  portalId,
  status: { $in: activeStatuses },
  isActive: true,
  isDeleted: { $ne: true },
});

console.log('📊 Realtime Stats:', {
  activeUsers: activeUsersCount,
  activeRequests: activeRequestsCount,
});

// ============================================================
// ✅ الرد النهائي
// ============================================================

res.status(200).json({
      success: true,
      data: {
        requests: {
          total: requestsStats.reduce((sum, item) => sum + item.count, 0),
          byStatus: requestsStats,
        },
        users: {
          total: usersStats.reduce((sum, item) => sum + item.count, 0),
          byRole: usersStats,
        },
        payments: {
          total: paymentsStats.reduce((sum, item) => sum + item.count, 0),
          byStatus: paymentsStats,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        subscriptions: {
          total: subscriptionsStats.reduce((sum, item) => sum + item.count, 0),
          byStatus: subscriptionsStats,
        },
        content: contentStats,
        sections: {
          total: sectionsCount,
          published: sectionsPublished,
        },
        services: {
          total: servicesCount,
          published: servicesPublished,
        },
        realtime: {
  activeUsers: activeUsersCount,
  activeRequests: activeRequestsCount,
  pendingPayments: paymentsStats.find(p => p._id === 'pending')?.count || 0,
},
      },
    });
  } catch (error) {
    console.error('❌ Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get dashboard stats',
    });
  }
};

export const getChartData = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { period = '30d' } = req.query;
    
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    let days = 30;
    if (period === '7d') days = 7;
    if (period === '30d') days = 30;
    if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const requestsChart = await Request.aggregate([
      { $match: { portalId, createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    const paymentsChart = await Payment.aggregate([
      { $match: { portalId, status: 'verified', createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        amount: { $sum: '$amount' }
      }},
      { $sort: { _id: 1 } }
    ]);

    const usersChart = await Account.aggregate([
      { $match: { portalId, createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        requests: requestsChart,
        payments: paymentsChart,
        users: usersChart,
      },
    });
  } catch (error) {
    console.error('❌ Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get chart data',
    });
  }
};

// ============================================================
// ✅ إعدادات النظام
// ============================================================

export const getSettings = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.query.portalId;
    
    if (!portalId) {
      console.log('❌ No portalId provided for settings');
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    console.log('🔍 Fetching settings for portal:', portalId);

    let settings = await Setting.findOne({ portalId });
    
    if (!settings) {
      console.log('📝 Creating default settings for portal:', portalId);
      settings = new Setting({ portalId });
      await settings.save();
    }
    
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get settings',
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.query.portalId;
    const { id: userId } = req.user;
    const { section, settings } = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }
    
    let existingSettings = await Setting.findOne({ portalId });
    
    if (!existingSettings) {
      existingSettings = new Setting({ portalId });
    }
    
    if (section && settings) {
      existingSettings[section] = {
        ...existingSettings[section],
        ...settings,
      };
    } else if (settings) {
      Object.assign(existingSettings, settings);
    }
    
    existingSettings.updatedBy = userId;
    await existingSettings.save();
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: existingSettings,
    });
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update settings',
    });
  }
};

// backend/src/controllers/admin.controller.js

// ============================================================
// ✅ إدارة المستخدمين - الدوال الكاملة
// ============================================================

// ===== جلب جميع المستخدمين =====
export const getUsers = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { role, search, isActive, limit = 20, page = 1 } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    console.log('📤 Fetching users for portal:', portalId);

    const query = { portalId, isDeleted: { $ne: true } };
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let users = await Account.find(query)
      .select('-passwordHash -__v')
      .populate('identityId', 'email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // ✅ بحث إذا كان موجوداً
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      users = users.filter(u => 
        searchRegex.test(u.email) ||
        searchRegex.test(u.username) ||
        searchRegex.test(u.fullName || '') ||
        searchRegex.test(u.profile?.fullName || '')
      );
    }

    const total = await Account.countDocuments(query);

    // ✅ تنسيق البيانات
    const formattedUsers = users.map(user => ({
      _id: user._id,
      email: user.email,
      username: user.username || user.email?.split('@')[0],
      profile: {
        fullName: user.fullName || user.profile?.fullName || 'مستخدم',
        avatar: user.profile?.avatar || '',
        bio: user.profile?.bio || '',
      },
      phone: user.phone || '',
      role: user.role || 'customer',
      isActive: user.isActive !== undefined ? user.isActive : true,
      isVerified: user.isVerified !== undefined ? user.isVerified : true,
      lastLogin: user.lastLogin || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getUsers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get users',
    });
  }
};

// ===== جلب مستخدم محدد =====
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const user = await Account.findOne({ _id: id, portalId, isDeleted: { $ne: true } })
      .select('-passwordHash -__v')
      .populate('identityId', 'email fullName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        username: user.username || user.email?.split('@')[0],
        fullName: user.fullName || user.profile?.fullName || 'مستخدم',
        profile: {
          fullName: user.fullName || user.profile?.fullName || 'مستخدم',
          avatar: user.profile?.avatar || '',
          bio: user.profile?.bio || '',
        },
        phone: user.phone || '',
        role: user.role || 'customer',
        isActive: user.isActive !== undefined ? user.isActive : true,
        isVerified: user.isVerified !== undefined ? user.isVerified : true,
        lastLogin: user.lastLogin || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error in getUserById:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user',
    });
  }
};

// ===== إنشاء مستخدم جديد =====
export const createUser = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { email, password, fullName, username, phone, role, isActive, isVerified } = req.body;

    console.log('📝 Creating user:', email);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    // ✅ التحقق من وجود المستخدم
    const existingUser = await Account.findOne({ portalId, email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // ✅ إنشاء هوية العميل (CustomerIdentity)
    const CustomerIdentity = (await import('../models/CustomerIdentity.model.js')).CustomerIdentity;
    const identity = new CustomerIdentity({
      email: email.toLowerCase(),
      fullName: fullName || username || 'User',
    });
    await identity.save();

    // ✅ إنشاء المستخدم مع ربط الهوية
    const user = new Account({
      portalId,
      identityId: identity._id,
      email: email.toLowerCase(),
      passwordHash: password,
      fullName: fullName || username || 'User',
      username: username || email.split('@')[0],
      phone: phone || '',
      role: role || 'customer',
      profile: {
        fullName: fullName || username || 'User',
        bio: '',
        avatar: '',
      },
      isActive: isActive !== undefined ? isActive : true,
      isVerified: isVerified !== undefined ? isVerified : true,
    });

    await user.save();

    console.log('✅ User created successfully:', user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        profile: {
          fullName: user.fullName || user.profile?.fullName,
        },
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('❌ Error in createUser:', error);
    
    // ✅ معالجة خطأ التكرار
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
};

// ===== تحديث مستخدم =====
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const { fullName, username, phone, role, isActive, isVerified, password } = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const user = await Account.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // ✅ تحديث الحقول
    if (fullName) {
      user.fullName = fullName;
      if (!user.profile) user.profile = {};
      user.profile.fullName = fullName;
    }
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (password) user.passwordHash = password;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        username: user.username,
        profile: {
          fullName: user.fullName || user.profile?.fullName,
        },
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('❌ Error in updateUser:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
};

// ===== تبديل حالة المستخدم =====
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const user = await Account.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        isActive: user.isActive,
      },
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('❌ Error in toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle user status',
    });
  }
};

// ===== حذف مستخدم =====
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const accountId = req.accountId || req.user?.id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const user = await Account.findOne({ _id: id, portalId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // ✅ لا يمكن حذف نفسه
    if (user._id.toString() === accountId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = accountId;
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
};

// ===== جلب إحصائيات المستخدمين =====
export const getUserStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    const total = await Account.countDocuments({ portalId, isDeleted: { $ne: true } });
    const active = await Account.countDocuments({ portalId, isDeleted: { $ne: true }, isActive: true });
    const inactive = await Account.countDocuments({ portalId, isDeleted: { $ne: true }, isActive: false });
    
    const customers = await Account.countDocuments({ portalId, isDeleted: { $ne: true }, role: 'customer' });
    const specialists = await Account.countDocuments({ portalId, isDeleted: { $ne: true }, role: 'specialist' });
    const admins = await Account.countDocuments({ portalId, isDeleted: { $ne: true }, role: { $in: ['portal_admin', 'super_admin'] } });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        customers,
        specialists,
        admins,
      },
    });
  } catch (error) {
    console.error('❌ Error in getUserStats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user stats',
    });
  }
};

export const updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const { permissions } = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }
    
    const user = await Account.findOne({ _id: id, portalId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    await user.grantPortalPermissions(portalId, permissions);
    
    res.status(200).json({
      success: true,
      message: 'User permissions updated',
      data: user,
    });
  } catch (error) {
    console.error('❌ Update user permissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user permissions',
    });
  }
};

// ============================================================
// ✅ سجل النشاطات (Audit Log)
// ============================================================

export const getAuditLog = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { action, userId, limit = 50, page = 1 } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }
    
    const query = { portalId };
    if (userId) query['activityLog.actorId'] = userId;
    
    const requests = await Request.find(query)
      .select('activityLog createdAt')
      .populate('accountId', 'profile.fullName email');
    
    let activities = [];
    requests.forEach(request => {
      request.activityLog.forEach(log => {
        if (!action || log.action === action) {
          activities.push({
            ...log.toObject(),
            resourceId: request._id,
            resourceType: 'Request',
            account: request.accountId,
          });
        }
      });
    });
    
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    const total = activities.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = activities.slice(skip, skip + parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get audit log',
    });
  }
};