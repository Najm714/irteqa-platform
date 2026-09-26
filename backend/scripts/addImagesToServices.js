// backend/scripts/addImagesToServices.js
// ============================================================
// 🎨 إضافة صور جاهزة لكل قسم وكل خدمة أكاديمية (3 أقسام)
// ============================================================
// الاستخدام:
//   cd backend
//   node scripts/addImagesToServices.js
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Section } from '../src/models/Section.model.js';
import { Service } from '../src/models/Service.model.js';

dotenv.config();

const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';

// ============================================================
// 🖼️ Helper: صورة افتراضية عند عدم توفر صورة مخصصة
// (بديل source.unsplash.com الذي توقف)
// ============================================================
const DEFAULT_SECTION_IMAGE =
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop&q=80';

// ============================================================
// 📂 صور الأقسام الرئيسية (3 أقسام)
// ============================================================
const SECTION_IMAGES = {
  'research-academic':
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=600&fit=crop&q=80',
  'statistics-data':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80',
  'language-publication':
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=600&fit=crop&q=80',
};

// ============================================================
// 📋 صور الخدمات (حسب slug) - 36 خدمة أكاديمية
// ============================================================
const SERVICE_IMAGES = {
  // ========================================================
  // 🔬 القسم 1: البحث والخدمات الأكاديمية (15 خدمة)
  // ========================================================
  'academic-consulting':
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=80',
  'thesis-titles-suggestion':
    'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=600&h=400&fit=crop&q=80',
  'research-proposal-preparation':
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  'previous-studies-collection':
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&h=400&fit=crop&q=80',
  'scientific-material-collection':
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop&q=80',
  'academic-critique':
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop&q=80',
  'thesis-formatting':
    'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&h=400&fit=crop&q=80',
  'results-discussion':
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=80',
  'conceptual-framework':
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop&q=80',
  'science-mapping-analysis':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',
  'quick-consulting-sessions':
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop&q=80',
  'research-grants-preparation':
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop&q=80',
  'academic-cv-design':
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=400&fit=crop&q=80',
  'academic-presentation-design':
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop&q=80',
  'research-poster-design':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop&q=80',

  // ========================================================
  // 📊 القسم 2: التحليل الإحصائي والبيانات (9 خدمات)
  // ========================================================
  'spss-statistical-analysis':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',
  'meta-analysis':
    'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=600&h=400&fit=crop&q=80',
  'medical-research-statistics':
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop&q=80',
  'amos-statistical-analysis':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80',
  'qualitative-statistical-analysis':
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop&q=80',
  'eviews-statistical-analysis':
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop&q=80',
  'sas-statistical-analysis':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',
  'smart-pls-statistical-analysis':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80',
  'stata-statistical-analysis':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80',

  // ========================================================
  // 🌐 القسم 3: اللغة والتحرير والنشر (12 خدمة)
  // ========================================================
  'academic-translation':
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop&q=80',
  'statement-of-purpose':
    'https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&h=400&fit=crop&q=80',
  'proofreading':
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop&q=80',
  'academic-style-enhancement':
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop&q=80',
  'comprehensive-academic-review':
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&q=80',
  'training-packages-preparation':
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop&q=80',
  'academic-support-publication':
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=400&fit=crop&q=80',
  'journal-recommendation':
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&h=400&fit=crop&q=80',
  'academic-ebook':
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop&q=80',
  'scientific-references-provision':
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop&q=80',
  'references-romanization':
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=400&fit=crop&q=80',
  'books-references-summarization':
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop&q=80',
};

// ============================================================
// ✅ الدالة الرئيسية
// ============================================================
const addImagesToServices = async () => {
  try {
    console.log('🎨 Starting image addition process...\n');

    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/irteqa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // ============================================================
    // 1. تحديث الأقسام
    // ============================================================
    console.log('📂 Updating sections with images...');
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
    console.log('📋 Updating services with images...');
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
    // 3. الخدمات التي لم تُحدَّث - صورة افتراضية
    // ============================================================
    console.log('🔍 Checking for services without images...');

    const servicesWithoutImages = await Service.find({
      portalId: PORTAL_ID,
      isDeleted: { $ne: true },
      $or: [{ image: '' }, { image: null }, { image: { $exists: false } }],
    }).select('slug nameAr sectionId');

    if (servicesWithoutImages.length > 0) {
      console.log(
        `\n⚠️  ${servicesWithoutImages.length} services still without images:`
      );

      for (const service of servicesWithoutImages) {
        await Service.updateOne(
          { _id: service._id },
          { $set: { image: DEFAULT_SECTION_IMAGE } }
        );
        console.log(`  ✅ Added default image to: ${service.nameAr}`);
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
    console.log(
      `  🔍 Services without images initially: ${servicesWithoutImages.length}`
    );
    console.log(`\n🎉 Image addition completed!`);
  } catch (error) {
    console.error('❌ Error:', error);
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
addImagesToServices();