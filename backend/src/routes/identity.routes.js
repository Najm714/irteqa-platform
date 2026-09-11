// backend/src/routes/identity.routes.js
import express from 'express'
import {
  getCustomerAccounts,
  linkCustomerAccounts,
  searchCustomer,
} from '../controllers/identity.controller.js'
import { authenticate } from '../middleware/auth.js'
import { requirePortalContext } from '../middleware/portalContext.js'
import { requirePortalAdmin } from '../middleware/authorization.js'

const router = express.Router()

// ✅ جميع المسارات تتطلب مصادقة
router.use(authenticate)
router.use(requirePortalContext)

// ✅ البحث عن العميل (للمدير فقط)
router.get('/search', requirePortalAdmin, searchCustomer)

// ✅ الحصول على حسابات العميل
router.get('/customer/:identityId', getCustomerAccounts)

// ✅ ربط حسابات العميل (للمدير فقط)
router.post('/link', requirePortalAdmin, linkCustomerAccounts)

export default router