// backend/src/routes/support.routes.js
import express from 'express';
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
  assignTicket,
  createDispute,
  getMyDisputes,
  getAllDisputes,
  addDisputeMessage,
  proposeDisputeResolution,
  acceptDisputeResolution,
} from '../controllers/support.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ جميع Routes تحتاج مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// تذاكر الدعم
// ============================================================

// Routes للمستخدمين العاديين
router.post('/tickets', requirePermission('create_ticket'), createTicket);
router.get('/tickets/my', requirePermission('view_own_tickets'), getMyTickets);
router.get('/tickets/:id', requirePermission('view_ticket'), getTicketById);
router.post('/tickets/:id/reply', requirePermission('reply_ticket'), replyToTicket);

// Routes للمشرفين
router.get('/tickets', requirePermission('manage_tickets'), getAllTickets);
router.put('/tickets/:id/status', requirePermission('manage_tickets'), updateTicketStatus);
router.put('/tickets/:id/assign', requirePermission('manage_tickets'), assignTicket);

// ============================================================
// النزاعات
// ============================================================

// Routes للمستخدمين العاديين
router.post('/disputes', requirePermission('create_dispute'), createDispute);
router.get('/disputes/my', requirePermission('view_own_disputes'), getMyDisputes);
router.post('/disputes/:id/message', requirePermission('message_in_dispute'), addDisputeMessage);

// Routes للمشرفين
router.get('/disputes', requirePermission('manage_disputes'), getAllDisputes);
router.post('/disputes/:id/resolution', requirePermission('manage_disputes'), proposeDisputeResolution);
router.post('/disputes/:id/accept', requirePermission('manage_disputes'), acceptDisputeResolution);

export default router;