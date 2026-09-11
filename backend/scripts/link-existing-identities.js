// backend/scripts/link-existing-identities.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { CustomerIdentity } from '../src/models/CustomerIdentity.model.js'
import { Account } from '../src/models/Account.model.js'

dotenv.config()

const linkExistingIdentities = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // ✅ البحث عن جميع الحسابات
    const accounts = await Account.find({ isActive: true }).populate('identityId')

    // ✅ تجميع الحسابات حسب البريد الإلكتروني (من الهوية)
    const groups = {}
    for (const account of accounts) {
      if (!account.identityId) continue
      
      const identity = account.identityId
      const email = identity.email
      
      if (!groups[email]) {
        groups[email] = {
          identity: identity,
          accounts: [],
        }
      }
      groups[email].accounts.push(account)
    }

    // ✅ ربط الحسابات التي لها نفس البريد الإلكتروني
    let linkedCount = 0
    for (const email in groups) {
      const group = groups[email]
      
      // إذا كان هناك أكثر من حساب لنفس البريد الإلكتروني
      if (group.accounts.length > 1) {
        console.log(`📌 Processing: ${email} (${group.accounts.length} accounts)`)
        
        const identity = group.identity
        
        for (const account of group.accounts) {
          // التحقق من عدم تكرار الربط
          const exists = identity.linkedAccounts.some(
            link => link.accountId.toString() === account._id.toString()
          )
          
          if (!exists) {
            identity.linkedAccounts.push({
              portalId: account.portalId,
              accountId: account._id,
              linkedAt: new Date(),
            })
            linkedCount++
            console.log(`   ✅ Linked account: ${account.email} (${account.portalId})`)
          }
        }
        
        await identity.save()
        console.log(`   ✅ Identity ${email} updated`)
      }
    }

    console.log(`\n🎉 Successfully linked ${linkedCount} accounts`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

linkExistingIdentities()