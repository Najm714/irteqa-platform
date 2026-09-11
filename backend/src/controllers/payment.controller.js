// backend/src/controllers/payment.controller.js
import { Payment } from '../models/Payment.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Request } from '../models/Request.model.js';
import { File } from '../models/File.model.js';

// ============================================================
// ✅ إنشاء دفعة جديدة
// ============================================================

export const createPayment = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.body.portalId || req.portal?._id;
    const accountId = req.accountId || req.user?.id;
    const { 
      requestId, 
      subscriptionId, 
      amount, 
      currency, 
      paymentMethod,
      accountNumber,
      accountName,
      bankName,
      reference,
      proof,
      status = 'submitted',
      notes
    } = req.body;

    console.log('📝 Creating payment...');
    console.log('  - Portal:', portalId);
    console.log('  - Account:', accountId);
    console.log('  - Amount:', amount);
    console.log('  - Payment Method:', paymentMethod);
    console.log('  - Proof:', proof);
    console.log('  - SubscriptionId:', subscriptionId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment method are required',
      });
    }

    // التحقق من وجود الطلب أو الاشتراك
    let request = null;
    let subscription = null;

    if (requestId) {
      request = await Request.findOne({ _id: requestId, portalId, isActive: true });
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
        });
      }
    }

    if (subscriptionId) {
      subscription = await Subscription.findOne({ _id: subscriptionId, portalId, isDeleted: { $ne: true } });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
      }
    }

    const payment = new Payment({
      portalId,
      accountId,
      requestId: request?._id,
      subscriptionId: subscription?._id,
      amount,
      currency: currency || 'SAR',
      paymentMethod,
      accountNumber: accountNumber || '',
      accountName: accountName || '',
      bankName: bankName || '',
      reference: reference || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      proof: proof || null,
      status: status || 'submitted',
      notes: notes || '',
      gateway: 'manual',
    });

    await payment.save();

    console.log('✅ Payment created:', payment._id);

    // ✅ إذا كان هناك اشتراك، قم بتحديثه
    if (subscription) {
      // إذا كانت طريقة الدفع manual أو bank_transfer، ننتظر التأكيد
      if (paymentMethod === 'manual' || paymentMethod === 'bank_transfer') {
        subscription.status = 'pending';
        subscription.paymentStatus = 'pending';
        subscription.paymentId = payment._id;
        await subscription.save();
        console.log('✅ Subscription updated to pending:', subscription._id);
      }
    }

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created successfully',
    });
  } catch (error) {
    console.error('❌ Error in createPayment:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ الحصول على مدفوعات المستخدم
// ============================================================

export const getMyPayments = async (req, res) => {
  try {
    const accountId = req.accountId || req.user?.id;
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { status, page = 1, limit = 20 } = req.query;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const query = { portalId, accountId, isDeleted: { $ne: true } };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('accountId', 'profile.fullName email')
        .populate('requestId', 'formData.title status')
        .populate('subscriptionId', 'type plan status')
        .populate('proof', 'originalName size mimeType')
        .populate('verifiedBy', 'profile.fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('❌ Error in getMyPayments:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ الحصول على دفعة محددة
// ============================================================

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const accountId = req.accountId || req.user?.id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    })
      .populate('accountId', 'profile.fullName email')
      .populate('requestId', 'formData.title status')
      .populate('subscriptionId', 'type plan status')
      .populate('proof', 'originalName size mimeType')
      .populate('verifiedBy', 'profile.fullName');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    const isOwner = payment.accountId?.toString() === accountId;
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this payment',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('❌ Error in getPaymentById:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ الحصول على جميع المدفوعات (للمدير)
// ============================================================

export const getPayments = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { status, page = 1, limit = 50, search } = req.query;

    console.log('📤 Fetching payments for portal:', portalId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const query = { portalId, isDeleted: { $ne: true } };
    if (status) {
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let paymentsQuery = Payment.find(query)
      .populate('accountId', 'profile.fullName email')
      .populate('requestId', 'formData.title status')
      .populate('subscriptionId', 'plan type status')
      .populate('proof', 'originalName size mimeType')
      .populate('verifiedBy', 'profile.fullName')
      .sort({ createdAt: -1 });

    if (search) {
      paymentsQuery = paymentsQuery.or([
        { reference: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
        { accountName: { $regex: search, $options: 'i' } },
      ]);
    }

    const [payments, total] = await Promise.all([
      paymentsQuery.skip(skip).limit(parseInt(limit)),
      Payment.countDocuments(query),
    ]);

    const paymentsWithProof = payments.filter(p => p.proof);
    console.log(`✅ Payments fetched: ${payments.length}, with proof: ${paymentsWithProof.length}`);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payments',
    });
  }
};

// ============================================================
// ✅ تحديث دفعة
// ============================================================

export const updatePayment = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    const updates = req.body;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const payment = await Payment.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // الحقول المسموح بتحديثها
    const allowedUpdates = ['status', 'notes', 'accountNumber', 'accountName', 'bankName', 'proof'];
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        payment[key] = updates[key];
      }
    });

    payment.updatedAt = new Date();
    await payment.save();

    res.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    console.error('❌ Error in updatePayment:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ تحديث حالة الدفع (للمدير)
// ============================================================

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const accountId = req.accountId || req.user?.id;
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    const oldStatus = payment.status;
    payment.status = status;
    payment.verifiedBy = accountId;
    payment.verifiedAt = new Date();

    if (status === 'verified') {
      payment.paidAt = new Date();
      
      // تحديث الطلب إذا كان مرتبطاً
      if (payment.requestId) {
        await Request.findByIdAndUpdate(payment.requestId, {
          paymentStatus: 'verified',
          paymentVerifiedAt: new Date(),
          status: 'in_progress',
        });
      }
      
      // ✅ تحديث الاشتراك إلى active
      if (payment.subscriptionId) {
        await Subscription.findByIdAndUpdate(payment.subscriptionId, {
          status: 'active',
          paymentStatus: 'paid',
          updatedAt: new Date(),
        });
        console.log('✅ Subscription activated:', payment.subscriptionId);
      }
    }

    if (status === 'rejected') {
      // ✅ تحديث الاشتراك إلى cancelled
      if (payment.subscriptionId) {
        await Subscription.findByIdAndUpdate(payment.subscriptionId, {
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date(),
        });
        console.log('❌ Subscription cancelled:', payment.subscriptionId);
      }
    }

    if (status === 'refunded') {
      payment.refundedAt = new Date();
    }

    await payment.save();

    console.log(`✅ Payment status updated: ${id} -> ${status}`);

    res.json({
      success: true,
      data: payment,
      message: `Payment status updated to ${status}`,
    });
  } catch (error) {
    console.error('❌ Error in updatePaymentStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ رفع إثبات دفع (للمدفوعات اليدوية)
// ============================================================

export const uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.accountId || req.user?.id;
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Proof file is required',
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      portalId,
      accountId,
      isDeleted: { $ne: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // ✅ إنشاء ملف جديد للإثبات
    const file = new File({
      portalId,
      accountId,
      requestId: payment.requestId,
      originalName: req.file.originalname,
      storageKey: `proof/${Date.now()}_${req.file.originalname}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: 'payment_proof',
      visibility: 'restricted',
      isEncrypted: false,
    });
    await file.save();

    // ✅ ربط الملف بالدفع
    payment.proof = file._id;
    payment.status = 'submitted';
    await payment.save();

    console.log('✅ Payment proof uploaded:', file._id);

    res.json({
      success: true,
      data: {
        payment,
        file: {
          _id: file._id,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
        },
      },
      message: 'Payment proof uploaded successfully',
    });
  } catch (error) {
    console.error('❌ Error in uploadPaymentProof:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ✅ التحقق من الدفع (Verification)
// ============================================================

export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const accountId = req.accountId || req.user?.id;

    console.log('📤 Verifying payment:', id);
    console.log('  - Status:', status);
    console.log('  - Portal:', portalId);
    console.log('  - Verified by:', accountId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required: verified or rejected',
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // لا يمكن إعادة التحقق من الدفع المؤكد
    if (payment.status === 'verified' || payment.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.status}`,
      });
    }

    // تحديث حالة الدفع
    payment.status = status;
    payment.verifiedBy = accountId;
    payment.verifiedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      payment.rejectionReason = rejectionReason;
    }

    if (status === 'verified') {
      payment.paidAt = new Date();
      
      // ✅ تحديث الاشتراك إلى active
      if (payment.subscriptionId) {
        const subscription = await Subscription.findByIdAndUpdate(
          payment.subscriptionId,
          { 
            status: 'active',
            paymentStatus: 'paid',
            updatedAt: new Date(),
          },
          { new: true }
        );
        console.log('✅ Subscription activated:', subscription?._id);
      }
      
      // تحديث الطلب إذا كان مرتبطاً
      if (payment.requestId) {
        await Request.findByIdAndUpdate(payment.requestId, {
          paymentStatus: 'verified',
          paymentVerifiedAt: new Date(),
          status: 'in_progress',
        });
      }
    }

    if (status === 'rejected') {
      // ✅ تحديث الاشتراك إلى cancelled
      if (payment.subscriptionId) {
        await Subscription.findByIdAndUpdate(payment.subscriptionId, {
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date(),
        });
        console.log('❌ Subscription cancelled:', payment.subscriptionId);
      }
    }

    await payment.save();

    console.log(`✅ Payment verified: ${id} -> ${status}`);

    res.json({
      success: true,
      data: payment,
      message: `Payment ${status === 'verified' ? 'approved' : 'rejected'} successfully`,
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
// ✅ حذف دفعة (للمدير فقط)
// ============================================================

export const deletePayment = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;
    const { id } = req.params;
    const userId = req.accountId || req.user?.id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // التحقق من الصلاحية (المدير فقط)
    const isAdmin = req.account?.role === 'portal_admin' || req.account?.role === 'super_admin';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this payment',
      });
    }

    // لا يمكن حذف المدفوعات المؤكدة
    if (payment.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a verified payment',
      });
    }

    // حذف منطقي
    payment.isDeleted = true;
    payment.deletedBy = userId;
    payment.deletedAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
      data: {
        id: payment._id,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('❌ Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete payment',
    });
  }
};

// ============================================================
// ✅ إحصائيات المدفوعات (للمدير)
// ============================================================

export const getPaymentStats = async (req, res) => {
  try {
    const portalId = req.portalId || req.headers['x-portal-id'] || req.portal?._id;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    const stats = await Payment.aggregate([
      { $match: { portalId, isDeleted: { $ne: true } } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      }},
    ]);

    const total = await Payment.countDocuments({ portalId, isDeleted: { $ne: true } });
    const totalAmount = await Payment.aggregate([
      { $match: { portalId, isDeleted: { $ne: true }, status: 'verified' } },
      { $group: {
        _id: null,
        total: { $sum: '$amount' },
      }},
    ]);

    res.json({
      success: true,
      data: {
        total,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        byStatus: stats.reduce((acc, s) => {
          acc[s._id] = { count: s.count, amount: s.totalAmount };
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('❌ Error in getPaymentStats:', error);
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
  createPayment,
  getMyPayments,
  getPaymentById,
  getPayments,
  updatePayment,
  updatePaymentStatus,
  uploadPaymentProof,
  verifyPayment,
  deletePayment,
  getPaymentStats,
};