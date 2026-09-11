// backend/src/controllers/order.controller.js
import { Request } from '../models/Request.model.js';
import { File } from '../models/File.model.js';

// ============================================================
// ✅ جلب الطلبات (للمدير أو للمستخدم)
// ============================================================
export const getMyOrders = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { status, limit = 50, page = 1, search } = req.query;

    const isAdminRoute = req.path?.includes('/all');
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    console.log('📋 جلب الطلبات...');
    console.log('  - Portal:', portalId);
    console.log('  - Account:', accountId);
    console.log('  - Is Admin Route:', isAdminRoute);
    console.log('  - Is Admin:', isAdmin);

    const query = { 
      portalId,
      isDeleted: { $ne: true },
    };

    if (isAdminRoute && isAdmin) {
      console.log('  - Mode: Admin - fetching all requests');
    } else {
      query.accountId = accountId;
      console.log('  - Mode: Customer - fetching own requests');
    }

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { requestNumber: { $regex: search, $options: 'i' } },
        { 'formData.title': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Request.find(query)
        .populate('serviceId', 'name nameAr slug icon')
        .populate('requestTypeId', 'name nameAr slug')
        .populate('files.fileId', 'originalName size mimeType')
        .populate('paymentProofs.fileId', 'originalName size mimeType')
        .populate('accountId', 'profile email phone')
        .populate('specialistId', 'profile email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Request.countDocuments(query),
    ]);

    console.log(`✅ تم العثور على ${orders.length} طلب`);

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      requestNumber: order.requestNumber,
      title: order.formData?.title || order.title || 'طلب',
      description: order.formData?.description || order.description || '',
      serviceId: order.serviceId,
      requestTypeId: order.requestTypeId,
      accountId: order.accountId,
      specialistId: order.specialistId,
      status: order.status || 'new',
      paymentStatus: order.paymentStatus || 'pending',
      price: order.price || order.scope?.price || 0,
      currency: order.currency || 'SAR',
      scope: order.scope,
      formData: order.formData,
      paymentProofs: order.paymentProofs?.map(p => ({
        _id: p._id,
        fileId: p.fileId?._id || p.fileId,
        filename: p.fileId?.originalName || p.filename,
        size: p.fileId?.size,
        mimeType: p.fileId?.mimeType,
        verified: p.verified || false,
        rejectionReason: p.rejectionReason || null,
        uploadedAt: p.uploadedAt,
      })) || [],
      files: order.files?.map(f => ({
        _id: f.fileId?._id,
        filename: f.fileId?.originalName,
        name: f.fileId?.originalName,
        storageProvider: f.fileId?.storageProvider,
        category: f.category,
      })) || [],
      messages: order.messages || [],
      activityLog: order.activityLog || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isDeleted: order.isDeleted,
      isActive: order.isActive,
    }));

    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getMyOrders:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جلب طلب محدد
// ============================================================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;

    const order = await Request.findOne({ _id: id, portalId, isDeleted: { $ne: true } })
      .populate('serviceId', 'name nameAr slug description pricing icon')
      .populate('requestTypeId', 'name nameAr slug')
      .populate('files.fileId', 'originalName size mimeType')
      .populate('paymentProofs.fileId', 'originalName size mimeType')
      .populate('accountId', 'profile email phone')
      .populate('specialistId', 'profile email phone')
      .populate('messages.senderId', 'profile email')
      .populate('activityLog.actorId', 'profile');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('❌ Error in getOrderById:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ إنشاء طلب جديد
// ============================================================
export const createOrder = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const {
      serviceId,
      requestTypeId,
      formData,
      title,
      description,
    } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'معرف الخدمة مطلوب',
      });
    }

    const order = new Request({
      portalId,
      accountId,
      serviceId,
      requestTypeId: requestTypeId || null,
      formData: formData || {},
      formSchemaSnapshot: {},
      title: title || formData?.title || 'طلب جديد',
      description: description || formData?.description || '',
      status: 'new',
      paymentStatus: 'pending',
      price: formData?.budget || 0,
      currency: 'SAR',
      scope: {
        price: formData?.budget || 0,
      },
      activityLog: [{
        action: 'request_created',
        actorId: accountId,
        actorRole: 'customer',
        timestamp: new Date(),
      }],
    });

    await order.save();

    res.status(201).json({
      success: true,
      data: order,
      message: 'تم إنشاء الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in createOrder:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'خطأ في التحقق من البيانات',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {}),
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تحديث طلب
// ============================================================
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const order = req.request;
    const accountId = req.accountId;

    const allowedFields = ['formData', 'scope', 'status', 'title', 'description', 'price'];
    let hasChanges = false;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'status') {
          const validStatuses = ['new', 'under_review', 'assigned', 'scope_definition', 
            'awaiting_approval', 'awaiting_payment', 'in_progress', 
            'under_review_2', 'modification', 'completed', 'closed', 'cancelled'];
          if (!validStatuses.includes(updates[field])) {
            return res.status(400).json({
              success: false,
              message: `حالة غير صالحة: ${updates[field]}`,
            });
          }
          order[field] = updates[field];
          order.addActivity('status_changed', accountId, req.account?.role || 'customer', 
            order.status, updates[field]);
        } else {
          order[field] = updates[field];
        }
        hasChanges = true;
      }
    }

    if (hasChanges) {
      order.updatedAt = new Date();
      await order.save();
    }

    res.json({
      success: true,
      data: order,
      message: 'تم تحديث الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in updateOrder:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ حذف طلب
// ============================================================
export const deleteOrder = async (req, res) => {
  try {
    const order = req.request;
    const accountId = req.accountId;

    order.isActive = false;
    order.isDeleted = true;
    order.deletedAt = new Date();
    order.deletedBy = accountId;
    order.addActivity('deleted', accountId, req.account?.role || 'customer');
    
    await order.save();

    res.json({
      success: true,
      message: 'تم حذف الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in deleteOrder:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ رفع ملفات للطلب
// ============================================================
export const uploadOrderFiles = async (req, res) => {
  try {
    const order = req.request;
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { category = 'request' } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد ملفات مرفوعة',
      });
    }

    console.log(`📤 رفع ${req.files.length} ملف للطلب ${order._id}`);
    console.log(`  - الفئة: ${category}`);

    const uploadedFiles = [];
    const proofFiles = [];

    for (const file of req.files) {
      const fileRecord = new File({
        portalId: portalId,
        accountId: accountId,
        requestId: order._id,
        originalName: file.originalname,
        storageKey: `orders/${order._id}/${category}/${Date.now()}_${file.originalname}`,
        mimeType: file.mimetype,
        size: file.size,
        category: category,
        visibility: 'private',
        metadata: {
          uploadDate: new Date(),
          orderId: order._id,
        },
      });
      await fileRecord.save();

      if (category === 'proof' || category === 'payment_proof') {
        order.paymentProofs.push({
          fileId: fileRecord._id,
          filename: file.originalname,
          uploadedAt: new Date(),
          verified: false,
        });
        
        order.paymentStatus = 'submitted';
        
        if (order.status === 'new' || order.status === 'under_review') {
          order.status = 'awaiting_payment';
        }
        
        order.addActivity(
          'payment_submitted',
          accountId,
          req.account?.role || 'customer',
          null,
          { filename: file.originalname, amount: order.price }
        );
        
        proofFiles.push(fileRecord._id);
      } else {
        order.files.push({
          fileId: fileRecord._id,
          category: category || 'request',
          uploadedAt: new Date(),
          uploadedBy: accountId,
          description: file.originalname,
        });
        
        order.addActivity(
          'file_uploaded',
          accountId,
          req.account?.role || 'customer',
          null,
          { filename: file.originalname, category: category || 'request' }
        );
      }

      uploadedFiles.push({
        id: fileRecord._id,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        category: category,
      });
    }

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: {
        uploaded: uploadedFiles,
        total: uploadedFiles.length,
        proofFiles: proofFiles.length,
        paymentStatus: order.paymentStatus,
        status: order.status,
      },
      message: `تم رفع ${uploadedFiles.length} ملف بنجاح`,
    });
  } catch (error) {
    console.error('❌ Error in uploadOrderFiles:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تحميل ملف من الطلب
// ============================================================
export const downloadOrderFile = async (req, res) => {
  try {
    const { id, fileIndex } = req.params;
    const order = req.request;

    const index = parseInt(fileIndex);
    if (isNaN(index) || index < 0 || index >= order.files.length) {
      return res.status(400).json({
        success: false,
        message: 'فهرس الملف غير صحيح',
      });
    }

    const fileRef = order.files[index];
    const file = await File.findById(fileRef.fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'الملف غير موجود',
      });
    }

    res.json({
      success: true,
      data: {
        id: file._id,
        name: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        storageKey: file.storageKey,
        category: file.category,
      },
    });
  } catch (error) {
    console.error('❌ Error in downloadOrderFile:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ إحصائيات الطلبات (للمدير)
// ============================================================
export const getOrderStats = async (req, res) => {
  try {
    const portalId = req.portalId;

    const stats = await Request.aggregate([
      { $match: { portalId, isDeleted: { $ne: true }, isActive: true } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
      }},
    ]);

    const result = {
      total: 0,
      new: 0,
      under_review: 0,
      assigned: 0,
      scope_definition: 0,
      awaiting_approval: 0,
      awaiting_payment: 0,
      in_progress: 0,
      under_review_2: 0,
      modification: 0,
      completed: 0,
      closed: 0,
      cancelled: 0,
    };

    stats.forEach(stat => {
      const key = stat._id || 'unknown';
      if (key in result) {
        result[key] = stat.count;
      }
      result.total += stat.count;
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Error in getOrderStats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تغيير حالة الطلب (للمدير)
// ============================================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = req.request;
    const accountId = req.accountId;

    const validStatuses = ['new', 'under_review', 'assigned', 'scope_definition', 
      'awaiting_approval', 'awaiting_payment', 'in_progress', 
      'under_review_2', 'modification', 'completed', 'closed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `حالة غير صالحة: ${status}`,
      });
    }

    const oldStatus = order.status;
    order.status = status;
    order.addActivity('status_changed', accountId, req.account?.role || 'portal_admin', oldStatus, status);
    
    if (status === 'completed') {
      order.completedAt = new Date();
    }
    if (status === 'closed') {
      order.closedAt = new Date();
    }
    if (status === 'cancelled') {
      order.isActive = false;
    }

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'تم تحديث حالة الطلب بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ إسناد مختص (للمدير)
// ============================================================
export const assignSpecialist = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialistId } = req.body;
    const order = req.request;
    const accountId = req.accountId;

    if (!specialistId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المختص مطلوب',
      });
    }

    const oldSpecialistId = order.specialistId;
    order.specialistId = specialistId;
    order.status = 'assigned';
    order.addActivity('specialist_assigned', accountId, req.account?.role || 'portal_admin', 
      oldSpecialistId, specialistId);

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'تم إسناد المختص بنجاح',
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
// ✅ تحديد نطاق العمل (للمدير)
// ============================================================
export const defineScope = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, deliverables, requirements, estimatedDuration, price, modificationsIncluded, exclusions } = req.body;
    const order = req.request;
    const accountId = req.accountId;

    if (!description || !price) {
      return res.status(400).json({
        success: false,
        message: 'الوصف والسعر مطلوبان',
      });
    }

    order.scope = {
      description,
      deliverables: deliverables || [],
      requirements: requirements || [],
      estimatedDuration: estimatedDuration || '',
      price: parseFloat(price),
      currency: 'SAR',
      modificationsIncluded: parseInt(modificationsIncluded) || 0,
      exclusions: exclusions || [],
    };

    order.price = parseFloat(price);
    order.status = 'awaiting_approval';
    order.addActivity('scope_defined', accountId, req.account?.role || 'portal_admin', null, { description, price });

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order.scope,
      message: 'تم تحديد نطاق العمل بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in defineScope:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ اعتماد نطاق العمل (للمدير)
// ============================================================
export const approveScope = async (req, res) => {
  try {
    const { id } = req.params;
    const order = req.request;
    const accountId = req.accountId;

    if (!order.scope || !order.scope.description) {
      return res.status(400).json({
        success: false,
        message: 'لا يوجد نطاق عمل لتتم الموافقة عليه',
      });
    }

    order.scope.approvedBy = accountId;
    order.scope.approvedAt = new Date();
    order.status = 'awaiting_payment';
    order.addActivity('scope_approved', accountId, req.account?.role || 'portal_admin', null, {
      description: order.scope.description,
      price: order.scope.price,
    });

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order.scope,
      message: '✅ تم اعتماد نطاق العمل بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in approveScope:', error);
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
    const { id } = req.params;
    const order = req.request;
    const accountId = req.accountId;

    if (order.paymentStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `لا يمكن تأكيد الدفع. الحالة الحالية: ${order.paymentStatus}`,
      });
    }

    const oldPaymentStatus = order.paymentStatus;
    order.paymentStatus = 'verified';
    order.paymentVerifiedAt = new Date();

    order.paymentProofs.forEach(p => {
      if (!p.verified) {
        p.verified = true;
        p.verifiedBy = accountId;
        p.verifiedAt = new Date();
      }
    });

    if (order.status === 'awaiting_payment') {
      order.status = 'in_progress';
      order.startedAt = new Date();
    }

    order.addActivity('payment_verified', accountId, req.account?.role || 'portal_admin', 
      oldPaymentStatus, 'verified', { amount: order.price });

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        status: order.status,
      },
      message: '✅ تم تأكيد الدفع بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in verifyPayment:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ رفض الدفع (للمدير)
// ============================================================
export const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = req.request;
    const accountId = req.accountId;

    if (order.paymentStatus !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `لا يمكن رفض الدفع. الحالة الحالية: ${order.paymentStatus}`,
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'سبب الرفض مطلوب',
      });
    }

    const oldPaymentStatus = order.paymentStatus;
    order.paymentStatus = 'rejected';

    order.paymentProofs.forEach(p => {
      if (!p.verified) {
        p.rejectionReason = reason.trim();
      }
    });

    order.metadata = {
      ...order.metadata,
      paymentRejectionReason: reason.trim(),
      paymentRejectedAt: new Date(),
      paymentRejectedBy: accountId,
    };

    order.addActivity('payment_rejected', accountId, req.account?.role || 'portal_admin', 
      oldPaymentStatus, 'rejected', { reason: reason.trim() });

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        rejectionReason: reason.trim(),
      },
      message: '❌ تم رفض الدفع',
    });
  } catch (error) {
    console.error('❌ Error in rejectPayment:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ إرسال رسالة (للمدير)
// ============================================================
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const order = req.request;
    const accountId = req.accountId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'نص الرسالة مطلوب',
      });
    }

    order.messages.push({
      senderId: accountId,
      senderRole: req.account?.role || 'portal_admin',
      message: message.trim(),
      attachments: [],
      createdAt: new Date(),
    });

    order.addActivity('message_sent', accountId, req.account?.role || 'portal_admin', null, { message: message.trim() });

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order.messages,
      message: '✅ تم إرسال الرسالة بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in sendMessage:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ جدولة مكالمة (للمدير)
// ============================================================
export const scheduleCall = async (req, res) => {
  try {
    const { id } = req.params;
    const { purpose, scheduledAt, duration, notes } = req.body;
    const order = req.request;
    const accountId = req.accountId;

    if (!purpose || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'الغرض والوقت مطلوبان',
      });
    }

    order.calls.push({
      requestedBy: accountId,
      requestedRole: req.account?.role || 'portal_admin',
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      purpose,
      notes: notes || '',
      status: 'scheduled',
      createdAt: new Date(),
    });

    order.addActivity('call_scheduled', accountId, req.account?.role || 'portal_admin', null, { purpose, scheduledAt });

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order.calls,
      message: '✅ تم جدولة المكالمة بنجاح',
    });
  } catch (error) {
    console.error('❌ Error in scheduleCall:', error);
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
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  uploadOrderFiles,
  downloadOrderFile,
  getOrderStats,
  updateOrderStatus,
  assignSpecialist,
  defineScope,
  approveScope,
  verifyPayment,
  rejectPayment,
  sendMessage,
  scheduleCall,
};