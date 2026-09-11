// src/controllers/delivery.controller.js
import { Delivery } from '../models/Delivery.model.js';
import { Request } from '../models/Request.model.js';
import { File } from '../models/File.model.js';
import { Modification } from '../models/Modification.model.js';

// ✅ إنشاء تسليم جديد
export const createDelivery = async (req, res) => {
  try {
    const { requestId, title, description, files, message } = req.body;
    const { id: userId } = req.user;

    // التحقق من وجود الطلب
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // التحقق من الصلاحية
    if (request.specialistId?.toString() !== userId && req.user.role !== 'portal_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to deliver this request',
      });
    }

    // الحصول على آخر إصدار
    const lastDelivery = await Delivery.findOne({ requestId })
      .sort({ version: -1 });

    const newVersion = lastDelivery ? lastDelivery.version + 1 : 1;

    // تحديث الإصدارات السابقة
    if (lastDelivery) {
      await Delivery.updateMany(
        { requestId, isLatest: true },
        { isLatest: false }
      );
    }

    // إنشاء التسليم الجديد
    const delivery = new Delivery({
      requestId,
      portalId: request.portalId,
      version: newVersion,
      title,
      description,
      files: files || [],
      message,
      deliveredBy: userId,
      isLatest: true,
    });

    await delivery.save();

    // تحديث حالة الطلب
    request.status = 'under_review';
    request.deliveredAt = new Date();
    request.addActivity('delivery_created', userId, 'specialist', null, {
      deliveryId: delivery._id,
      version: newVersion,
    });
    await request.save();

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: delivery,
    });
  } catch (error) {
    console.error('❌ Create delivery error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create delivery',
    });
  }
};

// ✅ مراجعة التسليم
export const reviewDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, comment } = req.body;
    const { id: userId } = req.user;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    // التحقق من الصلاحية
    const request = await Request.findById(delivery.requestId);
    if (request.accountId?.toString() !== userId && req.user.role !== 'portal_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this delivery',
      });
    }

    delivery.status = status;
    delivery.reviewComment = comment || '';
    delivery.reviewedBy = userId;
    delivery.reviewedAt = new Date();

    await delivery.save();

    // تحديث حالة الطلب
    if (status === 'accepted') {
      request.status = 'completed';
      request.completedAt = new Date();
      request.addActivity('delivery_accepted', userId, req.user.role, null, {
        deliveryId: delivery._id,
        version: delivery.version,
      });
    } else if (status === 'modification_requested') {
      request.status = 'modification';
      request.addActivity('modification_requested', userId, req.user.role, null, {
        deliveryId: delivery._id,
        version: delivery.version,
        comment,
      });
    } else if (status === 'rejected') {
      request.status = 'under_review';
      request.addActivity('delivery_rejected', userId, req.user.role, null, {
        deliveryId: delivery._id,
        version: delivery.version,
        comment,
      });
    }

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Delivery reviewed successfully',
      data: delivery,
    });
  } catch (error) {
    console.error('❌ Review delivery error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to review delivery',
    });
  }
};

// ✅ جلب تسليمات الطلب
export const getDeliveriesByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { id: userId } = req.user;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // التحقق من الصلاحية
    const isAuthorized = 
      request.accountId?.toString() === userId ||
      request.specialistId?.toString() === userId ||
      req.user.role === 'portal_admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these deliveries',
      });
    }

    const deliveries = await Delivery.find({ requestId })
      .sort({ version: -1 })
      .populate('deliveredBy', 'profile.fullName email')
      .populate('reviewedBy', 'profile.fullName email')
      .populate('files.fileId', 'originalName size mimeType');

    res.status(200).json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error('❌ Get deliveries error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get deliveries',
    });
  }
};