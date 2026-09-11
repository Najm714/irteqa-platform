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
// ✅ الحصول على مساحة عمل الطلب (Workspace)
// ============================================================
export const getWorkspace = async (req, res) => {
  try {
    const requestId = req.params.id;
    const accountId = req.accountId;
    const portalId = req.portalId;

    // ✅ استخدم getRequestById الموجود
    const request = await Request.findOne({
      _id: requestId,
      portalId,
      isDeleted: { $ne: true },
    })
      .populate('serviceId', 'name nameAr slug description pricing icon')
      .populate('requestTypeId', 'name nameAr slug')
      .populate('accountId', 'profile.fullName email phone')
      .populate('specialistId', 'profile.fullName email phone')
      .populate('files.fileId', 'originalName size mimeType storageKey')
      .populate('paymentProofs.fileId', 'originalName size mimeType storageKey')
      .populate('messages.senderId', 'profile.fullName')
      .populate('activityLog.actorId', 'profile.fullName');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // ✅ التحقق من الصلاحية
    const isOwner = request.accountId?._id?.toString() === accountId;
    const isSpecialist = request.specialistId?._id?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace',
      });
    }

    // ✅ تنظيم مساحة العمل
    const workspace = {
      // 1. نظرة عامة
      overview: {
        id: request._id,
        requestNumber: request.requestNumber,
        title: request.formData?.title || request.title || 'طلب',
        description: request.formData?.description || request.description || '',
        status: request.status,
        paymentStatus: request.paymentStatus,
        price: request.price || request.scope?.price || 0,
        currency: request.currency || 'SAR',
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        completedAt: request.completedAt,
        closedAt: request.closedAt,
        customer: request.accountId ? {
          id: request.accountId._id,
          name: request.accountId.profile?.fullName,
          email: request.accountId.email,
          phone: request.accountId.phone,
        } : null,
        specialist: request.specialistId ? {
          id: request.specialistId._id,
          name: request.specialistId.profile?.fullName,
          email: request.specialistId.email,
        } : null,
      },

      // 2. الخدمة ونوع الطلب
      service: request.serviceId ? {
        id: request.serviceId._id,
        name: request.serviceId.name,
        nameAr: request.serviceId.nameAr,
        slug: request.serviceId.slug,
        description: request.serviceId.description,
        icon: request.serviceId.icon,
        requestType: request.requestTypeId ? {
          id: request.requestTypeId._id,
          name: request.requestTypeId.name,
          nameAr: request.requestTypeId.nameAr,
        } : null,
      } : null,

      // 3. بيانات النموذج
      form: {
        schema: request.formSchemaSnapshot || {},
        data: request.formData || {},
      },

      // 4. النطاق (Scope)
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
      files: request.files?.map(f => ({
        id: f.fileId?._id,
        name: f.fileId?.originalName,
        category: f.category,
        size: f.fileId?.size,
        mimeType: f.fileId?.mimeType,
        uploadedAt: f.uploadedAt,
        uploadedBy: f.uploadedBy,
      })) || [],

      // 6. إثباتات الدفع
      paymentProofs: request.paymentProofs?.map(p => ({
        id: p._id,
        fileId: p.fileId?._id,
        filename: p.fileId?.originalName || p.filename,
        verified: p.verified || false,
        rejectionReason: p.rejectionReason || null,
        uploadedAt: p.uploadedAt,
      })) || [],

      // 7. الرسائل
      messages: request.messages?.map(m => ({
        id: m._id,
        content: m.message,
        sender: {
          id: m.senderId?._id,
          name: m.senderId?.profile?.fullName || 'مستخدم',
          role: m.senderRole,
        },
        attachments: m.attachments || [],
        createdAt: m.createdAt,
      })) || [],

      // 8. المكالمات
      calls: request.calls?.map(c => ({
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
      activityLog: request.activityLog?.map(log => ({
        action: log.action,
        actor: {
          id: log.actorId,
          name: log.actorId?.profile?.fullName || 'مستخدم',
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
        allowed: getAvailableTransitions(request.status, req.account?.role || 'customer', request),
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
        canMessage: true,
        canUploadFiles: true,
        canCall: true,
        canViewPayments: isOwner || isAdmin,
        canVerifyPayment: isAdmin,
        canRejectPayment: isAdmin,
      },
    };

    res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error('❌ Error in getWorkspace:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ الحصول على الانتقالات المسموحة
// ============================================================
function getAvailableTransitions(status, role, request) {
  const isOwner = request.accountId?._id?.toString() === request.accountId?._id;
  const isSpecialist = request.specialistId?._id?.toString() === request.accountId?._id;

  const transitions = {
    'new': {
      customer: ['under_review', 'cancelled'],
      specialist: [],
      admin: ['under_review', 'cancelled'],
    },
    'under_review': {
      customer: [],
      specialist: [],
      admin: ['assigned', 'cancelled'],
    },
    'assigned': {
      customer: [],
      specialist: ['scope_definition'],
      admin: ['scope_definition', 'cancelled'],
    },
    'scope_definition': {
      customer: [],
      specialist: ['awaiting_approval'],
      admin: ['awaiting_approval', 'cancelled'],
    },
    'awaiting_approval': {
      customer: ['awaiting_payment', 'scope_definition'],
      specialist: [],
      admin: ['awaiting_payment', 'scope_definition', 'cancelled'],
    },
    'awaiting_payment': {
      customer: ['in_progress'],
      specialist: [],
      admin: ['in_progress', 'cancelled'],
    },
    'in_progress': {
      customer: [],
      specialist: ['under_review_2'],
      admin: ['under_review_2', 'cancelled'],
    },
    'under_review_2': {
      customer: [],
      specialist: ['modification', 'completed'],
      admin: ['modification', 'completed', 'cancelled'],
    },
    'modification': {
      customer: [],
      specialist: ['in_progress'],
      admin: ['in_progress', 'cancelled'],
    },
    'completed': {
      customer: ['closed'],
      specialist: [],
      admin: ['closed'],
    },
    'closed': { customer: [], specialist: [], admin: [] },
    'cancelled': { customer: [], specialist: [], admin: [] },
  };

  const roleTransitions = transitions[status]?.[role] || [];
  const adminTransitions = transitions[status]?.admin || [];

  if (role === 'portal_admin' || role === 'super_admin') {
    return [...new Set([...roleTransitions, ...adminTransitions])];
  }

  return roleTransitions;
}

// ============================================================
// ✅ تحديث مساحة العمل
// ============================================================
export const updateWorkspace = async (req, res) => {
  try {
    const requestId = req.params.id;
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { action, data } = req.body;

    // ✅ التحقق من وجود الطلب
    const request = await Request.findOne({
      _id: requestId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // ✅ التحقق من الصلاحية
    const isOwner = request.accountId?._id?.toString() === accountId;
    const isSpecialist = request.specialistId?._id?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this workspace',
      });
    }

    let result = {};

    switch (action) {
      // ===== إرسال رسالة =====
      case 'send_message':
        req.request = request;
        return await addRequestMessage(req, res);

      // ===== رفع ملف =====
      case 'upload_file':
        req.request = request;
        return await addRequestFile(req, res);

      // ===== تحديث الحالة =====
      case 'update_status':
        req.request = request;
        return await updateRequestStatus(req, res);

      // ===== إسناد مختص =====
      case 'assign_specialist':
        req.request = request;
        return await assignSpecialist(req, res);

      // ===== تحديد النطاق =====
      case 'define_scope':
        req.request = request;
        if (isAdmin) {
          return await adminDefineScope(req, res);
        }
        return await defineRequestScope(req, res);

      // ===== اعتماد النطاق =====
      case 'approve_scope':
        req.request = request;
        return await approveRequestScope(req, res);

      // ===== تقديم الدفع =====
      case 'submit_payment':
        req.request = request;
        return await submitPayment(req, res);

      // ===== تأكيد الدفع =====
      case 'verify_payment':
        req.request = request;
        return await verifyPayment(req, res);

      // ===== رفض الدفع =====
      case 'reject_payment':
        req.request = request;
        return await rejectPayment(req, res);

      // ===== إضافة مكالمة =====
      case 'add_call':
        req.request = request;
        return await addRequestCall(req, res);

      // ===== تحديث مكالمة =====
      case 'update_call':
        req.request = request;
        return await updateRequestCall(req, res);

      default:
        return res.status(400).json({
          success: false,
          message: `Invalid action: ${action}`,
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ إحصائيات مساحة العمل
// ============================================================
export const getWorkspaceStats = async (req, res) => {
  try {
    const portalId = req.portalId;
    const accountId = req.accountId;
    const account = req.account;

    // ✅ بناء الاستعلام حسب الدور
    let query = { portalId, isDeleted: { $ne: true } };

    if (account.role === 'customer') {
      query.accountId = accountId;
    } else if (account.role === 'specialist') {
      query.specialistId = accountId;
    }
    // المدير يرى كل شيء

    const [total, newCount, underReview, assigned, inProgress, completed, cancelled] = await Promise.all([
      Request.countDocuments(query),
      Request.countDocuments({ ...query, status: 'new' }),
      Request.countDocuments({ ...query, status: 'under_review' }),
      Request.countDocuments({ ...query, status: 'assigned' }),
      Request.countDocuments({ ...query, status: 'in_progress' }),
      Request.countDocuments({ ...query, status: 'completed' }),
      Request.countDocuments({ ...query, status: 'cancelled' }),
    ]);

    // ✅ آخر 5 طلبات
    const recent = await Request.find(query)
      .populate('serviceId', 'name nameAr')
      .populate('accountId', 'profile.fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          total,
          new: newCount,
          underReview: underReview,
          assigned: assigned,
          inProgress: inProgress,
          completed: completed,
          cancelled: cancelled,
        },
        recent: recent.map(r => ({
          id: r._id,
          requestNumber: r.requestNumber,
          title: r.formData?.title || r.title || 'طلب',
          service: r.serviceId?.name || 'خدمة',
          status: r.status,
          createdAt: r.createdAt,
          customer: r.accountId?.profile?.fullName || 'مستخدم',
        })),
      },
    });
  } catch (error) {
    console.error('❌ Error in getWorkspaceStats:', error);
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
  getWorkspace,
  updateWorkspace,
  getWorkspaceStats,
};