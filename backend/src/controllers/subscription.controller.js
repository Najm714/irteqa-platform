// src/controllers/subscription.controller.js
import { Subscription } from '../models/Subscription.model.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.model.js';
import { Payment } from '../models/Payment.model.js';

// ✅ جلب خطط الاشتراك
export const getPlans = async (req, res) => {
  try {
    const { portalId } = req.portal;
    
    const plans = await SubscriptionPlan.find({
      portalId,
      isActive: true,
    })
    .sort({ order: 1, price: 1 });
    
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('❌ Get plans error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get plans',
    });
  }
};

// ✅ جلب خطة واحدة
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;
    
    const plan = await SubscriptionPlan.findOne({
      _id: id,
      portalId,
      isActive: true,
    });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('❌ Get plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get plan',
    });
  }
};

// ✅ إنشاء خطة جديدة (للمشرفين)
export const createPlan = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: userId } = req.user;
    
    const planData = {
      ...req.body,
      portalId,
      createdBy: userId,
    };
    
    const plan = new SubscriptionPlan(planData);
    await plan.save();
    
    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan,
    });
  } catch (error) {
    console.error('❌ Create plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create plan',
    });
  }
};

// ✅ تحديث خطة (للمشرفين)
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;
    
    const plan = await SubscriptionPlan.findOne({ _id: id, portalId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }
    
    Object.assign(plan, req.body);
    await plan.save();
    
    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan,
    });
  } catch (error) {
    console.error('❌ Update plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update plan',
    });
  }
};

// ✅ حذف خطة (للمشرفين)
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;
    
    const plan = await SubscriptionPlan.findOne({ _id: id, portalId });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }
    
    // حذف منطقي
    plan.isActive = false;
    await plan.save();
    
    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete plan',
    });
  }
};

// ✅ الاشتراك في خطة
export const subscribeToPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { portalId } = req.portal;
    const { id: accountId } = req.user;
    const { paymentMethod, autoRenew } = req.body;
    
    // التحقق من الخطة
    const plan = await SubscriptionPlan.findOne({
      _id: planId,
      portalId,
      isActive: true,
    });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }
    
    // التحقق من وجود اشتراك نشط
    const existingSubscription = await Subscription.findOne({
      portalId,
      accountId,
      status: 'active',
    });
    
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription',
      });
    }
    
    // حساب تاريخ الانتهاء
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);
    
    // إنشاء الاشتراك
    const subscription = new Subscription({
      portalId,
      accountId,
      planId: plan._id,
      planSnapshot: {
        name: plan.name,
        nameAr: plan.nameAr,
        type: plan.type,
        price: plan.price,
        currency: plan.currency,
        durationDays: plan.durationDays,
        features: plan.features,
        scope: plan.scope,
        limits: plan.limits,
      },
      startDate,
      endDate,
      status: 'pending',
      amount: plan.price,
      currency: plan.currency,
      autoRenew: autoRenew || false,
    });
    
    await subscription.save();
    
    // ✅ هنا سيتم دمج مع نظام الدفع
    // إنشاء دفعة
    const payment = new Payment({
      portalId,
      accountId,
      subscriptionId: subscription._id,
      amount: plan.price,
      currency: plan.currency,
      paymentMethod: paymentMethod || 'credit_card',
      status: 'pending',
      reference: `SUB-${subscription._id}-${Date.now()}`,
    });
    
    await payment.save();
    
    // ربط الدفع بالاشتراك
    subscription.paymentId = payment._id;
    await subscription.save();
    
    // إضافة نشاط
    subscription.activityLog.push({
      action: 'created',
      timestamp: new Date(),
      metadata: { planId: plan._id, planName: plan.name },
    });
    await subscription.save();
    
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription,
        payment,
      },
    });
  } catch (error) {
    console.error('❌ Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to subscribe',
    });
  }
};

// ✅ جلب اشتراكات المستخدم
export const getMySubscriptions = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: accountId } = req.user;
    
    const subscriptions = await Subscription.find({
      portalId,
      accountId,
    })
    .sort({ createdAt: -1 })
    .populate('planId', 'name nameAr type price')
    .populate('paymentId', 'amount status reference');
    
    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error('❌ Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get subscriptions',
    });
  }
};

// ✅ جلب اشتراك نشط للمستخدم
export const getActiveSubscription = async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { id: accountId } = req.user;
    
    const subscription = await Subscription.findOne({
      portalId,
      accountId,
      status: 'active',
    })
    .populate('planId', 'name nameAr type price features');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('❌ Get active subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get active subscription',
    });
  }
};

// ✅ إلغاء الاشتراك
export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;
    const { id: accountId } = req.user;
    
    const subscription = await Subscription.findOne({
      _id: id,
      portalId,
      accountId,
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }
    
    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can be cancelled',
      });
    }
    
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();
    
    subscription.activityLog.push({
      action: 'cancelled',
      timestamp: new Date(),
      metadata: { reason: req.body.reason || 'User requested cancellation' },
    });
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('❌ Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel subscription',
    });
  }
};

// ✅ تفعيل الاشتراك (بعد تأكيد الدفع)
export const activateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { portalId } = req.portal;
    
    const subscription = await Subscription.findOne({
      _id: id,
      portalId,
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }
    
    if (subscription.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending subscriptions can be activated',
      });
    }
    
    subscription.status = 'active';
    await subscription.save();
    
    subscription.activityLog.push({
      action: 'activated',
      timestamp: new Date(),
      metadata: { message: 'Subscription activated after payment confirmation' },
    });
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: subscription,
    });
  } catch (error) {
    console.error('❌ Activate subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate subscription',
    });
  }
};