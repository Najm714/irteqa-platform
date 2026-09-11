// backend/src/controllers/call.controller.js
import { Request } from '../models/Request.model.js';
import { Account } from '../models/Account.model.js';

// ============================================================
// ✅ جلب مكالمات المختص (الطلبات المسندة إليه)
// ============================================================
export const getSpecialistCalls = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { status, limit = 50, page = 1 } = req.query;

    console.log('📤 Fetching specialist calls for:', accountId);

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

    // ✅ جلب الطلبات التي تحتوي على مكالمات للمختص
    const matchQuery = {
      portalId,
      specialistId: accountId,
      isDeleted: { $ne: true },
      'calls.0': { $exists: true },
    };

    if (status) {
      matchQuery['calls.status'] = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await Request.aggregate([
      { $match: matchQuery },
      { $unwind: '$calls' },
      { $match: status ? { 'calls.status': status } : {} },
      {
        $lookup: {
          from: 'accounts',
          localField: 'accountId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          requestId: '$_id',
          requestNumber: 1,
          callId: '$calls._id',
          purpose: '$calls.purpose',
          scheduledAt: '$calls.scheduledAt',
          duration: '$calls.duration',
          status: '$calls.status',
          callUrl: '$calls.callUrl',
          recordingUrl: '$calls.recordingUrl',
          notes: '$calls.notes',
          requestedBy: '$calls.requestedBy',
          requestedRole: '$calls.requestedRole',
          createdAt: '$calls.createdAt',
          updatedAt: '$calls.updatedAt',
          customer: {
            _id: '$customer._id',
            profile: '$customer.profile',
            email: '$customer.email',
          },
        },
      },
      { $sort: { scheduledAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // ✅ حساب العدد الإجمالي
    const totalResult = await Request.aggregate([
      { $match: matchQuery },
      { $unwind: '$calls' },
      { $match: status ? { 'calls.status': status } : {} },
      { $count: 'total' },
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getSpecialistCalls:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get specialist calls',
    });
  }
};

// ============================================================
// ✅ جلب مكالمات طلب محدد
// ============================================================
export const getRequestCalls = async (req, res) => {
  try {
    const request = req.request;

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // ✅ جلب معلومات المرسلين للمكالمات
    const callsWithSender = await Promise.all(
      (request.calls || []).map(async (call) => {
        let requestedByInfo = null;
        if (call.requestedBy) {
          requestedByInfo = await Account.findById(call.requestedBy)
            .select('profile.fullName email');
        }
        return {
          ...call.toObject(),
          requestedByInfo,
        };
      })
    );

    res.json({
      success: true,
      data: callsWithSender || [],
    });
  } catch (error) {
    console.error('❌ Error in getRequestCalls:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get request calls',
    });
  }
};

// ============================================================
// ✅ جدولة مكالمة جديدة (معدل)
// ============================================================
export const scheduleCall = async (req, res) => {
  try {
    const request = req.request || await Request.findById(req.params.requestId);
    const accountId = req.accountId;
    const { scheduledAt, duration, purpose, notes } = req.body;

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (!scheduledAt || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date and purpose are required',
      });
    }

    // ✅ التحقق من الصلاحية (العميل، المختص، أو المدير)
    const isOwner = request.accountId?.toString() === accountId;
    const isSpecialist = request.specialistId?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to schedule a call for this request',
      });
    }

    const requestedRole = isOwner ? 'customer' : isSpecialist ? 'specialist' : 'portal_admin';

    // ✅ إضافة المكالمة
    const callData = {
      requestedBy: accountId,
      requestedRole,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      purpose,
      notes: notes || '',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    request.addCall(callData);
    await request.save();

    // ✅ جلب المكالمة المضافة
    const addedCall = request.calls[request.calls.length - 1];

    // ✅ إرسال إشعار عبر WebSocket
    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-scheduled', {
        callId: addedCall._id,
        purpose: addedCall.purpose,
        scheduledAt: addedCall.scheduledAt,
        requestedBy: accountId,
      });
    }

    res.status(201).json({
      success: true,
      data: addedCall,
      message: 'Call scheduled successfully',
    });
  } catch (error) {
    console.error('❌ Error in scheduleCall:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule call',
    });
  }
};

// ============================================================
// ✅ تحديث حالة المكالمة (معدل)
// ============================================================
export const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status } = req.body;
    const accountId = req.accountId;
    const portalId = req.portalId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    // ✅ البحث عن الطلب الذي يحتوي على المكالمة
    const request = await Request.findOne({
      portalId,
      isDeleted: { $ne: true },
      'calls._id': callId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // ✅ التحقق من الصلاحية
    const isOwner = request.accountId?.toString() === accountId;
    const isSpecialist = request.specialistId?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this call',
      });
    }

    // ✅ تحديث حالة المكالمة
    const call = request.calls.id(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    const oldStatus = call.status;
    call.status = status;
    call.updatedAt = new Date();

    // ✅ تسجيل النشاط
    if (status === 'completed') {
      request.addActivity(
        'call_completed',
        accountId,
        req.account?.role || 'customer',
        oldStatus,
        status,
        { callId, purpose: call.purpose }
      );
    } else {
      request.addActivity(
        'status_changed',
        accountId,
        req.account?.role || 'customer',
        oldStatus,
        status,
        { callId, purpose: call.purpose }
      );
    }

    await request.save();

    // ✅ إرسال إشعار عبر WebSocket
    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-status-updated', {
        callId: call._id,
        status: call.status,
        updatedBy: accountId,
      });
    }

    res.json({
      success: true,
      data: {
        _id: call._id,
        status: call.status,
        updatedAt: call.updatedAt,
      },
      message: `Call status updated to ${status}`,
    });
  } catch (error) {
    console.error('❌ Error in updateCallStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update call status',
    });
  }
};

// ============================================================
// ✅ إلغاء مكالمة (معدل)
// ============================================================
export const cancelCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const accountId = req.accountId;
    const portalId = req.portalId;

    // ✅ البحث عن الطلب الذي يحتوي على المكالمة
    const request = await Request.findOne({
      portalId,
      isDeleted: { $ne: true },
      'calls._id': callId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // ✅ التحقق من الصلاحية
    const isOwner = request.accountId?.toString() === accountId;
    const isSpecialist = request.specialistId?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this call',
      });
    }

    // ✅ إلغاء المكالمة
    const call = request.calls.id(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    if (call.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed call',
      });
    }

    const oldStatus = call.status;
    call.status = 'cancelled';
    call.updatedAt = new Date();

    request.addActivity(
      'status_changed',
      accountId,
      req.account?.role || 'customer',
      oldStatus,
      'cancelled',
      { callId, purpose: call.purpose, reason: 'Cancelled by user' }
    );

    await request.save();

    // ✅ إرسال إشعار عبر WebSocket
    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-cancelled', {
        callId: call._id,
        cancelledBy: accountId,
      });
    }

    res.json({
      success: true,
      data: {
        _id: call._id,
        status: call.status,
      },
      message: 'Call cancelled successfully',
    });
  } catch (error) {
    console.error('❌ Error in cancelCall:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel call',
    });
  }
};

// ============================================================
// ✅ الانضمام إلى المكالمة (معدل)
// ============================================================
export const joinCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const accountId = req.accountId;
    const portalId = req.portalId;

    // ✅ البحث عن الطلب الذي يحتوي على المكالمة
    const request = await Request.findOne({
      portalId,
      isDeleted: { $ne: true },
      'calls._id': callId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // ✅ التحقق من الصلاحية
    const isOwner = request.accountId?.toString() === accountId;
    const isSpecialist = request.specialistId?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to join this call',
      });
    }

    const call = request.calls.id(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
      });
    }

    // ✅ تحديث حالة المكالمة إذا كانت scheduled
    if (call.status === 'scheduled') {
      call.status = 'started';
      call.updatedAt = new Date();

      request.addActivity(
        'call_started',
        accountId,
        req.account?.role || 'customer',
        null,
        { callId, purpose: call.purpose }
      );
      await request.save();
    }

    // ✅ إرسال إشعار عبر WebSocket
    const io = req.app?.get('io');
    if (io) {
      io.to(`request-${request._id}`).emit('call-joined', {
        callId: call._id,
        participantId: accountId,
      });
    }

    res.json({
      success: true,
      data: {
        _id: call._id,
        status: call.status,
        callUrl: call.callUrl || `/call/${callId}`,
      },
      message: 'Joined call successfully',
    });
  } catch (error) {
    console.error('❌ Error in joinCall:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to join call',
    });
  }
};

// ============================================================
// ✅ المكالمات القادمة للمستخدم (معدل)
// ============================================================
export const getUpcomingCalls = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;

    if (!accountId || !portalId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and Portal ID are required',
      });
    }

    // ✅ جلب الطلبات التي تحتوي على مكالمات قادمة
    const requests = await Request.find({
      portalId,
      isDeleted: { $ne: true },
      $or: [
        { accountId },
        { specialistId: accountId },
      ],
      'calls.0': { $exists: true },
    })
      .populate('accountId', 'profile.fullName email')
      .populate('specialistId', 'profile.fullName email')
      .select('_id requestNumber accountId specialistId calls');

    // ✅ استخراج المكالمات القادمة
    const upcomingCalls = [];
    requests.forEach(request => {
      if (request.calls) {
        request.calls.forEach(call => {
          if (call.status === 'scheduled' && new Date(call.scheduledAt) >= new Date()) {
            const isScheduledByMe = call.requestedBy?.toString() === accountId;
            const otherParticipant = isScheduledByMe 
              ? request.specialistId || request.accountId 
              : request.accountId;
            
            upcomingCalls.push({
              _id: call._id,
              purpose: call.purpose,
              scheduledAt: call.scheduledAt,
              duration: call.duration,
              status: call.status,
              requestId: request._id,
              requestNumber: request.requestNumber,
              callUrl: call.callUrl || `/call/${call._id}`,
              participant: otherParticipant,
            });
          }
        });
      }
    });

    // ✅ ترتيب حسب التاريخ (الأقرب أولاً)
    upcomingCalls.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    res.json({
      success: true,
      data: upcomingCalls.slice(0, 10),
    });
  } catch (error) {
    console.error('❌ Error in getUpcomingCalls:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get upcoming calls',
    });
  }
};

// ============================================================
// ✅ المكالمات السابقة للمستخدم (معدل)
// ============================================================
export const getPastCalls = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { limit = 20, page = 1 } = req.query;

    if (!accountId || !portalId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID and Portal ID are required',
      });
    }

    // ✅ جلب الطلبات التي تحتوي على مكالمات سابقة
    const requests = await Request.find({
      portalId,
      isDeleted: { $ne: true },
      $or: [
        { accountId },
        { specialistId: accountId },
      ],
      'calls.0': { $exists: true },
    })
      .populate('accountId', 'profile.fullName email')
      .populate('specialistId', 'profile.fullName email')
      .select('_id requestNumber accountId specialistId calls');

    // ✅ استخراج المكالمات السابقة
    const pastCalls = [];
    requests.forEach(request => {
      if (request.calls) {
        request.calls.forEach(call => {
          if (call.status === 'completed' || call.status === 'cancelled' || call.status === 'missed') {
            const isScheduledByMe = call.requestedBy?.toString() === accountId;
            const otherParticipant = isScheduledByMe 
              ? request.specialistId || request.accountId 
              : request.accountId;
            
            pastCalls.push({
              _id: call._id,
              purpose: call.purpose,
              scheduledAt: call.scheduledAt,
              duration: call.duration,
              status: call.status,
              requestId: request._id,
              requestNumber: request.requestNumber,
              participant: otherParticipant,
              createdAt: call.createdAt,
              updatedAt: call.updatedAt,
            });
          }
        });
      }
    });

    // ✅ ترتيب حسب التاريخ (الأحدث أولاً)
    pastCalls.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = pastCalls.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: pastCalls.length,
        pages: Math.ceil(pastCalls.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getPastCalls:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get past calls',
    });
  }
};