// backend/src/controllers/workspace.controller.js

import { Request } from '../models/Request.model.js';
import { Service } from '../models/Service.model.js';
import { Account } from '../models/Account.model.js';
import { File } from '../models/File.model.js';
import { Message } from '../models/Message.model.js';

import {
  getRequestById,
  addRequestMessage,
  addRequestFile,
  defineRequestScope,
  adminDefineScope,
  approveRequestScope,
  submitPayment,
  verifyPayment,
  rejectPayment,
  assignSpecialist,
  updateRequestStatus,
  addRequestCall,
  getRequestCalls,
  updateRequestCall,
  getRequestActivity,
} from './request.controller.js';

// ============================================================
// Helpers
// ============================================================

const getAccountId = (req) => {
  return req.accountId
    ? String(req.accountId)
    : req.account?._id
      ? String(req.account._id)
      : null;
};

const getPortalId = (req) => {
  return req.portalId
    ? String(req.portalId)
    : req.portal?._id
      ? String(req.portal._id)
      : null;
};

const isAdminAccount = (account) => {
  return (
    account?.role === 'portal_admin' ||
    account?.role === 'super_admin'
  );
};

// ============================================================
// الحصول على Workspace مع التحقق من Portal والملكية
// ============================================================

export const getWorkspace = async (req, res) => {
  try {
    const requestId = req.params.id;
    const accountId = getAccountId(req);
    const portalId = getPortalId(req);
    const account = req.account;

    // ----------------------------------------------------------
    // التحقق من المصادقة
    // ----------------------------------------------------------

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
        code: 'REQUEST_ID_REQUIRED',
      });
    }

    // ----------------------------------------------------------
    // 🔐 Portal-scoped query
    // لا يتم جلب الطلب إلا من البوابة الحالية
    // ----------------------------------------------------------

    const request = await Request.findOne({
      _id: requestId,
      portalId,
      isDeleted: { $ne: true },
    })
      .populate(
        'serviceId',
        'name nameAr slug description pricing icon'
      )
      .populate(
        'requestTypeId',
        'name nameAr slug'
      )
      .populate(
        'accountId',
        'profile.fullName email phone'
      )
      .populate(
        'specialistId',
        'profile.fullName email phone'
      )
      .populate(
        'files.fileId',
        'originalName size mimeType storageKey'
      )
      .populate(
        'paymentProofs.fileId',
        'originalName size mimeType storageKey'
      )
      .populate(
        'messages.senderId',
        'profile.fullName'
      )
      .populate(
        'activityLog.actorId',
        'profile.fullName'
      );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
        code: 'REQUEST_NOT_FOUND',
      });
    }

    // ----------------------------------------------------------
    // 🔐 تحقق إضافي من Portal
    // ----------------------------------------------------------

    if (
      !request.portalId ||
      String(request.portalId) !== String(portalId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Request belongs to a different portal',
        code: 'PORTAL_ACCESS_DENIED',
      });
    }

    // ----------------------------------------------------------
    // التحقق من الملكية / الاختصاص
    // ----------------------------------------------------------

    const isOwner =
      request.accountId?._id &&
      String(request.accountId._id) === accountId;

    const isSpecialist =
      request.specialistId?._id &&
      String(request.specialistId._id) === accountId;

    const isAdmin = isAdminAccount(account);

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace',
        code: 'WORKSPACE_ACCESS_DENIED',
      });
    }

    // ----------------------------------------------------------
    // تنظيم مساحة العمل
    // ----------------------------------------------------------

    const workspace = {
      // 1. نظرة عامة
      overview: {
        id: request._id,
        requestNumber: request.requestNumber,
        title:
          request.formData?.title ||
          request.title ||
          'طلب',
        description:
          request.formData?.description ||
          request.description ||
          '',
        status: request.status,
        paymentStatus: request.paymentStatus,
        price:
          request.price ||
          request.scope?.price ||
          0,
        currency: request.currency || 'SAR',
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        completedAt: request.completedAt,
        closedAt: request.closedAt,

        customer: request.accountId
          ? {
              id: request.accountId._id,
              name: request.accountId.profile?.fullName,
              email: request.accountId.email,
              phone: request.accountId.phone,
            }
          : null,

        specialist: request.specialistId
          ? {
              id: request.specialistId._id,
              name: request.specialistId.profile?.fullName,
              email: request.specialistId.email,
            }
          : null,
      },

      // 2. الخدمة ونوع الطلب
      service: request.serviceId
        ? {
            id: request.serviceId._id,
            name: request.serviceId.name,
            nameAr: request.serviceId.nameAr,
            slug: request.serviceId.slug,
            description: request.serviceId.description,
            icon: request.serviceId.icon,

            requestType: request.requestTypeId
              ? {
                  id: request.requestTypeId._id,
                  name: request.requestTypeId.name,
                  nameAr: request.requestTypeId.nameAr,
                }
              : null,
          }
        : null,

      // 3. بيانات النموذج
      form: {
        schema: request.formSchemaSnapshot || {},
        data: request.formData || {},
      },

      // 4. النطاق
      scope: request.scope || {
        description: '',
        deliverables: [],
        requirements: [],
        estimatedDuration: '',
        price: 0,
        currency: 'SAR',
        modificationsIncluded: 0,
        exclusions: [],
        approvedBy: null,
        approvedAt: null,
      },

      // 5. الملفات
      files:
        request.files?.map((f) => ({
          id: f.fileId?._id,
          name: f.fileId?.originalName,
          category: f.category,
          size: f.fileId?.size,
          mimeType: f.fileId?.mimeType,
          uploadedAt: f.uploadedAt,
          uploadedBy: f.uploadedBy,
        })) || [],

      // 6. إثباتات الدفع
      paymentProofs:
        request.paymentProofs?.map((p) => ({
          id: p._id,
          fileId: p.fileId?._id,
          filename:
            p.fileId?.originalName ||
            p.filename,
          verified: p.verified || false,
          rejectionReason:
            p.rejectionReason || null,
          uploadedAt: p.uploadedAt,
        })) || [],

      // 7. الرسائل
      messages:
        request.messages?.map((m) => ({
          id: m._id,
          content: m.message,

          sender: {
            id: m.senderId?._id,
            name:
              m.senderId?.profile?.fullName ||
              'مستخدم',
            role: m.senderRole,
          },

          attachments: m.attachments || [],
          createdAt: m.createdAt,
        })) || [],

      // 8. المكالمات
      calls:
        request.calls?.map((c) => ({
          id: c._id,
          purpose: c.purpose,
          scheduledAt: c.scheduledAt,
          duration: c.duration,
          status: c.status,
          notes: c.notes,
          callUrl: c.callUrl,
          recordingUrl: c.recordingUrl,
          requestedBy: c.requestedBy,
          requestedRole: c.requestedRole,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })) || [],

      // 9. سجل النشاط
      activityLog:
        request.activityLog?.map((log) => ({
          action: log.action,

          actor: {
            id: log.actorId,
            name:
              log.actorId?.profile?.fullName ||
              'مستخدم',
          },

          actorRole: log.actorRole,
          oldValue: log.oldValue,
          newValue: log.newValue,
          metadata: log.metadata,
          timestamp: log.timestamp,
        })) || [],

      // 10. التواريخ المهمة
      dates: {
        scopeApprovedAt: request.scopeApprovedAt,
        paymentVerifiedAt: request.paymentVerifiedAt,
        startedAt: request.startedAt,
        deliveredAt: request.deliveredAt,
        completedAt: request.completedAt,
        closedAt: request.closedAt,
      },

      // 11. الحالة والانتقالات المسموحة
      transitions: {
        current: request.status,
        allowed: getAvailableTransitions(
          request.status,
          account.role
        ),
      },

      // 12. صلاحيات المستخدم الحالي
      permissions: {
        canEdit: isOwner || isAdmin,
        canAssign: isAdmin,
        canDefineScope: isSpecialist || isAdmin,
        canApproveScope: isOwner,
        canPay: isOwner,
        canDeliver: isSpecialist,
        canModify: isOwner || isSpecialist,
        canComplete: isOwner,
        canClose: isOwner || isAdmin,
        canMessage: isOwner || isSpecialist || isAdmin,
        canUploadFiles: isOwner || isSpecialist || isAdmin,
        canCall: isOwner || isSpecialist || isAdmin,
        canViewPayments: isOwner || isAdmin,
        canVerifyPayment: isAdmin,
        canRejectPayment: isAdmin,
      },
    };

    return res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error('❌ Error in getWorkspace:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'WORKSPACE_ERROR',
    });
  }
};

// ============================================================
// الحصول على الانتقالات المسموحة
// ============================================================

function getAvailableTransitions(status, role) {
  const transitions = {
    new: {
      customer: ['under_review', 'cancelled'],
      specialist: [],
      portal_admin: ['under_review', 'cancelled'],
      super_admin: ['under_review', 'cancelled'],
    },

    under_review: {
      customer: [],
      specialist: [],
      portal_admin: ['assigned', 'cancelled'],
      super_admin: ['assigned', 'cancelled'],
    },

    assigned: {
      customer: [],
      specialist: ['scope_definition'],
      portal_admin: ['scope_definition', 'cancelled'],
      super_admin: ['scope_definition', 'cancelled'],
    },

    scope_definition: {
      customer: [],
      specialist: ['awaiting_approval'],
      portal_admin: ['awaiting_approval', 'cancelled'],
      super_admin: ['awaiting_approval', 'cancelled'],
    },

    awaiting_approval: {
      customer: [
        'awaiting_payment',
        'scope_definition',
      ],
      specialist: [],
      portal_admin: [
        'awaiting_payment',
        'scope_definition',
        'cancelled',
      ],
      super_admin: [
        'awaiting_payment',
        'scope_definition',
        'cancelled',
      ],
    },

    awaiting_payment: {
      customer: ['in_progress'],
      specialist: [],
      portal_admin: ['in_progress', 'cancelled'],
      super_admin: ['in_progress', 'cancelled'],
    },

    in_progress: {
      customer: [],
      specialist: ['under_review_2'],
      portal_admin: ['under_review_2', 'cancelled'],
      super_admin: ['under_review_2', 'cancelled'],
    },

    under_review_2: {
      customer: [],
      specialist: ['modification', 'completed'],
      portal_admin: [
        'modification',
        'completed',
        'cancelled',
      ],
      super_admin: [
        'modification',
        'completed',
        'cancelled',
      ],
    },

    modification: {
      customer: [],
      specialist: ['in_progress'],
      portal_admin: ['in_progress', 'cancelled'],
      super_admin: ['in_progress', 'cancelled'],
    },

    completed: {
      customer: ['closed'],
      specialist: [],
      portal_admin: ['closed'],
      super_admin: ['closed'],
    },

    closed: {
      customer: [],
      specialist: [],
      portal_admin: [],
      super_admin: [],
    },

    cancelled: {
      customer: [],
      specialist: [],
      portal_admin: [],
      super_admin: [],
    },
  };

  return transitions[status]?.[role] || [];
}

// ============================================================
// تحديث مساحة العمل
// ============================================================

export const updateWorkspace = async (req, res) => {
  try {
    const requestId = req.params.id;
    const accountId = getAccountId(req);
    const portalId = getPortalId(req);
    const account = req.account;
    const { action } = req.body;

    // ----------------------------------------------------------
    // التحقق من المصادقة
    // ----------------------------------------------------------

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required',
        code: 'REQUEST_ID_REQUIRED',
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required',
        code: 'ACTION_REQUIRED',
      });
    }

    // ----------------------------------------------------------
    // 🔐 Portal-scoped query
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // تحقق إضافي من Portal
    // ----------------------------------------------------------

    if (
      !request.portalId ||
      String(request.portalId) !== String(portalId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Request belongs to a different portal',
        code: 'PORTAL_ACCESS_DENIED',
      });
    }

    // ----------------------------------------------------------
    // تحديد الملكية
    // ----------------------------------------------------------

    const isOwner =
      request.accountId &&
      String(request.accountId) === accountId;

    const isSpecialist =
      request.specialistId &&
      String(request.specialistId) === accountId;

    const isAdmin = isAdminAccount(account);

    // ----------------------------------------------------------
    // صلاحيات كل Action
    // ----------------------------------------------------------

    switch (action) {
      // ========================================================
      // إرسال رسالة
      // ========================================================

      case 'send_message':
        if (!isOwner && !isSpecialist && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to send messages.',
            code: 'MESSAGE_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await addRequestMessage(req, res);

      // ========================================================
      // رفع ملف
      // ========================================================

      case 'upload_file':
        if (!isOwner && !isSpecialist && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to upload files.',
            code: 'FILE_UPLOAD_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await addRequestFile(req, res);

      // ========================================================
      // تحديث الحالة
      // ========================================================

      case 'update_status':
        if (!isOwner && !isSpecialist && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to update request status.',
            code: 'STATUS_UPDATE_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await updateRequestStatus(req, res);

      // ========================================================
      // إسناد مختص
      // Admin فقط
      // ========================================================

      case 'assign_specialist':
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Only portal administrators can assign specialists.',
            code: 'ASSIGNMENT_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await assignSpecialist(req, res);

      // ========================================================
      // تحديد النطاق
      // Specialist أو Admin
      // ========================================================

      case 'define_scope':
        if (!isSpecialist && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Only the assigned specialist or administrator can define the scope.',
            code: 'SCOPE_ACCESS_DENIED',
          });
        }

        req.request = request;

        if (isAdmin) {
          return await adminDefineScope(req, res);
        }

        return await defineRequestScope(req, res);

      // ========================================================
      // اعتماد النطاق
      // Customer فقط
      // ========================================================

      case 'approve_scope':
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'Only the request owner can approve the scope.',
            code: 'SCOPE_APPROVAL_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await approveRequestScope(req, res);

      // ========================================================
      // تقديم الدفع
      // Customer فقط
      // ========================================================

      case 'submit_payment':
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'Only the request owner can submit payment.',
            code: 'PAYMENT_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await submitPayment(req, res);

      // ========================================================
      // تأكيد الدفع
      // Admin فقط
      // ========================================================

      case 'verify_payment':
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Only portal administrators can verify payments.',
            code: 'PAYMENT_VERIFICATION_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await verifyPayment(req, res);

      // ========================================================
      // رفض الدفع
      // Admin فقط
      // ========================================================

      case 'reject_payment':
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Only portal administrators can reject payments.',
            code: 'PAYMENT_REJECTION_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await rejectPayment(req, res);

      // ========================================================
      // إضافة مكالمة
      // Owner / Specialist / Admin
      // ========================================================

      case 'add_call':
        if (!isOwner && !isSpecialist && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to add calls.',
            code: 'CALL_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await addRequestCall(req, res);

      // ========================================================
      // تحديث مكالمة
      // Owner / Specialist / Admin
      // ========================================================

      case 'update_call':
        if (!isOwner && !isSpecialist && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to update calls.',
            code: 'CALL_ACCESS_DENIED',
          });
        }

        req.request = request;
        return await updateRequestCall(req, res);

      // ========================================================
      // Action غير معروف
      // ========================================================

      default:
        return res.status(400).json({
          success: false,
          message: `Invalid action: ${action}`,
          code: 'INVALID_ACTION',

          availableActions: [
            'send_message',
            'upload_file',
            'update_status',
            'assign_specialist',
            'define_scope',
            'approve_scope',
            'submit_payment',
            'verify_payment',
            'reject_payment',
            'add_call',
            'update_call',
          ],
        });
    }
  } catch (error) {
    console.error('❌ Error in updateWorkspace:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'WORKSPACE_UPDATE_ERROR',
    });
  }
};

// ============================================================
// إحصائيات مساحة العمل
// ============================================================

export const getWorkspaceStats = async (req, res) => {
  try {
    const portalId = getPortalId(req);
    const accountId = getAccountId(req);
    const account = req.account;

    // ----------------------------------------------------------
    // التحقق من المصادقة والـ Portal
    // ----------------------------------------------------------

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // ----------------------------------------------------------
    // 🔐 جميع الإحصائيات مقيدة بالـ Portal
    // ----------------------------------------------------------

    const query = {
      portalId,
      isDeleted: { $ne: true },
    };

    // Customer
    if (account.role === 'customer') {
      query.accountId = accountId;
    }

    // Specialist
    else if (account.role === 'specialist') {
      query.specialistId = accountId;
    }

    // Portal Admin / Super Admin
    // يرى كل طلبات الـ Portal المحددة فقط

    const [
      total,
      newCount,
      underReview,
      assigned,
      inProgress,
      completed,
      cancelled,
    ] = await Promise.all([
      Request.countDocuments(query),

      Request.countDocuments({
        ...query,
        status: 'new',
      }),

      Request.countDocuments({
        ...query,
        status: 'under_review',
      }),

      Request.countDocuments({
        ...query,
        status: 'assigned',
      }),

      Request.countDocuments({
        ...query,
        status: 'in_progress',
      }),

      Request.countDocuments({
        ...query,
        status: 'completed',
      }),

      Request.countDocuments({
        ...query,
        status: 'cancelled',
      }),
    ]);

    // ----------------------------------------------------------
    // آخر 5 طلبات
    // ----------------------------------------------------------

    const recent = await Request.find(query)
      .populate(
        'serviceId',
        'name nameAr'
      )
      .populate(
        'accountId',
        'profile.fullName'
      )
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,

      data: {
        stats: {
          total,
          new: newCount,
          underReview,
          assigned,
          inProgress,
          completed,
          cancelled,
        },

        recent: recent.map((r) => ({
          id: r._id,
          requestNumber: r.requestNumber,

          title:
            r.formData?.title ||
            r.title ||
            'طلب',

          service:
            r.serviceId?.name ||
            'خدمة',

          status: r.status,
          createdAt: r.createdAt,

          customer:
            r.accountId?.profile?.fullName ||
            'مستخدم',
        })),
      },
    });
  } catch (error) {
    console.error(
      '❌ Error in getWorkspaceStats:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
      code: 'WORKSPACE_STATS_ERROR',
    });
  }
};

// ============================================================
// تصدير جميع الدوال
// ============================================================

export default {
  getWorkspace,
  updateWorkspace,
  getWorkspaceStats,
};