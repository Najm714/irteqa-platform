// src/routes/content.routes.js
import express from 'express';
import {
  getContent,        // ✅ تم التصحيح
  getContentById,
  getVideos,
  getSummaries,
  createContent,
  updateContent,
  deleteContent,
} from '../controllers/content.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ Routes العامة (للمستخدمين العاديين)
router.get('/', authenticate, requirePortalContext, getContent);
router.get('/videos', authenticate, requirePortalContext, getVideos);
router.get('/summaries', authenticate, requirePortalContext, getSummaries);
router.get('/:id', authenticate, requirePortalContext, getContentById);

// ✅ Routes الإدارية (للمشرفين)
router.post('/', authenticate, requirePortalContext, requirePermission('manage_content'), createContent);
router.put('/:id', authenticate, requirePortalContext, requirePermission('manage_content'), updateContent);
router.delete('/:id', authenticate, requirePortalContext, requirePermission('manage_content'), deleteContent);

export default router;