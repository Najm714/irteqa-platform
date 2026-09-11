// src/middleware/subscription.js
import { Subscription } from '../models/Subscription.model.js';

// ✅ التحقق من وجود اشتراك نشط
export const requireActiveSubscription = async (req, res, next) => {
  try {
    const { portalId } = req.portal;
    const { id: accountId } = req.user;
    
    const subscription = await Subscription.findOne({
      portalId,
      accountId,
      status: 'active',
    });
    
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this content',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }
    
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('❌ Subscription middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Subscription verification error',
    });
  }
};

// ✅ التحقق من صلاحية محتوى معين
export const requireContentAccess = (contentIdParam = 'contentId') => {
  return async (req, res, next) => {
    try {
      const { portalId } = req.portal;
      const { id: accountId } = req.user;
      const contentId = req.params[contentIdParam] || req.body[contentIdParam];
      
      if (!contentId) {
        return res.status(400).json({
          success: false,
          message: 'Content ID is required',
        });
      }
      
      const subscription = await Subscription.findOne({
        portalId,
        accountId,
        status: 'active',
      });
      
      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required to access this content',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }
      
      const hasAccess = subscription.hasAccessToContent(contentId);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription does not include access to this content',
          code: 'CONTENT_NOT_IN_SUBSCRIPTION',
        });
      }
      
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('❌ Content access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Content access verification error',
      });
    }
  };
};