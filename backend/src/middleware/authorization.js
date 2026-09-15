// backend/src/middleware/authorization.js

// ============================================================
// ✅ صلاحيات كل دور حسب البوابة
// ============================================================

const portalRolePermissions = {
  customer: [
    'read_own_requests',
    'create_requests',
    'update_own_requests',
    'read_content',
    'read_free_content',
    'create_messages',
    'read_own_messages',
    'upload_own_files',
    'upload_files',
    'upload_payment_proof',
    'read_own_files',
    'manage_own_profile',
    'view_payments',
    'create_subscription',
    'read_subscriptions',
    'read_payments',
    'create_payments',
    'read_files',
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

  super_admin: ['*'],
};

// ============================================================
// ✅ تحويل الصلاحيات إلى مصفوفة
// ============================================================

const normalizePermissions = (requiredPermissions) => {
  if (Array.isArray(requiredPermissions)) {
    return requiredPermissions.filter(Boolean);
  }

  return requiredPermissions ? [requiredPermissions] : [];
};

// ============================================================
// ✅ التحقق من تطابق الحساب مع البوابة
// ============================================================
// ============================================================
// ✅ التحقق من تطابق الحساب مع البوابة
// ============================================================

const ensurePortalAccess = (account, portalId) => {
  if (!account) {
    return {
      allowed: false,
      code: 'AUTH_REQUIRED',
      message: 'Authentication required.',
    };
  }

  // Super admin يستطيع إدارة أي بوابة،
  // بشرط أن يكون portalId محددًا وصحيحًا من portalContext.
  if (account.role === 'super_admin') {
    return {
      allowed: true,
    };
  }

  if (!portalId) {
    return {
      allowed: false,
      code: 'PORTAL_ID_REQUIRED',
      message: 'Portal context is required.',
    };
  }

  if (!account.portalId) {
    return {
      allowed: false,
      code: 'ACCOUNT_PORTAL_REQUIRED',
      message: 'Your account is not assigned to a portal.',
    };
  }

  // account.portalId قد يكون:
  // 1) ObjectId
  // 2) populated Portal document
  const accountPortalId =
    account.portalId?._id || account.portalId;

  if (
    accountPortalId.toString() !==
    portalId.toString()
  ) {
    return {
      allowed: false,
      code: 'PORTAL_ACCESS_DENIED',
      message: 'You are not authorized to access this portal.',
    };
  }

  return {
    allowed: true,
  };
};
// ============================================================
// ✅ دالة التحقق من الصلاحيات
// ============================================================

export const requirePermission = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const account = req.account;

      console.log('🔍 requirePermission - account:', account?._id);
      console.log('🔍 requirePermission - role:', account?.role);
      console.log(
        '🔍 requirePermission - requiredPermissions:',
        requiredPermissions
      );

      // --------------------------------------------------------
      // التحقق من وجود الحساب
      // --------------------------------------------------------

      if (!account) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED',
        });
      }

      // --------------------------------------------------------
      // التحقق من نشاط الحساب
      // --------------------------------------------------------

      if (!account.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated.',
          code: 'ACCOUNT_INACTIVE',
        });
      }

      // --------------------------------------------------------
      // تحديد البوابة من الـ secure portal context
      // --------------------------------------------------------

const portalId =
  req.portalId ||
  req.portal?._id ||
  null;

console.log('========== PORTAL ACCESS DEBUG ==========');
console.log('account._id:', account?._id?.toString());
console.log('account.role:', account?.role);
console.log('account.portalId:', account?.portalId?.toString());
console.log('req.portalId:', req.portalId?.toString());
console.log('req.portal._id:', req.portal?._id?.toString());
console.log('computed portalId:', portalId?.toString());
console.log('=========================================');
      // --------------------------------------------------------
      // Super Admin
      // --------------------------------------------------------

      if (account.role === 'super_admin') {
        if (!portalId) {
          return res.status(400).json({
            success: false,
            message: 'Portal context is required for super admin.',
            code: 'PORTAL_ID_REQUIRED',
          });
        }

        console.log(
          '✅ Super admin granted access to portal:',
          portalId.toString()
        );

        return next();
      }

      // --------------------------------------------------------
      // جميع المستخدمين غير Super Admin
      // يجب أن تكون لهم بوابة محددة
      // ويجب أن تطابق بوابتهم الشخصية
      // --------------------------------------------------------

      const portalAccess = ensurePortalAccess(account, portalId);

      
      if (!portalAccess.allowed) {
        console.warn(
          `🚫 Portal permission blocked: account=${account._id}, ` +
          `accountPortal=${account.portalId}, requestedPortal=${portalId}`
        );

        return res.status(
          portalAccess.code === 'PORTAL_ID_REQUIRED' ||
          portalAccess.code === 'ACCOUNT_PORTAL_REQUIRED'
            ? 400
            : 403
        ).json({
          success: false,
          message: portalAccess.message,
          code: portalAccess.code,
        });
      }

      // --------------------------------------------------------
      // Portal Admin
      //
      // مهم:
      // لا نعطيه next() قبل التحقق من البوابة.
      // بعد التأكد من أن البوابة هي بوابته، يحصل على
      // صلاحيات إدارة البوابة.
      // --------------------------------------------------------

      if (account.role === 'portal_admin') {
        console.log(
          '✅ Portal admin authorized for own portal:',
          portalId.toString()
        );

        return next();
      }

      // --------------------------------------------------------
      // الصلاحيات المطلوبة
      // --------------------------------------------------------

      const permissions = normalizePermissions(requiredPermissions);

      if (permissions.length === 0) {
        return next();
      }

      // --------------------------------------------------------
      // التحقق من صلاحيات الحساب الخاصة بالبوابة
      // --------------------------------------------------------

      const hasAllAccountPermissions = permissions.every((permission) => {
        const hasPermission =
          typeof account.hasPortalPermission === 'function'
            ? account.hasPortalPermission(portalId, permission)
            : false;

        console.log(
          `🔍 Permission check: ${permission} = ${hasPermission}`
        );

        return hasPermission;
      });

      if (hasAllAccountPermissions) {
        console.log(
          '✅ Permission granted through account permissions:',
          permissions
        );

        return next();
      }

      // --------------------------------------------------------
      // fallback إلى صلاحيات الدور
      // --------------------------------------------------------

      const rolePermissions =
        portalRolePermissions[account.role] || [];

      const hasByRole = permissions.every(
        (permission) =>
          rolePermissions.includes(permission) ||
          rolePermissions.includes('*')
      );

      if (!hasByRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions for this portal.',
          required: permissions,
          userRole: account.role,
          userPermissions:
            account.permissions?.length > 0
              ? account.permissions
              : rolePermissions,
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      console.log(
        '✅ Permission granted through role:',
        permissions
      );

      return next();
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

    const roles = Array.isArray(allowedRoles)
      ? allowedRoles.filter(Boolean)
      : [allowedRoles].filter(Boolean);

    // Super admin يتجاوز فحص الدور
    if (account.role === 'super_admin') {
      return next();
    }

    if (roles.length === 0) {
      return next();
    }

    if (!roles.includes(account.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
        userRole: account.role,
        code: 'ROLE_REQUIRED',
      });
    }

    return next();
  };
};

// ============================================================
// ✅ دالة التحقق من أن المستخدم هو مدير البوابة
// ============================================================

export const requirePortalAdmin = async (req, res, next) => {
  const account = req.account;

  if (!account) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED',
    });
  }

  // Super admin يستطيع إدارة أي بوابة
  // لكن يجب أن يكون portalContext موجودًا.
  if (account.role === 'super_admin') {
    if (!req.portalId && !req.portal?._id) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required for super admin.',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    return next();
  }

  try {
    const portalId =
      req.portalId ||
      req.portal?._id ||
      null;

    // يجب وجود portal context
    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required.',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // مدير البوابة يجب أن يكون مرتبطًا ببوابة
    if (!account.portalId) {
      return res.status(403).json({
        success: false,
        message: 'Portal admin is not assigned to a portal.',
        code: 'ACCOUNT_PORTAL_REQUIRED',
      });
    }

    // منع Portal Admin من الوصول إلى بوابة أخرى
    if (account.portalId.toString() !== portalId.toString()) {
      console.warn(
        `🚫 Portal admin cross-portal access blocked: ` +
        `account=${account._id}, ` +
        `accountPortal=${account.portalId}, ` +
        `requestedPortal=${portalId}`
      );

      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this portal.',
        userRole: account.role,
        portalId,
        code: 'PORTAL_ACCESS_DENIED',
      });
    }

    if (account.role !== 'portal_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Portal admin privileges required.',
        userRole: account.role,
        portalId,
        code: 'ADMIN_REQUIRED',
      });
    }

    // التأكد من وجود صلاحية manage_portal
    const hasManagePortal =
      typeof account.hasPortalPermission === 'function'
        ? account.hasPortalPermission(portalId, 'manage_portal')
        : false;

    if (!hasManagePortal) {
      return res.status(403).json({
        success: false,
        message: 'Portal admin does not have manage_portal permission.',
        userRole: account.role,
        portalId,
        code: 'ADMIN_PERMISSION_REQUIRED',
      });
    }

    return next();
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

export const requireResourceOwnership = (
  model,
  idParam = 'id',
  ownerField = 'accountId'
) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const accountId = req.accountId;
      const account = req.account;

      // استخدام الـ portal context الآمن
      const portalId =
        req.portalId ||
        req.portal?._id ||
        null;

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

      if (!portalId) {
        return res.status(400).json({
          success: false,
          message: 'Portal context is required',
          code: 'PORTAL_ID_REQUIRED',
        });
      }

      // البحث عن المورد داخل البوابة فقط
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

      // Super admin: بعد التأكد من portal context
      if (account?.role === 'super_admin') {
        req.resource = resource;
        return next();
      }

      // Portal admin: لا يصل إلا لموارد بوابته
      if (account?.role === 'portal_admin') {
        if (
          !account.portalId ||
          account.portalId.toString() !== portalId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to access this portal.',
            code: 'PORTAL_ACCESS_DENIED',
          });
        }

        req.resource = resource;
        return next();
      }

      // المستخدم العادي: التحقق من الملكية
      const ownerId = resource[ownerField];

      if (
        !ownerId ||
        ownerId.toString() !== accountId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
          code: 'ACCESS_DENIED',
        });
      }

      req.resource = resource;
      return next();
    } catch (error) {
      console.error(
        '❌ Resource ownership middleware error:',
        error
      );

      return res.status(500).json({
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

    return requireResourceOwnership(
      File,
      'id',
      'accountId'
    )(req, res, next);
  } catch (error) {
    console.error(
      '❌ File ownership middleware error:',
      error
    );

    return res.status(500).json({
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

    return requireResourceOwnership(
      Request,
      'id',
      'accountId'
    )(req, res, next);
  } catch (error) {
    console.error(
      '❌ Request ownership middleware error:',
      error
    );

    return res.status(500).json({
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
      const requestId =
        req.params.id ||
        req.params.requestId;

      const accountId = req.accountId;
      const account = req.account;

      // استخدام portal context الآمن
      const portalId =
        req.portalId ||
        req.portal?._id ||
        null;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: 'Request ID is required',
          code: 'REQUEST_ID_REQUIRED',
        });
      }

      if (!accountId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      if (!portalId) {
        return res.status(400).json({
          success: false,
          message: 'Portal context is required',
          code: 'PORTAL_ID_REQUIRED',
        });
      }

      // استيراد نموذج الطلب
      const { Request } = await import(
        '../models/Request.model.js'
      );

      // البحث داخل البوابة الحالية فقط
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

      // --------------------------------------------------------
      // Super Admin
      // --------------------------------------------------------

      if (account?.role === 'super_admin') {
        req.request = request;
        return next();
      }

      // --------------------------------------------------------
      // Portal Admin
      // --------------------------------------------------------

      if (account?.role === 'portal_admin') {
        if (
          !account.portalId ||
          account.portalId.toString() !== portalId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to access this portal.',
            code: 'PORTAL_ACCESS_DENIED',
          });
        }

        req.request = request;
        return next();
      }

      // --------------------------------------------------------
      // Customer
      // --------------------------------------------------------

      if (
        account?.role === 'customer' &&
        request.accountId?.toString() === accountId?.toString()
      ) {
        req.request = request;
        return next();
      }

      // --------------------------------------------------------
      // Specialist
      // --------------------------------------------------------

      if (
        account?.role === 'specialist' &&
        request.specialistId?.toString() === accountId?.toString()
      ) {
        req.request = request;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'You do not have access to this request',
        code: 'ACCESS_DENIED',
      });
    } catch (error) {
      console.error(
        '❌ Request access middleware error:',
        error
      );

      return res.status(500).json({
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