// backend/scripts/migrateImagesToR2.js
// ============================================================
// 📦 نقل صور الأقسام والخدمات من Unsplash إلى Cloudflare R2
// ============================================================
// الاستخدام:
//   cd backend
//   node scripts/migrateImagesToR2.js --dry-run   (تجربة بدون تعديل)
//   node scripts/migrateImagesToR2.js             (تنفيذ فعلي)
// ============================================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ تحميل .env من نفس مكان env.js
dotenv.config({ path: path.join(__dirname, '../.env') });

// ✅ استيراد بعد تحميل .env
const { config } = await import('../src/config/env.js');
const { Account } = await import('../src/models/Account.model.js');
const { Section } = await import('../src/models/Section.model.js');
const { Service } = await import('../src/models/Service.model.js');
const { File } = await import('../src/models/File.model.js');
const { default: storageService } = await import(
  '../src/services/storage.service.js'
);

const PORTAL_ID = process.env.SEED_PORTAL_ID || '6aa45ad70a89ed89eeb18e41';
const DRY_RUN = process.argv.includes('--dry-run');

// ✅ التصنيف الصحيح (موجود في File.model.js enum)
const FILE_CATEGORY = 'image';

// ============================================================
// 🖼️ تنزيل صورة من URL
// ============================================================
const downloadImage = async (url) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Irteqa-Migration/1.0' },
    timeout: 30000,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = res.headers.get('content-type') || 'image/jpeg';

  return { buffer, contentType };
};

// ============================================================
// 🧩 بناء كائن file متوافق مع storageService.uploadFile
// ============================================================
const buildFileObject = (buffer, contentType, originalName) => ({
  buffer,
  size: buffer.length,
  mimetype: contentType,
  originalname: originalName,
});

// ============================================================
// 🎯 استخراج امتداد من contentType
// ============================================================
const extFromContentType = (contentType) => {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };
  return map[contentType] || 'jpg';
};

// ============================================================
// 🔍 هل الصورة تحتاج نقل؟
// ============================================================
const needsMigration = (imageUrl) => {
  if (!imageUrl) return false;
  if (imageUrl.startsWith('/uploads/')) return false;
  if (imageUrl.startsWith('/images/')) return false;
  const publicUrl = config.r2.publicUrl || '';
  if (publicUrl && imageUrl.startsWith(publicUrl)) return false;
  return imageUrl.startsWith('http');
};

// ============================================================
// 🚀 نقل صور مجموعة (Sections / Services)
// ============================================================
const migrateCollection = async (Model, collectionName, admin) => {
  const query = {
    portalId: PORTAL_ID,
    isDeleted: { $ne: true },
    image: { $regex: '^https?://' },
  };

  const docs = await Model.find(query).select(
    '_id slug name nameAr image metadata'
  );

  console.log(`\n📦 ${collectionName}: ${docs.length} images to check`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    const oldUrl = doc.image;

    if (!needsMigration(oldUrl)) {
      skipped++;
      continue;
    }

    try {
      console.log(`\n  🔄 ${doc.slug || doc._id}`);
      console.log(`     From: ${oldUrl.substring(0, 80)}...`);

      if (DRY_RUN) {
        console.log('     [DRY RUN] Would migrate');
        migrated++;
        continue;
      }

      // 1. تنزيل
      const { buffer, contentType } = await downloadImage(oldUrl);
      console.log(`     Downloaded: ${(buffer.length / 1024).toFixed(1)} KB`);

      // 2. تجهيز file object
      const ext = extFromContentType(contentType);
      const originalName = `${doc.slug || doc._id}.${ext}`;
      const fileObject = buildFileObject(buffer, contentType, originalName);

      // 3. رفع إلى R2 عبر storageService — ✅ 'image' بدل 'images'
      const { file, key } = await storageService.uploadFile(
        fileObject,
        PORTAL_ID,
        admin._id,
        FILE_CATEGORY,
        null,
        {
          source: 'unsplash-migration',
          sourceUrl: oldUrl,
          entityType: collectionName,
          entityId: doc._id.toString(),
          slug: doc.slug,
        }
      );

      // 4. تحديث visibility إلى public
      file.visibility = 'public';
      await file.save();

      // 5. بناء URL عام (دائم)
      const publicUrl = `${config.r2.publicUrl}/${key}`;

      // 6. تحديث المستند
      doc.image = publicUrl;
      doc.metadata = {
        ...(doc.metadata || {}),
        imageStorageKey: key,
        imageFileId: file._id,
        imageMigratedAt: new Date(),
        imageOriginalUrl: oldUrl,
      };
      await doc.save();

      console.log(`     ✅ → ${publicUrl}`);
      migrated++;
    } catch (err) {
      failed++;
      console.error(`     ❌ ${err.message}`);
    }
  }

  console.log(
    `\n  📊 ${collectionName}: ✅ ${migrated} | ⏭️  ${skipped} | ❌ ${failed}`
  );

  return { migrated, skipped, failed };
};

// ============================================================
// ✅ الدالة الرئيسية
// ============================================================
const migrate = async () => {
  try {
    console.log('🚀 Starting image migration to Cloudflare R2...');
    if (DRY_RUN) console.log('⚠️  DRY RUN MODE — no changes\n');

    // 1. الاتصال
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // 2. التحقق من R2
    console.log('📁 Storage provider:', storageService.providerType.toUpperCase());

    if (storageService.providerType !== 'r2') {
      console.error('\n❌ R2 is NOT configured!');
      console.error('💡 Check .env:');
      console.error('   STORAGE_PROVIDER=r2');
      console.error('   R2_ENDPOINT=https://xxxx.r2.cloudflarestorage.com');
      console.error('   R2_ACCESS_KEY=xxxx');
      console.error('   R2_SECRET_KEY=xxxx');
      console.error('   R2_BUCKET=irteqa-images');
      console.error('   R2_PUBLIC_URL=https://images.yourdomain.com');
      process.exit(1);
    }

    console.log(`  - Bucket: ${config.r2.bucket}`);
    console.log(`  - Public URL: ${config.r2.publicUrl}`);

    if (!config.r2.publicUrl) {
      console.error('\n❌ R2_PUBLIC_URL is missing!');
      console.error('💡 Set it to your R2 custom domain');
      process.exit(1);
    }

    // 3. جلب حساب المدير
    const admin = await Account.findOne({
      portalId: PORTAL_ID,
      role: { $in: ['portal_admin', 'super_admin'] },
      isActive: true,
    }).select('_id profile.fullName');

    if (!admin) {
      console.error('❌ No admin found for portal:', PORTAL_ID);
      process.exit(1);
    }

    console.log(`\n✅ Using admin: ${admin.profile?.fullName || admin._id}`);

    // 4. نقل الصور
    const sectionsResult = await migrateCollection(Section, 'sections', admin);
    const servicesResult = await migrateCollection(Service, 'services', admin);

    // 5. الملخص
    const totalMigrated = sectionsResult.migrated + servicesResult.migrated;
    const totalSkipped = sectionsResult.skipped + servicesResult.skipped;
    const totalFailed = sectionsResult.failed + servicesResult.failed;

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`  ✅ Migrated : ${totalMigrated}`);
    console.log(`  ⏭️  Skipped  : ${totalSkipped}`);
    console.log(`  ❌ Failed   : ${totalFailed}`);
    console.log('='.repeat(60));

    if (totalFailed > 0) {
      console.log('\n⚠️  Some images failed. Re-run to retry.');
    } else if (!DRY_RUN) {
      console.log('\n🎉 All images migrated successfully!');
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
    process.exit(0);
  }
};

migrate();