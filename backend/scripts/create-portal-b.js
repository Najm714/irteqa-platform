// backend/scripts/create-portal-b.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Portal } from '../src/models/Portal.model.js';

dotenv.config();

// ✅ معرّف ثابت
const PORTAL_B_ID = '6aa7b3f5a30172dea41091e0';

async function createPortalB() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // ✅ احذف Portal B القديم إن وُجد
    const existing = await Portal.findOne({ slug: 'portal-b' });
    if (existing) {
      console.log('ℹ️  Portal B already exists:');
      console.log('   _id:', existing._id);
      console.log('   slug:', existing.slug);
      console.log('\n🗑️  Deleting old and creating new...');
      await Portal.deleteOne({ slug: 'portal-b' });
    }

    // ✅ أنشئ Portal B
    const portalB = await Portal.create({
      _id: PORTAL_B_ID,
      name: 'البوابة المهنية',
      slug: 'portal-b',
      url: 'http://localhost:8080',
      description: 'البوابة المهنية لخدمات الأعمال والاستشارات',
      isActive: true,
      theme: {
        primaryColor: '#2563eb',
        secondaryColor: '#7c3aed',
        accentColor: '#f59e0b',
        fontFamily: 'Inter',
      },
      settings: {
        registrationEnabled: true,
        requireEmailVerification: false,
        defaultRole: 'customer',
        maintenanceMode: false,
      },
    });

    console.log('═══════════════════════════════════════');
    console.log('✅ Portal B created successfully');
    console.log('═══════════════════════════════════════');
    console.log('📌 _id:  ', portalB._id);
    console.log('📌 slug: ', portalB.slug);
    console.log('📌 name: ', portalB.name);
    console.log('📌 url:  ', portalB.url);
    console.log('═══════════════════════════════════════\n');

    // ✅ عرض كل البوابات
    const allPortals = await Portal.find({}, '_id slug name url isActive').lean();
    console.log('📋 All portals:');
    allPortals.forEach(p => {
      console.log(`   - ${p.slug}: ${p._id} (${p.isActive ? '✅' : '❌'}) ${p.url}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createPortalB();