// backend/scripts/seed-legal-pages.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LegalPage } from '../src/models/LegalPage.model.js';
import { Portal } from '../src/models/Portal.model.js';

dotenv.config();

const legalPagesData = [
  {
    type: 'terms',
    title: 'شروط الاستخدام',
    titleAr: 'شروط الاستخدام',
    content: 'هذه هي شروط استخدام منصة ارتقاء...',
    contentAr: 'هذه هي شروط استخدام منصة ارتقاء...',
    excerpt: 'شروط وأحكام استخدام منصة ارتقاء',
    excerptAr: 'شروط وأحكام استخدام منصة ارتقاء',
  },
  {
    type: 'privacy',
    title: 'سياسة الخصوصية',
    titleAr: 'سياسة الخصوصية',
    content: 'نحن في منصة ارتقاء نولي خصوصية بياناتك أهمية كبيرة...',
    contentAr: 'نحن في منصة ارتقاء نولي خصوصية بياناتك أهمية كبيرة...',
    excerpt: 'سياسة خصوصية منصة ارتقاء',
    excerptAr: 'سياسة خصوصية منصة ارتقاء',
  },
  {
    type: 'cookie',
    title: 'سياسة ملفات تعريف الارتباط',
    titleAr: 'سياسة ملفات تعريف الارتباط',
    content: 'تستخدم منصة ارتقاء ملفات تعريف الارتباط لتحسين تجربتك...',
    contentAr: 'تستخدم منصة ارتقاء ملفات تعريف الارتباط لتحسين تجربتك...',
    excerpt: 'سياسة ملفات تعريف الارتباط',
    excerptAr: 'سياسة ملفات تعريف الارتباط',
  },
  {
    type: 'refund',
    title: 'سياسة الاسترداد',
    titleAr: 'سياسة الاسترداد',
    content: 'سياسة الاسترداد في منصة ارتقاء...',
    contentAr: 'سياسة الاسترداد في منصة ارتقاء...',
    excerpt: 'سياسة استرداد المدفوعات',
    excerptAr: 'سياسة استرداد المدفوعات',
  },
  {
    type: 'modification',
    title: 'سياسة التعديلات',
    titleAr: 'سياسة التعديلات',
    content: 'سياسة التعديلات في منصة ارتقاء...',
    contentAr: 'سياسة التعديلات في منصة ارتقاء...',
    excerpt: 'سياسة تعديل الطلبات',
    excerptAr: 'سياسة تعديل الطلبات',
  },
  {
    type: 'complaints',
    title: 'سياسة الشكاوى',
    titleAr: 'سياسة الشكاوى',
    content: 'سياسة الشكاوى في منصة ارتقاء...',
    contentAr: 'سياسة الشكاوى في منصة ارتقاء...',
    excerpt: 'سياسة تقديم الشكاوى',
    excerptAr: 'سياسة تقديم الشكاوى',
  },
  {
    type: 'intellectual_property',
    title: 'سياسة الملكية الفكرية',
    titleAr: 'سياسة الملكية الفكرية',
    content: 'سياسة الملكية الفكرية في منصة ارتقاء...',
    contentAr: 'سياسة الملكية الفكرية في منصة ارتقاء...',
    excerpt: 'سياسة الملكية الفكرية',
    excerptAr: 'سياسة الملكية الفكرية',
  },
  {
    type: 'academic_charter',
    title: 'ميثاق العمل الأكاديمي',
    titleAr: 'ميثاق العمل الأكاديمي',
    content: 'ميثاق العمل الأكاديمي في منصة ارتقاء...',
    contentAr: 'ميثاق العمل الأكاديمي في منصة ارتقاء...',
    excerpt: 'ميثاق العمل الأكاديمي',
    excerptAr: 'ميثاق العمل الأكاديمي',
  },
  {
    type: 'quality_assurance',
    title: 'اتفاقية ضمان الجودة',
    titleAr: 'اتفاقية ضمان الجودة',
    content: 'اتفاقية ضمان الجودة في منصة ارتقاء...',
    contentAr: 'اتفاقية ضمان الجودة في منصة ارتقاء...',
    excerpt: 'اتفاقية ضمان الجودة',
    excerptAr: 'اتفاقية ضمان الجودة',
  },
  {
    type: 'service_policies',
    title: 'سياسات الخدمة',
    titleAr: 'سياسات الخدمة',
    content: 'سياسات الخدمة في منصة ارتقاء...',
    contentAr: 'سياسات الخدمة في منصة ارتقاء...',
    excerpt: 'سياسات الخدمة',
    excerptAr: 'سياسات الخدمة',
  },
];

async function seedLegalPages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // الحصول على جميع البوابات
    const portals = await Portal.find({ isActive: true });
    
    for (const portal of portals) {
      console.log(`📝 Seeding legal pages for portal: ${portal.name}`);

      for (const pageData of legalPagesData) {
        const existing = await LegalPage.findOne({
          portalId: portal._id,
          type: pageData.type,
        });

        if (!existing) {
          await LegalPage.create({
            ...pageData,
            portalId: portal._id,
            effectiveDate: new Date(),
            isPublished: true,
          });
          console.log(`  ✅ Created: ${pageData.type}`);
        } else {
          console.log(`  ⏭️ Skipped: ${pageData.type} (already exists)`);
        }
      }
    }

    console.log('✅ Legal pages seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedLegalPages();