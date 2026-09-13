// backend/scripts/seed-admin.js
import mongoose from 'mongoose'
import { Account } from '../src/models/Account.model.js'
import { Portal } from '../src/models/Portal.model.js'
import { CustomerIdentity } from '../src/models/CustomerIdentity.model.js'
import dotenv from 'dotenv'

dotenv.config()

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // 1. ابحث عن بوابة (portal-a أولاً)
    let portal = await Portal.findOne({ slug: 'portal-a' })
    if (!portal) {
      portal = await Portal.findOne()
    }
    if (!portal) {
      console.log('❌ No portal found. Please run: node scripts/seed-portal.js')
      process.exit(1)
    }
    console.log('📌 Using portal:', portal.slug, '-', portal.name)

    // 2. ابحث عن هوية موجودة أو أنشئها
    let identity = await CustomerIdentity.findOne({ email: 'admin@irteqa.com' })
    if (!identity) {
      identity = new CustomerIdentity({
        email: 'admin@irteqa.com',
        fullName: 'المدير العام',
      })
      await identity.save()
      console.log('✅ Admin identity created')
    } else {
      console.log('ℹ️  Admin identity already exists')
    }

    // 3. احذف الحساب القديم إن وُجد (لتجنب duplicate)
    const existing = await Account.findOne({
      email: 'admin@irteqa.com',
      portalId: portal._id,
    })
    if (existing) {
      console.log('⚠️  Deleting existing admin account...')
      await Account.deleteOne({ _id: existing._id })
    }

    // 4. ✅ أنشئ حساب المدير — كلمة المرور نص عادي
    //    Account.model.js سيشفّرها تلقائياً في pre('save')
    const admin = new Account({
      portalId: portal._id,
      identityId: identity._id,
      username: 'admin',
      email: 'admin@irteqa.com',
      passwordHash: 'Admin@123456',   // ← نص عادي!
      role: 'super_admin',
      isActive: true,
      isVerified: true,
      emailVerified: true,
      fullName: 'المدير العام',
      profile: {
        fullName: 'المدير العام',
        bio: 'حساب المدير العام لمنصة ارتقاء',
      },
    })

    await admin.save()
    console.log('')
    console.log('═══════════════════════════════════════')
    console.log('✅ Admin account created successfully')
    console.log('═══════════════════════════════════════')
    console.log('📧 Email:    admin@irteqa.com')
    console.log('🔑 Password: Admin@123456')
    console.log('👤 Role:     super_admin')
    console.log('🏛️  Portal:   ' + portal.slug)
    console.log('═══════════════════════════════════════')
    console.log('⚠️  غيّر كلمة المرور فوراً بعد الدخول!')
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code === 11000) {
      console.error('💡 Account already exists. Delete it manually or run the script again.')
    }
    process.exit(1)
  }
}

createAdmin()