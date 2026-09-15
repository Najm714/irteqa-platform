// backend/src/controllers/identity.controller.js

import { CustomerIdentity } from '../models/CustomerIdentity.model.js'
import { Account } from '../models/Account.model.js'

// ============================================================
// الحصول على حسابات العميل داخل البوابة الحالية فقط
// ============================================================

export const getCustomerAccounts = async (req, res) => {
  try {
    const { identityId } = req.params
    const portalId = req.portalId

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      })
    }

    const identity = await CustomerIdentity.findById(identityId)

    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Customer identity not found',
      })
    }

    // ========================================================
    // جميع المستخدمين — بما فيهم SUPER_ADMIN — يعملون ضمن
    // portal context الحالي.
    // SUPER_ADMIN يستطيع تغيير البوابة من خلال portal context.
    // ========================================================

    const accounts = []

    for (const link of identity.linkedAccounts) {
      // لا نسمح بعرض حساب من بوابة أخرى
      if (link.portalId.toString() !== portalId.toString()) {
        continue
      }

      const account = await Account.findOne({
        _id: link.accountId,
        portalId,
        isDeleted: { $ne: true },
      })
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

// ============================================================
// ربط حساب العميل داخل البوابة الحالية فقط
// ============================================================

export const linkCustomerAccounts = async (req, res) => {
  try {
    const { identityId, accountId } = req.body
    const portalId = req.portalId
    const adminId = req.accountId

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      })
    }

    if (!identityId || !accountId) {
      return res.status(400).json({
        success: false,
        message: 'identityId and accountId are required',
      })
    }

    // ========================================================
    // البحث عن الهوية
    // ========================================================

    const identity = await CustomerIdentity.findById(identityId)

    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Customer identity not found',
      })
    }

    // ========================================================
    // الحساب يجب أن يكون من البوابة الحالية فقط
    // ========================================================

    const account = await Account.findOne({
      _id: accountId,
      portalId,
      isDeleted: { $ne: true },
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found in the current portal',
      })
    }

    // ========================================================
    // منع الربط إذا كان الحساب مرتبطًا بالفعل ببوابة أخرى
    // ========================================================

    const existingLink = identity.linkedAccounts.find(
      link => link.accountId.toString() === accountId.toString()
    )

    if (existingLink && existingLink.portalId.toString() !== portalId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This account belongs to another portal',
        code: 'CROSS_PORTAL_LINK_FORBIDDEN',
      })
    }

    // ========================================================
    // ربط الحساب باستخدام portalId الموثوق من middleware
    // وليس portalId القادم من المستخدم
    // ========================================================

    await identity.linkAccount(
      portalId,
      accountId,
      adminId
    )

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

// ============================================================
// البحث عن العميل داخل البوابة الحالية فقط
// ============================================================

export const searchCustomer = async (req, res) => {
  try {
    const { query } = req.query
    const portalId = req.portalId

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
        code: 'PORTAL_ID_REQUIRED',
      })
    }

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      })
    }

    // ========================================================
    // البحث عن الهويات المرتبطة فعليًا بالبوابة الحالية فقط
    // ========================================================

    const identities = await CustomerIdentity.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { nationalId: { $regex: query, $options: 'i' } },
      ],
      isActive: true,
      linkedAccounts: {
        $elemMatch: {
          portalId,
        },
      },
    })

    const results = []

    for (const identity of identities) {
      const accounts = []

      for (const link of identity.linkedAccounts) {
        // لا نعرض إلا الحسابات التابعة للبوابة الحالية
        if (link.portalId.toString() !== portalId.toString()) {
          continue
        }

        const account = await Account.findOne({
          _id: link.accountId,
          portalId,
          isDeleted: { $ne: true },
        })
          .populate('portalId')
          .select('-passwordHash')

        if (account) {
          accounts.push({
            account,
            portal: account.portalId,
            isCurrentPortal: true,
            linkedAt: link.linkedAt,
          })
        }
      }

      if (accounts.length > 0) {
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