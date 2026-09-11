// backend/src/middleware/resourceOwnership.js
import { Request } from '../models/Request.model.js'
import { File } from '../models/File.model.js'
import { Message } from '../models/Message.model.js'

// ✅ التحقق من ملكية الطلب
export const requireRequestOwnership = async (req, res, next) => {
  try {
    const requestId = req.params.requestId || req.params.id
    const account = req.account
    const portal = req.portal

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
      })
    }

    const request = await Request.findById(requestId)
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      })
    }

    // ✅ التحقق من البوابة
    if (request.portalId.toString() !== portal._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Request belongs to a different portal.',
      })
    }

    // ✅ التحقق من الملكية
    const isOwner = request.accountId.toString() === account._id.toString()
    const isSpecialist = request.specialistId &&
      request.specialistId.toString() === account._id.toString()
    const isAdmin = account.role === 'portal_admin' || account.role === 'super_admin'

    if (!isOwner && !isSpecialist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this request.',
      })
    }

    req.request = request
    next()
  } catch (error) {
    console.error('❌ Request ownership error:', error)
    return res.status(500).json({
      success: false,
      message: 'Error verifying request access.',
    })
  }
}

// ✅ التحقق من ملكية الملف
export const requireFileOwnership = async (req, res, next) => {
  try {
    const fileId = req.params.fileId || req.params.id
    const account = req.account
    const portal = req.portal

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required.',
      })
    }

    const file = await File.findById(fileId)
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.',
      })
    }

    // ✅ التحقق من البوابة
    if (file.portalId.toString() !== portal._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'File belongs to a different portal.',
      })
    }

    // ✅ التحقق من الملكية
    const isOwner = file.accountId.toString() === account._id.toString()
    const isAdmin = account.role === 'portal_admin' || account.role === 'super_admin'

    if (!isOwner && !isAdmin) {
      // ✅ إذا كان الملف مرتبطاً بطلب، تحقق من أن المستخدم هو مختص الطلب
      if (file.requestId) {
        const request = await Request.findById(file.requestId)
        if (request && request.specialistId?.toString() === account._id.toString()) {
          req.file = file
          return next()
        }
      }
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this file.',
      })
    }

    req.file = file
    next()
  } catch (error) {
    console.error('❌ File ownership error:', error)
    return res.status(500).json({
      success: false,
      message: 'Error verifying file access.',
    })
  }
}

// ✅ التحقق من ملكية الرسالة
export const requireMessageOwnership = async (req, res, next) => {
  try {
    const messageId = req.params.messageId || req.params.id
    const account = req.account
    const portal = req.portal

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required.',
      })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      })
    }

    // ✅ التحقق من البوابة
    if (message.portalId.toString() !== portal._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Message belongs to a different portal.',
      })
    }

    // ✅ التحقق من الملكية
    const isSender = message.senderId.toString() === account._id.toString()
    const isAdmin = account.role === 'portal_admin' || account.role === 'super_admin'

    if (!isSender && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this message.',
      })
    }

    req.message = message
    next()
  } catch (error) {
    console.error('❌ Message ownership error:', error)
    return res.status(500).json({
      success: false,
      message: 'Error verifying message access.',
    })
  }
}