// backend/src/controllers/file.controller.js
import { File } from '../models/File.model.js';
import { Request } from '../models/Request.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Account } from '../models/Account.model.js';
import storageService from '../services/storage.service.js';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

// ============================================================
// ✅ دالة مساعدة لحفظ الملف
// ============================================================

const saveFile = async ({ file, portalId, accountId, category = 'user', metadata = {}, requestId = null }) => {
  console.log('💾 saveFile called...');
  console.log('  - portalId:', portalId);
  console.log('  - accountId:', accountId);
  console.log('  - category:', category);

  if (!portalId) {
    throw new Error('portalId is required');
  }

  const result = await storageService.uploadFile(
    file,
    portalId,
    accountId,
    category,
    requestId,
    metadata
  );

  return result.file;
};

// ============================================================
// ✅ دالة مساعدة للتحقق من الصلاحية مع الاشتراك
// ============================================================

const canAccessFileWithSubscription = async (file, account) => {
  // 1. المدير لديه صلاحية مطلقة
  if (account?.role === 'portal_admin' || account?.role === 'super_admin') {
    return true;
  }

  // 2. الملفات غير المشفرة متاحة للجميع
  if (!file.isEncrypted) {
    return true;
  }

  // 3. الملفات المشفرة - تحقق من الاشتراك
  try {
    const subscription = await Subscription.findOne({
      portalId: file.portalId,
      accountId: account._id,
      status: 'active',
    });

    if (subscription) {
      console.log('✅ Active subscription found for user:', account._id);
      return true;
    }

    console.log('❌ No active subscription for user:', account._id);
    return false;
  } catch (err) {
    console.error('❌ Error checking subscription:', err);
    return false;
  }
};

// ============================================================
// ✅ ✅ إضافة علامة مائية على ملف PDF (النص الإنجليزي)
// ============================================================

const addWatermarkToPDF = async (pdfBuffer, watermarkText, accountName = '') => {
  try {
    console.log('📝 Adding watermark to PDF...');
    
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    
    const fontSize = 40;
    const opacity = 0.15;
    const color = rgb(0.2, 0.2, 0.2);
    
    // ✅ استخدام النص الإنجليزي لتجنب مشاكل الترميز
    const fullWatermark = accountName 
      ? `${watermarkText} - ${accountName}`
      : watermarkText;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      // ✅ العلامة المائية الرئيسية
      page.drawText(fullWatermark, {
        x: width / 2 - 150,
        y: height / 2 - 20,
        size: fontSize,
        color: color,
        opacity: opacity,
        rotate: degrees(-45),
      });

      // ✅ تاريخ المشاهدة بالإنجليزية
      const dateTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      
      page.drawText(`Viewed on: ${dateTime}`, {
        x: 20,
        y: 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.5,
      });

      // ✅ رقم الصفحة
      page.drawText(`Page ${i + 1} of ${totalPages}`, {
        x: width - 120,
        y: 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.5,
      });
    }

    console.log('✅ Watermark added successfully');
    return await pdfDoc.save();
  } catch (error) {
    console.error('❌ Error adding watermark:', error);
    throw error;
  }
};

// ============================================================
// ✅ رفع ملف
// ============================================================

export const uploadFile = async (req, res) => {
  try {
    const portalId = req.portal?._id || req.portalId || req.headers['x-portal-id'] || req.body.portalId;
    const accountId = req.accountId || req.user?.id;
    const role = req.account?.role || 'customer';
    const { category, metadata, requestId } = req.body;

    console.log('📁 Uploading file...');
    console.log('  - Portal:', portalId);
    console.log('  - Account:', accountId);
    console.log('  - Role:', role);
    console.log('  - Category:', category);

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal ID is required',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // ✅ قائمة الفئات المسموحة
    const allowedCategories = [
      'payment_proof', 'user', 'request_file', 'request',
      'proof', 'delivery', 'modification', 'support',
      'profile', 'message', 'platform_sample', 'learning_content',
      'video', 'attachment', 'content', 'summary', 'service_form',
      'library', 'library_file', 'document', 'image', 'infographic', 'thumbnail',
      'about', 'offer', 'promotion', 'banner', 'slide', 'cover', 'logo',
    ];

    const finalCategory = category || 'user';

    // ✅ التحقق من صلاحيات الفئة حسب الدور
    if (role === 'customer' && !allowedCategories.includes(finalCategory)) {
      return res.status(403).json({
        success: false,
        message: `Category "${finalCategory}" is not allowed for customers. Allowed: ${allowedCategories.join(', ')}`,
        allowed: allowedCategories,
      });
    }

    const specialistAllowed = [...allowedCategories, 'work', 'final', 'delivery'];
    if (role === 'specialist' && !specialistAllowed.includes(finalCategory)) {
      return res.status(403).json({
        success: false,
        message: `Category "${finalCategory}" is not allowed for specialists. Allowed: ${specialistAllowed.join(', ')}`,
        allowed: specialistAllowed,
      });
    }

    // ✅ المديرين لديهم صلاحية مطلقة
    if ((role === 'portal_admin' || role === 'super_admin') && !allowedCategories.includes(finalCategory)) {
      return res.status(403).json({
        success: false,
        message: `Category "${finalCategory}" is not allowed for admins.`,
      });
    }

    // ✅ رفع الملف
    const file = await saveFile({
      file: req.file,
      portalId,
      accountId,
      category: finalCategory,
      metadata: metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : {},
      requestId: requestId || null,
    });

    console.log('✅ File uploaded successfully:', file._id);

    res.status(201).json({
      success: true,
      data: { file },
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('❌ Upload file error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
    });
  }
};

// ============================================================
// ✅ ✅ معاينة ملف (View) - مع العلامة المائية الإنجليزية
// ============================================================

export const viewFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.headers['x-portal-id'] || req.query.portalId;
    let account = req.account;

    console.log('👁️ Viewing file:', fileId);
    console.log('  - Query token:', req.query.token ? 'Present' : 'Missing');
    console.log('  - Headers token:', req.headers.authorization ? 'Present' : 'Missing');

    // ✅ محاولة الحصول على التوكن من Query String
    const tokenFromQuery = req.query.token;
    
    if (!account && tokenFromQuery) {
      try {
        const decoded = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
        console.log('✅ Token decoded from query');
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via query token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from query invalid:', err.message);
      }
    }

    // ✅ إذا كان التوكن في الـ Headers، استخدمه
    if (!account && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded from headers');
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via headers token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from headers invalid:', err.message);
      }
    }

    console.log('  - Final Account:', account?._id);
    console.log('  - Role:', account?.role);

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided',
        code: 'NO_TOKEN',
      });
    }

    // ✅ البحث عن الملف
    const file = await File.findOne({ _id: fileId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // ✅ التحقق من البوابة
    const accountPortalId = account.portalId?.toString() || account.portalId;
    if (file.portalId.toString() !== (portalId || accountPortalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Invalid portal',
        code: 'ACCESS_DENIED',
      });
    }

    // ✅ التحقق من الصلاحية
    const hasAccess = await canAccessFileWithSubscription(file, account);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this file',
        code: 'ACCESS_DENIED',
      });
    }

    // ✅ تحميل الملف
    let fileBuffer = await storageService.getFile(file);
    
    // ✅ ✅ إضافة العلامة المائية (PDF فقط - بالنص الإنجليزي)
    if (file.mimeType === 'application/pdf') {
      try {
        const userName = account.profile?.fullName || account.email || 'User';
        const watermarkText = 'Confidential';
        fileBuffer = await addWatermarkToPDF(fileBuffer, watermarkText, userName);
        console.log('✅ Watermark added to PDF');
      } catch (watermarkError) {
        console.error('⚠️ Failed to add watermark:', watermarkError.message);
        // استمر بدون علامة مائية (لا نوقف المعاينة)
      }
    }

    // ✅ إرسال الملف للمعاينة
    const filename = encodeURIComponent(file.originalName);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Portal-Id');

    console.log('✅ File viewed successfully:', fileId);
    res.send(fileBuffer);
  } catch (error) {
    console.error('❌ View file error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to view file',
    });
  }
};

// ============================================================
// ✅ تحميل ملف مباشرة
// ============================================================

export const downloadFileDirect = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.headers['x-portal-id'] || req.query.portalId;
    let account = req.account;

    console.log('📥 Downloading file directly:', fileId);
    console.log('  - Query token:', req.query.token ? 'Present' : 'Missing');
    console.log('  - Headers token:', req.headers.authorization ? 'Present' : 'Missing');

    // ✅ محاولة الحصول على التوكن من Query String
    const tokenFromQuery = req.query.token;
    
    if (!account && tokenFromQuery) {
      try {
        const decoded = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
        console.log('✅ Token decoded from query');
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via query token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from query invalid:', err.message);
      }
    }

    if (!account && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded from headers');
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via headers token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from headers invalid:', err.message);
      }
    }

    console.log('  - Final Account:', account?._id);
    console.log('  - Role:', account?.role);

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided',
        code: 'NO_TOKEN',
      });
    }

    const file = await File.findOne({ _id: fileId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const accountPortalId = account.portalId?.toString() || account.portalId;
    if (file.portalId.toString() !== (portalId || accountPortalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Invalid portal',
        code: 'ACCESS_DENIED',
      });
    }

    const hasAccess = await canAccessFileWithSubscription(file, account);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this file',
        code: 'ACCESS_DENIED',
      });
    }

    const fileBuffer = await storageService.getFile(file);

    const filename = encodeURIComponent(file.originalName);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Portal-Id');

    console.log('✅ File sent successfully:', fileId, 'Size:', file.size);
    res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Download file direct error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download file',
    });
  }
};

// ============================================================
// ✅ تشغيل فيديو مباشرة (Streaming)
// ============================================================

export const streamVideo = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.headers['x-portal-id'] || req.query.portalId;
    let account = req.account;

    console.log('🎬 Streaming video:', fileId);
    console.log('  - Query token:', req.query.token ? 'Present' : 'Missing');
    console.log('  - Headers token:', req.headers.authorization ? 'Present' : 'Missing');

    const tokenFromQuery = req.query.token;
    
    if (!account && tokenFromQuery) {
      try {
        const decoded = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
        console.log('✅ Token decoded from query');
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via query token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from query invalid:', err.message);
      }
    }

    if (!account && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded from headers');
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via headers token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from headers invalid:', err.message);
      }
    }

    console.log('  - Final Account:', account?._id);
    console.log('  - Role:', account?.role);

    if (!account) {
      console.log('❌ No account found, unauthorized');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
        code: 'NO_TOKEN',
      });
    }

    const file = await File.findOne({ _id: fileId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const accountPortalId = account.portalId?.toString() || account.portalId;
    if (file.portalId.toString() !== (portalId || accountPortalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Invalid portal',
        code: 'ACCESS_DENIED',
      });
    }

    const hasAccess = await canAccessFileWithSubscription(file, account);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this video',
        code: 'ACCESS_DENIED',
      });
    }

    const fileBuffer = await storageService.getFile(file);

    res.setHeader('Content-Type', file.mimeType || 'video/mp4');
    res.setHeader('Content-Length', file.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log('✅ Video stream started:', fileId, 'Size:', file.size);
    res.send(fileBuffer);
  } catch (error) {
    console.error('❌ Stream video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stream video',
    });
  }
};

// ============================================================
// ✅ الحصول على معلومات الملف
// ============================================================

export const getFileInfo = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.portal?._id || req.portalId || req.headers['x-portal-id'];

    const fileInfo = await storageService.getFileInfo(fileId);

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const fileRecord = await File.findOne({ _id: fileId, portalId });
    if (!fileRecord) {
      return res.status(404).json({
        success: false,
        message: 'File not found in this portal',
      });
    }

    res.status(200).json({
      success: true,
      data: fileInfo,
    });
  } catch (error) {
    console.error('❌ Get file info error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get file info',
    });
  }
};

// ============================================================
// ✅ الحصول على ملف
// ============================================================

export const getFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.portal?._id || req.portalId || req.headers['x-portal-id'];

    const file = await File.findOne({ _id: fileId, portalId, isDeleted: { $ne: true } })
      .populate('accountId', 'profile.fullName email')
      .populate('requestId', 'title status');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const fileData = file.toObject();
    try {
      const url = await storageService.getFileUrl(fileId, req.account, 3600);
      fileData.downloadUrl = url;
    } catch (error) {
      console.log('⚠️ Could not generate download URL:', error.message);
    }

    res.status(200).json({
      success: true,
      data: fileData,
    });
  } catch (error) {
    console.error('❌ Get file error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get file',
    });
  }
};

// ============================================================
// ✅ حذف ملف
// ============================================================

export const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const account = req.account;

    await storageService.deleteFile(fileId, account);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete file error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete file',
    });
  }
};

// ============================================================
// ✅ إعادة رفع ملف مفقود (للمدير)
// ============================================================

export const reuploadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portalId || req.headers['x-portal-id'];
    const accountId = req.accountId || req.user?.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const file = await File.findOne({ _id: id, portalId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in database',
      });
    }

    console.log('🔄 Re-uploading file:');
    console.log('  - File ID:', file._id);
    console.log('  - Original name:', file.originalName);
    console.log('  - Old storage key:', file.storageKey);

    const result = await storageService.uploadFile(
      req.file,
      portalId,
      accountId,
      file.category || 'request',
      file.requestId || null,
      file.metadata || {}
    );

    const oldKey = file.storageKey;
    file.storageKey = result.key;
    file.size = req.file.size;
    file.mimeType = req.file.mimetype;
    file.originalName = req.file.originalname;
    file.updatedAt = new Date();
    await file.save();

    console.log('✅ File re-uploaded successfully:');
    console.log('  - New storage key:', result.key);
    console.log('  - Old storage key (replaced):', oldKey);

    if (file.requestId) {
      const request = await Request.findById(file.requestId);
      if (request) {
        request.files?.forEach(f => {
          if (f.fileId?.toString() === file._id.toString()) {
            f.fileId = file._id;
          }
        });
        request.paymentProofs?.forEach(p => {
          if (p.fileId?.toString() === file._id.toString()) {
            p.fileId = file._id;
          }
        });
        await request.save();
      }
    }

    res.json({
      success: true,
      data: {
        file: {
          _id: file._id,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          storageKey: file.storageKey,
        },
        oldKey,
      },
      message: 'تم إعادة رفع الملف بنجاح',
    });
  } catch (error) {
    console.error('❌ Reupload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to re-upload file',
    });
  }
};

// ============================================================
// ✅ ✅ جلب ملفات المختص (محدث)
// ============================================================

export const getSpecialistFiles = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { category, search, page = 1, limit = 20 } = req.query;

    console.log('📤 Fetching specialist files for:', accountId);

    // التحقق من أن المستخدم مختص
    if (req.account?.role !== 'specialist' && req.account?.role !== 'portal_admin' && req.account?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only specialists can access this endpoint',
      });
    }

    const query = {
      portalId,
      uploadedBy: accountId,
      isDeleted: { $ne: true },
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const files = await File.find(query)
      .populate('requestId', 'requestNumber title status')
      .populate('uploadedBy', 'profile.fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await File.countDocuments(query);

    const formattedFiles = files.map(file => ({
      _id: file._id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      category: file.category,
      requestId: file.requestId?._id,
      requestNumber: file.requestId?.requestNumber,
      requestTitle: file.requestId?.title,
      requestStatus: file.requestId?.status,
      isEncrypted: file.isEncrypted,
      createdAt: file.createdAt,
      uploadedBy: file.uploadedBy,
      storageKey: file.storageKey,
    }));

    res.json({
      success: true,
      data: formattedFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching specialist files:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch files',
    });
  }
};
// backend/src/controllers/file.controller.js

// ============================================================
// ✅ ✅ تشغيل فيديو آمن (مع دعم التوكن)
// ============================================================

export const streamVideoSecure = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.headers['x-portal-id'] || req.query.portalId;
    let account = req.account;

    console.log('🎬 Streaming video (secure):', fileId);
    console.log('  - Query token:', req.query.token ? 'Present' : 'Missing');
    console.log('  - Headers token:', req.headers.authorization ? 'Present' : 'Missing');

    // ✅ محاولة الحصول على التوكن من Query String
    const tokenFromQuery = req.query.token;
    
    if (!account && tokenFromQuery) {
      try {
        const decoded = jwt.verify(tokenFromQuery, process.env.JWT_SECRET);
        console.log('✅ Token decoded from query');
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via query token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from query invalid:', err.message);
      }
    }

    // ✅ إذا كان التوكن في الـ Headers، استخدمه
    if (!account && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded from headers');
        if (decoded) {
          account = await Account.findById(decoded.id || decoded._id);
          console.log('✅ Account found via headers token:', account?._id);
        }
      } catch (err) {
        console.log('⚠️ Token from headers invalid:', err.message);
      }
    }

    console.log('  - Final Account:', account?._id);
    console.log('  - Role:', account?.role);

    if (!account) {
      console.log('❌ No account found, unauthorized');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
        code: 'NO_TOKEN',
      });
    }

    // ✅ البحث عن الملف
    const file = await File.findOne({ _id: fileId, isDeleted: { $ne: true } });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // ✅ التحقق من البوابة
    const accountPortalId = account.portalId?.toString() || account.portalId;
    if (file.portalId.toString() !== (portalId || accountPortalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Invalid portal',
        code: 'ACCESS_DENIED',
      });
    }

    // ✅ التحقق من الصلاحية
    const hasAccess = await canAccessFileWithSubscription(file, account);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this video',
        code: 'ACCESS_DENIED',
      });
    }

    // ✅ تحميل الفيديو
    const fileBuffer = await storageService.getFile(file);
    const fileSize = fileBuffer.length;
    const range = req.headers.range;

    // ✅ إعداد رؤوس الأمان
    const headers = {
      'Content-Type': file.mimeType || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Portal-Id, Range',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    // ✅ دعم البث الجزئي
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const chunk = fileBuffer.slice(start, end + 1);

      res.writeHead(206, {
        ...headers,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
      });
      res.end(chunk);
    } else {
      res.writeHead(200, {
        ...headers,
        'Content-Length': fileSize,
      });
      res.end(fileBuffer);
    }

    console.log('✅ Video streamed securely:', fileId);
  } catch (error) {
    console.error('❌ Stream video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to stream video',
    });
  }
};
// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================

export default {
  uploadFile,
  downloadFileDirect,
  streamVideo,
  streamVideoSecure,  // ✅ أضف هذا
  viewFile,
  getFile,
  getFileInfo,
  deleteFile,
  reuploadFile,
  getSpecialistFiles,
};