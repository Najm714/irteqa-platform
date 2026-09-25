// backend/scripts/create-explanations-section.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Section } from '../src/models/Section.model.js';
import { Account } from '../src/models/Account.model.js';

dotenv.config();

const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';

const createExplanationsSection = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/irteqa';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // 1. جلب حساب المدير
    const admin = await Account.findOne({
      portalId: PORTAL_ID,
      role: { $in: ['portal_admin', 'super_admin'] },
      isActive: true,
    }).select('_id');

    // 2. افحص إن كان موجوداً
    const existing = await Section.findOne({
      portalId: PORTAL_ID,
      slug: 'explanations',
      isDeleted: { $ne: true },
    });

    if (existing) {
      console.log('ℹ️  Section already exists:');
      console.log(`   Name: ${existing.nameAr}`);
      console.log(`   Slug: ${existing.slug}`);
      console.log(`   Image: ${existing.image || 'EMPTY'}`);
      process.exit(0);
    }

    // 3. أنشئ القسم
    const section = new Section({
      portalId: PORTAL_ID,
      name: 'Explanations & Summaries',
      nameAr: 'الشروحات والملخصات',
      slug: 'explanations',
      description: 'Private explanations and organized summaries for university courses',
      descriptionAr:
        'شروحات خصوصية وملخصات منظمة للمقررات الجامعية',
      icon: 'fa-book',
      image:
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop&q=80',
      order: 0,
      isPublished: true,
      createdBy: admin?._id,
    });

    await section.save();

    console.log('✅ Section created successfully!\n');
    console.log(`   Name: ${section.nameAr}`);
    console.log(`   Slug: ${section.slug}`);
    console.log(`   ID: ${section._id}`);
    console.log(`   Image: ${section.image}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createExplanationsSection();