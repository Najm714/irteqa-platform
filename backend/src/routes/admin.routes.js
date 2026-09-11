// backend/src/routes/admin.routes.js
import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  updateUserPermissions,
  getDashboardStats,
  getChartData,
  getSettings,
  updateSettings,
  getAuditLog,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ جميع المسارات تتطلب مصادقة وسياق بوابة وصلاحيات إدارية
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات لوحة التحكم
// ============================================================
router.get('/dashboard/stats', requirePermission(['view_reports']), getDashboardStats);
router.get('/dashboard/chart', requirePermission(['view_reports']), getChartData);

// ============================================================
// ✅ مسارات الإعدادات
// ============================================================
router.get('/settings', requirePermission(['manage_settings']), getSettings);
router.put('/settings', requirePermission(['manage_settings']), updateSettings);

// ============================================================
// ✅ مسارات المستخدمين
// ============================================================
router.get('/users/stats', requirePermission(['manage_users']), getUserStats);
router.get('/users', requirePermission(['manage_users']), getUsers);
router.get('/users/:id', requirePermission(['manage_users']), getUserById);
router.post('/users', requirePermission(['manage_users']), createUser);
router.put('/users/:id', requirePermission(['manage_users']), updateUser);
router.patch('/users/:id/toggle', requirePermission(['manage_users']), toggleUserStatus);
router.patch('/users/:id/permissions', requirePermission(['manage_users']), updateUserPermissions);
router.delete('/users/:id', requirePermission(['manage_users']), deleteUser);

// ============================================================
// ✅ مسارات سجل النشاطات
// ============================================================
router.get('/audit-log', requirePermission(['view_audit']), getAuditLog);

export default router;