// backend/scripts/reset-admin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Portal } from '../src/models/Portal.model.js';
import { Account } from '../src/models/Account.model.js';
import { CustomerIdentity } from '../src/models/CustomerIdentity.model.js';

dotenv.config();

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const portal = await Portal.findOne({ slug: 'portal-a' });
    if (!portal) {
      console.error('❌ Portal not found');
      process.exit(1);
    }
    console.log(`✅ Portal found: ${portal._id}`);
    
    // ✅ حذف الحساب القديم
    await Account.deleteOne({ email: 'admin@irteqa.com' });
    await CustomerIdentity.deleteOne({ email: 'admin@irteqa.com' });
    console.log('🗑️ Deleted old admin account');
    
    // ✅ إنشاء هوية جديدة
    const identity = await CustomerIdentity.create({
      email: 'admin@irteqa.com',
      fullName: 'مدير النظام',
      phone: '0500000000',
    });
    console.log('✅ Identity created');
    
    // ✅ إنشاء حساب جديد (بدون تشفير مسبق)
    // سيتم تشفير كلمة المرور تلقائياً في pre('save')
    const plainPassword = 'Admin@123456';
    
    const admin = await Account.create({
      portalId: portal._id,
      identityId: identity._id,
      email: 'admin@irteqa.com',
      username: 'admin',
      passwordHash: plainPassword, // ✅ يترك للتشفير في pre('save')
      role: 'super_admin',
      isActive: true,
      isVerified: true,
      profile: {
        fullName: 'مدير النظام',
      },
    });
    
    console.log('\n✅ Admin created successfully!');
    console.log(`   📌 Email: admin@irteqa.com`);
    console.log(`   🔑 Password: ${plainPassword}`);
    console.log(`   📌 Portal ID: ${portal._id}`);
    console.log(`   📌 Role: ${admin.role}`);
    
    // ✅ التحقق من كلمة المرور
    const isValid = await admin.comparePassword(plainPassword);
    console.log(`\n🔑 Password verification: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdmin();