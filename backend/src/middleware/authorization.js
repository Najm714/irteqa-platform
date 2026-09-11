// backend/src/middleware/authorization.js

// ============================================================
// ✅ صلاحيات كل دور حسب البوابة
// ============================================================

const portalRolePermissions = {
  customer: [
    // الصلاحيات الأساسية للعميل
    'read_own_requests',
    'create_requests',
    'update_own_requests',
    'read_content',
    'read_free_content',
    'create_messages',
    'read_own_messages',
    'upload_own_files',
    'upload_files',           // ✅ رفع الملفات
    'upload_payment_proof',   // ✅ رفع إثبات الدفع
    'read_own_files',
    'manage_own_profile',
    'view_payments',
    'create_subscription',    // ✅ إنشاء اشتراك
    'read_subscriptions',     // ✅ قراءة الاشتراكات
    'read_payments',          // ✅ قراءة المدفوعات
    'create_payments',        // ✅ إنشاء مدفوعات
    'read_files',             // ✅ قراءة الملفات
  ],
  
  specialist: [
    'read_assigned_requests',
    'update_assigned_requests',
    'communicate',
    'upload_files',
    'read_request_files',
    'update_request_status',
    'define_scope',
    'deliver_work',
    'handle_modifications',
    'schedule_calls',
    'read_files',
    'read_payments',
  ],
  
  portal_admin: [
    // صلاحيات إدارة البوابة كاملة
    'manage_portal',
    'manage_users',
    'manage_specialists',
    'manage_services',
    'manage_sections',
    'manage_requests',
    'manage_content',
    'manage_videos',
    'manage_payments',
    'manage_subscriptions',
    'manage_files',
    'view_reports',
    'manage_settings',
    'manage_roles',
    'view_audit_logs',
    'manage_forms',
    'upload_files',
    'read_files',
    'delete_files',
    'manage_all_requests',
    'manage_all_payments',
    'manage_all_subscriptions',
    'manage_all_content',
  ],
  
  super_admin: ['*'], // ✅ جميع الصلاحيات
};

// ============================================================
// ✅ دالة التحقق من الصلاحيات
// ============================================================

export const requirePermission = (requiredPermissions = []) => {
  return async (req, res, next) => {
    const account = req.account;
    const portal = req.portal;

    console.log('🔍 requirePermission - account:', account?._id);
    console.log('🔍 requirePermission - role:', account?.role);
    console.log('🔍 requirePermission - requiredPermissions:', requiredPermissions);

    // ✅ التحقق من وجود الحساب
    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    // ✅ التحقق من نشاط الحساب
    if (!account.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // ✅ Super admin لديه صلاحيات كاملة
    if (account.role === 'super_admin') {
      console.log('✅ Super admin granted all permissions');
      return next();
    }

    // ✅ Portal admin لديه صلاحيات كاملة في بوابته
    if (account.role === 'portal_admin') {
      console.log('✅ Portal admin granted all permissions');
      return next();
    }

    // ✅ التأكد من أن requiredPermissions هي مصفوفة
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions].filter(Boolean);

    // ✅ إذا لم تكن هناك صلاحيات مطلوبة، السماح بالوصول
    if (permissions.length === 0) {
      console.log('✅ No specific permissions required, allowing access');
      return next();
    }

    // ✅ التحقق من صلاحيات البوابة
    try {
      const portalId = portal?._id || req.portalId || account.portalId;
      
      // ✅ التحقق من كل صلاحية
      const hasAllPermissions = permissions.every(permission => {
        // التحقق من الصلاحية في حساب المستخدم
        const hasPermission = account.hasPortalPermission?.(portalId, permission);
        console.log(`🔍 Permission check: ${permission} = ${hasPermission}`);
        return hasPermission;
      });

      if (!hasAllPermissions) {
        // ✅ محاولة الحصول على الصلاحيات من الدور مباشرة
        const rolePermissions = portalRolePermissions[account.role] || [];
        const hasByRole = permissions.every(permission => 
          rolePermissions.includes(permission) || rolePermissions.includes('*')
        );

        if (!hasByRole) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions for this portal.',
            required: permissions,
            userRole: account.role,
            userPermissions: account.permissions || rolePermissions || [],
            code: 'INSUFFICIENT_PERMISSIONS',
          });
        }
      }

      console.log('✅ Permission granted for:', permissions);
      next();
    } catch (error) {
      console.error('❌ Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message,
        code: 'PERMISSION_CHECK_ERROR',
      });
    }
  };
};

// ============================================================
// ✅ دالة التحقق من دور المستخدم
// ============================================================

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const account = req.account;

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    // ✅ التأكد من أن allowedRoles هي مصفوفة
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles].filter(Boolean);

    // ✅ Super admin لديه صلاحيات كاملة
    if (account.role === 'super_admin') {
      return next();
    }

    // ✅ إذا لم تكن هناك أدوار مطلوبة، السماح بالوصول
    if (roles.length === 0) {
      return next();
    }

    // ✅ التحقق من الدور
    if (!roles.includes(account.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
        userRole: account.role,
        code: 'ROLE_REQUIRED',
      });
    }

    next();
  };
};

// ============================================================
// ✅ دالة التحقق من أن المستخدم هو مدير البوابة
// ============================================================

export const requirePortalAdmin = async (req, res, next) => {
  const account = req.account;
  const portal = req.portal;

  if (!account) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
  }

  // ✅ Super admin لديه صلاحيات كاملة
  if (account.role === 'super_admin') {
    return next();
  }

  // ✅ التحقق من أن المستخدم مدير لهذه البوابة
  try {
    const portalId = portal?._id || req.portalId || account.portalId;
    const isPortalAdmin = account.role === 'portal_admin' &&
      account.hasPortalPermission?.(portalId, 'manage_portal');

    if (!isPortalAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Portal admin privileges required.',
        userRole: account.role,
        portalId: portalId,
        code: 'ADMIN_REQUIRED',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Portal admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Portal admin check failed',
      error: error.message,
      code: 'ADMIN_CHECK_ERROR',
    });
  }
};

// ============================================================
// ✅ دالة التحقق من ملكية المورد (IDOR Protection)
// ============================================================

export const requireResourceOwnership = (model, idParam = 'id', ownerField = 'accountId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const accountId = req.accountId;
      const portalId = req.portalId;
      const account = req.account;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required',
          code: 'RESOURCE_ID_REQUIRED',
        });
      }

      if (!accountId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      // ✅ البحث عن المورد
      const resource = await model.findOne({
        _id: resourceId,
        portalId,
        isDeleted: { $ne: true },
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND',
        });
      }

      // ✅ المشرف العام ومدير البوابة لديهم صلاحية الوصول
      if (account?.role === 'super_admin' || account?.role === 'portal_admin') {
        req.resource = resource;
        return next();
      }

      // ✅ التحقق من ملكية المورد
      const ownerId = resource[ownerField];
      if (!ownerId || ownerId.toString() !== accountId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          code: 'ACCESS_DENIED',
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('❌ Resource ownership middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error',
        code: 'AUTH_ERROR',
      });
    }
  };
};

// ============================================================
// ✅ دالة التحقق من ملكية الملف
// ============================================================

export const requireFileOwnership = async (req, res, next) => {
  try {
    const { File } = await import('../models/File.model.js');
    return requireResourceOwnership(File, 'id', 'accountId')(req, res, next);
  } catch (error) {
    console.error('❌ File ownership middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      code: 'AUTH_ERROR',
    });
  }
};

// ============================================================
// ✅ دالة التحقق من ملكية الطلب
// ============================================================

export const requireRequestOwnership = async (req, res, next) => {
  try {
    const { Request } = await import('../models/Request.model.js');
    return requireResourceOwnership(Request, 'id', 'accountId')(req, res, next);
  } catch (error) {
    console.error('❌ Request ownership middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
      code: 'AUTH_ERROR',
    });
  }
};

// ============================================================
// ✅ دالة التحقق من الوصول إلى الطلب
// ============================================================

export const requireRequestAccess = () => {
  return async (req, res, next) => {
    try {
      const requestId = req.params.id || req.params.requestId;
      const accountId = req.accountId;
      const portalId = req.portalId;
      const account = req.account;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: 'Request ID is required',
          code: 'REQUEST_ID_REQUIRED',
        });
      }

      // ✅ استيراد نموذج الطلب
      const { Request } = await import('../models/Request.model.js');
      const request = await Request.findOne({
        _id: requestId,
        portalId,
        isDeleted: { $ne: true },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
          code: 'REQUEST_NOT_FOUND',
        });
      }

      // ✅ المشرف العام أو مدير البوابة
      if (account?.role === 'super_admin' || account?.role === 'portal_admin') {
        req.request = request;
        return next();
      }

      // ✅ العميل - يمكنه الوصول لطلباته فقط
      if (account?.role === 'customer' && request.accountId?.toString() === accountId?.toString()) {
        req.request = request;
        return next();
      }

      // ✅ المختص - يمكنه الوصول للطلبات المسندة إليه
      if (account?.role === 'specialist' && request.specialistId?.toString() === accountId?.toString()) {
        req.request = request;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'You do not have access to this request',
        code: 'ACCESS_DENIED',
      });
    } catch (error) {
      console.error('❌ Request access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error',
        code: 'AUTH_ERROR',
      });
    }
  };
};

// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================

export default {
  requirePermission,
  requireRole,
  requirePortalAdmin,
  requireResourceOwnership,
  requireFileOwnership,
  requireRequestOwnership,
  requireRequestAccess,
  portalRolePermissions,
};