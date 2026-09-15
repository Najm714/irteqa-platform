// backend/src/controllers/payment.controller.js
import { Payment } from '../models/Payment.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Request } from '../models/Request.model.js';
import { File } from '../models/File.model.js';

// ============================================================
// ✅ إنشاء دفعة جديدة
// ============================================================
// ============================================================
// ✅ إنشاء دفعة جديدة - Portal / Account Secure
// ============================================================

export const createPayment = async (req, res) => {
  try {
    // ✅ القيم الموثوقة تأتي من middleware وليس من العميل
    const portalId = req.portalId;
    const accountId = req.accountId;

    const {
      requestId,
      subscriptionId,
      paymentMethod,
      accountNumber,
      accountName,
      bankName,
      reference,
      notes,
    } = req.body;

    console.log('📝 Creating payment...');
    console.log('  - Portal:', portalId);
    console.log('  - Account:', accountId);
    console.log('  - Payment Method:', paymentMethod);
    console.log('  - RequestId:', requestId);
    console.log('  - SubscriptionId:', subscriptionId);

    // ========================================================
    // 1️⃣ التحقق من السياق الأمني
    // ========================================================

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // يجب أن يكون الدفع مرتبطًا بطلب أو اشتراك
    if (!requestId && !subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'requestId or subscriptionId is required',
      });
    }

    // ========================================================
    // 2️⃣ تحميل الطلب والتحقق من ملكيته
    // ========================================================

    let request = null;

    if (requestId) {
      request = await Request.findOne({
        _id: requestId,
        portalId,
        accountId,
        isActive: true,
        isDeleted: { $ne: true },
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or access denied',
        });
      }

      // لا ننشئ دفعة جديدة إذا كان الطلب مدفوعًا بالفعل
      if (
        request.paymentStatus === 'verified' ||
        request.paymentStatus === 'refunded'
      ) {
        return res.status(409).json({
          success: false,
          message: 'This request cannot receive a new payment',
        });
      }
    }

    // ========================================================
    // 3️⃣ تحميل الاشتراك والتحقق من ملكيته
    // ========================================================

    let subscription = null;

    if (subscriptionId) {
      subscription = await Subscription.findOne({
        _id: subscriptionId,
        portalId,
        accountId,
        isDeleted: { $ne: true },
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found or access denied',
        });
      }

      if (
        subscription.paymentStatus === 'paid' ||
        subscription.paymentStatus === 'refunded'
      ) {
        return res.status(409).json({
          success: false,
          message: 'This subscription cannot receive a new payment',
        });
      }
    }

    // ========================================================
    // 4️⃣ إذا كان هناك Request + Subscription
    //    يجب أن يكونا لنفس المستخدم والبوابة
    // ========================================================

    if (request && subscription) {
      if (
        request.accountId.toString() !==
        subscription.accountId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Request and subscription belong to different accounts',
        });
      }

      if (
        request.portalId.toString() !==
        subscription.portalId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Request and subscription belong to different portals',
        });
      }
    }

    // ========================================================
    // 5️⃣ تحديد السعر من قاعدة البيانات
    //    ❌ لا نثق في amount القادم من frontend
    // ========================================================

    let paymentAmount = null;
    let paymentCurrency = 'SAR';

    if (subscription) {
      paymentAmount = Number(subscription.price);
      paymentCurrency = subscription.currency || 'SAR';
    } else if (request) {
      paymentAmount = Number(request.price);
      paymentCurrency = request.currency || 'SAR';
    }

    if (!Number.isFinite(paymentAmount) || paymentAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount',
      });
    }

    // ========================================================
    // 6️⃣ منع وجود دفعة معلقة/مقدمة مكررة
    // ========================================================

    const duplicateQuery = {
      portalId,
      accountId,
      isDeleted: { $ne: true },
      status: { $in: ['pending', 'submitted', 'verified'] },
    };

    if (subscriptionId) {
      duplicateQuery.subscriptionId = subscription._id;
    }

    if (requestId) {
      duplicateQuery.requestId = request._id;
    }

    const existingPayment = await Payment.findOne(duplicateQuery);

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: 'An existing payment is already associated with this request or subscription',
        data: existingPayment,
      });
    }

    // ========================================================
    // 7️⃣ إنشاء الدفعة
    // ========================================================
    // ❌ لا نأخذ:
    // - portalId من body
    // - accountId من body
    // - amount من body
    // - status من body
    // - proof من body
    //
    // ✅ الحالة الابتدائية دائمًا submitted
    // ========================================================

    const payment = new Payment({
      portalId,
      accountId,

      requestId: request?._id || null,
      subscriptionId: subscription?._id || null,

      amount: paymentAmount,
      currency: paymentCurrency,

      paymentMethod,

      accountNumber: accountNumber || '',
      accountName: accountName || '',
      bankName: bankName || '',

      reference:
        reference ||
        `PAY-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`,

      // ❌ إثبات الدفع لا يأتي من JSON
      // سيتم ربطه لاحقًا بواسطة /:id/proof
      proof: null,

      // 🔒 لا يسمح للعميل بتحديد حالة الدفع
      status: 'submitted',

      notes: notes || '',

      gateway: 'manual',
    });

    await payment.save();

    console.log('✅ Payment created:', payment._id);

    // ========================================================
    // 8️⃣ تحديث Request
    // ========================================================

    if (request) {
      request.paymentStatus = 'submitted';

      request.addActivity(
        'payment_submitted',
        accountId,
        req.user?.role || 'customer',
        null,
        {
          paymentId: payment._id,
          amount: paymentAmount,
          currency: paymentCurrency,
          paymentMethod,
        }
      );

      await request.save();

      console.log('✅ Request payment status updated:', request._id);
    }

    // ========================================================
    // 9️⃣ تحديث Subscription
    // ========================================================

    if (subscription) {
      subscription.status = 'pending';
      subscription.paymentStatus = 'pending';
      subscription.paymentId = payment._id;

      await subscription.save();

      console.log(
        '✅ Subscription payment linked:',
        subscription._id
      );
    }

    // ========================================================
    // 🔟 الاستجابة
    // ========================================================

    return res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created successfully',
    });

  } catch (error) {
    console.error('❌ Error in createPayment:', error);

    // معالجة duplicate reference
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Payment reference already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create payment',
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
// ✅ تحديث بيانات الدفعة
// ملاحظة: تغيير حالة الدفع يتم فقط عبر updatePaymentStatus
// ============================================================

export const updatePayment = async (req, res) => {
  try {
    const portalId = req.portalId;
    const { id } = req.params;
    const updates = req.body || {};

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
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

    // ========================================================
    // الحقول المسموح بتحديثها
    // ❌ status ليس هنا
    // لأن تغيير الحالة يجب أن يمر عبر updatePaymentStatus
    // ========================================================

    const allowedUpdates = [
      'notes',
      'accountNumber',
      'accountName',
      'bankName',
      'proof',
    ];

    allowedUpdates.forEach((key) => {
      if (updates[key] !== undefined) {
        payment[key] = updates[key];
      }
    });

    await payment.save();

    return res.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully',
    });

  } catch (error) {
    console.error('❌ Error in updatePayment:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update payment',
    });
  }
};
// ============================================================
// ✅ تحديث حالة الدفع - Admin
// ============================================================

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body || {};

    // ✅ القيم الموثوقة تأتي من middleware
    const accountId = req.accountId;
    const portalId = req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // ========================================================
    // 1️⃣ التحقق من حالة الدفع
    // ========================================================

    const allowedStatuses = [
      'pending',
      'submitted',
      'verified',
      'rejected',
      'refunded',
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status',
        allowedStatuses,
      });
    }

    // ========================================================
    // 2️⃣ جلب الدفعة داخل نفس الـ Portal
    // ========================================================

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

    // ========================================================
    // 3️⃣ منع بعض الانتقالات غير المنطقية
    // ========================================================

    if (oldStatus === 'refunded' && status !== 'refunded') {
      return res.status(409).json({
        success: false,
        message: 'A refunded payment cannot be moved to another status',
      });
    }

    if (oldStatus === 'verified' && status === 'submitted') {
      return res.status(409).json({
        success: false,
        message: 'A verified payment cannot be moved back to submitted',
      });
    }

    // ========================================================
    // 4️⃣ تحديث الدفعة
    // ========================================================

    payment.status = status;

    if (notes !== undefined) {
      payment.notes = notes;
    }

    // الشخص الذي قام بالتحقق/التحديث
    payment.verifiedBy = accountId;

    // ========================================================
    // 5️⃣ VERIFIED
    // ========================================================

    if (status === 'verified') {
      const now = new Date();

      payment.verifiedAt = now;
      payment.paidAt = now;

      // ------------------------------------------------------
      // تحديث Request مع portalId
      // ------------------------------------------------------

      if (payment.requestId) {
        const request = await Request.findOne({
          _id: payment.requestId,
          portalId,
          isDeleted: { $ne: true },
        });

        if (!request) {
          return res.status(409).json({
            success: false,
            message: 'Associated request was not found in this portal',
          });
        }

        request.paymentStatus = 'verified';
        request.paymentVerifiedAt = now;

        // لا ننتقل إلى in_progress إذا كان الطلب في حالة
        // لا تسمح بهذا الانتقال.
        if (request.status === 'awaiting_payment') {
          request.status = 'in_progress';
        }

        request.addActivity(
          'payment_verified',
          accountId,
          req.user?.role || 'portal_admin',
          oldStatus,
          'verified',
          {
            paymentId: payment._id,
            amount: payment.amount,
            currency: payment.currency,
          }
        );

        await request.save();

        console.log(
          '✅ Request payment verified:',
          request._id
        );
      }

      // ------------------------------------------------------
      // تحديث Subscription مع portalId + accountId
      // ------------------------------------------------------

      if (payment.subscriptionId) {
        const subscription = await Subscription.findOne({
          _id: payment.subscriptionId,
          portalId,
          accountId: payment.accountId,
          isDeleted: { $ne: true },
        });

        if (!subscription) {
          return res.status(409).json({
            success: false,
            message: 'Associated subscription was not found in this portal',
          });
        }

        subscription.status = 'active';
        subscription.paymentStatus = 'paid';
        subscription.paymentId = payment._id;

        await subscription.save();

        console.log(
          '✅ Subscription activated:',
          subscription._id
        );
      }
    }

    // ========================================================
    // 6️⃣ REJECTED
    // ========================================================

    if (status === 'rejected') {
      payment.verifiedAt = new Date();

      // ------------------------------------------------------
      // تحديث Request مع portalId
      // ------------------------------------------------------

      if (payment.requestId) {
        const request = await Request.findOne({
          _id: payment.requestId,
          portalId,
          isDeleted: { $ne: true },
        });

        if (!request) {
          return res.status(409).json({
            success: false,
            message: 'Associated request was not found in this portal',
          });
        }

        request.paymentStatus = 'rejected';

        request.addActivity(
          'payment_rejected',
          accountId,
          req.user?.role || 'portal_admin',
          oldStatus,
          'rejected',
          {
            paymentId: payment._id,
            reason: notes || '',
          }
        );

        await request.save();

        console.log(
          '❌ Request payment rejected:',
          request._id
        );
      }

      // ------------------------------------------------------
      // تحديث Subscription مع portalId + accountId
      // ------------------------------------------------------

      if (payment.subscriptionId) {
        const subscription = await Subscription.findOne({
          _id: payment.subscriptionId,
          portalId,
          accountId: payment.accountId,
          isDeleted: { $ne: true },
        });

        if (!subscription) {
          return res.status(409).json({
            success: false,
            message: 'Associated subscription was not found in this portal',
          });
        }

        subscription.status = 'cancelled';
        subscription.paymentStatus = 'failed';

        await subscription.save();

        console.log(
          '❌ Subscription cancelled:',
          subscription._id
        );
      }
    }

    // ========================================================
    // 7️⃣ REFUNDED
    // ========================================================

    if (status === 'refunded') {
      payment.refundedAt = new Date();

      // إذا كان هناك اشتراك، يجب أن يكون التحديث
      // داخل نفس الـPortal ونفس الحساب.
      if (payment.subscriptionId) {
        const subscription = await Subscription.findOne({
          _id: payment.subscriptionId,
          portalId,
          accountId: payment.accountId,
          isDeleted: { $ne: true },
        });

        if (subscription) {
          subscription.paymentStatus = 'refunded';
          subscription.status = 'cancelled';

          await subscription.save();
        }
      }

      // تحديث حالة طلب مرتبط بالدفع المسترد
      if (payment.requestId) {
        const request = await Request.findOne({
          _id: payment.requestId,
          portalId,
          isDeleted: { $ne: true },
        });

        if (request) {
          request.paymentStatus = 'refunded';

          request.addActivity(
            'payment_rejected',
            accountId,
            req.user?.role || 'portal_admin',
            oldStatus,
            'refunded',
            {
              paymentId: payment._id,
              reason: notes || 'Payment refunded',
            }
          );

          await request.save();
        }
      }
    }

    // ========================================================
    // 8️⃣ حفظ الدفعة
    // ========================================================

    await payment.save();

    console.log(
      `✅ Payment status updated: ${payment._id} ${oldStatus} -> ${status}`
    );

    return res.json({
      success: true,
      data: payment,
      message: `Payment status updated to ${status}`,
    });

  } catch (error) {
    console.error('❌ Error in updatePaymentStatus:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
    });
  }
};
export const uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔐 Use authenticated context only.
    // Never trust X-Portal-Id or user-supplied portal IDs here.
    const portalId = req.portalId;
    const accountId = req.accountId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof file is required',
      });
    }

    // 🔐 Payment must belong to the authenticated account
    // and the currently authorized portal.
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

    // A verified/refunded payment should not be replaced
    // by a new proof document.
    if (payment.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Cannot upload proof for a verified payment',
      });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Cannot upload proof for a refunded payment',
      });
    }

    // 🔐 Actually upload the file to the configured storage provider
    // and create the File database record through StorageService.
    const uploadResult = await storageService.uploadFile(
      req.file,
      portalId,
      accountId,
      'payment_proof',
      payment.requestId || null,
      {
        paymentId: payment._id.toString(),
        reference: payment.reference || '',
      }
    );

    if (!uploadResult?.file?._id) {
      throw new Error('Failed to create payment proof file record');
    }

    // Link the stored File record to the Payment.
    payment.proof = uploadResult.file._id;
    payment.status = 'submitted';

    await payment.save();

    return res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: {
        payment,
        proof: uploadResult.file,
        storageKey: uploadResult.key,
        provider: uploadResult.provider,
      },
    });
  } catch (error) {
    console.error('❌ uploadPaymentProof error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload payment proof',
    });
  }
};
// ============================================================
// ✅ التحقق من الدفع (Verification)
// ============================================================

export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body || {};

    // ✅ القيم الموثوقة من middleware
    const portalId = req.portalId;
    const accountId = req.accountId;

    console.log('📤 Verifying payment:', id);
    console.log('  - Status:', status);
    console.log('  - Portal:', portalId);
    console.log('  - Verified by:', accountId);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required: verified or rejected',
      });
    }

    // ========================================================
    // 1️⃣ جلب الدفعة داخل نفس الـ Portal
    // ========================================================

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

    // ========================================================
    // 2️⃣ منع إعادة التحقق
    // ========================================================

    if (
      payment.status === 'verified' ||
      payment.status === 'rejected'
    ) {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.status}`,
      });
    }

    const now = new Date();
    const oldStatus = payment.status;

    // ========================================================
    // 3️⃣ VERIFIED
    // ========================================================

    if (status === 'verified') {
      payment.status = 'verified';
      payment.verifiedBy = accountId;
      payment.verifiedAt = now;
      payment.paidAt = now;

      // ------------------------------------------------------
      // تحديث Subscription
      // مع التأكد من:
      // _id + portalId + accountId
      // ------------------------------------------------------

      if (payment.subscriptionId) {
        const subscription = await Subscription.findOne({
          _id: payment.subscriptionId,
          portalId,
          accountId: payment.accountId,
          isDeleted: { $ne: true },
        });

        if (!subscription) {
          return res.status(409).json({
            success: false,
            message: 'Associated subscription was not found in this portal',
          });
        }

        subscription.status = 'active';
        subscription.paymentStatus = 'paid';
        subscription.paymentId = payment._id;

        await subscription.save();

        console.log(
          '✅ Subscription activated:',
          subscription._id
        );
      }

      // ------------------------------------------------------
      // تحديث Request
      // ------------------------------------------------------

      if (payment.requestId) {
        const request = await Request.findOne({
          _id: payment.requestId,
          portalId,
          isDeleted: { $ne: true },
        });

        if (!request) {
          return res.status(409).json({
            success: false,
            message: 'Associated request was not found in this portal',
          });
        }

        request.paymentStatus = 'verified';
        request.paymentVerifiedAt = now;

        // الانتقال إلى in_progress فقط من awaiting_payment
        if (request.status === 'awaiting_payment') {
          request.status = 'in_progress';
        }

        request.addActivity(
          'payment_verified',
          accountId,
          req.user?.role || 'portal_admin',
          oldStatus,
          'verified',
          {
            paymentId: payment._id,
            amount: payment.amount,
            currency: payment.currency,
          }
        );

        await request.save();

        console.log(
          '✅ Request payment verified:',
          request._id
        );
      }
    }

    // ========================================================
    // 4️⃣ REJECTED
    // ========================================================

    if (status === 'rejected') {
      payment.status = 'rejected';
      payment.verifiedBy = accountId;
      payment.verifiedAt = now;

      if (rejectionReason) {
        payment.rejectionReason = rejectionReason;
      }

      // ------------------------------------------------------
      // تحديث Subscription
      // ------------------------------------------------------

      if (payment.subscriptionId) {
        const subscription = await Subscription.findOne({
          _id: payment.subscriptionId,
          portalId,
          accountId: payment.accountId,
          isDeleted: { $ne: true },
        });

        if (!subscription) {
          return res.status(409).json({
            success: false,
            message: 'Associated subscription was not found in this portal',
          });
        }

        subscription.status = 'cancelled';
        subscription.paymentStatus = 'failed';

        await subscription.save();

        console.log(
          '❌ Subscription cancelled:',
          subscription._id
        );
      }

      // ------------------------------------------------------
      // تحديث Request
      // ------------------------------------------------------

      if (payment.requestId) {
        const request = await Request.findOne({
          _id: payment.requestId,
          portalId,
          isDeleted: { $ne: true },
        });

        if (!request) {
          return res.status(409).json({
            success: false,
            message: 'Associated request was not found in this portal',
          });
        }

        request.paymentStatus = 'rejected';

        request.addActivity(
          'payment_rejected',
          accountId,
          req.user?.role || 'portal_admin',
          oldStatus,
          'rejected',
          {
            paymentId: payment._id,
            reason: rejectionReason || '',
          }
        );

        await request.save();

        console.log(
          '❌ Request payment rejected:',
          request._id
        );
      }
    }

    // ========================================================
    // 5️⃣ حفظ الدفعة
    // ========================================================

    await payment.save();

    console.log(
      `✅ Payment verification completed: ${id} -> ${status}`
    );

    return res.json({
      success: true,
      data: payment,
      message:
        status === 'verified'
          ? 'Payment approved successfully'
          : 'Payment rejected successfully',
    });

  } catch (error) {
    console.error('❌ Error in verifyPayment:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
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