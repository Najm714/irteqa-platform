// backend/src/routes/about.routes.js
import express from 'express';
import {
  upsertAbout,
  getAbout,
  getAboutFile,
} from '../controllers/about.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ مسار عرض الملفات - عام (يقرأ التوكن من Query)
router.get('/file/:id', getAboutFile);

// ✅ جميع المسارات الأخرى تتطلب مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات العميل (عرض صفحة نبذة عنا)
// ============================================================
router.get('/', getAbout);

// ============================================================
// ✅ مسارات المدير (إدارة صفحة نبذة عنا)
// ============================================================
router.post('/', requirePermission(['manage_about']), upsertAbout);
router.put('/', requirePermission(['manage_about']), upsertAbout);

export default router;