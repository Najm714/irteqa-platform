// backend/src/routes/offer.routes.js
import express from 'express';
import {
  addOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  viewOfferImage,
  getOfferStats,
  trackOfferClick,
} from '../controllers/offer.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ✅ مسار عرض صورة العرض - عام (يقرأ التوكن من Query)
router.get('/:id/image', viewOfferImage);

// ✅ جميع المسارات الأخرى تتطلب مصادقة
router.use(authenticate);
router.use(requirePortalContext);

// ============================================================
// ✅ مسارات العميل
// ============================================================
router.get('/', getOffers);
router.get('/stats', getOfferStats);
router.get('/:id', getOfferById);
router.post('/:id/click', trackOfferClick);

// ============================================================
// ✅ مسارات المدير
// ============================================================
router.post('/', requirePermission(['manage_offers']), addOffer);
router.put('/:id', requirePermission(['manage_offers']), updateOffer);
router.delete('/:id', requirePermission(['manage_offers']), deleteOffer);

export default router;