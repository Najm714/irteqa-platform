// backend/src/routes/liveStream.routes.js
import express from 'express';
import {
  createLiveStream,
  getLiveStreams,
  getLiveStreamById,
  getLiveStreamDetails,
  startLiveStream,
  endLiveStream,
  deleteLiveStream,
  updateViewers,
  saveLiveChatMessage,
  getLiveChat,
  getLiveStats,
} from '../controllers/liveStream.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ============================================================
// ✅ مسارات المشاهدة العامة
// ============================================================

router.get('/', optionalAuth, requirePortalContext, getLiveStreams);
router.get('/:id', optionalAuth, requirePortalContext, getLiveStreamById);
router.post('/:id/viewers', optionalAuth, requirePortalContext, updateViewers);
router.get('/:id/chat', optionalAuth, requirePortalContext, getLiveChat);
router.post('/:id/chat', authenticate, requirePortalContext, saveLiveChatMessage);

// ============================================================
// ✅ مسارات الإدارة (للمدير فقط)
// ============================================================

router.post(
  '/',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_videos', 'manage_live', 'manage_explanations']),
  createLiveStream
);

router.get(
  '/:id/details',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_videos', 'manage_live', 'manage_explanations']),
  getLiveStreamDetails
);

router.put(
  '/:id/start',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_videos', 'manage_live', 'manage_explanations']),
  startLiveStream
);

router.put(
  '/:id/end',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_videos', 'manage_live', 'manage_explanations']),
  endLiveStream
);

router.delete(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_videos', 'manage_live', 'manage_explanations']),
  deleteLiveStream
);

router.get(
  '/:id/stats',
  authenticate,
  requirePortalContext,
  requirePermission(['manage_videos', 'manage_live', 'manage_explanations']),
  getLiveStats
);

export default router;