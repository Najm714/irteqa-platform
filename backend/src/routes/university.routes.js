// src/routes/university.routes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { University } from '../models/University.model.js';

const router = express.Router();

// GET /api/universities
router.get('/', authenticate, requirePortalContext, async (req, res) => {
  try {
    const { portalId } = req.portal;
    const universities = await University.find({ portalId, isActive: true });
    res.json({ success: true, data: universities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/universities/:id
router.get('/:id', authenticate, requirePortalContext, async (req, res) => {
  try {
    const { portalId } = req.portal;
    const university = await University.findOne({
      _id: req.params.id,
      portalId,
      isActive: true,
    });
    if (!university) {
      return res.status(404).json({ success: false, message: 'University not found' });
    }
    res.json({ success: true, data: university });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;