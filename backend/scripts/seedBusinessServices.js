// backend/scripts/seedBusinessServices.js
// ============================================================
// 🚀 Script لإدراج / تحديث خدمات الأعمال والاقتصاد تلقائياً (3 أقسام)
// ============================================================
// الاستخدام:
//   cd backend
//   node scripts/seedBusinessServices.js
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from '../src/models/Account.model.js';
import { Section } from '../src/models/Section.model.js';
import { Service } from '../src/models/Service.model.js';

dotenv.config();

const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';

// ============================================================
// 📚 البيانات: 3 أقسام رئيسية لخدمات الأعمال
// ============================================================
const SECTIONS_DATA = [
  {
    name: 'Business Administration & Strategy',
    nameAr: 'إدارة الأعمال والاستراتيجية',
    slug: 'business-administration',
    description: 'Business administration, strategy and project services',
    descriptionAr:
      'خدمات إدارة الأعمال والاستراتيجية وتحليل الحالات ودراسات الجدوى',
    icon: 'fa-briefcase',
    order: 1,
  },
  {
    name: 'Finance, Accounting & Economics',
    nameAr: 'المالية والمحاسبة والاقتصاد',
    slug: 'finance-economics',
    description: 'Finance, accounting and economics services',
    descriptionAr:
      'خدمات المالية والمحاسبة والاقتصاد والتحليل الكمي لبيانات الأعمال',
    icon: 'fa-calculator',
    order: 2,
  },
  {
    name: 'Marketing, Operations & Applied Reports',
    nameAr: 'التسويق والعمليات والتقارير التطبيقية',
    slug: 'marketing-operations-reports',
    description: 'Marketing, operations, supply chain and applied reports',
    descriptionAr:
      'خدمات التسويق والعمليات والإنتاج وسلاسل الإمداد والتقارير التطبيقية',
    icon: 'fa-bullhorn',
    order: 3,
  },
];

// ============================================================
// 📋 البيانات: 29 خدمة موزعة على 3 أقسام
// ============================================================
const SERVICES_DATA = [
  // ============================================================
  // 💼 القسم 1: إدارة الأعمال والاستراتيجية (10 خدمات)
  // ============================================================
  {
    section: 'business-administration',
    name: 'Management Case Study Analysis',
    nameAr: 'تحليل الحالات الإدارية',
    description: 'Academic guidance for analyzing management case studies',
    descriptionAr:
      'توجيه أكاديمي في تحليل الحالات الإدارية وتنظيم المعلومات وربطها بالنماذج الإدارية',
    icon: 'fa-file-alt',
    slug: 'management-case-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 1,
  },
  {
    section: 'business-administration',
    name: 'Applied Management Reports Review',
    nameAr: 'مراجعة التقارير الإدارية التطبيقية',
    description: 'Academic review of applied management reports',
    descriptionAr:
      'مراجعة أكاديمية للتقارير الإدارية مع تحسين تنظيم المحتوى وجودة التحليل',
    icon: 'fa-file-lines',
    slug: 'management-reports-review',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 2,
  },
  {
    section: 'business-administration',
    name: 'Management Models Application',
    nameAr: 'تطبيق النماذج الإدارية',
    description: 'Guidance for applying management models',
    descriptionAr:
      'توجيه في تطبيق النماذج الإدارية على الحالات والمشاريع التطبيقية',
    icon: 'fa-sitemap',
    slug: 'management-models-application',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 3,
  },
  {
    section: 'business-administration',
    name: 'Project Planning Guidance',
    nameAr: 'توجيه في إعداد خطط المشاريع',
    description: 'Academic guidance for project planning',
    descriptionAr:
      'توجيه أكاديمي في بناء خطط المشاريع وتنظيم أهدافها ومراحل تنفيذها',
    icon: 'fa-list-check',
    slug: 'project-planning-guidance',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 4,
  },
  {
    section: 'business-administration',
    name: 'Feasibility Studies Review & Evaluation',
    nameAr: 'مراجعة وتقييم دراسات الجدوى',
    description: 'Academic review of feasibility studies',
    descriptionAr:
      'مراجعة أكاديمية لدراسات الجدوى مع تحليل الجوانب التشغيلية والمالية',
    icon: 'fa-scale-balanced',
    slug: 'feasibility-studies-review',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 5,
  },
  {
    section: 'business-administration',
    name: 'Business Model Analysis',
    nameAr: 'تحليل نموذج العمل التجاري',
    description: 'Business Model Canvas analysis',
    descriptionAr:
      'تحليل أكاديمي لنموذج العمل باستخدام Business Model Canvas',
    icon: 'fa-cube',
    slug: 'business-model-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 6,
  },
  {
    section: 'business-administration',
    name: 'Academic Analysis of Project Ideas',
    nameAr: 'التحليل الأكاديمي لأفكار المشاريع',
    description: 'SWOT analysis for project ideas',
    descriptionAr: 'تحليل أكاديمي لأفكار المشاريع مع SWOT',
    icon: 'fa-lightbulb',
    slug: 'project-ideas-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 7,
  },
  {
    section: 'business-administration',
    name: 'Applied Studies Guidance',
    nameAr: 'توجيه في الدراسات التطبيقية',
    description: 'Guidance for applied studies',
    descriptionAr: 'توجيه أكاديمي في إعداد الدراسات التطبيقية',
    icon: 'fa-pen-fancy',
    slug: 'applied-studies-guidance',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 8,
  },
  {
    section: 'business-administration',
    name: 'Project Presentation Development',
    nameAr: 'تطوير العروض التقديمية للمشاريع',
    description: 'Development of project presentations',
    descriptionAr: 'توجيه في تطوير عروض المشاريع والدراسات',
    icon: 'fa-presentation-screen',
    slug: 'project-presentation-development',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 9,
  },
  {
    section: 'business-administration',
    name: 'Final Outputs Quality Improvement',
    nameAr: 'تحسين جودة المخرجات النهائية',
    description: 'Quality improvement of final outputs',
    descriptionAr: 'تحسين أكاديمي لجودة المخرجات النهائية',
    icon: 'fa-arrow-up',
    slug: 'final-outputs-quality',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 10,
  },

  // ============================================================
  // 💰 القسم 2: المالية والمحاسبة والاقتصاد (9 خدمات)
  // ============================================================
  {
    section: 'finance-economics',
    name: 'Financial Modeling Development',
    nameAr: 'تطوير النماذج المالية',
    description: 'Development of academic financial models',
    descriptionAr:
      'تطوير نماذج مالية أكاديمية لتنظيم البيانات وعرض التوقعات',
    icon: 'fa-calculator',
    slug: 'financial-modeling-development',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 1,
  },
  {
    section: 'finance-economics',
    name: 'Financial Statement Analysis',
    nameAr: 'تحليل القوائم والبيانات المالية',
    description: 'Academic analysis of financial statements',
    descriptionAr: 'تحليل أكاديمي للقوائم المالية واستخلاص المؤشرات',
    icon: 'fa-chart-bar',
    slug: 'financial-statement-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 2,
  },
  {
    section: 'finance-economics',
    name: 'Financial Risk Analysis',
    nameAr: 'تحليل المخاطر المالية',
    description: 'Academic analysis of financial risks',
    descriptionAr: 'تحليل أكاديمي للمخاطر المالية المرتبطة بالمشاريع',
    icon: 'fa-shield',
    slug: 'financial-risk-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 3,
  },
  {
    section: 'finance-economics',
    name: 'Financial & Analytical Reports Review',
    nameAr: 'مراجعة التقارير المالية والتحليلية',
    description: 'Review of financial and analytical reports',
    descriptionAr: 'مراجعة أكاديمية للتقارير المالية والتحليلية',
    icon: 'fa-file-invoice',
    slug: 'financial-reports-review',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 4,
  },
  {
    section: 'finance-economics',
    name: 'Accounting Case Analysis',
    nameAr: 'تحليل الحالات المحاسبية',
    description: 'Academic analysis of accounting cases',
    descriptionAr: 'تحليل أكاديمي للحالات المحاسبية التطبيقية',
    icon: 'fa-book',
    slug: 'accounting-case-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 5,
  },
  {
    section: 'finance-economics',
    name: 'Economic Data Analysis',
    nameAr: 'تحليل البيانات والمؤشرات الاقتصادية',
    description: 'Analysis of economic data and indicators',
    descriptionAr: 'تحليل أكاديمي للبيانات والمؤشرات الاقتصادية',
    icon: 'fa-chart-line',
    slug: 'economic-data-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 6,
  },
  {
    section: 'finance-economics',
    name: 'Economic Studies Review',
    nameAr: 'مراجعة الدراسات الاقتصادية',
    description: 'Review of economic studies',
    descriptionAr: 'مراجعة أكاديمية للدراسات الاقتصادية',
    icon: 'fa-file-signature',
    slug: 'economic-studies-review',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 7,
  },
  {
    section: 'finance-economics',
    name: 'Business Data Statistical Analysis',
    nameAr: 'التحليل الإحصائي لبيانات الأعمال',
    description: 'Statistical analysis for business data',
    descriptionAr: 'تحليل إحصائي أكاديمي لبيانات الأعمال',
    icon: 'fa-square-root-variable',
    slug: 'business-data-statistical-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 8,
  },
  {
    section: 'finance-economics',
    name: 'Quantitative Models Guidance',
    nameAr: 'توجيه في بناء النماذج الكمية',
    description: 'Guidance for quantitative modeling',
    descriptionAr: 'توجيه أكاديمي في بناء النماذج الكمية لتحليل القرارات',
    icon: 'fa-gear',
    slug: 'quantitative-models-guidance',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 9,
  },

  // ============================================================
  // 📈 القسم 3: التسويق والعمليات والتقارير التطبيقية (10 خدمات)
  // ============================================================
  {
    section: 'marketing-operations-reports',
    name: 'Marketing Studies Guidance',
    nameAr: 'توجيه في الدراسات التسويقية',
    description: 'Academic guidance for marketing studies',
    descriptionAr: 'توجيه أكاديمي في إعداد الدراسات التسويقية',
    icon: 'fa-chart-pie',
    slug: 'marketing-studies-guidance',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 1,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Marketing Plans Development',
    nameAr: 'تطوير الخطط التسويقية',
    description: 'Development of marketing plans',
    descriptionAr: 'توجيه أكاديمي في إعداد الخطط التسويقية',
    icon: 'fa-bullhorn',
    slug: 'marketing-plans-development',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 2,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Operations Process Mapping Guidance',
    nameAr: 'توجيه في إعداد خرائط العمليات',
    description: 'Guidance for process mapping',
    descriptionAr: 'توجيه أكاديمي في إعداد خرائط العمليات التشغيلية',
    icon: 'fa-map',
    slug: 'operations-process-mapping',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 3,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Operations Analysis',
    nameAr: 'تحليل العمليات التشغيلية',
    description: 'Analysis of operations processes',
    descriptionAr: 'تحليل أكاديمي للعمليات التشغيلية وتطوير تنظيمها',
    icon: 'fa-gears',
    slug: 'operations-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 4,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Operations & Production Planning Models',
    nameAr: 'نماذج تخطيط العمليات والإنتاج',
    description: 'Operations and production planning models',
    descriptionAr: 'تطوير نماذج أكاديمية لتخطيط العمليات والإنتاج',
    icon: 'fa-industry',
    slug: 'production-planning-models',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 5,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Inventory Management Models Analysis',
    nameAr: 'تحليل نماذج إدارة المخزون',
    description: 'Analysis of inventory management models',
    descriptionAr: 'تحليل أكاديمي لنماذج إدارة المخزون',
    icon: 'fa-warehouse',
    slug: 'inventory-management-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 6,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Supply Chain Analysis',
    nameAr: 'تحليل سلاسل الإمداد',
    description: 'Supply chain analysis and mapping',
    descriptionAr: 'تحليل أكاديمي لسلاسل الإمداد وتنظيم مكوناتها',
    icon: 'fa-route',
    slug: 'supply-chain-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 7,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Applied Reports Review',
    nameAr: 'مراجعة التقارير التطبيقية',
    description: 'Review of applied reports',
    descriptionAr: 'مراجعة أكاديمية للتقارير التطبيقية',
    icon: 'fa-file-pen',
    slug: 'applied-reports-review',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 8,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Analytical Templates Development',
    nameAr: 'تطوير النماذج والجداول التحليلية',
    description: 'Development of analytical templates',
    descriptionAr: 'تصميم نماذج وجداول تحليلية أكاديمية',
    icon: 'fa-table',
    slug: 'analytical-templates-development',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 9,
  },
  {
    section: 'marketing-operations-reports',
    name: 'Applied Work Review & Evaluation',
    nameAr: 'مراجعة وتقييم الأعمال التطبيقية',
    description: 'Review and evaluation of applied work',
    descriptionAr: 'مراجعة أكاديمية شاملة للأعمال التطبيقية',
    icon: 'fa-clipboard-check',
    slug: 'applied-work-review',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 10,
  },
];

// ============================================================
// ✅ الدالة الرئيسية
// ============================================================
const seedBusinessServices = async () => {
  try {
    console.log('🚀 Starting business services seed...\n');

    // 1. الاتصال
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/irteqa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // 2. جلب حساب المدير
    const admin = await Account.findOne({
      portalId: PORTAL_ID,
      role: { $in: ['portal_admin', 'super_admin'] },
      isActive: true,
    }).select('_id profile.fullName');

    if (!admin) {
      console.error('❌ No admin found for portal:', PORTAL_ID);
      process.exit(1);
    }

    console.log(`✅ Using admin: ${admin.profile?.fullName || admin._id}\n`);

    // ============================================================
    // 3. إنشاء / تحديث الأقسام
    // ============================================================
    console.log('📂 Creating/Updating business sections...');
    const sectionMap = new Map();

    for (const sectionData of SECTIONS_DATA) {
      let section = await Section.findOne({
        portalId: PORTAL_ID,
        slug: sectionData.slug,
        isDeleted: { $ne: true },
      });

      if (section) {
        // 🔄 تحديث بيانات القسم الموجود
        section.name = sectionData.name;
        section.nameAr = sectionData.nameAr;
        section.description = sectionData.description;
        section.descriptionAr = sectionData.descriptionAr;
        section.icon = sectionData.icon;
        section.order = sectionData.order;
        section.isPublished = true;

        await section.save();
        console.log(`  🔄 Updated section: ${sectionData.nameAr}`);
      } else {
        // ✅ إنشاء قسم جديد
        section = new Section({
          portalId: PORTAL_ID,
          ...sectionData,
          isPublished: true,
          createdBy: admin._id,
        });
        await section.save();
        console.log(`  ✅ Created section: ${sectionData.nameAr}`);
      }

      sectionMap.set(sectionData.slug, section._id);
    }

    console.log(`\n✅ ${sectionMap.size} sections ready\n`);

    // ============================================================
    // 4. إنشاء / تحديث الخدمات
    // ============================================================
    console.log('📋 Creating/Updating business services...');
    let created = 0;
    let updated = 0;

    for (const serviceData of SERVICES_DATA) {
      const { section: sectionSlug, ...serviceFields } = serviceData;
      const sectionId = sectionMap.get(sectionSlug);

      if (!sectionId) {
        console.warn(`  ⚠️  Section not found: ${sectionSlug}`);
        continue;
      }

      const existing = await Service.findOne({
        portalId: PORTAL_ID,
        slug: serviceFields.slug,
        isDeleted: { $ne: true },
      });

      if (existing) {
        // 🔄 تحديث الخدمة الموجودة (نحافظ على _id والبيانات المرتبطة)
        existing.sectionId = sectionId;
        existing.name = serviceFields.name;
        existing.nameAr = serviceFields.nameAr;
        existing.description = serviceFields.description;
        existing.descriptionAr = serviceFields.descriptionAr;
        existing.icon = serviceFields.icon;
        existing.order = serviceFields.order;
        existing.isPublished = true;

        await existing.save();
        updated++;

        if (updated % 10 === 0) {
          console.log(`  🔄 Updated ${updated} services...`);
        }
      } else {
        // ✅ إنشاء خدمة جديدة
        const service = new Service({
          portalId: PORTAL_ID,
          sectionId,
          ...serviceFields,
          isPublished: true,
          isFeatured: false,
          createdBy: admin._id,
        });

        await service.save();
        created++;

        if (created % 10 === 0) {
          console.log(`  ✅ Created ${created} services...`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  📁 Sections ready: ${sectionMap.size}`);
    console.log(`  ✅ Created: ${created} services`);
    console.log(`  🔄 Updated: ${updated} services`);
    console.log(`\n🎉 Business services seed completed successfully!`);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// ============================================================
// 🚀 التنفيذ
// ============================================================
seedBusinessServices();