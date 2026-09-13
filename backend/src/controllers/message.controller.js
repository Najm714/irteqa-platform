// backend/src/controllers/message.controller.js
import { Message } from '../models/Message.model.js';
import { Request } from '../models/Request.model.js';
import { Account } from '../models/Account.model.js';
import { File } from '../models/File.model.js';

// ============================================================
// ✅ جلب رسائل المختص (الطلبات المسندة إليه)
// ============================================================
export const getSpecialistMessages = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { limit = 50, page = 1 } = req.query;

    console.log('📤 Fetching specialist messages for:', accountId);

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

    // ✅ جلب جميع الطلبات المسندة للمختص
    const requests = await Request.find({
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
    })
      .select('_id requestNumber messages')
      .populate({
        path: 'messages.senderId',
        select: 'profile.fullName email username',
      })
      .sort({ createdAt: -1 });

    // ✅ تجميع جميع الرسائل من جميع الطلبات
    let allMessages = [];
    requests.forEach(request => {
      if (request.messages && request.messages.length > 0) {
        const messagesWithRequest = request.messages.map(msg => {
          const msgObj = msg.toObject ? msg.toObject() : msg;
          return {
            ...msgObj,
            requestId: request._id,
            requestNumber: request.requestNumber,
          };
        });
        allMessages = [...allMessages, ...messagesWithRequest];
      }
    });

    // ✅ ترتيب الرسائل حسب التاريخ (الأحدث أولاً)
    allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ✅ تطبيق الترقيم
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = allMessages.slice(skip, skip + parseInt(limit));
    const total = allMessages.length;

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getSpecialistMessages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get specialist messages',
    });
  }
};

// ============================================================
// ✅ إرسال رسالة جديدة
// ============================================================
export const sendMessage = async (req, res) => {
  try {
    const { requestId, content, attachments } = req.body;
    const accountId = req.accountId;
    const portalId = req.portalId;
    const accountRole = req.account?.role || 'customer';

    if (!requestId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and content are required',
      });
    }

    // التحقق من وجود الطلب
    const request = await Request.findOne({
      _id: requestId,
      portalId,
      isActive: true,
      isDeleted: { $ne: true },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // التحقق من الصلاحية (العميل، المختص، أو المدير)
    const isOwner = request.accountId?.toString() === accountId;
    const isSpecialist = request.specialistId?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send messages in this request',
      });
    }

    // إنشاء الرسالة
    const message = new Message({
      portalId,
      requestId: request._id,
      senderId: accountId,
      senderRole: accountRole,
      content,
      attachments: attachments || [],
      isRead: false,
    });

    await message.save();

    // تحديث الطلب (إضافة نشاط)
    if (request.addActivity) {
      request.addActivity(
        'message_sent',
        accountId,
        accountRole,
        null,
        { messageId: message._id, content: content.substring(0, 100) }
      );
      await request.save();
    }

    // جلب بيانات المرسل
    const sender = await Account.findById(accountId).select('profile email username');

    // إعداد البيانات للإرسال عبر WebSocket
    const messageData = {
      id: message._id,
      content: message.content,
      sender: {
        id: sender?._id || accountId,
        name: sender?.profile?.fullName || sender?.username || 'مستخدم',
        role: accountRole,
        avatar: sender?.profile?.avatar,
      },
      attachments: message.attachments,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };

    // إرسال عبر Socket.IO (سيتم تنفيذه في server.js)
    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${requestId}`).emit('new-message', messageData);
    }

    res.status(201).json({
      success: true,
      data: messageData,
      message: 'Message sent successfully',
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
// ✅ الحصول على رسائل الطلب
// ============================================================
export const getMessages = async (req, res) => {
  try {
    const { requestId } = req.params;
    const portalId = req.portalId;
    const accountId = req.accountId;
    const { limit = 50, before } = req.query;

    // التحقق من وجود الطلب
    const request = await Request.findOne({
      _id: requestId,
      portalId,
      isActive: true,
      isDeleted: { $ne: true },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // التحقق من الصلاحية
    const isOwner = request.accountId?.toString() === accountId;
    const isSpecialist = request.specialistId?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages',
      });
    }

    // بناء الاستعلام
    const query = { portalId, requestId: request._id, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'profile email username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // تحديث حالة القراءة للرسائل غير المقروءة
    const unreadMessages = messages.filter(
      m => !m.isRead && m.senderId?._id?.toString() !== accountId
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(m => m._id) } },
        {
          $set: { isRead: true, readAt: new Date() },
          $push: {
            readBy: {
              accountId,
              readAt: new Date(),
            },
          },
        }
      );
    }

    // تنسيق البيانات
    const formattedMessages = messages.map(m => ({
      id: m._id,
      content: m.content,
      sender: {
        id: m.senderId?._id || m.senderId,
        name: m.senderId?.profile?.fullName || m.senderId?.username || 'مستخدم',
        role: m.senderRole,
        avatar: m.senderId?.profile?.avatar,
      },
      attachments: m.attachments,
      isRead: m.isRead,
      readAt: m.readAt,
      createdAt: m.createdAt,
    }));

    res.json({
      success: true,
      data: {
        messages: formattedMessages.reverse(),
        total: messages.length,
        unreadCount: unreadMessages.length,
      },
    });
  } catch (error) {
    console.error('❌ Error in getMessages:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تحديد رسالة كمقروءة
// ============================================================
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.accountId;
    const portalId = req.portalId;

    const message = await Message.findOne({
      _id: id,
      portalId,
      isDeleted: false,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // لا يمكن تحديد رسالتك الخاصة كمقروءة
    if (message.senderId?.toString() === accountId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot mark your own message as read',
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    if (!message.readBy) message.readBy = [];
    message.readBy.push({
      accountId,
      readAt: new Date(),
    });
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    console.error('❌ Error in markAsRead:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تحديد جميع رسائل الطلب كمقروءة
// ============================================================
export const markAllAsRead = async (req, res) => {
  try {
    const { requestId } = req.params;
    const accountId = req.accountId;
    const portalId = req.portalId;

    const result = await Message.updateMany(
      {
        portalId,
        requestId,
        isDeleted: false,
        isRead: false,
        senderId: { $ne: accountId },
      },
      {
        $set: { isRead: true, readAt: new Date() },
        $push: {
          readBy: {
            accountId,
            readAt: new Date(),
          },
        },
      }
    );

    res.json({
      success: true,
      data: {
        markedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} messages marked as read`,
    });
  } catch (error) {
    console.error('❌ Error in markAllAsRead:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ حذف رسالة (للمدير فقط)
// ============================================================
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId;
    const accountId = req.accountId;

    const message = await Message.findOne({
      _id: id,
      portalId,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // التحقق من الصلاحية (مدير أو مرسل الرسالة)
    const isSender = message.senderId?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isSender && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this message',
      });
    }

    message.isDeleted = true;
    await message.save();

    // إرسال إشعار الحذف عبر WebSocket
    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${message.requestId}`).emit('message-deleted', {
        messageId: message._id,
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error in deleteMessage:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ الحصول على عدد الرسائل غير المقروءة
// ============================================================
export const getUnreadCount = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    // جلب جميع الطلبات التي يشارك فيها المستخدم
    const requests = await Request.find({
      portalId,
      isActive: true,
      isDeleted: { $ne: true },
      $or: [
        { accountId },
        { specialistId: accountId },
      ],
    }).select('_id');

    const requestIds = requests.map(r => r._id);

    const count = await Message.countDocuments({
      portalId,
      requestId: { $in: requestIds },
      isDeleted: false,
      isRead: false,
      senderId: { $ne: accountId },
    });

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error('❌ Error in getUnreadCount:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};