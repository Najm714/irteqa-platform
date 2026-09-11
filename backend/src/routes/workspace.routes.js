// backend/src/routes/workspace.routes.js
import express from 'express'
import {
  getWorkspace,
  updateWorkspace,
  getWorkspaceStats,
} from '../controllers/workspace.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requirePortalContext } from '../middleware/portalContext.js'
import { requireRequestOwnership } from '../middleware/resourceOwnership.js'
import { requirePermission } from '../middleware/authorization.js'

const router = express.Router()

// ===== جميع المسارات تتطلب مصادقة =====
router.use(authenticate)
router.use(requirePortalContext)

// ===== إحصائيات مساحة العمل =====
router.get('/stats', requirePermission(['read_own_requests']), getWorkspaceStats)

// ===== مساحة عمل الطلب =====
router.get('/:id', requireRequestOwnership, getWorkspace)
router.patch('/:id', requireRequestOwnership, updateWorkspace)

export default router