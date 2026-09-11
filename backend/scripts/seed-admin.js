// backend/scripts/seed-admin.js
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { Account } from '../src/models/Account.model.js'
import { Portal } from '../src/models/Portal.model.js'
import { CustomerIdentity } from '../src/models/CustomerIdentity.model.js'
import dotenv from 'dotenv'

dotenv.config()

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // البحث عن بوابة
    const portal = await Portal.findOne()
    if (!portal) {
      console.log('❌ No portal found. Please create a portal first.')
      process.exit(1)
    }

    // إنشاء هوية المدير
    let identity = await CustomerIdentity.findOne({ email: 'admin@irteqa.com' })
    if (!identity) {
      identity = new CustomerIdentity({
        email: 'admin@irteqa.com',
        fullName: 'المدير العام',
        isActive: true,
      })
      await identity.save()
      console.log('✅ Admin identity created')
    }

    // إنشاء حساب المدير
    const hashedPassword = await bcrypt.hash('Admin@123456', 10)
    const admin = new Account({
      portalId: portal._id,
      identityId: identity._id,
      username: 'admin',
      email: 'admin@irteqa.com',
      passwordHash: hashedPassword,
      role: 'super_admin',
      isActive: true,
      isVerified: true,
      emailVerified: true,
      profile: {
        fullName: 'المدير العام',
      },
    })
    await admin.save()
    console.log('✅ Admin account created')
    console.log('📧 Email: admin@irteqa.com')
    console.log('🔑 Password: Admin@123456')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createAdmin()