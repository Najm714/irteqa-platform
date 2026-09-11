// src/routes/subscription.routes.js
import express from 'express';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  subscribeToPlan,
  getMySubscriptions,
  getActiveSubscription,
  cancelSubscription,
  activateSubscription,
} from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ Routes العامة (للمستخدمين العاديين)
router.get('/plans', authenticate, requirePortalContext, getPlans);
router.get('/plans/:id', authenticate, requirePortalContext, getPlanById);
router.get('/my', authenticate, requirePortalContext, getMySubscriptions);
router.get('/active', authenticate, requirePortalContext, getActiveSubscription);
router.post('/plans/:planId/subscribe', authenticate, requirePortalContext, subscribeToPlan);
router.put('/:id/cancel', authenticate, requirePortalContext, cancelSubscription);

// ✅ Routes الإدارية (للمشرفين)
router.post('/plans', authenticate, requirePortalContext, requirePermission('manage_subscriptions'), createPlan);
router.put('/plans/:id', authenticate, requirePortalContext, requirePermission('manage_subscriptions'), updatePlan);
router.delete('/plans/:id', authenticate, requirePortalContext, requirePermission('manage_subscriptions'), deletePlan);
router.put('/:id/activate', authenticate, requirePortalContext, requirePermission('manage_subscriptions'), activateSubscription);

export default router;