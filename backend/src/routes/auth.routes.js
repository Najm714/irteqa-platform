// backend/src/routes/auth.routes.js
import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
  updateSettings,
  getSettings,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRegister } from '../validators/auth.validator.js';

const router = express.Router();

// ============================================================
// ✅ Routes العامة (لا تحتاج مصادقة)
// ============================================================
router.post('/register', validateRegister, register);
router.post('/login', login);
router.post('/logout', logout);

// ============================================================
// ✅ Routes المحمية (تحتاج مصادقة)
// ============================================================
router.get('/me', authenticate, getMe);
router.get('/profile', authenticate, getProfile);      // ✅ GET /auth/profile
router.put('/profile', authenticate, updateProfile);   // ✅ PUT /auth/profile
router.post('/change-password', authenticate, changePassword);


router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, updateSettings);

export default router;