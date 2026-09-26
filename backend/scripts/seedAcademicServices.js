// backend/scripts/seedAcademicServices.js
// ============================================================
// 🚀 Script لإدراج / تحديث الخدمات الأكاديمية تلقائياً (3 أقسام)
// ============================================================
// الاستخدام:
//   cd backend
//   node scripts/seedAcademicServices.js
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from '../src/models/Account.model.js';
import { Section } from '../src/models/Section.model.js';
import { Service } from '../src/models/Service.model.js';

dotenv.config();

// ============================================================
// ✅ إعدادات
// ============================================================
const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@irteqa.com';

// ============================================================
// 📚 البيانات: 3 أقسام رئيسية فقط
// ============================================================
const SECTIONS_DATA = [
  {
    name: 'Research & Academic Services',
    nameAr: 'البحث والخدمات الأكاديمية',
    slug: 'research-academic',
    description: 'Research, consulting and academic output services',
    descriptionAr:
      'خدمات البحث العلمي والاستشارات والإخراج الأكاديمي (سيرة ذاتية، عروض، بوسترات)',
    icon: 'fa-microscope',
    order: 1,
  },
  {
    name: 'Statistical Analysis & Data',
    nameAr: 'التحليل الإحصائي والبيانات',
    slug: 'statistics-data',
    description: 'Statistical analysis services using all major software',
    descriptionAr:
      'خدمات التحليل الإحصائي بمختلف البرامج (SPSS, AMOS, Smart PLS, SAS, STATA, ...)',
    icon: 'fa-chart-line',
    order: 2,
  },
  {
    name: 'Language, Editing & Publication',
    nameAr: 'اللغة والتحرير والنشر',
    slug: 'language-publication',
    description:
      'Translation, editing, proofreading, references and publication services',
    descriptionAr:
      'خدمات الترجمة والتدقيق اللغوي والمراجع والدعم الأكاديمي للنشر العلمي',
    icon: 'fa-language',
    order: 3,
  },
];

// ============================================================
// 📋 البيانات: الخدمات (36 خدمة) موزعة على 3 أقسام
// ============================================================
const SERVICES_DATA = [
  // ========================================================
  // 🔬 القسم 1: البحث والخدمات الأكاديمية (15 خدمة)
  // ========================================================
  {
    section: 'research-academic',
    name: 'Academic Consulting',
    nameAr: 'الاستشارات الأكاديمية',
    description: 'Specialized academic consulting for research stages',
    descriptionAr: 'استشارات أكاديمية متخصصة لمساعدتك في مراحل بحثك العلمي',
    icon: 'fa-handshake',
    slug: 'academic-consulting',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 1,
  },
  {
    section: 'research-academic',
    name: 'Thesis Titles Suggestion',
    nameAr: 'اقتراح عناوين رسائل علمية',
    description: 'Innovative research titles in your academic field',
    descriptionAr: 'عناوين بحثية مبتكرة وأصيلة في تخصصك الأكاديمي',
    icon: 'fa-lightbulb',
    slug: 'thesis-titles-suggestion',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 2,
  },
  {
    section: 'research-academic',
    name: 'Research Proposal Preparation',
    nameAr: 'إعداد المقترح البحثي',
    description: 'Academic guidance for research proposals',
    descriptionAr: 'توجيه أكاديمي في إعداد المقترحات البحثية',
    icon: 'fa-file-alt',
    slug: 'research-proposal-preparation',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 3,
  },
  {
    section: 'research-academic',
    name: 'Previous Studies Collection & Analysis',
    nameAr: 'جمع وتحليل الدراسات السابقة',
    description: 'Collection and analysis of previous studies',
    descriptionAr: 'جمع وتحليل الدراسات العربية والعالمية في تخصصك',
    icon: 'fa-search-plus',
    slug: 'previous-studies-collection',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 4,
  },
  {
    section: 'research-academic',
    name: 'Scientific Material Collection & Documentation',
    nameAr: 'جمع وتوثيق المادة العلمية',
    description: 'Collection and documentation of scientific material',
    descriptionAr: 'جمع المادة العلمية من مصادر موثوقة وتوثيقها احترافياً',
    icon: 'fa-archive',
    slug: 'scientific-material-collection',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 5,
  },
  {
    section: 'research-academic',
    name: 'Academic Critique',
    nameAr: 'النقد الأكاديمي',
    description: 'Constructive academic critique from experts',
    descriptionAr: 'نقد علمي بناء من خبراء متخصصين في مجال البحث',
    icon: 'fa-comment-dots',
    slug: 'academic-critique',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 6,
  },
  {
    section: 'research-academic',
    name: 'Thesis Formatting',
    nameAr: 'تنسيق الرسائل العلمية',
    description: 'Professional formatting of academic theses',
    descriptionAr: 'تنسيق الرسائل العلمية وفق دليل الجامعة بدقة احترافية',
    icon: 'fa-file',
    slug: 'thesis-formatting',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 7,
  },
  {
    section: 'research-academic',
    name: 'Results Discussion',
    nameAr: 'مناقشة النتائج',
    description: 'Scientific interpretation and linking to literature',
    descriptionAr: 'تفسير علمي دقيق للنتائج وربطها بالأدبيات السابقة',
    icon: 'fa-comments',
    slug: 'results-discussion',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 8,
  },
  {
    section: 'research-academic',
    name: 'Conceptual Framework Development',
    nameAr: 'بناء التصور المقترح',
    description: 'Building conceptual and research frameworks',
    descriptionAr: 'توجيه في بناء تصور أو نموذج بحثي مبتكر',
    icon: 'fa-project-diagram',
    slug: 'conceptual-framework',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 9,
  },
  {
    section: 'research-academic',
    name: 'Science Mapping Analysis',
    nameAr: 'تحليل الخرائط العلمية',
    description: 'Science mapping and network analysis',
    descriptionAr: 'تحليل ورسم خرائط علمية باستخدام أحدث البرامج',
    icon: 'fa-globe',
    slug: 'science-mapping-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 10,
  },
  {
    section: 'research-academic',
    name: 'Quick Consulting Sessions',
    nameAr: 'جلسات استشارية سريعة',
    description: 'Fast consulting sessions with experts',
    descriptionAr: 'جلسات استشارية سريعة مع خبراء لحل مشكلاتك البحثية',
    icon: 'fa-clock',
    slug: 'quick-consulting-sessions',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 11,
  },
  {
    section: 'research-academic',
    name: 'Research Grants Preparation',
    nameAr: 'الإعداد للتمويل البحثي والمنح',
    description: 'Guidance for research grants and funding',
    descriptionAr: 'توجيه في إعداد مقترحات للحصول على تمويل بحثي',
    icon: 'fa-money-bill-wave',
    slug: 'research-grants-preparation',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 12,
  },
  {
    section: 'research-academic',
    name: 'Academic CV Design',
    nameAr: 'تصميم السيرة الذاتية الأكاديمية',
    description: 'Professional academic CV design',
    descriptionAr: 'تصميم سيرة ذاتية احترافية للمجال الأكاديمي',
    icon: 'fa-id-card',
    slug: 'academic-cv-design',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 13,
  },
  {
    section: 'research-academic',
    name: 'Academic Presentation Design',
    nameAr: 'تصميم العروض التقديمية الأكاديمية',
    description: 'Professional academic presentation design',
    descriptionAr: 'تصميم عروض تقديمية أكاديمية احترافية',
    icon: 'fa-desktop',
    slug: 'academic-presentation-design',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 14,
  },
  {
    section: 'research-academic',
    name: 'Research Poster Design',
    nameAr: 'تصميم البوسترات البحثية',
    description: 'Professional research poster design',
    descriptionAr: 'تصميم بوسترات بحثية احترافية للمؤتمرات',
    icon: 'fa-paint-brush',
    slug: 'research-poster-design',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 15,
  },

  // ========================================================
  // 📊 القسم 2: التحليل الإحصائي والبيانات (9 خدمات)
  // ========================================================
  {
    section: 'statistics-data',
    name: 'SPSS Statistical Analysis',
    nameAr: 'التحليل الإحصائي SPSS',
    description: 'Professional SPSS statistical analysis',
    descriptionAr: 'تحليل إحصائي احترافي باستخدام SPSS مع مناقشة النتائج',
    icon: 'fa-chart-bar',
    slug: 'spss-statistical-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 1,
  },
  {
    section: 'statistics-data',
    name: 'Meta-analysis',
    nameAr: 'التحليل التلوي Meta-analysis',
    description: 'Advanced meta-analysis with statistical software',
    descriptionAr: 'تحليل تلوي متقدم باستخدام أحدث البرامج الإحصائية',
    icon: 'fa-chart-line',
    slug: 'meta-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 2,
  },
  {
    section: 'statistics-data',
    name: 'Medical Research Statistics',
    nameAr: 'التحليل الإحصائي للبحوث الطبية',
    description: 'Specialized medical and clinical research statistics',
    descriptionAr: 'تحليل إحصائي متخصص للبحوث الطبية والسريرية',
    icon: 'fa-heart',
    slug: 'medical-research-statistics',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 3,
  },
  {
    section: 'statistics-data',
    name: 'AMOS Statistical Analysis',
    nameAr: 'التحليل الإحصائي AMOS',
    description: 'Path analysis and SEM using AMOS',
    descriptionAr: 'تحليل المسار ونمذجة المعادلات الهيكلية باستخدام AMOS',
    icon: 'fa-project-diagram',
    slug: 'amos-statistical-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 4,
  },
  {
    section: 'statistics-data',
    name: 'Qualitative Statistical Analysis',
    nameAr: 'التحليل الإحصائي النوعي',
    description: 'Qualitative analysis using NVivo and other tools',
    descriptionAr: 'تحليل نوعي باستخدام NVivo وأدوات متخصصة',
    icon: 'fa-comment',
    slug: 'qualitative-statistical-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 5,
  },
  {
    section: 'statistics-data',
    name: 'E-Views Statistical Analysis',
    nameAr: 'التحليل الإحصائي E-Views',
    description: 'Econometric analysis using E-Views',
    descriptionAr: 'تحليل اقتصادي قياسي باستخدام E-Views',
    icon: 'fa-chart-line',
    slug: 'eviews-statistical-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 6,
  },
  {
    section: 'statistics-data',
    name: 'SAS Statistical Analysis',
    nameAr: 'التحليل الإحصائي SAS',
    description: 'Advanced statistical analysis using SAS',
    descriptionAr: 'تحليل إحصائي متقدم باستخدام SAS',
    icon: 'fa-database',
    slug: 'sas-statistical-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 7,
  },
  {
    section: 'statistics-data',
    name: 'Smart PLS Statistical Analysis',
    nameAr: 'التحليل الإحصائي Smart PLS',
    description: 'PLS-SEM analysis using Smart PLS',
    descriptionAr: 'تحليل PLS-SEM باستخدام Smart PLS',
    icon: 'fa-cubes',
    slug: 'smart-pls-statistical-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 8,
  },
  {
    section: 'statistics-data',
    name: 'STATA Statistical Analysis',
    nameAr: 'التحليل الإحصائي STATA',
    description: 'Advanced statistical analysis using STATA',
    descriptionAr: 'تحليل إحصائي متقدم باستخدام STATA',
    icon: 'fa-calculator',
    slug: 'stata-statistical-analysis',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 9,
  },

  // ========================================================
  // 🌐 القسم 3: اللغة والتحرير والنشر (12 خدمة)
  // ========================================================
  {
    section: 'language-publication',
    name: 'Academic Translation',
    nameAr: 'الترجمة الأكاديمية',
    description: 'Professional academic translation',
    descriptionAr: 'ترجمة دقيقة واحترافية بين العربية والإنجليزية',
    icon: 'fa-language',
    slug: 'academic-translation',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 1,
  },
  {
    section: 'language-publication',
    name: 'Statement of Purpose (SOP)',
    nameAr: 'خطاب الغرض من الدراسة (SOP)',
    description: 'Review and enhancement of SOP',
    descriptionAr: 'مراجعة وتحسين خطاب الغرض من الدراسة (SOP)',
    icon: 'fa-file',
    slug: 'statement-of-purpose',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 2,
  },
  {
    section: 'language-publication',
    name: 'Proofreading',
    nameAr: 'التدقيق اللغوي',
    description: 'Professional linguistic and spelling proofreading',
    descriptionAr: 'تدقيق لغوي وإملائي احترافي للنصوص الأكاديمية',
    icon: 'fa-spell-check',
    slug: 'proofreading',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 3,
  },
  {
    section: 'language-publication',
    name: 'Academic Style Enhancement',
    nameAr: 'تحسين الأسلوب الأكاديمي',
    description: 'Enhancement of academic style while preserving content',
    descriptionAr: 'تحسين الأسلوب العلمي مع الحفاظ على المحتوى الأصلي',
    icon: 'fa-pen-fancy',
    slug: 'academic-style-enhancement',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 4,
  },
  {
    section: 'language-publication',
    name: 'Comprehensive Academic Review',
    nameAr: 'المراجعة العلمية الشاملة',
    description: 'Comprehensive review of research before final evaluation',
    descriptionAr: 'مراجعة شاملة للأبحاث قبل التقييم النهائي',
    icon: 'fa-search',
    slug: 'comprehensive-academic-review',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 5,
  },
  {
    section: 'language-publication',
    name: 'Training Packages Preparation',
    nameAr: 'إعداد الحقائب التدريبية',
    description: 'Comprehensive training packages preparation',
    descriptionAr: 'إعداد حقائب تدريبية متكاملة وفق المعايير العالمية',
    icon: 'fa-briefcase',
    slug: 'training-packages-preparation',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 6,
  },
  {
    section: 'language-publication',
    name: 'Academic Support for Publication',
    nameAr: 'الدعم الأكاديمي للنشر العلمي',
    description: 'Academic support for publishing in peer-reviewed journals',
    descriptionAr: 'دعم أكاديمي لإعداد البحث للنشر في مجلات محكمة',
    icon: 'fa-newspaper',
    slug: 'academic-support-publication',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 7,
  },
  {
    section: 'language-publication',
    name: 'Journal Recommendation',
    nameAr: 'ترشيح المجلات العلمية',
    description: 'Recommendation of suitable scientific journals',
    descriptionAr: 'ترشيح مجلات علمية مناسبة لنشر أبحاثك',
    icon: 'fa-search-location',
    slug: 'journal-recommendation',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 8,
  },
  {
    section: 'language-publication',
    name: 'Academic E-book',
    nameAr: 'كتاب إلكتروني أكاديمي',
    description: 'Professional academic e-book design and publishing',
    descriptionAr: 'تصميم ونشر كتاب إلكتروني أكاديمي احترافي',
    icon: 'fa-book-open',
    slug: 'academic-ebook',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 9,
  },
  {
    section: 'language-publication',
    name: 'Scientific References Provision',
    nameAr: 'توفير المراجع العلمية',
    description: 'Provision of documented scientific references',
    descriptionAr: 'توفير مراجع علمية موثقة من مصادر معتمدة',
    icon: 'fa-book',
    slug: 'scientific-references-provision',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 10,
  },
  {
    section: 'language-publication',
    name: 'References Romanization',
    nameAr: 'رومنة المراجع العربية',
    description: 'Romanization of Arabic references',
    descriptionAr: 'تحويل المراجع العربية إلى كتابة لاتينية وفق المعايير',
    icon: 'fa-font',
    slug: 'references-romanization',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 11,
  },
  {
    section: 'language-publication',
    name: 'Books & References Summarization',
    nameAr: 'تلخيص الكتب والمراجع العلمية',
    description: 'Summarization of scientific books and references',
    descriptionAr: 'تلخيص الكتب والمراجع العلمية بالعربية والإنجليزية',
    icon: 'fa-file-alt',
    slug: 'books-references-summarization',
    pricing: { type: 'custom', defaultPrice: 0 },
    order: 12,
  },
];

// ============================================================
// ✅ الدالة الرئيسية
// ============================================================
const seedAcademicServices = async () => {
  try {
    console.log('🚀 Starting seed process...\n');

    // 1. الاتصال بقاعدة البيانات
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
      console.log('💡 Tip: Set SEED_ADMIN_EMAIL env variable');
      process.exit(1);
    }

    console.log(`✅ Using admin: ${admin.profile?.fullName || admin._id}\n`);

    // 3. إنشاء / تحديث الأقسام
    console.log('📂 Creating/Updating sections...');
    const sectionMap = new Map();

    for (const sectionData of SECTIONS_DATA) {
      let section = await Section.findOne({
        portalId: PORTAL_ID,
        slug: sectionData.slug,
        isDeleted: { $ne: true },
      });

      if (section) {
        // تحديث بيانات القسم الموجود
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
        // إنشاء قسم جديد
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

    // 4. إنشاء / تحديث الخدمات
    console.log('📋 Creating/Updating services...');
    let created = 0;
    let updated = 0;

    for (const serviceData of SERVICES_DATA) {
      const { section: sectionSlug, ...serviceFields } = serviceData;
      const sectionId = sectionMap.get(sectionSlug);

      if (!sectionId) {
        console.warn(`  ⚠️  Section not found: ${sectionSlug}`);
        continue;
      }

      // فحص وجود الخدمة
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
    console.log(`\n🎉 Seed completed successfully!`);
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
seedAcademicServices();