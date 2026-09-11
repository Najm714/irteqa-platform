// backend/src/controllers/support.controller.js
import { SupportTicket } from '../models/SupportTicket.model.js';
import { Dispute } from '../models/Dispute.model.js';
import { Request } from '../models/Request.model.js';
import { Account } from '../models/Account.model.js';
import { getNotificationService } from '../services/notification.service.js';

// ============================================================
// تذاكر الدعم
// ============================================================

// ✅ إنشاء تذكرة دعم
export const createTicket = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const {
      category,
      subject,
      subjectAr,
      message,
      messageAr,
      requestId,
      priority = 'medium',
    } = req.body;

    const ticket = new SupportTicket({
      portalId,
      accountId: userId,
      requestId: requestId || null,
      category,
      subject,
      subjectAr,
      message,
      messageAr,
      priority,
      status: 'open',
      activityLog: [{
        action: 'created',
        actorId: userId,
        details: { category, priority },
        timestamp: new Date(),
      }],
    });

    await ticket.save();

    // ✅ إرسال إشعار للمشرفين
    try {
      const notificationService = getNotificationService(req.app.get('io'));
      const admins = await Account.find({
        portalId,
        role: { $in: ['portal_admin', 'super_admin'] },
        isActive: true,
      });

      for (const admin of admins) {
        await notificationService.sendNotification({
          portalId,
          accountId: admin._id,
          type: 'support_reply',
          title: 'تذكرة دعم جديدة',
          titleAr: 'تذكرة دعم جديدة',
          message: `تذكرة جديدة من ${req.user.fullName || 'مستخدم'}: ${subject}`,
          messageAr: `تذكرة جديدة من ${req.user.fullName || 'مستخدم'}: ${subjectAr}`,
          data: {
            ticketId: ticket._id,
            category,
            priority,
          },
          priority: priority === 'urgent' ? 'high' : 'medium',
        });
      }
    } catch (error) {
      console.error('❌ Failed to send ticket notification:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('❌ Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create ticket',
    });
  }
};

// ✅ جلب تذاكر المستخدم
export const getMyTickets = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const { status, limit = 20, page = 1 } = req.query;

    const query = { portalId, accountId: userId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('assignedTo', 'profile.fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SupportTicket.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get my tickets error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get tickets',
    });
  }
};

// ✅ جلب جميع التذاكر (للمشرفين)
export const getAllTickets = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { status, assignedTo, priority, limit = 20, page = 1 } = req.query;

    const query = { portalId };
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('accountId', 'profile.fullName email')
        .populate('assignedTo', 'profile.fullName email')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SupportTicket.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get all tickets error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get tickets',
    });
  }
};

// ✅ جلب تذكرة واحدة
export const getTicketById = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id } = req.params;
    const { id: userId } = req.user;

    const ticket = await SupportTicket.findOne({ _id: id, portalId })
      .populate('accountId', 'profile.fullName email')
      .populate('assignedTo', 'profile.fullName email')
      .populate('replies.senderId', 'profile.fullName email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // التحقق من الصلاحية
    const isAuthorized =
      ticket.accountId._id.toString() === userId ||
      ticket.assignedTo?._id.toString() === userId ||
      req.user.role === 'portal_admin' ||
      req.user.role === 'super_admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ticket',
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('❌ Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get ticket',
    });
  }
};

// ✅ الرد على تذكرة
export const replyToTicket = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id } = req.params;
    const { id: userId } = req.user;
    const { message, messageAr, isInternal = false } = req.body;

    const ticket = await SupportTicket.findOne({ _id: id, portalId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // التحقق من الصلاحية
    const isAuthorized =
      ticket.accountId.toString() === userId ||
      ticket.assignedTo?.toString() === userId ||
      req.user.role === 'portal_admin' ||
      req.user.role === 'super_admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reply to this ticket',
      });
    }

    ticket.addReply({
      message,
      messageAr,
      senderId: userId,
      senderRole: req.user.role,
      isInternal,
    });

    await ticket.save();

    // ✅ إرسال إشعار للطرف الآخر
    try {
      const notificationService = getNotificationService(req.app.get('io'));
      const recipientId = ticket.accountId.toString() === userId 
        ? ticket.assignedTo 
        : ticket.accountId;

      if (recipientId) {
        await notificationService.sendNotification({
          portalId,
          accountId: recipientId,
          type: 'support_reply',
          title: 'رد على تذكرة الدعم',
          titleAr: 'رد على تذكرة الدعم',
          message: `رد جديد على تذكرة #${ticket._id}`,
          messageAr: `رد جديد على تذكرة #${ticket._id}`,
          data: {
            ticketId: ticket._id,
          },
          priority: 'medium',
        });
      }
    } catch (error) {
      console.error('❌ Failed to send reply notification:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('❌ Reply to ticket error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reply to ticket',
    });
  }
};

// ✅ تغيير حالة التذكرة
export const updateTicketStatus = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id } = req.params;
    const { id: userId } = req.user;
    const { status } = req.body;

    const ticket = await SupportTicket.findOne({ _id: id, portalId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // التحقق من الصلاحية (المشرفون فقط)
    if (req.user.role !== 'portal_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can change ticket status',
      });
    }

    ticket.changeStatus(status, userId);
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket status updated',
      data: ticket,
    });
  } catch (error) {
    console.error('❌ Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update ticket status',
    });
  }
};

// ✅ إسناد تذكرة
export const assignTicket = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id } = req.params;
    const { id: userId } = req.user;
    const { assignedTo } = req.body;

    const ticket = await SupportTicket.findOne({ _id: id, portalId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // التحقق من الصلاحية (المشرفون فقط)
    if (req.user.role !== 'portal_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can assign tickets',
      });
    }

    // التحقق من وجود المستخدم
    const assignee = await Account.findOne({ _id: assignedTo, portalId });
    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    ticket.assignTo(assignedTo, userId);
    await ticket.save();

    // ✅ إرسال إشعار للمسند إليه
    try {
      const notificationService = getNotificationService(req.app.get('io'));
      await notificationService.sendNotification({
        portalId,
        accountId: assignedTo,
        type: 'support_reply',
        title: 'تم إسناد تذكرة إليك',
        titleAr: 'تم إسناد تذكرة إليك',
        message: `تم إسناد تذكرة #${ticket._id} إليك`,
        messageAr: `تم إسناد تذكرة #${ticket._id} إليك`,
        data: {
          ticketId: ticket._id,
        },
        priority: 'medium',
      });
    } catch (error) {
      console.error('❌ Failed to send assignment notification:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('❌ Assign ticket error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign ticket',
    });
  }
};

// ============================================================
// النزاعات (Disputes)
// ============================================================

// ✅ إنشاء نزاع
export const createDispute = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const {
      requestId,
      type,
      title,
      titleAr,
      description,
      descriptionAr,
    } = req.body;

    // التحقق من وجود الطلب
    const request = await Request.findOne({ _id: requestId, portalId });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // التحقق من الصلاحية (صاحب الطلب أو المختص)
    const isAuthorized =
      request.accountId.toString() === userId ||
      request.specialistId?.toString() === userId;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create a dispute',
      });
    }

    // تحديد الطرف الآخر
    const respondentId = request.accountId.toString() === userId
      ? request.specialistId
      : request.accountId;

    const respondentRole = request.accountId.toString() === userId
      ? 'specialist'
      : 'customer';

    const dispute = new Dispute({
      portalId,
      requestId,
      initiatorId: userId,
      initiatorRole: req.user.role,
      respondentId,
      respondentRole,
      type,
      title,
      titleAr,
      description,
      descriptionAr,
      status: 'open',
      activityLog: [{
        action: 'created',
        actorId: userId,
        details: { type },
        timestamp: new Date(),
      }],
    });

    await dispute.save();

    // ✅ إرسال إشعار للطرف الآخر والمشرفين
    try {
      const notificationService = getNotificationService(req.app.get('io'));
      
      // إشعار للطرف الآخر
      await notificationService.sendNotification({
        portalId,
        accountId: respondentId,
        type: 'request_updated',
        title: 'تم فتح نزاع',
        titleAr: 'تم فتح نزاع',
        message: `تم فتح نزاع على الطلب #${requestId}`,
        messageAr: `تم فتح نزاع على الطلب #${requestId}`,
        data: {
          requestId,
          disputeId: dispute._id,
        },
        priority: 'high',
      });

      // إشعار للمشرفين
      const admins = await Account.find({
        portalId,
        role: { $in: ['portal_admin', 'super_admin'] },
        isActive: true,
      });

      for (const admin of admins) {
        await notificationService.sendNotification({
          portalId,
          accountId: admin._id,
          type: 'system_alert',
          title: 'نزاع جديد',
          titleAr: 'نزاع جديد',
          message: `نزاع جديد على الطلب #${requestId} من نوع ${type}`,
          messageAr: `نزاع جديد على الطلب #${requestId} من نوع ${type}`,
          data: {
            requestId,
            disputeId: dispute._id,
          },
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('❌ Failed to send dispute notification:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: dispute,
    });
  } catch (error) {
    console.error('❌ Create dispute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create dispute',
    });
  }
};

// ✅ جلب نزاعات المستخدم
export const getMyDisputes = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    const { status, limit = 20, page = 1 } = req.query;

    const query = {
      portalId,
      $or: [
        { initiatorId: userId },
        { respondentId: userId },
      ],
    };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate('initiatorId', 'profile.fullName email')
        .populate('respondentId', 'profile.fullName email')
        .populate('requestId', 'title status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Dispute.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: disputes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get my disputes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get disputes',
    });
  }
};

// ✅ جلب جميع النزاعات (للمشرفين)
export const getAllDisputes = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { status, type, limit = 20, page = 1 } = req.query;

    const query = { portalId };
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate('initiatorId', 'profile.fullName email')
        .populate('respondentId', 'profile.fullName email')
        .populate('requestId', 'title status')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Dispute.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: disputes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get all disputes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get disputes',
    });
  }
};

// ✅ إضافة رسالة في النزاع
export const addDisputeMessage = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id } = req.params;
    const { id: userId } = req.user;
    const { message, isInternal = false } = req.body;

    const dispute = await Dispute.findOne({ _id: id, portalId });
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found',
      });
    }

    // التحقق من الصلاحية
    const isAuthorized =
      dispute.initiatorId.toString() === userId ||
      dispute.respondentId.toString() === userId ||
      req.user.role === 'portal_admin' ||
      req.user.role === 'super_admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to message in this dispute',
      });
    }

    dispute.addMessage({
      senderId: userId,
      senderRole: req.user.role,
      message,
      isInternal,
    });

    await dispute.save();

    // ✅ إرسال إشعار للطرف الآخر
    try {
      const notificationService = getNotificationService(req.app.get('io'));
      const recipientId = dispute.initiatorId.toString() === userId
        ? dispute.respondentId
        : dispute.initiatorId;

      if (recipientId && !isInternal) {
        await notificationService.sendNotification({
          portalId,
          accountId: recipientId,
          type: 'request_updated',
          title: 'رسالة جديدة في النزاع',
          titleAr: 'رسالة جديدة في النزاع',
          message: `رسالة جديدة في النزاع على الطلب #${dispute.requestId}`,
          messageAr: `رسالة جديدة في النزاع على الطلب #${dispute.requestId}`,
          data: {
            disputeId: dispute._id,
            requestId: dispute.requestId,
          },
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('❌ Failed to send dispute message notification:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      data: dispute,
    });
  } catch (error) {
    console.error('❌ Add dispute message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add message',
    });
  }
};

// ✅ اقتراح حل للنزاع (للمشرفين فقط)
export const proposeDisputeResolution = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id } = req.params;
    const { id: userId } = req.user;
    const { description, descriptionAr } = req.body;

    // التحقق من الصلاحية (المشرفون فقط)
    if (req.user.role !== 'portal_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can propose resolutions',
      });
    }

    const dispute = await Dispute.findOne({ _id: id, portalId });
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found',
      });
    }

    dispute.proposeResolution(userId, description);
    await dispute.save();

    // ✅ إرسال إشعار للطرفين
    try {
      const notificationService = getNotificationService(req.app.get('io'));
      
      for (const partyId of [dispute.initiatorId, dispute.respondentId]) {
        await notificationService.sendNotification({
          portalId,
          accountId: partyId,
          type: 'request_updated',
          title: 'تم اقتراح حل للنزاع',
          titleAr: 'تم اقتراح حل للنزاع',
          message: `تم اقتراح حل للنزاع على الطلب #${dispute.requestId}`,
          messageAr: `تم اقتراح حل للنزاع على الطلب #${dispute.requestId}`,
          data: {
            disputeId: dispute._id,
            requestId: dispute.requestId,
          },
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('❌ Failed to send resolution notification:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Resolution proposed successfully',
      data: dispute,
    });
  } catch (error) {
    console.error('❌ Propose resolution error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to propose resolution',
    });
  }
};

// ✅ قبول حل النزاع
export const acceptDisputeResolution = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id } = req.params;
    const { id: userId } = req.user;

    const dispute = await Dispute.findOne({ _id: id, portalId });
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found',
      });
    }

    // التحقق من الصلاحية (أحد الأطراف أو المشرف)
    const isAuthorized =
      dispute.initiatorId.toString() === userId ||
      dispute.respondentId.toString() === userId ||
      req.user.role === 'portal_admin' ||
      req.user.role === 'super_admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this resolution',
      });
    }

    dispute.resolution.acceptedBy = userId;
    dispute.resolution.acceptedAt = new Date();
    dispute.status = 'resolved';
    dispute.resolvedAt = new Date();
    dispute.updatedAt = new Date();

    dispute.activityLog.push({
      action: 'resolution_accepted',
      actorId: userId,
      details: { resolution: dispute.resolution.description?.substring(0, 100) },
      timestamp: new Date(),
    });

    await dispute.save();

    res.status(200).json({
      success: true,
      message: 'Resolution accepted successfully',
      data: dispute,
    });
  } catch (error) {
    console.error('❌ Accept resolution error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept resolution',
    });
  }
};