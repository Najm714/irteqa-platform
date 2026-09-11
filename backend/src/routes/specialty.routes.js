// src/routes/specialty.routes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { Specialty } from '../models/Specialty.model.js';

const router = express.Router();

router.get('/', authenticate, requirePortalContext, async (req, res) => {
  try {
    const { portalId } = req.portal;
    const { collegeId } = req.query;
    const query = { portalId, isActive: true };
    if (collegeId) query.collegeId = collegeId;
    const specialties = await Specialty.find(query);
    res.json({ success: true, data: specialties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;