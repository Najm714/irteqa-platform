// backend/scripts/check-admin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Account } from '../src/models/Account.model.js';
import { Portal } from '../src/models/Portal.model.js';
import bcrypt from 'bcrypt';

dotenv.config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // ✅ البحث عن Portal
    const portal = await Portal.findOne({ slug: 'portal-a' });
    if (!portal) {
      console.error('❌ Portal not found');
      process.exit(1);
    }
    console.log(`✅ Portal found: ${portal._id}\n`);
    
    // ✅ البحث عن حساب المدير
    const admin = await Account.findOne({
      portalId: portal._id,
      email: 'admin@irteqa.com',
    }).select('+passwordHash');
    
    if (!admin) {
      console.error('❌ Admin account not found!');
      process.exit(1);
    }
    
    console.log('✅ Admin account found:');
    console.log(`   📌 Email: ${admin.email}`);
    console.log(`   📌 Username: ${admin.username}`);
    console.log(`   📌 Role: ${admin.role}`);
    console.log(`   📌 Password Hash: ${admin.passwordHash.substring(0, 30)}...`);
    console.log(`   📌 Is Active: ${admin.isActive}`);
    console.log(`   📌 Is Verified: ${admin.isVerified}`);
    
    // ✅ اختبار كلمة المرور
    const testPassword = 'Admin@123456';
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
    console.log(`\n🔑 Password "${testPassword}" is ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    // ✅ إذا كانت كلمة المرور غير صحيحة، قم بتحديثها
    if (!isValid) {
      console.log('\n🔄 Updating password...');
      const newHash = await bcrypt.hash(testPassword, 10);
      admin.passwordHash = newHash;
      await admin.save();
      console.log('✅ Password updated successfully!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmin();