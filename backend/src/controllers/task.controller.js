// backend/src/controllers/task.controller.js
import { Request } from '../models/Request.model.js';

// ============================================================
// ✅ جلب مهام المختص
// ============================================================
export const getSpecialistTasks = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { status, limit = 50, page = 1 } = req.query;

    console.log('📤 Fetching specialist tasks for:', accountId);

    if (!accountId || !portalId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and Portal ID are required',
      });
    }

    // ✅ التحقق من أن المستخدم مختص
    if (req.account?.role !== 'specialist') {
      return res.status(403).json({
        success: false,
        message: 'Only specialists can access this endpoint',
      });
    }

    const query = {
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
    };

    // ✅ تصفية حسب الحالة
    if (status) {
      if (status === 'pending') {
        query.status = { $in: ['assigned', 'scope_definition', 'awaiting_approval'] };
      } else if (status === 'in_progress') {
        query.status = { $in: ['in_progress', 'modification'] };
      } else if (status === 'completed') {
        query.status = { $in: ['completed', 'closed'] };
      } else {
        query.status = status;
      }
    } else {
      // ✅ المهام النشطة فقط (غير المكتملة والملغية)
      query.status = { $nin: ['new', 'cancelled'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Request.find(query)
      .populate('serviceId', 'name nameAr')
      .populate('accountId', 'profile.fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);

    const formattedTasks = tasks.map(task => ({
      _id: task._id,
      title: task.formData?.title || task.title || 'مهمة',
      description: task.formData?.description || task.description || '',
      requestId: task._id,
      requestNumber: task.requestNumber,
      priority: task.metadata?.priority || 'medium',
      status: task.status,
      dueDate: task.scope?.estimatedDuration ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
      assignedAt: task.createdAt,
      serviceName: task.serviceId?.nameAr || task.serviceId?.name || 'خدمة',
      customerName: task.accountId?.profile?.fullName || 'عميل',
      customerEmail: task.accountId?.email || '',
      price: task.price || 0,
      filesCount: task.files?.length || 0,
      messagesCount: task.messages?.length || 0,
      callsCount: task.calls?.length || 0,
    }));

    res.json({
      success: true,
      data: formattedTasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getSpecialistTasks:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get specialist tasks',
    });
  }
};

// ============================================================
// ✅ جلب مهمة محددة
// ============================================================
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.accountId;
    const portalId = req.portalId;

    const task = await Request.findOne({
      _id: id,
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
    })
      .populate('serviceId', 'name nameAr icon')
      .populate('accountId', 'profile.fullName email phone')
      .populate('files.fileId', 'originalName size mimeType');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: {
        _id: task._id,
        title: task.formData?.title || task.title || 'مهمة',
        description: task.formData?.description || task.description || '',
        requestId: task._id,
        requestNumber: task.requestNumber,
        priority: task.metadata?.priority || 'medium',
        status: task.status,
        dueDate: task.scope?.estimatedDuration ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        assignedAt: task.createdAt,
        serviceName: task.serviceId?.nameAr || task.serviceId?.name || 'خدمة',
        customerName: task.accountId?.profile?.fullName || 'عميل',
        customerEmail: task.accountId?.email || '',
        customerPhone: task.accountId?.phone || '',
        scope: task.scope || {},
        files: task.files || [],
        messagesCount: task.messages?.length || 0,
        callsCount: task.calls?.length || 0,
        formData: task.formData || {},
        price: task.price || 0,
        paymentStatus: task.paymentStatus || 'pending',
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error in getTaskById:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get task',
    });
  }
};

// ============================================================
// ✅ تحديث حالة المهمة
// ============================================================
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const accountId = req.accountId;
    const portalId = req.portalId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const task = await Request.findOne({
      _id: id,
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // ✅ التحقق من إمكانية الانتقال إلى الحالة الجديدة
    if (!task.canTransitionTo(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${task.status}" to "${status}"`,
      });
    }

    const oldStatus = task.status;
    task.status = status;

    // ✅ تحديث التواريخ حسب الحالة
    if (status === 'in_progress' && !task.startedAt) {
      task.startedAt = new Date();
    }
    if (status === 'completed') {
      task.completedAt = new Date();
    }
    if (status === 'closed') {
      task.closedAt = new Date();
    }
    if (status === 'cancelled') {
      task.isActive = false;
    }

    // ✅ إضافة ملاحظات
    if (notes) {
      task.metadata = {
        ...task.metadata,
        statusChangeNotes: notes,
      };
    }

    task.addActivity(
      'status_changed',
      accountId,
      'specialist',
      oldStatus,
      status,
      { notes }
    );

    await task.save();

    res.json({
      success: true,
      data: {
        _id: task._id,
        status: task.status,
        updatedAt: task.updatedAt,
      },
      message: `Task status updated to ${status}`,
    });
  } catch (error) {
    console.error('❌ Error in updateTaskStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update task status',
    });
  }
};

// ============================================================
// ✅ إحصائيات المهام
// ============================================================
export const getTaskStats = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    if (!accountId || !portalId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and Portal ID are required',
      });
    }

    // ✅ التحقق من أن المستخدم مختص
    if (req.account?.role !== 'specialist') {
      return res.status(403).json({
        success: false,
        message: 'Only specialists can access this endpoint',
      });
    }

    const total = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
    });

    const pending = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      status: { $in: ['assigned', 'scope_definition', 'awaiting_approval'] },
    });

    const inProgress = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      status: { $in: ['in_progress', 'modification'] },
    });

    const completed = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      status: { $in: ['completed', 'closed'] },
    });

    const cancelled = await Request.countDocuments({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      status: 'cancelled',
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        cancelled,
      },
    });
  } catch (error) {
    console.error('❌ Error in getTaskStats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get task stats',
    });
  }
};