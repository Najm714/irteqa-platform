// backend/scripts/create-admin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Portal } from '../src/models/Portal.model.js';
import { Account } from '../src/models/Account.model.js';
import { CustomerIdentity } from '../src/models/CustomerIdentity.model.js';

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // ✅ الحصول على Portal
    const portal = await Portal.findOne({ slug: 'portal-a' });
    if (!portal) {
      console.error('❌ Portal not found');
      process.exit(1);
    }
    console.log(`✅ Portal found: ${portal._id}`);
    
    // ✅ حذف حساب المدير القديم إذا وجد
    await Account.deleteOne({ email: 'admin@irteqa.com' });
    await CustomerIdentity.deleteOne({ email: 'admin@irteqa.com' });
    console.log('🗑️ Deleted old admin account');
    
    // ✅ إنشاء هوية المدير
    const identity = await CustomerIdentity.create({
      email: 'admin@irteqa.com',
      fullName: 'مدير النظام',
      phone: '0500000000',
    });
    console.log('✅ Admin identity created');
    
    // ✅ تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    // ✅ إنشاء حساب المدير
    const admin = await Account.create({
      portalId: portal._id,
      identityId: identity._id,
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
    
    console.log('\n✅ Admin created successfully!');
    console.log(`   📌 Email: admin@irteqa.com`);
    console.log(`   🔑 Password: Admin@123456`);
    console.log(`   📌 Portal ID: ${portal._id}`);
    console.log(`   📌 Role: ${admin.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();