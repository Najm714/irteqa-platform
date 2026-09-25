// backend/src/routes/sectionsStyle.routes.js
import express from 'express';
import {
  getSectionsStyle,
  updateSectionsStyle,
  applyPreset,
  resetSectionsStyle,
} from '../controllers/sectionsStyle.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

const PERMS = ['manage_appearance', 'manage_settings'];

// ✅ عام
router.get('/', optionalAuth, requirePortalContext, getSectionsStyle);

// ✅ إداري
router.put(
  '/',
  authenticate,
  requirePortalContext,
  requirePermission(PERMS),
  updateSectionsStyle
);

router.post(
  '/preset/:preset',
  authenticate,
  requirePortalContext,
  requirePermission(PERMS),
  applyPreset
);

router.post(
  '/reset',
  authenticate,
  requirePortalContext,
  requirePermission(PERMS),
  resetSectionsStyle
);

export default router;