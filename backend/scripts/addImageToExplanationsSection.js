// backend/scripts/addImageToExplanationsSection.js
// ============================================================
// 🎨 إضافة صورة لقسم "الشروحات والملخصات"
// ============================================================
// الاستخدام:
//   cd backend
//   node scripts/addImageToExplanationsSection.js
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Section } from '../src/models/Section.model.js';

dotenv.config();

// ============================================================
// ⚙️ الإعدادات
// ============================================================
const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';

// ✅ الصورة التي تريد إضافتها (عدّلها حسب رغبتك)
const SECTION_SLUG = 'explanations';
const IMAGE_URL =
'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&q=80'

// ============================================================
// 🚀 التنفيذ
// ============================================================
const addImageToSection = async () => {
  try {
    console.log('🎨 Adding image to section...\n');

    // الاتصال بقاعدة البيانات
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/irteqa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // البحث عن القسم
    const section = await Section.findOne({
      portalId: PORTAL_ID,
      slug: SECTION_SLUG,
      isDeleted: { $ne: true },
    });

    if (!section) {
      console.error(`❌ Section "${SECTION_SLUG}" not found`);
      console.log('💡 Available sections:');
      const allSections = await Section.find({
        portalId: PORTAL_ID,
        isDeleted: { $ne: true },
      }).select('slug nameAr');

      allSections.forEach((s) => {
        console.log(`   - ${s.slug} (${s.nameAr})`);
      });

      process.exit(1);
    }

    console.log('📂 Found section:');
    console.log(`   - Name: ${section.nameAr}`);
    console.log(`   - Slug: ${section.slug}`);
    console.log(`   - Old image: ${section.image || 'EMPTY'}\n`);

    // تحديث الصورة
    section.image = IMAGE_URL;
    await section.save();

    console.log('✅ Image added successfully!\n');
    console.log(`   New image: ${section.image}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

addImageToSection();