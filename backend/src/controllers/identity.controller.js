// backend/src/controllers/identity.controller.js
import { CustomerIdentity } from '../models/CustomerIdentity.model.js'
import { Account } from '../models/Account.model.js'

// ✅ الحصول على جميع حسابات العميل
export const getCustomerAccounts = async (req, res) => {
  try {
    const { identityId } = req.params
    const portalId = req.portalId

    const identity = await CustomerIdentity.findById(identityId)
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Customer identity not found',
      })
    }

    // التحقق من صلاحية المدير
    const isAdmin = req.account.role === 'portal_admin' || req.account.role === 'super_admin'
    
    // العميل العادي يرى فقط حساباته في بوابته
    let accounts = []
    if (isAdmin) {
      // المدير يرى جميع الحسابات
      for (const link of identity.linkedAccounts) {
        const account = await Account.findById(link.accountId)
          .populate('portalId')
          .select('-passwordHash')
        if (account) {
          accounts.push({
            account,
            portal: account.portalId,
            linkedAt: link.linkedAt,
          })
        }
      }
    } else {
      // العميل يرى فقط حسابه في البوابة الحالية
      const currentLink = identity.linkedAccounts.find(
        link => link.portalId.toString() === portalId.toString()
      )
      if (currentLink) {
        const account = await Account.findById(currentLink.accountId)
          .populate('portalId')
          .select('-passwordHash')
        if (account) {
          accounts.push({
            account,
            portal: account.portalId,
            linkedAt: currentLink.linkedAt,
          })
        }
      }
    }

    res.json({
      success: true,
      data: {
        identity: {
          id: identity._id,
          email: identity.email,
          fullName: identity.fullName,
          phone: identity.phone,
        },
        accounts,
        totalAccounts: accounts.length,
      },
    })
  } catch (error) {
    console.error('❌ Error in getCustomerAccounts:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ✅ ربط حسابين للعميل (للمدير فقط)
export const linkCustomerAccounts = async (req, res) => {
  try {
    const { identityId, portalId, accountId } = req.body
    const adminId = req.accountId

    // البحث عن الهوية
    const identity = await CustomerIdentity.findById(identityId)
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Customer identity not found',
      })
    }

    // التحقق من وجود الحساب
    const account = await Account.findById(accountId)
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      })
    }

    // ربط الحساب
    await identity.linkAccount(portalId, accountId, adminId)

    res.json({
      success: true,
      message: 'Account linked successfully',
      data: {
        identity: {
          id: identity._id,
          email: identity.email,
          fullName: identity.fullName,
        },
        linkedAccounts: identity.linkedAccounts,
      },
    })
  } catch (error) {
    console.error('❌ Error in linkCustomerAccounts:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ✅ البحث عن العميل (للمدير)
export const searchCustomer = async (req, res) => {
  try {
    const { query } = req.query
    const portalId = req.portalId

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      })
    }

    const identities = await CustomerIdentity.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { nationalId: { $regex: query, $options: 'i' } },
      ],
      isActive: true,
    })

    // جلب الحسابات لكل هوية
    const results = []
    for (const identity of identities) {
      const accounts = []
      for (const link of identity.linkedAccounts) {
        const account = await Account.findById(link.accountId)
          .populate('portalId')
          .select('-passwordHash')
        if (account) {
          accounts.push({
            account,
            portal: account.portalId,
            isCurrentPortal: account.portalId._id.toString() === portalId.toString(),
          })
        }
      }
      results.push({
        identity: {
          id: identity._id,
          email: identity.email,
          fullName: identity.fullName,
          phone: identity.phone,
        },
        accounts,
        totalAccounts: accounts.length,
      })
    }

    res.json({
      success: true,
      data: results,
      total: results.length,
    })
  } catch (error) {
    console.error('❌ Error in searchCustomer:', error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}