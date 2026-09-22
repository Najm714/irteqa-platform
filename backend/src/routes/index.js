// backend/src/routes/index.js
import express from 'express';
import authRoutes from './auth.routes.js';
import requestRoutes from './request.routes.js';
import serviceRoutes from './service.routes.js';
import sectionRoutes from './section.routes.js';
import fileRoutes from './file.routes.js';
import messageRoutes from './message.routes.js';
import paymentRoutes from './payment.routes.js';
import contentRoutes from './content.routes.js';
import adminRoutes from './admin.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import formRoutes from './form.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import explanationsRoutes from './explanations.routes.js';
import identityRoutes from './identity.routes.js';
import workspaceRoutes from './workspace.routes.js';
import callRoutes from './call.routes.js';
import notificationRoutes from './notification.routes.js';
import reviewRoutes from './review.routes.js';
import reportRoutes from './report.routes.js';
import supportRoutes from './support.routes.js';
import legalRoutes from './legal.routes.js';
// ❌ تم دمجها في explanations.routes.js
// import universityRoutes from './university.routes.js';
// import collegeRoutes from './college.routes.js';
// import specialtyRoutes from './specialty.routes.js';
// import videoRoutes from './video.routes.js';
import serviceDetailRoutes from './serviceDetail.routes.js';
import serviceFormRoutes from './serviceForm.routes.js';
import adminServicesRoutes from './admin/services.routes.js';
import adminSectionsRoutes from './admin/sections.routes.js';
import adminSettingsRoutes from './admin/settings.routes.js';
import taskRoutes from './task.routes.js';
import libraryRoutes from './library.routes.js';
import videoLibraryRoutes from './videoLibrary.routes.js';
import infographicRoutes from './infographic.routes.js';
import offerRoutes from './offer.routes.js';
import aboutRoutes from './about.routes.js';
import liveStreamRoutes from './liveStream.routes.js';
import heroConfigRoutes from './heroConfig.routes.js';

const router = express.Router();

// ============================================================
// ✅ Routes الصحية (Health Check)
// ============================================================

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================================
// ✅ Routes API الرئيسية
// ============================================================

router.use('/api/auth', authRoutes);
router.use('/api/requests', requestRoutes);
router.use('/api/services', serviceRoutes);
router.use('/api/sections', sectionRoutes);
router.use('/api/files', fileRoutes);
router.use('/api/messages', messageRoutes);
router.use('/api/payments', paymentRoutes);
router.use('/api/content', contentRoutes);
router.use('/api/subscriptions', subscriptionRoutes);
router.use('/api/forms', formRoutes);
router.use('/api/admin', adminRoutes);

// ✅ ✅ Explanations - يحتوي على كل شيء: الجامعات، الكليات، التخصصات، المواد، الفيديوهات
router.use('/api/explanations', explanationsRoutes);

router.use('/api/identity', identityRoutes);
router.use('/api/workspace', workspaceRoutes);
router.use('/api/calls', callRoutes);
router.use('/api/notifications', notificationRoutes);
router.use('/api/reviews', reviewRoutes);
router.use('/api/reports', reportRoutes);
router.use('/api/support', supportRoutes);
router.use('/api/legal', legalRoutes);
// ✅ Hero Config
router.use('/api/appearance/hero', heroConfigRoutes);
// ✅ مسارات الخدمات
router.use('/api/service-details', serviceDetailRoutes);
router.use('/api/service-forms', serviceFormRoutes);
router.use('/api/live-streams', liveStreamRoutes);

// ✅ لوحة التحكم والمهام
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/tasks', taskRoutes);

// ✅ المكتبة والمحتوى
router.use('/api/library', libraryRoutes);
router.use('/api/infographics', infographicRoutes);
router.use('/api/offers', offerRoutes);
router.use('/api/about', aboutRoutes);

// ============================================================
// ✅ Routes الإدارية
// ============================================================

router.use('/api/admin/services', adminServicesRoutes);
router.use('/api/admin/sections', adminSectionsRoutes);
router.use('/api/admin/settings', adminSettingsRoutes);
router.use('/api/videos-library', videoLibraryRoutes);

// ============================================================
// ✅ ❌ مسارات تم إزالتها (مدمجة في explanations.routes.js)
// ============================================================

// ❌ router.use('/api/universities', universityRoutes);
// ❌ router.use('/api/colleges', collegeRoutes);
// ❌ router.use('/api/specialties', specialtyRoutes);
// ❌ router.use('/api/videos', videoRoutes);

// ============================================================
// ✅ سجل المسارات عند بدء التشغيل
// ============================================================

console.log('✅ Routes loaded:');
console.log('  - /health');
console.log('  - /api/health');
console.log('  - /api/auth/*');
console.log('  - /api/requests/*');
console.log('  - /api/services/*');
console.log('  - /api/sections/*');
console.log('  - /api/files/*');
console.log('  - /api/messages/*');
console.log('  - /api/payments/*');
console.log('  - /api/content/*');
console.log('  - /api/subscriptions/*');
console.log('  - /api/forms/*');
console.log('  - /api/admin/*');
console.log('  - /api/explanations/* (includes: universities, colleges, specialties, materials, videos)');
console.log('  - /api/identity/*');
console.log('  - /api/workspace/*');
console.log('  - /api/calls/*');
console.log('  - /api/notifications/*');
console.log('  - /api/reviews/*');
console.log('  - /api/reports/*');
console.log('  - /api/support/*');
console.log('  - /api/legal/*');
console.log('  - /api/service-details/*');
console.log('  - /api/service-forms/*');
console.log('  - /api/dashboard/*');
console.log('  - /api/tasks/*');
console.log('  - /api/library/*');
console.log('  - /api/infographics/*');
console.log('  - /api/offers/*');
console.log('  - /api/about/*');
console.log('  - /api/admin/services/*');
console.log('  - /api/admin/sections/*');
console.log('  - /api/admin/settings/*');
console.log('  - /api/videos-library/*');
console.log('  - /api/live-streams/*');
console.log('  - /api/appearance/hero/*');

export default router;