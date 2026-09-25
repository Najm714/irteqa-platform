// backend/scripts/addBusinessServiceImages.js
// ============================================================
// 🎨 إضافة صور لكل قسم وخدمة من خدمات الأعمال
// ============================================================
// الاستخدام:
//   cd backend
//   node scripts/addBusinessServiceImages.js
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Section } from '../src/models/Section.model.js';
import { Service } from '../src/models/Service.model.js';

dotenv.config();

const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';

// ============================================================
// 🖼️ Helper: توليد URL لصورة من Unsplash
// ============================================================
const unsplash = (keyword, width = 600, height = 400) =>
  `https://source.unsplash.com/featured/${width}x${height}/?${keyword}`;

// ============================================================
// 📂 صور الأقسام الرئيسية
// ============================================================
const SECTION_IMAGES = {
  'business-management':
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&q=80',
  'finance-accounting':
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&q=80',
  marketing:
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=600&fit=crop&q=80',
  economics:
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&q=80',
  operations:
    'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=600&fit=crop&q=80',
  'business-reports':
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop&q=80',
};

// ============================================================
// 📋 صور الخدمات (حسب slug)
// ============================================================
const SERVICE_IMAGES = {
  // 💼 إدارة الأعمال
  'management-case-analysis':
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  'management-reports-review':
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&q=80',
  'management-models-application':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80',
  'project-planning-guidance':
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop&q=80',
  'feasibility-studies-review':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',

  // 💰 المالية والمحاسبة
  'financial-modeling-development':
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop&q=80',
  'financial-statement-analysis':
    'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=600&h=400&fit=crop&q=80',
  'financial-risk-analysis':
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop&q=80',
  'financial-reports-review':
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&q=80',
  'accounting-case-analysis':
    'https://images.unsplash.com/photo-1568234928966-359c35dd8327?w=600&h=400&fit=crop&q=80',

  // 📈 التسويق
  'marketing-studies-guidance':
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&h=400&fit=crop&q=80',
  'marketing-plans-development':
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=80',
  'business-model-analysis':
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop&q=80',
  'project-ideas-analysis':
    'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=600&h=400&fit=crop&q=80',

  // 🌍 الاقتصاد
  'economic-data-analysis':
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop&q=80',
  'economic-studies-review':
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  'business-data-statistical-analysis':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',
  'quantitative-models-guidance':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80',

  // ⚙️ العمليات والإنتاج
  'operations-process-mapping':
    'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&h=400&fit=crop&q=80',
  'operations-analysis':
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop&q=80',
  'production-planning-models':
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop&q=80',
  'inventory-management-analysis':
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=400&fit=crop&q=80',
  'supply-chain-analysis':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop&q=80',

  // 📊 التقارير
  'applied-studies-guidance':
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  'applied-reports-review':
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop&q=80',
  'project-presentation-development':
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&q=80',
  'analytical-templates-development':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',
  'applied-work-review':
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  'final-outputs-quality':
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=80',
};

// ============================================================
// ✅ الدالة الرئيسية
// ============================================================
const addBusinessServiceImages = async () => {
  try {
    console.log('🎨 Starting image addition for business services...\n');

    // الاتصال
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/irteqa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // ============================================================
    // 1. تحديث الأقسام
    // ============================================================
    console.log('📂 Updating business sections with images...');
    let sectionsUpdated = 0;

    for (const [slug, imageUrl] of Object.entries(SECTION_IMAGES)) {
      const result = await Section.updateOne(
        { portalId: PORTAL_ID, slug, isDeleted: { $ne: true } },
        { $set: { image: imageUrl } }
      );

      if (result.modifiedCount > 0) {
        sectionsUpdated++;
        console.log(`  ✅ Updated: ${slug}`);
      }
    }

    console.log(`\n✅ ${sectionsUpdated} sections updated\n`);

    // ============================================================
    // 2. تحديث الخدمات
    // ============================================================
    console.log('📋 Updating business services with images...');
    let servicesUpdated = 0;

    for (const [slug, imageUrl] of Object.entries(SERVICE_IMAGES)) {
      const result = await Service.updateOne(
        { portalId: PORTAL_ID, slug, isDeleted: { $ne: true } },
        { $set: { image: imageUrl } }
      );

      if (result.modifiedCount > 0) {
        servicesUpdated++;
        if (servicesUpdated % 10 === 0) {
          console.log(`  ✅ Updated ${servicesUpdated} services...`);
        }
      }
    }

    console.log(`\n✅ ${servicesUpdated} services updated\n`);

    // ============================================================
    // 3. Fallback للخدمات التي لم تُحدَّث
    // ============================================================
    console.log('🔍 Checking for services without images...');

    const servicesWithoutImages = await Service.find({
      portalId: PORTAL_ID,
      isDeleted: { $ne: true },
      $or: [{ image: '' }, { image: null }, { image: { $exists: false } }],
    }).select('slug nameAr');

    if (servicesWithoutImages.length > 0) {
      console.log(
        `\n⚠️  ${servicesWithoutImages.length} services still without images:`
      );

      for (const service of servicesWithoutImages) {
        // ابحث عن القسم
        const fullService = await Service.findById(service._id).select(
          'sectionId'
        );
        const section = fullService
          ? await Section.findById(fullService.sectionId).select('slug')
          : null;

        const keyword = section?.slug || 'business';
        const defaultImage = unsplash(keyword, 600, 400);

        await Service.updateOne(
          { _id: service._id },
          { $set: { image: defaultImage } }
        );

        console.log(`  ✅ Added default to: ${service.nameAr}`);
      }
    } else {
      console.log('✅ All services have images!\n');
    }

    // ============================================================
    // 4. الملخص
    // ============================================================
    console.log('\n📊 Summary:');
    console.log(`  📂 Sections updated: ${sectionsUpdated}`);
    console.log(`  📋 Services updated: ${servicesUpdated}`);
    console.log(`\n🎉 Business services images added!`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

addBusinessServiceImages();