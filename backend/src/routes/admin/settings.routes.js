// backend/src/routes/admin/settings.routes.js
import express from 'express';
import {
  getSettings,
  updateSettings,
} from '../../controllers/admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePortalForSettings } from '../../middleware/portalContext.js';
import { requirePermission } from '../../middleware/authorization.js';

const router = express.Router();

// ✅ جميع Routes تحتاج مصادقة
router.use(authenticate);

// ✅ Routes للإعدادات
router.get('/', requirePortalForSettings, requirePermission('manage_settings'), getSettings);
router.put('/', requirePortalForSettings, requirePermission('manage_settings'), updateSettings);

export default router;

