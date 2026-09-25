// backend/src/controllers/request.controller.js
import { Request } from '../models/Request.model.js';
import { File } from '../models/File.model.js';
import { Account } from '../models/Account.model.js';
import { Service } from '../models/Service.model.js';
import { RequestType } from '../models/RequestType.model.js';
import { getNotificationService } from '../services/notification.service.js';
import mongoose from 'mongoose';

// ============================================================
// ✅ Helper: إرسال إشعار بأمان
// ============================================================
const safeSendNotification = async (req, notificationData) => {
  try {
    const notificationService = getNotificationService(req.app?.get('io'));
    await notificationService.sendNotification(notificationData);
    console.log('✅ Notification sent:', notificationData.type);
  } catch (notifError) {
    console.error('⚠️ Notification error:', notifError.message);
  }
};

// ============================================================
// ✅ Helper: فحص صلاحية الوصول للطلب
// ============================================================
const checkRequestAccess = (request, accountId, role) => {
  return request.canUserAccess(accountId, role);
};

// ============================================================
// ✅ Helper: هل المستخدم مدير؟
// ============================================================
const isAdmin = (role) => {
  return role === 'portal_admin' || role === 'super_admin';
};

// ============================================================
// ✅ Helper: تنسيق بيانات الطلب للقوائم
// ============================================================
const formatRequestForList = (order) => ({
  _id: order._id,
  requestNumber: order.requestNumber,
  title: order.formData?.title || order.title || 'طلب',
  description: order.formData?.description || order.description || '',
  service: order.serviceId || { name: 'خدمة', nameAr: 'خدمة' },
  requestType: order.requestTypeId,
  specialist: order.specialistId,
  customer: order.accountId,
  status: order.status || 'new',
  paymentStatus: order.paymentStatus || 'pending',
  price: order.scope?.price || order.price || 0,
  estimatedDuration: order.scope?.estimatedDuration,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  files: order.files?.map((f) => ({
    _id: f.fileId?._id,
    filename: f.fileId?.originalName,
    category: f.category,
  })) || [],
  paymentProofs: order.paymentProofs?.map((p) => ({
    _id: p._id,
    fileId: p.fileId?._id || p.fileId,
    filename: p.fileId?.originalName || p.filename,
    verified: p.verified || false,
    rejectionReason: p.rejectionReason || null,
  })) || [],
  messages: order.messages?.length || 0,
  calls: order.calls?.length || 0,
  activityLog: order.activityLog?.slice(0, 5) || [],
});

// ============================================================
// ✅ جلب طلبات المستخدم الحالي (العميل)
// ============================================================
export const getMyRequests = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { status, search, page = 1, limit = 20 } = req.query;

    console.log(`📤 Fetching requests for user: ${accountId}`);

    const query = {
      portalId,
      accountId,
      isDeleted: { $ne: true },
    };

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ select محدود لتجنب جلب حقول ضخمة
    let requests = await Request.find(query)
      .select('-messages -activityLog')
      .populate('serviceId', 'name nameAr icon')
      .populate('requestTypeId', 'name nameAr')
      .populate('specialistId', 'profile.fullName')
      .populate('files.fileId', 'originalName size mimeType')
      .populate('paymentProofs.fileId', 'originalName size mimeType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      requests = requests.filter(
        (r) =>
          searchRegex.test(r.requestNumber) ||
          searchRegex.test(r.formData?.title || '') ||
          searchRegex.test(r.serviceId?.name || '') ||
          searchRegex.test(r.serviceId?.nameAr || '')
      );
    }

    const total = await Request.countDocuments(query);

    res.json({
      success: true,
      data: requests.map(formatRequestForList),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getMyRequests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ جلب طلبات المختص
// ============================================================
export const getSpecialistRequests = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { status, page = 1, limit = 20 } = req.query;

    console.log(`📤 Fetching specialist requests for: ${accountId}`);

    const query = {
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      status: { $ne: 'new' },
    };

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await Request.find(query)
      .select('-messages -activityLog')
      .populate('serviceId', 'name nameAr icon')
      .populate('requestTypeId', 'name nameAr')
      .populate('accountId', 'profile.fullName email')
      .populate('files.fileId', 'originalName size mimeType')
      .populate('paymentProofs.fileId', 'originalName size mimeType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);

    res.json({
      success: true,
      data: requests.map(formatRequestForList),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getSpecialistRequests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ جلب جميع الطلبات (للمدير)
// ============================================================
export const getAllRequests = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { status, search, page = 1, limit = 20 } = req.query;

    console.log(`📤 Fetching all requests for portal: ${portalId}`);

    const query = {
      portalId,
      isDeleted: { $ne: true },
    };

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let requests = await Request.find(query)
      .select('-messages -activityLog')
      .populate('serviceId', 'name nameAr icon')
      .populate('requestTypeId', 'name nameAr')
      .populate('accountId', 'profile.fullName email')
      .populate('specialistId', 'profile.fullName')
      .populate('files.fileId', 'originalName size mimeType')
      .populate('paymentProofs.fileId', 'originalName size mimeType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      requests = requests.filter(
        (r) =>
          searchRegex.test(r.requestNumber) ||
          searchRegex.test(r.formData?.title || '') ||
          searchRegex.test(r.serviceId?.name || '') ||
          searchRegex.test(r.serviceId?.nameAr || '') ||
          searchRegex.test(r.accountId?.profile?.fullName || '')
      );
    }

    const total = await Request.countDocuments(query);

    res.json({
      success: true,
      data: requests.map(formatRequestForList),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getAllRequests:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ جلب طلب محدد
// ============================================================
export const getRequestById = async (req, res) => {
  try {
    const request = req.request;

    console.log('📤 Fetching request by ID:', request._id);

    const populatedRequest = await Request.findById(request._id)
      .populate('serviceId', 'name nameAr icon description image')
      .populate('requestTypeId', 'name nameAr description')
      .populate('accountId', 'profile.fullName email phone')
      .populate('specialistId', 'profile.fullName email phone')
      .populate('files.fileId', 'originalName size mimeType storageKey')
      .populate('paymentProofs.fileId', 'originalName size mimeType storageKey')
      .populate('messages.senderId', 'profile.fullName email')
      .populate('activityLog.actorId', 'profile.fullName email');

    console.log('📤 Request data:');
    console.log('  - Files:', populatedRequest.files?.length || 0);
    console.log('  - Payment Proofs:', populatedRequest.paymentProofs?.length || 0);
    console.log('  - Messages:', populatedRequest.messages?.length || 0);

    res.json({
      success: true,
      data: populatedRequest,
    });
  } catch (error) {
    console.error('❌ Error in getRequestById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ إنشاء طلب جديد
// ============================================================
export const createRequest = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { serviceId, requestTypeId, formData, files = [] } = req.body;

    console.log(`📝 Creating new request for user: ${accountId}`);

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    // ✅ فحص وجود الخدمة في نفس البوابة
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      portalId,
      isDeleted: { $ne: true },
    }).select('_id name nameAr');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found in this portal',
        code: 'SERVICE_NOT_FOUND',
      });
    }

    // ✅ فحص نوع الطلب إن وُجد
    if (requestTypeId) {
      if (!mongoose.Types.ObjectId.isValid(requestTypeId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request type ID',
        });
      }

      const requestType = await RequestType.findOne({
        _id: requestTypeId,
        portalId,
      }).select('_id serviceId');

      if (!requestType) {
        return res.status(404).json({
          success: false,
          message: 'Request type not found',
          code: 'REQUEST_TYPE_NOT_FOUND',
        });
      }
    }

    // 🔐 فحص الملفات
    const fileIds = Array.isArray(files)
      ? [...new Set(files.filter(Boolean).map(String))]
      : [];

    if (fileIds.length > 0) {
      const invalidFileId = fileIds.find(
        (fileId) => !mongoose.Types.ObjectId.isValid(fileId)
      );

      if (invalidFileId) {
        return res.status(400).json({
          success: false,
          message: 'One or more file IDs are invalid.',
          code: 'INVALID_FILE_ID',
        });
      }

      const uploadedFiles = await File.find({
        _id: { $in: fileIds },
        portalId,
        accountId,
        isDeleted: { $ne: true },
      }).select('_id portalId accountId isDeleted');

      if (uploadedFiles.length !== fileIds.length) {
        const validFileIds = new Set(
          uploadedFiles.map((file) => file._id.toString())
        );

        const invalidFileIds = fileIds.filter(
          (fileId) => !validFileIds.has(fileId)
        );

        console.warn(
          `🚫 Invalid file attachment attempt: account=${accountId}, ` +
            `portal=${portalId}, invalidFiles=${invalidFileIds.join(',')}`
        );

        return res.status(403).json({
          success: false,
          message:
            'One or more files are not authorized for this account or portal.',
          code: 'FILE_ACCESS_DENIED',
          invalidFileIds,
        });
      }
    }

    // ✅ إنشاء الطلب
    const request = new Request({
      portalId,
      accountId,
      serviceId,
      requestTypeId: requestTypeId || undefined,
      formData: formData || {},
      formSchemaSnapshot: formData || {},
      status: 'new',
      paymentStatus: 'pending',
      price: formData?.budget || 0,
      scope: {
        price: formData?.budget || 0,
        estimatedDuration: formData?.estimatedDuration || '',
      },
    });

    for (const fileId of fileIds) {
      request.files.push({
        fileId,
        category: 'request',
        uploadedAt: new Date(),
        uploadedBy: accountId,
      });
    }

    request.addActivity('request_created', accountId, 'customer', null, {
      serviceId,
      requestTypeId,
      formData,
    });

    await request.save();

    console.log('✅ Request created successfully:', request._id);

    // ✅ إشعار للعميل
    await safeSendNotification(req, {
      portalId: request.portalId,
      accountId: request.accountId,
      type: 'request_created',
      title: 'Request created',
      titleAr: 'تم إنشاء طلبك',
      message: `Your request ${request.requestNumber} has been created`,
      messageAr: `تم إنشاء طلبك رقم ${request.requestNumber} بنجاح`,
      data: { requestId: request._id },
      priority: 'medium',
    });

    // ✅ إشعار للمديرين
    try {
      const notificationService = getNotificationService(req.app?.get('io'));

      const adminNotification = {
        type: 'request_created',
        title: 'New request',
        titleAr: 'طلب جديد',
        message: `New request ${request.requestNumber} created`,
        messageAr: `تم إنشاء طلب جديد رقم ${request.requestNumber}`,
        data: { requestId: request._id },
        priority: 'medium',
      };

      const [portalAdmins, superAdmins] = await Promise.all([
        Account.find({
          portalId: request.portalId,
          role: 'portal_admin',
          isActive: true,
        }).select('_id'),
        Account.find({
          role: 'super_admin',
          isActive: true,
        }).select('_id'),
      ]);

      for (const admin of portalAdmins) {
        await notificationService.sendNotification({
          portalId: request.portalId,
          accountId: admin._id,
          ...adminNotification,
        });
      }

      for (const admin of superAdmins) {
        await notificationService.sendNotification({
          portalId: request.portalId,
          accountId: admin._id,
          ...adminNotification,
          priority: 'high',
        });
      }

      console.log(
        `✅ Notified ${portalAdmins.length} portal_admin(s), ${superAdmins.length} super_admin(s)`
      );
    } catch (err) {
      console.error('⚠️ Admin notification error:', err.message);
    }

    res.status(201).json({
      success: true,
      data: request,
      message: 'تم إنشاء الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in createRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ تحديث الطلب (formData / scope)
// ============================================================
export const updateRequest = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const { formData, scope } = req.body;

    // ✅ فحص الصلاحية
    if (!checkRequestAccess(request, accountId, req.account?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (formData) {
      request.formData = { ...request.formData, ...formData };
    }

    if (scope) {
      request.scope = { ...request.scope, ...scope };
    }

    request.addActivity(
      'request_updated',
      accountId,
      req.account?.role || 'customer',
      null,
      { formData, scope }
    );

    await request.save();

    res.json({
      success: true,
      data: request,
      message: 'تم تحديث الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in updateRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ تغيير حالة الطلب
// ============================================================
export const updateRequestStatus = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const { status, notes } = req.body;
    const userRole = req.account?.role || 'customer';

    // ✅ فحص الحالة المطلوبة
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    // ✅ فحص صلاحية الوصول
    if (!checkRequestAccess(request, accountId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // ✅ فحص الانتقال الصحيح
    if (!request.canTransitionTo(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${request.status}" to "${status}"`,
        code: 'INVALID_STATUS_TRANSITION',
        currentStatus: request.status,
        requestedStatus: status,
      });
    }

    const oldStatus = request.status;
    request.status = status;

    if (notes) {
      request.metadata = { ...request.metadata, statusChangeNotes: notes };
    }

    if (status === 'assigned') request.startedAt = new Date();
    if (status === 'completed') request.completedAt = new Date();
    if (status === 'closed') request.closedAt = new Date();
    if (status === 'cancelled') request.isActive = false;

    request.addActivity('status_changed', accountId, userRole, oldStatus, status, {
      notes,
    });

    await request.save();

    // ✅ إشعار للعميل
    const statusMessages = {
      in_progress: {
        ar: 'طلبك قيد التنفيذ الآن',
        en: 'Your request is now in progress',
      },
      completed: {
        ar: 'تم إكمال طلبك',
        en: 'Your request has been completed',
      },
      cancelled: {
        ar: 'تم إلغاء طلبك',
        en: 'Your request has been cancelled',
      },
      closed: {
        ar: 'تم إغلاق طلبك',
        en: 'Your request has been closed',
      },
    };

    const msg = statusMessages[status] || {
      ar: `تم تحديث حالة طلبك إلى ${status}`,
      en: `Your request status updated to ${status}`,
    };

    await safeSendNotification(req, {
      portalId: request.portalId,
      accountId: request.accountId,
      type: 'request_updated',
      title: 'Request status updated',
      titleAr: msg.ar,
      message: msg.en,
      messageAr: msg.ar,
      data: { requestId: request._id },
      priority: 'medium',
    });

    res.json({
      success: true,
      data: request,
      message: `تم تغيير حالة الطلب إلى ${status}`,
    });
  } catch (error) {
    console.error('❌ Error in updateRequestStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ إسناد مختص
// ============================================================
export const assignSpecialist = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const userRole = req.account?.role || 'customer';
    const { specialistId } = req.body;

    // ✅ فحص الصلاحية — فقط admin
    if (!isAdmin(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can assign specialists',
        code: 'ADMIN_ONLY',
      });
    }

    if (!specialistId) {
      return res.status(400).json({
        success: false,
        message: 'Specialist ID is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(specialistId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid specialist ID',
      });
    }

    if (!request?.portalId) {
      return res.status(400).json({
        success: false,
        message: 'Request portal context is required',
        code: 'REQUEST_PORTAL_REQUIRED',
      });
    }

    // ✅ فحص المختص
    const specialist = await Account.findOne({
      _id: specialistId,
      portalId: request.portalId,
      role: 'specialist',
      isActive: true,
    }).select('_id portalId role isActive profile.fullName');

    if (!specialist) {
      return res.status(403).json({
        success: false,
        message: 'The selected specialist is not authorized for this portal.',
        code: 'SPECIALIST_PORTAL_ACCESS_DENIED',
      });
    }

    const oldSpecialist = request.specialistId;

    request.specialistId = specialist._id;
    request.status = 'assigned';

    request.addActivity(
      'specialist_assigned',
      accountId,
      userRole,
      oldSpecialist,
      specialist._id,
      { specialistId: specialist._id }
    );

    await request.save();

    // ✅ إشعار للمختص
    await safeSendNotification(req, {
      portalId: request.portalId,
      accountId: specialist._id,
      type: 'request_assigned',
      title: 'New request assigned',
      titleAr: 'تم إسناد طلب جديد إليك',
      message: `Request ${request.requestNumber} has been assigned to you`,
      messageAr: `تم إسناد الطلب رقم ${request.requestNumber} إليك`,
      data: { requestId: request._id },
      priority: 'high',
    });

    // ✅ إشعار للعميل
    await safeSendNotification(req, {
      portalId: request.portalId,
      accountId: request.accountId,
      type: 'request_updated',
      title: 'Specialist assigned',
      titleAr: 'تم تعيين مختص لطلبك',
      message: `A specialist has been assigned to your request ${request.requestNumber}`,
      messageAr: `تم تعيين مختص للطلب رقم ${request.requestNumber}`,
      data: { requestId: request._id },
      priority: 'medium',
    });

    res.json({
      success: true,
      data: request,
      message: 'تم إسناد الطلب إلى المختص بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in assignSpecialist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ حذف الطلب (ناعم)
// ============================================================
export const deleteRequest = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const userRole = req.account?.role || 'customer';

    // ✅ فحص الصلاحية
    if (!checkRequestAccess(request, accountId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    request.isDeleted = true;
    request.deletedAt = new Date();
    request.deletedBy = accountId;
    request.isActive = false;

    request.addActivity('deleted', accountId, userRole);

    await request.save();

    res.json({
      success: true,
      message: 'تم حذف الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in deleteRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ إحصائيات الطلبات (للمدير)
// ============================================================
export const getRequestStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    // ✅ دمج الطلبين بـ $facet
    const [stats] = await Request.aggregate([
      { $match: { portalId, isDeleted: { $ne: true } } },
      {
        $facet: {
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const statusMap = {};
    stats.statusCounts.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    const total = stats.total[0]?.count || 0;

    res.json({
      success: true,
      data: {
        total,
        new: statusMap.new || 0,
        under_review: statusMap.under_review || 0,
        assigned: statusMap.assigned || 0,
        scope_definition: statusMap.scope_definition || 0,
        awaiting_approval: statusMap.awaiting_approval || 0,
        awaiting_payment: statusMap.awaiting_payment || 0,
        in_progress: statusMap.in_progress || 0,
        under_review_2: statusMap.under_review_2 || 0,
        modification: statusMap.modification || 0,
        completed: statusMap.completed || 0,
        closed: statusMap.closed || 0,
        cancelled: statusMap.cancelled || 0,
      },
    });
  } catch (error) {
    console.error('❌ Error in getRequestStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ إضافة ملف إلى الطلب
// ============================================================
export const addRequestFile = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const role = req.account?.role || 'customer';
    const portalId = req.portalId;
    const { fileIds, category } = req.body;

    console.log('📤 addRequestFile:', {
      role,
      portalId,
      requestId: request?._id,
      category,
      fileIds,
    });

    // ✅ فحص الصلاحية
    if (!checkRequestAccess(request, accountId, role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    if (!request?.portalId) {
      return res.status(400).json({
        success: false,
        message: 'Request portal is missing',
        code: 'REQUEST_PORTAL_REQUIRED',
      });
    }

    // ✅ فحص أن الطلب نفسه ضمن البوابة
    if (request.portalId.toString() !== portalId.toString()) {
      console.warn('🚫 Request portal mismatch:', {
        requestId: request._id,
        requestPortalId: request.portalId,
        currentPortalId: portalId,
      });

      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this request.',
        code: 'REQUEST_PORTAL_ACCESS_DENIED',
      });
    }

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one file ID is required',
      });
    }

    // ✅ فحص الفئات المسموحة
    const allowedCategories = {
      customer: ['request', 'proof'],
      specialist: ['request', 'proof', 'delivery', 'modification'],
      portal_admin: ['request', 'proof', 'delivery', 'modification', 'final'],
      super_admin: ['request', 'proof', 'delivery', 'modification', 'final'],
    };

    const userAllowed = allowedCategories[role] || allowedCategories.customer;
    const finalCategory = category || 'request';

    if (!userAllowed.includes(finalCategory)) {
      return res.status(403).json({
        success: false,
        message: `Category "${finalCategory}" is not allowed. Allowed: ${userAllowed.join(', ')}`,
      });
    }

    // 🔐 فحص الملفات
    const files = await File.find({
      _id: { $in: fileIds },
      portalId: portalId,
      isDeleted: { $ne: true },
    });

    if (files.length !== fileIds.length) {
      const foundFileIds = new Set(files.map((file) => file._id.toString()));
      const invalidFileIds = fileIds.filter(
        (fileId) => !foundFileIds.has(fileId.toString())
      );

      console.warn('🚫 File portal validation failed:', {
        requestId: request._id,
        invalidFileIds,
      });

      return res.status(403).json({
        success: false,
        message:
          'One or more files do not belong to this portal or are unavailable.',
        code: 'FILE_PORTAL_ACCESS_DENIED',
        invalidFileIds,
      });
    }

    // ✅ إضافة الملفات
    for (const fileId of fileIds) {
      const file = files.find((f) => f._id.toString() === fileId.toString());
      if (!file) continue;

      if (finalCategory === 'proof' || finalCategory === 'payment_proof') {
        const exists = request.paymentProofs.some(
          (p) => p.fileId?.toString() === fileId.toString()
        );

        if (!exists) {
          request.paymentProofs.push({
            fileId,
            filename: file.originalName || '',
            uploadedAt: new Date(),
            verified: false,
          });
        }
      } else {
        const exists = request.files.some(
          (f) => f.fileId?.toString() === fileId.toString()
        );

        if (!exists) {
          request.files.push({
            fileId,
            category: finalCategory,
            uploadedAt: new Date(),
            uploadedBy: accountId,
            description: file.originalName || '',
          });
        }
      }
    }

    // ✅ تسجيل النشاط
    if (finalCategory === 'proof' || finalCategory === 'payment_proof') {
      request.paymentStatus = 'submitted';

      request.addActivity('payment_submitted', accountId, role, null, {
        count: fileIds.length,
        category: finalCategory,
      });
    } else {
      request.addActivity('file_uploaded', accountId, role, null, {
        count: fileIds.length,
        category: finalCategory,
      });
    }

    await request.save();

    const updatedRequest = await Request.findById(request._id)
      .populate('files.fileId', 'originalName size mimeType')
      .populate('paymentProofs.fileId', 'originalName size mimeType');

    res.json({
      success: true,
      data: {
        files: updatedRequest.files,
        paymentProofs: updatedRequest.paymentProofs,
      },
      message: `تم رفع ${fileIds.length} ملف بنجاح في فئة "${finalCategory}"`,
    });
  } catch (error) {
    console.error('❌ Error in addRequestFile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ إضافة رسالة إلى الطلب
// ============================================================
export const addRequestMessage = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { message, attachments } = req.body;
    const userRole = req.account?.role || 'customer';

    // ✅ فحص الرسالة
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // ✅ فحص الصلاحية
    if (!checkRequestAccess(request, accountId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // ✅ فحص المرفقات (مهم!)
    let validatedAttachments = [];
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const fileIds = attachments
        .map((a) => (typeof a === 'object' ? a.fileId : a))
        .filter(Boolean);

      if (fileIds.length > 0) {
        const invalidFileId = fileIds.find(
          (fid) => !mongoose.Types.ObjectId.isValid(fid)
        );

        if (invalidFileId) {
          return res.status(400).json({
            success: false,
            message: 'One or more attachment IDs are invalid',
          });
        }

        const validFiles = await File.find({
          _id: { $in: fileIds },
          portalId,
          isDeleted: { $ne: true },
        }).select('_id originalName');

        if (validFiles.length !== fileIds.length) {
          return res.status(403).json({
            success: false,
            message:
              'One or more attachments do not belong to this portal.',
            code: 'ATTACHMENT_ACCESS_DENIED',
          });
        }

        // ✅ ربط المرفقات بأسماء الملفات
        validatedAttachments = validFiles.map((f) => ({
          fileId: f._id,
          filename: f.originalName,
        }));
      }
    }

    request.messages.push({
      senderId: accountId,
      senderRole: userRole,
      message: message.trim(),
      attachments: validatedAttachments,
      createdAt: new Date(),
    });

    request.addActivity('message_sent', accountId, userRole, null, {
      message: message.trim(),
    });

    await request.save();

    const newMessage = request.messages[request.messages.length - 1];

    // ✅ إشعار للطرف الآخر
    try {
      const notificationService = getNotificationService(req.app?.get('io'));

      const recipientId =
        userRole === 'customer' ? request.specialistId : request.accountId;

      if (recipientId && recipientId.toString() !== accountId.toString()) {
        await notificationService.sendNotification({
          portalId: request.portalId,
          accountId: recipientId,
          type: 'new_message',
          title: 'New message',
          titleAr: 'رسالة جديدة',
          message: `New message on request ${request.requestNumber}`,
          messageAr: `رسالة جديدة على الطلب ${request.requestNumber}`,
          data: { requestId: request._id },
          priority: 'medium',
        });
      }
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError.message);
    }

    res.json({
      success: true,
      data: newMessage,
      message: 'تم إرسال الرسالة بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in addRequestMessage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ جلب رسائل الطلب
// ============================================================
export const getRequestMessages = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    if (!checkRequestAccess(request, accountId, req.account?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    request.markAsRead(accountId);
    await request.save();

    res.json({
      success: true,
      data: request.messages || [],
    });
  } catch (error) {
    console.error('❌ Error in getRequestMessages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ جلب ملفات الطلب
// ============================================================
export const getRequestFiles = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    if (!checkRequestAccess(request, accountId, req.account?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    await request.populate(
      'files.fileId',
      'originalName size mimeType storageKey'
    );
    await request.populate(
      'paymentProofs.fileId',
      'originalName size mimeType storageKey'
    );

    res.json({
      success: true,
      data: {
        files: request.files || [],
        paymentProofs: request.paymentProofs || [],
      },
    });
  } catch (error) {
    console.error('❌ Error in getRequestFiles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ تحديد نطاق العمل (للمختص)
// ============================================================
export const defineRequestScope = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const {
      description,
      deliverables,
      requirements,
      estimatedDuration,
      price,
      modificationsIncluded,
      exclusions,
    } = req.body;

    if (!description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Description and price are required',
      });
    }

    if (request.specialistId?.toString() !== accountId) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned specialist can define the scope',
      });
    }

    request.scope = {
      description,
      deliverables: deliverables || [],
      requirements: requirements || [],
      estimatedDuration: estimatedDuration || '',
      price: parseFloat(price),
      currency: 'SAR',
      modificationsIncluded: parseInt(modificationsIncluded) || 0,
      exclusions: exclusions || [],
    };

    request.price = parseFloat(price);

    const oldStatus = request.status;
    request.status = 'awaiting_approval';

    request.addActivity('scope_defined', accountId, 'specialist', null, {
      description,
      price,
    });

    request.addActivity(
      'status_changed',
      accountId,
      'specialist',
      oldStatus,
      'awaiting_approval',
      { reason: 'Scope defined' }
    );

    await request.save();

    res.json({
      success: true,
      data: request.scope,
      message: 'تم تحديد نطاق العمل بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in defineRequestScope:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ تحديد نطاق العمل (للمدير)
// ============================================================
export const adminDefineScope = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const {
      description,
      deliverables,
      requirements,
      estimatedDuration,
      price,
      modificationsIncluded,
      exclusions,
    } = req.body;

    if (!description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Description and price are required',
      });
    }

    const userIsAdmin = isAdmin(req.account?.role);
    const isSpecialist = request.specialistId?.toString() === accountId;

    if (!userIsAdmin && !isSpecialist) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned specialist or admin can define the scope',
      });
    }

    request.scope = {
      description,
      deliverables: deliverables || [],
      requirements: requirements || [],
      estimatedDuration: estimatedDuration || '',
      price: parseFloat(price),
      currency: 'SAR',
      modificationsIncluded: parseInt(modificationsIncluded) || 0,
      exclusions: exclusions || [],
    };

    request.price = parseFloat(price);

    const oldStatus = request.status;
    request.status = 'awaiting_approval';

    const actorRole = userIsAdmin ? 'portal_admin' : 'specialist';

    request.addActivity('scope_defined', accountId, actorRole, null, {
      description,
      price,
    });

    request.addActivity(
      'status_changed',
      accountId,
      actorRole,
      oldStatus,
      'awaiting_approval',
      { reason: 'Scope defined' }
    );

    await request.save();

    res.json({
      success: true,
      data: request.scope,
      message: 'تم تحديد نطاق العمل بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in adminDefineScope:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to define scope',
    });
  }
};

// ============================================================
// ✅ اعتماد نطاق العمل (من قبل العميل)
// ============================================================
export const approveRequestScope = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    if (request.accountId?.toString() !== accountId) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can approve the scope',
      });
    }

    if (!request.scope || !request.scope.description) {
      return res.status(400).json({
        success: false,
        message: 'Scope has not been defined yet',
      });
    }

    request.scope.approvedBy = accountId;
    request.scope.approvedAt = new Date();

    const oldStatus = request.status;
    request.status = 'awaiting_payment';

    request.addActivity('scope_approved', accountId, 'customer', null, {
      scope: request.scope,
    });

    request.addActivity(
      'status_changed',
      accountId,
      'customer',
      oldStatus,
      'awaiting_payment',
      { reason: 'Scope approved' }
    );

    await request.save();

    res.json({
      success: true,
      data: request.scope,
      message: 'تم اعتماد نطاق العمل بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in approveRequestScope:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ تقديم الدفع (العميل)
// ============================================================
export const submitPayment = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { amount, paymentMethod, proofFileId } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    if (request.accountId?.toString() !== accountId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can submit payment',
      });
    }

    if (request.portalId?.toString() !== portalId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Request does not belong to the current portal',
        code: 'REQUEST_PORTAL_ACCESS_DENIED',
      });
    }

    // 🔐 فحص ملف إثبات الدفع
    if (proofFileId) {
      if (!mongoose.Types.ObjectId.isValid(proofFileId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment proof file ID',
          code: 'INVALID_PROOF_FILE_ID',
        });
      }

      const proofFile = await File.findOne({
        _id: proofFileId,
        portalId,
        accountId,
        isDeleted: { $ne: true },
      }).select('_id portalId accountId isDeleted');

      if (!proofFile) {
        console.warn(
          `🚫 Unauthorized payment proof attempt: ` +
            `account=${accountId}, portal=${portalId}, file=${proofFileId}`
        );

        return res.status(403).json({
          success: false,
          message:
            'The payment proof file is not authorized for this account or portal.',
          code: 'PROOF_FILE_ACCESS_DENIED',
        });
      }
    }

    // ✅ حفظ المبلغ المطلوب للتحقق
    const expectedPrice = request.scope?.price || request.price || 0;
    const submittedAmount = parseFloat(amount);

    // ✅ منطق الدفع:
    // - إذا paymentMethod === 'manual' أو 'bank_transfer' → submitted (بانتظار التحقق)
    // - إزالة التأكيد التلقائي لـ credit_card/mada — يحتاج تكامل بوابة دفع حقيقية
    request.paymentStatus = 'submitted';
    request.price = submittedAmount;

    // ⚠️ تحذير: إذا كان المبلغ أقل من المتوقع
    if (expectedPrice > 0 && submittedAmount < expectedPrice) {
      console.warn(
        `⚠️ Partial payment: expected=${expectedPrice}, submitted=${submittedAmount}`
      );
      request.metadata = {
        ...request.metadata,
        partialPayment: true,
        expectedAmount: expectedPrice,
      };
    }

    if (proofFileId) {
      request.paymentProofs.push({
        fileId: proofFileId,
        filename: 'إثبات الدفع',
        uploadedAt: new Date(),
        verified: false,
      });
    }

    request.addActivity('payment_submitted', accountId, 'customer', null, {
      amount: submittedAmount,
      paymentMethod,
      expectedPrice,
    });

    await request.save();

    // ✅ إشعار للمدير
    try {
      const notificationService = getNotificationService(req.app?.get('io'));

      const admins = await Account.find({
        portalId: request.portalId,
        role: { $in: ['portal_admin', 'super_admin'] },
        isActive: true,
      }).select('_id role');

      for (const admin of admins) {
        await notificationService.sendNotification({
          portalId: request.portalId,
          accountId: admin._id,
          type: 'payment_received',
          title: 'Payment submitted',
          titleAr: 'تم تقديم دفعة جديدة',
          message: `Payment of ${submittedAmount} SAR submitted for request ${request.requestNumber}`,
          messageAr: `تم تقديم دفعة بمبلغ ${submittedAmount} ريال للطلب ${request.requestNumber}`,
          data: {
            requestId: request._id,
            paymentId: proofFileId || null,
          },
          priority: 'high',
        });
      }
    } catch (err) {
      console.error('⚠️ Admin notification error:', err.message);
    }

    res.json({
      success: true,
      data: {
        paymentStatus: request.paymentStatus,
        status: request.status,
        price: request.price,
      },
      message: '📤 تم تقديم طلب الدفع — سيتم التحقق منه قريباً',
    });
  } catch (error) {
    console.error('❌ Error in submitPayment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ تأكيد الدفع (للمدير)
// ============================================================
export const verifyPayment = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const userRole = req.account?.role || 'customer';

    if (!isAdmin(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can verify payments',
      });
    }

    if (request.paymentStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Payment cannot be verified. Current status: ${request.paymentStatus}`,
      });
    }

    const oldStatus = request.paymentStatus;
    request.paymentStatus = 'verified';
    request.paymentVerifiedAt = new Date();

    request.paymentProofs.forEach((p) => {
      if (!p.verified) {
        p.verified = true;
        p.verifiedBy = accountId;
        p.verifiedAt = new Date();
      }
    });

    if (request.status === 'awaiting_payment') {
      request.status = 'in_progress';
      request.startedAt = new Date();
    }

    request.addActivity(
      'payment_verified',
      accountId,
      userRole,
      oldStatus,
      'verified',
      { amount: request.price }
    );

    await request.save();

    // ✅ إشعار للعميل
    await safeSendNotification(req, {
      portalId: request.portalId,
      accountId: request.accountId,
      type: 'payment_verified',
      title: 'Payment verified',
      titleAr: 'تم تأكيد دفعتك',
      message: `Your payment of ${request.price} SAR has been verified`,
      messageAr: `تم تأكيد دفعتك بمبلغ ${request.price} ريال`,
      data: { requestId: request._id },
      priority: 'high',
    });

    res.json({
      success: true,
      data: {
        paymentStatus: request.paymentStatus,
        status: request.status,
        price: request.price,
      },
      message: '✅ تم تأكيد الدفع بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in verifyPayment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
};

// ============================================================
// ✅ رفض الدفع (للمدير)
// ============================================================
export const rejectPayment = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const userRole = req.account?.role || 'customer';
    const { reason } = req.body;

    if (!isAdmin(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can reject payments',
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    if (request.paymentStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Payment cannot be rejected. Current status: ${request.paymentStatus}`,
      });
    }

    const oldStatus = request.paymentStatus;
    request.paymentStatus = 'rejected';

    request.paymentProofs.forEach((p) => {
      if (!p.verified) {
        p.rejectionReason = reason.trim();
      }
    });

    request.metadata = {
      ...request.metadata,
      paymentRejectionReason: reason.trim(),
      paymentRejectedAt: new Date(),
      paymentRejectedBy: accountId,
    };

    request.addActivity(
      'payment_rejected',
      accountId,
      userRole,
      oldStatus,
      'rejected',
      { reason: reason.trim() }
    );

    await request.save();

    // ✅ إشعار للعميل
    await safeSendNotification(req, {
      portalId: request.portalId,
      accountId: request.accountId,
      type: 'payment_failed',
      title: 'Payment rejected',
      titleAr: 'تم رفض دفعتك',
      message: `Your payment was rejected: ${reason.trim()}`,
      messageAr: `تم رفض دفعتك. السبب: ${reason.trim()}`,
      data: { requestId: request._id },
      priority: 'high',
    });

    res.json({
      success: true,
      data: {
        paymentStatus: request.paymentStatus,
        rejectionReason: reason.trim(),
      },
      message: '❌ تم رفض الدفع',
    });
  } catch (error) {
    console.error('❌ Error in rejectPayment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject payment',
    });
  }
};

// ============================================================
// ✅ جدولة مكالمة
// ============================================================
export const addRequestCall = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const userRole = req.account?.role || 'customer';
    const { purpose, scheduledAt, duration, notes, type } = req.body;

    console.log('📞 Adding call to request:', request._id);

    if (!purpose || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Purpose and scheduled time are required',
      });
    }

    // ✅ فحص الصلاحية
    if (!checkRequestAccess(request, accountId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const validTypes = ['audio', 'video'];
    const callType = type && validTypes.includes(type) ? type : 'video';

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduled date',
      });
    }

    const callerRole = userRole;

    const callData = {
      requestedBy: accountId,
      requestedRole: callerRole,
      scheduledAt: scheduledDate,
      duration: duration || 30,
      purpose: purpose.trim(),
      notes: notes || '',
      status: 'scheduled',
      type: callType,
    };

    request.addCall(callData);
    await request.save();

    const newCall = request.calls[request.calls.length - 1];

    // ✅ إشعار عبر WebSocket
    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-scheduled', {
        callId: newCall._id,
        purpose: newCall.purpose,
        scheduledAt: newCall.scheduledAt,
        type: newCall.type,
        requestedBy: accountId,
        requestedRole: callerRole,
      });
    }

    // ✅ إشعار للطرف الآخر
    const recipientId =
      userRole === 'customer' ? request.specialistId : request.accountId;

    if (recipientId) {
      await safeSendNotification(req, {
        portalId: request.portalId,
        accountId: recipientId,
        type: 'call_scheduled',
        title: 'New call scheduled',
        titleAr: 'تم جدولة مكالمة جديدة',
        message: `Call scheduled for request ${request.requestNumber}`,
        messageAr: `تم جدولة مكالمة للطلب ${request.requestNumber}`,
        data: { requestId: request._id, callId: newCall._id },
        priority: 'high',
      });
    }

    res.status(201).json({
      success: true,
      data: newCall,
      message: `✅ تم جدولة المكالمة (${
        callType === 'audio' ? 'صوتية' : 'فيديو'
      }) بنجاح`,
    });
  } catch (error) {
    console.error('❌ Error in addRequestCall:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule call',
    });
  }
};

// ============================================================
// ✅ جلب مكالمات الطلب
// ============================================================
export const getRequestCalls = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    if (!checkRequestAccess(request, accountId, req.account?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const callsWithInfo = await request.getCallsWithSenderInfo();

    res.json({
      success: true,
      data: callsWithInfo || [],
      count: callsWithInfo?.length || 0,
    });
  } catch (error) {
    console.error('❌ Error in getRequestCalls:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get calls',
    });
  }
};

// ============================================================
// ✅ بدء مكالمة مجدولة
// ============================================================
export const startScheduledCall = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const userRole = req.account?.role || 'customer';
    const { callId } = req.params;

    console.log('📞 Starting scheduled call:', callId);

    if (!callId) {
      return res.status(400).json({
        success: false,
        message: 'Call ID is required',
      });
    }

    const callIndex = request.calls.findIndex(
      (c) => c._id?.toString() === callId
    );
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    const call = request.calls[callIndex];

    if (call.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot start a call with status: ${call.status}`,
      });
    }

    // ✅ فحص الصلاحية — العميل أو المختص أو admin
    if (!checkRequestAccess(request, accountId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const oldStatus = call.status;
    call.status = 'started';
    call.updatedAt = new Date();

    request.addActivity(
      'call_started',
      accountId,
      userRole,
      oldStatus,
      'started',
      {
        callId,
        purpose: call.purpose,
        type: call.type || 'video',
      }
    );

    await request.save();

    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-started', {
        callId: call._id,
        status: call.status,
        type: call.type || 'video',
        startedBy: accountId,
        startedByName:
          req.account?.profile?.fullName || req.account?.username,
        scheduledAt: call.scheduledAt,
      });
    }

    res.json({
      success: true,
      data: {
        callId: call._id,
        status: call.status,
        type: call.type || 'video',
        startedAt: call.updatedAt,
        scheduledAt: call.scheduledAt,
      },
      message: `✅ تم بدء المكالمة (${
        call.type === 'audio' ? 'صوتية' : 'فيديو'
      }) بنجاح`,
    });
  } catch (error) {
    console.error('❌ Error in startScheduledCall:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start call',
    });
  }
};

// ============================================================
// ✅ تحديث مكالمة
// ============================================================
export const updateRequestCall = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const userRole = req.account?.role || 'customer';
    const { callId } = req.params;
    const { status, notes, callUrl, recordingUrl, duration } = req.body;

    console.log('📞 Updating call:', { callId, status, accountId });

    if (!callId) {
      return res.status(400).json({
        success: false,
        message: 'Call ID is required',
      });
    }

    if (!request.calls || request.calls.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No calls found for this request',
      });
    }

    const callIndex = request.calls.findIndex(
      (c) => c._id?.toString() === callId
    );
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    const call = request.calls[callIndex];

    // ✅ فحص الصلاحية
    if (!checkRequestAccess(request, accountId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (status) {
      const validStatuses = [
        'scheduled',
        'started',
        'completed',
        'cancelled',
        'missed',
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${validStatuses.join(', ')}`,
        });
      }
    }

    const oldStatus = call.status;

    if (status) call.status = status;
    if (notes !== undefined) call.notes = notes;
    if (callUrl !== undefined) call.callUrl = callUrl;
    if (recordingUrl !== undefined) call.recordingUrl = recordingUrl;
    if (duration !== undefined) call.duration = duration;

    call.updatedAt = new Date();

    if (status === 'completed') {
      call.completedAt = new Date();
    }

    if (status && status !== oldStatus) {
      request.addActivity(
        status === 'completed' ? 'call_completed' : 'call_updated',
        accountId,
        userRole,
        oldStatus,
        status,
        { callId, purpose: call.purpose }
      );
    }

    await request.save();

    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-status-updated', {
        callId,
        status: call.status,
        updatedBy: accountId,
      });
    }

    res.json({
      success: true,
      data: call,
      message: `✅ تم تحديث المكالمة إلى "${status}" بنجاح`,
    });
  } catch (error) {
    console.error('❌ Error in updateRequestCall:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update call',
    });
  }
};

// ============================================================
// ✅ إلغاء مكالمة
// ============================================================
export const cancelRequestCall = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const userRole = req.account?.role || 'customer';
    const { callId } = req.params;

    console.log('📞 Cancelling call:', callId);

    if (!callId) {
      return res.status(400).json({
        success: false,
        message: 'Call ID is required',
      });
    }

    // ✅ فحص الصلاحية
    if (!checkRequestAccess(request, accountId, userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    try {
      request.cancelCallById(callId, accountId, userRole);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Cannot cancel this call',
      });
    }

    await request.save();

    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-cancelled', {
        callId: callId,
        cancelledBy: accountId,
      });
    }

    res.json({
      success: true,
      data: { callId, status: 'cancelled' },
      message: '✅ تم إلغاء المكالمة بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in cancelRequestCall:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel call',
    });
  }
};

// ============================================================
// ✅ المكالمات القادمة
// ============================================================
export const getUpcomingCallsForRequest = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    if (!checkRequestAccess(request, accountId, req.account?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const upcomingCalls = request.getUpcomingCalls();

    res.json({
      success: true,
      data: upcomingCalls,
      count: upcomingCalls.length,
    });
  } catch (error) {
    console.error('❌ Error in getUpcomingCallsForRequest:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get upcoming calls',
    });
  }
};

// ============================================================
// ✅ المكالمات السابقة
// ============================================================
export const getPastCallsForRequest = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    if (!checkRequestAccess(request, accountId, req.account?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const pastCalls = request.getPastCalls();

    res.json({
      success: true,
      data: pastCalls,
      count: pastCalls.length,
    });
  } catch (error) {
    console.error('❌ Error in getPastCallsForRequest:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get past calls',
    });
  }
};

// ============================================================
// ✅ جلب نشاطات الطلب
// ============================================================
export const getRequestActivity = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    if (!checkRequestAccess(request, accountId, req.account?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: request.activityLog || [],
    });
  } catch (error) {
    console.error('❌ Error in getRequestActivity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================
export default {
  getMyRequests,
  getSpecialistRequests,
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  updateRequestStatus,
  assignSpecialist,
  deleteRequest,
  getRequestStats,
  addRequestFile,
  addRequestMessage,
  getRequestMessages,
  getRequestFiles,
  defineRequestScope,
  adminDefineScope,
  approveRequestScope,
  submitPayment,
  verifyPayment,
  rejectPayment,
  addRequestCall,
  getRequestCalls,
  startScheduledCall,
  updateRequestCall,
  cancelRequestCall,
  getUpcomingCallsForRequest,
  getPastCallsForRequest,
  getRequestActivity,
};