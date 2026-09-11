// backend/scripts/setup-complete.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Portal } from '../src/models/Portal.model.js';
import { Account } from '../src/models/Account.model.js';
import { CustomerIdentity } from '../src/models/CustomerIdentity.model.js';

dotenv.config();

async function setupComplete() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. حذف جميع البوابات القديمة
    const deleted = await Portal.deleteMany({});
    console.log(`🗑️ Deleted ${deleted.deletedCount} old portals\n`);

    // 2. إنشاء بوابة جديدة
    const portal = await Portal.create({
      name: 'البوابة الأكاديمية',
      nameAr: 'البوابة الأكاديمية',
      slug: 'portal-a',
      url: 'http://localhost',
      isActive: true,
      settings: {
        registrationEnabled: true,
        defaultRole: 'customer',
      },
    });
    
    const portalId = portal._id.toString();
    console.log('✅ Portal created:');
    console.log(`   📌 Portal ID: ${portalId}`);
    console.log(`   📌 Slug: ${portal.slug}`);
    console.log(`   📌 URL: ${portal.url}\n`);

    // 3. حذف الحسابات القديمة
    await Account.deleteMany({});
    await CustomerIdentity.deleteMany({});
    console.log('🗑️ Deleted old accounts and identities\n');

    // 4. إنشاء هوية المدير
    const adminIdentity = await CustomerIdentity.create({
      email: 'admin@irteqa.com',
      fullName: 'مدير النظام',
      phone: '0500000000',
    });
    console.log('✅ Admin identity created');

    // 5. إنشاء حساب المدير
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    const admin = await Account.create({
      portalId: portal._id,
      identityId: adminIdentity._id,
      email: 'admin@irteqa.com',
      username: 'admin',
      passwordHash: hashedPassword,
      role: 'super_admin',
      isActive: true,
      isVerified: true,
      profile: {
        fullName: 'مدير النظام',
      },
    });
    console.log('✅ Admin account created:');
    console.log(`   📌 Email: admin@irteqa.com`);
    console.log(`   🔑 Password: Admin@123456\n`);

    // 6. إنشاء مستخدم عادي للاختبار
    const userIdentity = await CustomerIdentity.create({
      email: 'user@irteqa.com',
      fullName: 'مستخدم عادي',
      phone: '0500000001',
    });
    console.log('✅ User identity created');

    const userPassword = await bcrypt.hash('User@123456', 10);

    await Account.create({
      portalId: portal._id,
      identityId: userIdentity._id,
      email: 'user@irteqa.com',
      username: 'user',
      passwordHash: userPassword,
      role: 'customer',
      isActive: true,
      isVerified: true,
      profile: {
        fullName: 'مستخدم عادي',
      },
    });
    console.log('✅ User account created:');
    console.log(`   📌 Email: user@irteqa.com`);
    console.log(`   🔑 Password: User@123456\n`);

    console.log('🎉 Setup completed successfully!');
    console.log('📌 IMPORTANT: Use this Portal ID in frontend:');
    console.log(`   ${portalId}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupComplete();