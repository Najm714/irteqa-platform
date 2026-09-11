// src/routes/video.routes.js
import express from 'express';
import multer from 'multer';
import {
  uploadVideo,
  getVideoForPlayback,
  getVideos,
  deleteVideo,
  createLiveStream,
  getLiveStreamInfo,
} from '../controllers/video.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// إعداد multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

// ✅ Routes العامة
router.get('/', authenticate, requirePortalContext, getVideos);
router.get('/:id/playback', authenticate, requirePortalContext, getVideoForPlayback);

// ✅ Routes الإدارية
router.post(
  '/upload',
  authenticate,
  requirePortalContext,
  requirePermission('manage_videos'),
  upload.single('video'),
  uploadVideo
);

router.delete(
  '/:id',
  authenticate,
  requirePortalContext,
  requirePermission('manage_videos'),
  deleteVideo
);

// ✅ Routes البث المباشر
router.post(
  '/live',
  authenticate,
  requirePortalContext,
  requirePermission('manage_videos'),
  createLiveStream
);

router.get(
  '/live/:id',
  authenticate,
  requirePortalContext,
  getLiveStreamInfo
);

export default router;