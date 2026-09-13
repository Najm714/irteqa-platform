// backend/src/controllers/request.controller.js
import { Request } from '../models/Request.model.js';
import { File } from '../models/File.model.js';
import { Account } from '../models/Account.model.js';
import { getNotificationService } from '../services/notification.service.js';

// ============================================================
// ✅ دالة مساعدة: إرسال إشعار بأمان
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

    let requests = await Request.find(query)
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
      requests = requests.filter(r =>
        searchRegex.test(r.requestNumber) ||
        searchRegex.test(r.formData?.title || '') ||
        searchRegex.test(r.serviceId?.name || '') ||
        searchRegex.test(r.serviceId?.nameAr || '')
      );
    }

    const total = await Request.countDocuments(query);

    const formattedRequests = requests.map(order => ({
      _id: order._id,
      requestNumber: order.requestNumber,
      title: order.formData?.title || order.title || 'طلب',
      description: order.formData?.description || order.description || '',
      service: order.serviceId || { name: 'خدمة', nameAr: 'خدمة' },
      requestType: order.requestTypeId,
      specialist: order.specialistId,
      status: order.status || 'new',
      paymentStatus: order.paymentStatus || 'pending',
      price: order.scope?.price || order.price || 0,
      estimatedDuration: order.scope?.estimatedDuration,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      files: order.files?.map(f => ({
        _id: f.fileId?._id,
        filename: f.fileId?.originalName,
        category: f.category,
      })) || [],
      paymentProofs: order.paymentProofs?.map(p => ({
        _id: p._id,
        fileId: p.fileId?._id || p.fileId,
        filename: p.fileId?.originalName || p.filename,
        verified: p.verified || false,
        rejectionReason: p.rejectionReason || null,
      })) || [],
      messages: order.messages?.length || 0,
      calls: order.calls?.length || 0,
      activityLog: order.activityLog?.slice(0, 5) || [],
    }));

    res.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getMyRequests:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
      .populate('serviceId', 'name nameAr icon')
      .populate('requestTypeId', 'name nameAr')
      .populate('accountId', 'profile.fullName email')
      .populate('files.fileId', 'originalName size mimeType')
      .populate('paymentProofs.fileId', 'originalName size mimeType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);

    const formattedRequests = requests.map(order => ({
      _id: order._id,
      requestNumber: order.requestNumber,
      title: order.formData?.title || order.title || 'طلب',
      description: order.formData?.description || order.description || '',
      service: order.serviceId,
      requestType: order.requestTypeId,
      customer: order.accountId,
      status: order.status || 'new',
      paymentStatus: order.paymentStatus || 'pending',
      price: order.scope?.price || order.price || 0,
      estimatedDuration: order.scope?.estimatedDuration,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      files: order.files?.map(f => ({
        _id: f.fileId?._id,
        filename: f.fileId?.originalName,
        category: f.category,
      })) || [],
      paymentProofs: order.paymentProofs?.map(p => ({
        _id: p._id,
        fileId: p.fileId?._id || p.fileId,
        filename: p.fileId?.originalName || p.filename,
        verified: p.verified || false,
        rejectionReason: p.rejectionReason || null,
      })) || [],
      messages: order.messages?.length || 0,
      calls: order.calls?.length || 0,
    }));

    res.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getSpecialistRequests:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
      requests = requests.filter(r =>
        searchRegex.test(r.requestNumber) ||
        searchRegex.test(r.formData?.title || '') ||
        searchRegex.test(r.serviceId?.name || '') ||
        searchRegex.test(r.serviceId?.nameAr || '') ||
        searchRegex.test(r.accountId?.profile?.fullName || '')
      );
    }

    const total = await Request.countDocuments(query);

    const formattedRequests = requests.map(order => ({
      _id: order._id,
      requestNumber: order.requestNumber,
      title: order.formData?.title || order.title || 'طلب',
      description: order.formData?.description || order.description || '',
      service: order.serviceId,
      requestType: order.requestTypeId,
      customer: order.accountId,
      specialist: order.specialistId,
      status: order.status || 'new',
      paymentStatus: order.paymentStatus || 'pending',
      price: order.scope?.price || order.price || 0,
      estimatedDuration: order.scope?.estimatedDuration,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      files: order.files?.map(f => ({
        _id: f.fileId?._id,
        filename: f.fileId?.originalName,
        category: f.category,
      })) || [],
      paymentProofs: order.paymentProofs?.map(p => ({
        _id: p._id,
        fileId: p.fileId?._id || p.fileId,
        filename: p.fileId?.originalName || p.filename,
        verified: p.verified || false,
        rejectionReason: p.rejectionReason || null,
      })) || [],
      messages: order.messages?.length || 0,
      calls: order.calls?.length || 0,
      activityLog: order.activityLog?.slice(0, 5) || [],
    }));

    res.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getAllRequests:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
      .populate('serviceId', 'name nameAr icon description')
      .populate('requestTypeId', 'name nameAr description')
      .populate('accountId', 'profile.fullName email phone')
      .populate('specialistId', 'profile.fullName email phone')
      .populate('files.fileId', 'originalName size mimeType storageKey')
      .populate('paymentProofs.fileId', 'originalName size mimeType storageKey')
      .populate('messages.senderId', 'profile.fullName')
      .populate('activityLog.actorId', 'profile.fullName');

    console.log('📤 Request data:');
    console.log('  - Files:', populatedRequest.files?.length || 0);
    console.log('  - Payment Proofs:', populatedRequest.paymentProofs?.length || 0);

    res.json({
      success: true,
      data: populatedRequest,
    });
  } catch (error) {
    console.error('❌ Error in getRequestById:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
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

    const request = new Request({
      portalId,
      accountId,
      serviceId,
      requestTypeId,
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

    for (const fileId of files) {
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

    // ✅ 1. إشعار للعميل (صاحب الطلب)
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

    // ✅ 2. إشعار لجميع المديرين (portal_admin + super_admin)
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

      // 🎯 2a. إشعار لـ portal_admin في نفس البوابة
      const portalAdmins = await Account.find({
        portalId: request.portalId,
        role: 'portal_admin',
        isActive: true,
      });

      for (const admin of portalAdmins) {
        await notificationService.sendNotification({
          portalId: request.portalId,
          accountId: admin._id,
          ...adminNotification,
        });
      }

      console.log(`✅ Notified ${portalAdmins.length} portal_admin(s)`);

      // 🎯 2b. إشعار لـ super_admin (جميع المشرفين)
      const superAdmins = await Account.find({
        role: 'super_admin',
        isActive: true,
      });

      for (const admin of superAdmins) {
        await notificationService.sendNotification({
          portalId: request.portalId,
          accountId: admin._id,
          ...adminNotification,
          priority: 'high', // super_admin يحصل على أولوية أعلى
        });
      }

      console.log(`✅ Notified ${superAdmins.length} super_admin(s)`);

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================================
// ✅ تحديث الطلب
// ============================================================
export const updateRequest = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const { formData, scope } = req.body;

    if (formData) {
      request.formData = { ...request.formData, ...formData };
    }

    if (scope) {
      request.scope = { ...request.scope, ...scope };
    }

    request.addActivity('request_updated', accountId, req.account?.role || 'customer', null, {
      formData,
      scope,
    });

    await request.save();

    res.json({
      success: true,
      data: request,
      message: 'تم تحديث الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in updateRequest:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

    const oldStatus = request.status;
    request.status = status;

    if (notes) {
      request.metadata = { ...request.metadata, statusChangeNotes: notes };
    }

    if (status === 'assigned') request.startedAt = new Date();
    if (status === 'completed') request.completedAt = new Date();
    if (status === 'closed') request.closedAt = new Date();
    if (status === 'cancelled') request.isActive = false;

    request.addActivity(
      'status_changed',
      accountId,
      req.account?.role || 'customer',
      oldStatus,
      status,
      { notes }
    );

    await request.save();

    // ✅ إشعار للعميل
    const statusMessages = {
      'in_progress': { ar: 'طلبك قيد التنفيذ الآن', en: 'Your request is now in progress' },
      'completed': { ar: 'تم إكمال طلبك', en: 'Your request has been completed' },
      'cancelled': { ar: 'تم إلغاء طلبك', en: 'Your request has been cancelled' },
      'closed': { ar: 'تم إغلاق طلبك', en: 'Your request has been closed' },
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const assignSpecialist = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const { specialistId } = req.body;

    if (!specialistId) {
      return res.status(400).json({
        success: false,
        message: 'Specialist ID is required',
      });
    }

    const oldSpecialist = request.specialistId;
    request.specialistId = specialistId;
    request.status = 'assigned';

    request.addActivity(
      'specialist_assigned',
      accountId,
      req.account?.role || 'portal_admin',
      oldSpecialist,
      specialistId,
      { specialistId }
    );

    await request.save();

    // ✅ 1. إشعار للمختص
    await safeSendNotification(req, {
      portalId: request.portalId,
      accountId: specialistId,
      type: 'request_assigned',
      title: 'New request assigned',
      titleAr: 'تم إسناد طلب جديد إليك',
      message: `Request ${request.requestNumber} has been assigned to you`,
      messageAr: `تم إسناد الطلب رقم ${request.requestNumber} إليك`,
      data: { requestId: request._id },
      priority: 'high',
    });

    // ✅ 2. إشعار للعميل (صاحب الطلب)
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ حذف الطلب (ناعم)
// ============================================================
export const deleteRequest = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    request.isDeleted = true;
    request.deletedAt = new Date();
    request.deletedBy = accountId;
    request.isActive = false;

    request.addActivity('deleted', accountId, req.account?.role || 'customer');

    await request.save();

    res.json({
      success: true,
      message: 'تم حذف الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in deleteRequest:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ إحصائيات الطلبات (للمدير)
// ============================================================
export const getRequestStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    const stats = await Request.aggregate([
      { $match: { portalId, isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const total = await Request.countDocuments({ portalId, isDeleted: { $ne: true } });

    const statusMap = {};
    stats.forEach(s => { statusMap[s._id] = s.count; });

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
    const { fileIds, category } = req.body;

    console.log('📤 addRequestFile:', { role, category, fileIds });

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one file ID is required',
      });
    }

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

    const files = await File.find({ _id: { $in: fileIds } });
    if (files.length !== fileIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some files not found',
      });
    }

    for (const fileId of fileIds) {
      const file = files.find(f => f._id.toString() === fileId);

      if (finalCategory === 'proof' || finalCategory === 'payment_proof') {
        const exists = request.paymentProofs.some(p => p.fileId?.toString() === fileId);
        if (!exists) {
          request.paymentProofs.push({
            fileId,
            filename: file?.originalName || '',
            uploadedAt: new Date(),
            verified: false,
          });
        }
      } else {
        const exists = request.files.some(f => f.fileId?.toString() === fileId);
        if (!exists) {
          request.files.push({
            fileId,
            category: finalCategory,
            uploadedAt: new Date(),
            uploadedBy: accountId,
            description: file?.originalName || '',
          });
        }
      }
    }

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ إضافة رسالة إلى الطلب
// ============================================================
export const addRequestMessage = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const { message, attachments } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const senderRole = req.account?.role || 'customer';

    request.messages.push({
      senderId: accountId,
      senderRole,
      message: message.trim(),
      attachments: attachments || [],
      createdAt: new Date(),
    });

    request.addActivity('message_sent', accountId, senderRole, null, {
      message: message.trim(),
    });

    await request.save();

    const newMessage = request.messages[request.messages.length - 1];

    // ✅ إشعار للطرف الآخر
    try {
      const notificationService = getNotificationService(req.app?.get('io'));

      const requestAccountId = request.accountId?._id?.toString() || request.accountId?.toString();
      const recipientId = senderRole === 'customer'
        ? request.specialistId
        : request.accountId;

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب رسائل الطلب
// ============================================================
export const getRequestMessages = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    request.markAsRead(accountId);
    await request.save();

    res.json({
      success: true,
      data: request.messages || [],
    });
  } catch (error) {
    console.error('❌ Error in getRequestMessages:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب ملفات الطلب
// ============================================================
export const getRequestFiles = async (req, res) => {
  try {
    const request = req.request;

    await request.populate('files.fileId', 'originalName size mimeType storageKey');
    await request.populate('paymentProofs.fileId', 'originalName size mimeType storageKey');

    res.json({
      success: true,
      data: {
        files: request.files || [],
        paymentProofs: request.paymentProofs || [],
      },
    });
  } catch (error) {
    console.error('❌ Error in getRequestFiles:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

    request.addActivity('status_changed', accountId, 'specialist', oldStatus, 'awaiting_approval', {
      reason: 'Scope defined',
    });

    await request.save();

    res.json({
      success: true,
      data: request.scope,
      message: 'تم تحديد نطاق العمل بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in defineRequestScope:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';
    const isSpecialist = request.specialistId?.toString() === accountId;

    if (!isAdmin && !isSpecialist) {
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

    request.addActivity('scope_defined', accountId, isAdmin ? 'portal_admin' : 'specialist', null, {
      description,
      price,
    });

    request.addActivity('status_changed', accountId, isAdmin ? 'portal_admin' : 'specialist', oldStatus, 'awaiting_approval', {
      reason: 'Scope defined',
    });

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

    request.addActivity('status_changed', accountId, 'customer', oldStatus, 'awaiting_payment', {
      reason: 'Scope approved',
    });

    await request.save();

    res.json({
      success: true,
      data: request.scope,
      message: 'تم اعتماد نطاق العمل بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in approveRequestScope:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تقديم الدفع (من قبل العميل)
// ============================================================
export const submitPayment = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const { amount, paymentMethod, proofFileId } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    if (request.accountId?.toString() !== accountId) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can submit payment',
      });
    }

    request.paymentStatus = 'submitted';
    request.price = parseFloat(amount);

    if (proofFileId) {
      request.paymentProofs.push({
        fileId: proofFileId,
        filename: 'إثبات الدفع',
        uploadedAt: new Date(),
        verified: false,
      });
    }

    if (paymentMethod === 'credit_card' || paymentMethod === 'mada') {
      request.paymentStatus = 'verified';
      request.paymentVerifiedAt = new Date();

      const oldStatus = request.status;
      request.status = 'in_progress';

      request.addActivity('status_changed', accountId, 'customer', oldStatus, 'in_progress', {
        reason: 'Payment verified',
      });
    }

    request.addActivity('payment_submitted', accountId, 'customer', null, {
      amount,
      paymentMethod,
    });

    await request.save();

    // ✅ إشعار للمدير
    await safeSendNotification(req, {
      portalId: request.portalId,
      accountId: request.specialistId || request.accountId,
      type: 'payment_received',
      title: 'Payment submitted',
      titleAr: 'تم تقديم دفعة جديدة',
      message: `Payment of ${amount} SAR submitted for request ${request.requestNumber}`,
      messageAr: `تم تقديم دفعة بمبلغ ${amount} ريال للطلب ${request.requestNumber}`,
      data: { requestId: request._id, paymentId: proofFileId },
      priority: 'high',
    });

    res.json({
      success: true,
      data: {
        paymentStatus: request.paymentStatus,
        status: request.status,
        price: request.price,
      },
      message: request.paymentStatus === 'verified' ? '✅ تم تأكيد الدفع بنجاح' : '📤 تم تقديم طلب الدفع',
    });
  } catch (error) {
    console.error('❌ Error in submitPayment:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تأكيد الدفع (للمدير)
// ============================================================
export const verifyPayment = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;

    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';
    if (!isAdmin) {
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
    request.paymentProofs.forEach(p => {
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

    request.addActivity('payment_verified', accountId, req.account?.role || 'portal_admin', oldStatus, 'verified', {
      amount: request.price,
    });

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
    const { reason } = req.body;

    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';
    if (!isAdmin) {
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
    request.paymentProofs.forEach(p => {
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

    request.addActivity('payment_rejected', accountId, req.account?.role || 'portal_admin', oldStatus, 'rejected', {
      reason: reason.trim(),
    });

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
// ✅ إضافة مكالمة إلى الطلب
// ============================================================
export const addRequestCall = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const { purpose, scheduledAt, duration, notes, type } = req.body;

    console.log('📞 Adding call to request:', request._id);

    if (!purpose || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Purpose and scheduled time are required',
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

    const isOwner = request.accountId?._id?.toString() === accountId?.toString() ||
                    request.accountId?.toString() === accountId?.toString();

    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    const isSpecialist = request.specialistId?._id?.toString() === accountId?.toString() ||
                         request.specialistId?.toString() === accountId?.toString();

    if (isSpecialist) {
      return res.status(403).json({
        success: false,
        message: 'Specialists cannot schedule calls. Only the client can schedule calls.',
      });
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the client (request owner) can schedule calls',
      });
    }

    const callerRole = isOwner ? 'customer' : 'portal_admin';

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

    // ✅ إشعار للمختص
    if (request.specialistId) {
      await safeSendNotification(req, {
        portalId: request.portalId,
        accountId: request.specialistId,
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
      message: `✅ تم جدولة المكالمة (${callType === 'audio' ? 'صوتية' : 'فيديو'}) بنجاح`,
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
    console.log('📤 Fetching calls for request:', request._id);

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
// ✅ بدء مكالمة مجدولة (للمختص)
// ============================================================
export const startScheduledCall = async (req, res) => {
  try {
    const request = req.request;
    const accountId = req.accountId;
    const { callId } = req.params;

    console.log('📞 Starting scheduled call:', callId);

    if (!callId) {
      return res.status(400).json({
        success: false,
        message: 'Call ID is required',
      });
    }

    const callIndex = request.calls.findIndex(c => c._id?.toString() === callId);
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

    const requestAccountId = request.accountId?._id?.toString() || request.accountId?.toString();
    const requestSpecialistId = request.specialistId?._id?.toString() || request.specialistId?.toString();
    const currentAccountId = accountId?.toString();

    const isOwner = requestAccountId === currentAccountId;
    const isSpecialist = requestSpecialistId === currentAccountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the specialist can start the call',
      });
    }

    if (!isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned specialist can start this call',
      });
    }

    const oldStatus = call.status;
    call.status = 'started';
    call.updatedAt = new Date();

    request.addActivity('call_started', accountId, 'specialist', oldStatus, 'started', {
      callId,
      purpose: call.purpose,
      type: call.type || 'video',
    });

    await request.save();

    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-started', {
        callId: call._id,
        status: call.status,
        type: call.type || 'video',
        startedBy: accountId,
        startedByName: req.account?.profile?.fullName || req.account?.username,
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
      message: `✅ تم بدء المكالمة (${call.type === 'audio' ? 'صوتية' : 'فيديو'}) بنجاح`,
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

    const callIndex = request.calls.findIndex(c => c._id?.toString() === callId);
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    const call = request.calls[callIndex];

    const requestAccountId = request.accountId?._id?.toString() || request.accountId?.toString();
    const requestSpecialistId = request.specialistId?._id?.toString() || request.specialistId?.toString();
    const currentAccountId = accountId?.toString();
    const callRequestedBy = call.requestedBy?._id?.toString() || call.requestedBy?.toString();

    const isOwner = requestAccountId === currentAccountId;
    const isSpecialist = requestSpecialistId === currentAccountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';
    const isCallInitiator = callRequestedBy === currentAccountId;

    if (!isOwner && !isSpecialist && !isAdmin && !isCallInitiator) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this call',
      });
    }

    if (status) {
      const validStatuses = ['scheduled', 'started', 'completed', 'cancelled', 'missed'];
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
        req.account?.role || 'customer',
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
    const { callId } = req.params;

    console.log('📞 Cancelling call:', callId);

    if (!callId) {
      return res.status(400).json({
        success: false,
        message: 'Call ID is required',
      });
    }

    const requestAccountId = request.accountId?._id?.toString() || request.accountId?.toString();
    const requestSpecialistId = request.specialistId?._id?.toString() || request.specialistId?.toString();
    const currentAccountId = accountId?.toString();

    const isOwner = requestAccountId === currentAccountId;
    const isSpecialist = requestSpecialistId === currentAccountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this call',
      });
    }

    try {
      request.cancelCallById(callId, accountId, req.account?.role || 'customer');
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
// ✅ المكالمات القادمة للطلب
// ============================================================
export const getUpcomingCallsForRequest = async (req, res) => {
  try {
    const request = req.request;
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
// ✅ المكالمات السابقة للطلب
// ============================================================
export const getPastCallsForRequest = async (req, res) => {
  try {
    const request = req.request;
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

    res.json({
      success: true,
      data: request.activityLog || [],
    });
  } catch (error) {
    console.error('❌ Error in getRequestActivity:', error);
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