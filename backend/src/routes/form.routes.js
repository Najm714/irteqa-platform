// backend/src/routes/form.routes.js
import express from 'express'
import {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  submitForm,
} from '../controllers/form.controller.js'
import { authenticate } from '../middleware/auth.js'
import { detectPortal, requirePortalContext } from '../middleware/portalContext.js'
import { requirePortalAdmin } from '../middleware/authorization.js'

const router = express.Router()

// ===== المسارات العامة =====
router.get('/', detectPortal, getForms)
router.get('/:id', detectPortal, getFormById)

// ===== تقديم النموذج (مصادقة مطلوبة) =====
router.post('/submit', authenticate, requirePortalContext, submitForm)

// ===== المسارات المحمية (للمدير فقط) =====
router.post('/', authenticate, requirePortalContext, requirePortalAdmin, createForm)
router.put('/:id', authenticate, requirePortalContext, requirePortalAdmin, updateForm)
router.delete('/:id', authenticate, requirePortalContext, requirePortalAdmin, deleteForm)

export default router