// backend/src/routes/reports.routes.js
import express from 'express';
import {
  getRequestsReport,
  getPaymentsReport,
  getUsersReport,
  getContentReport,
  getFullReport,
  exportReport,
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة وصلاحيات إدارية
router.use(authenticate);
router.use(requirePortalContext);

// ✅ مسارات التقارير المختلفة
router.get('/requests', requirePermission(['view_reports']), getRequestsReport);
router.get('/payments', requirePermission(['view_reports']), getPaymentsReport);
router.get('/users', requirePermission(['view_reports']), getUsersReport);
router.get('/content', requirePermission(['view_reports']), getContentReport);

// ✅ التقرير الشامل
router.get('/full', requirePermission(['view_reports']), getFullReport);

// ✅ تصدير التقارير
router.get('/export', requirePermission(['view_reports']), exportReport);

export default router;