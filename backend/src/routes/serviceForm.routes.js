// backend/src/routes/serviceForm.routes.js
import express from 'express';
import {
  getServiceForms,
  getServiceFormById,
  createServiceForm,
  updateServiceForm,
  deleteServiceForm,
  toggleServiceFormStatus,
  uploadServiceFormFile,
} from '../controllers/serviceForm.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePortalContext } from '../middleware/portalContext.js';
import { requirePermission } from '../middleware/authorization.js';
import multer from 'multer';

const router = express.Router();

// ✅ تكوين Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/gif',
      'text/plain',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'), false);
    }
  },
});

router.use(authenticate);
router.use(requirePortalContext);

// ✅ رفع ملف النموذج
router.post('/upload', upload.single('file'), requirePermission(['manage_services']), uploadServiceFormFile);

// مسارات القراءة
router.get('/', getServiceForms);
router.get('/:id', getServiceFormById);

// مسارات الإدارة
router.post('/', requirePermission(['manage_services']), createServiceForm);
router.put('/:id', requirePermission(['manage_services']), updateServiceForm);
router.delete('/:id', requirePermission(['manage_services']), deleteServiceForm);
router.patch('/:id/toggle', requirePermission(['manage_services']), toggleServiceFormStatus);

export default router;