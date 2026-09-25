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
import { extractPortalId, isSamePortal } from '../utils/portalHelpers.js';
import thumbnailService from '../services/thumbnail.service.js';
import mongoose from 'mongoose';
// ============================================================
// ✅ دالة مساعدة: هل المستخدم مدير؟
// ============================================================
const isAdmin = (account) => {
  return account?.role === 'portal_admin' || account?.role === 'super_admin';
};
const checkPortalAccess = (file, account, portalId) => {
  if (!file || !account) return false;

  const filePortalId = extractPortalId(file.portalId);
  if (!filePortalId) return false;

  // Super admin
  if (account.role === 'super_admin') {
    if (!portalId) return false;
    return filePortalId === extractPortalId(portalId);
  }

  // باقي الأدوار
  const accountPortalId = extractPortalId(account.portalId);
  if (!accountPortalId) return false;

  if (portalId && extractPortalId(portalId) !== accountPortalId) {
    return false;
  }

  if (filePortalId !== accountPortalId) {
    return false;
  }

  return true;
};
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

const canAccessFileWithSubscription = async (file, account) => {
  if (isAdmin(account)) return true;
  if (!file.isEncrypted) return true;

  try {
    const subscription = await Subscription.findOne({
      portalId: extractPortalId(file.portalId),
      accountId: account._id,
      status: 'active',
      paymentStatus: 'paid',
      isDeleted: { $ne: true },
      endDate: { $gt: new Date() },
    });

    return !!subscription;
  } catch (err) {
    console.error('❌ Subscription check error:', err);
    return false;
  }
};

// ============================================================
// ✅ إضافة علامة مائية على ملف PDF
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
    
    const fullWatermark = accountName 
      ? `${watermarkText} - ${accountName}`
      : watermarkText;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      page.drawText(fullWatermark, {
        x: width / 2 - 150,
        y: height / 2 - 20,
        size: fontSize,
        color: color,
        opacity: opacity,
        rotate: degrees(-45),
      });

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
// ✅ دالة مساعدة: استخراج الحساب من التوكن
// ============================================================
const getAccountFromRequest = async (req) => {
  let account = req.account;

  if (!account && req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
      if (decoded) {
        account = await Account.findById(decoded.id || decoded._id);
      }
    } catch (err) {
      console.log('⚠️ Token from query invalid:', err.message);
    }
  }

  if (!account && req.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded) {
        account = await Account.findById(decoded.id || decoded._id);
      }
    } catch (err) {
      console.log('⚠️ Token from headers invalid:', err.message);
    }
  }

  return account;
};
export const uploadFile = async (req, res) => {
  try {
    const portalId = req.portal?._id || req.portalId;
    const accountId = req.accountId || req.user?.id;
    const role = req.account?.role || 'customer';
    const { category, metadata, requestId } = req.body;

    console.log('📁 Uploading file...');
    console.log('  - Portal:', portalId);
    console.log('  - Account:', accountId);
    console.log('  - Role:', role);
    console.log('  - Category:', category);

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // ✅ تعريف المتغيرات في الأعلى (قبل أي شرط)
    let thumbnailFile = null;
    let videoDuration = 0;

    const allowedCategories = [
      'payment_proof',
      'user',
      'request_file',
      'request',
      'proof',
      'delivery',
      'modification',
      'support',
      'profile',
      'message',
      'platform_sample',
      'learning_content',
      'video',
      'attachment',
      'content',
      'summary',
      'service_form',
      'library',
      'library_file',
      'document',
      'image',
      'infographic',
      'thumbnail',
      'about',
      'offer',
      'promotion',
      'banner',
      'slide',
      'cover',
      'logo',
      'sections-bg',
      'sections-pattern',
    ];

    const finalCategory = category || 'user';

    if (role === 'customer' && !allowedCategories.includes(finalCategory)) {
      return res.status(403).json({
        success: false,
        message: `Category "${finalCategory}" is not allowed for customers.`,
        allowed: allowedCategories,
      });
    }

    const specialistAllowed = [...allowedCategories, 'work', 'final', 'delivery'];

    if (role === 'specialist' && !specialistAllowed.includes(finalCategory)) {
      return res.status(403).json({
        success: false,
        message: `Category "${finalCategory}" is not allowed for specialists.`,
        allowed: specialistAllowed,
      });
    }

    // ============================================================
    // رفع الملف
    // ============================================================
    const file = await saveFile({
      file: req.file,
      portalId,
      accountId,
      category: finalCategory,
      metadata: metadata
        ? typeof metadata === 'string'
          ? JSON.parse(metadata)
          : metadata
        : {},
      requestId: requestId || null,
    });

    console.log(
      '✅ File uploaded successfully:',
      file._id,
      '| Portal:',
      portalId
    );

    // ============================================================
    // ✅ استخراج صورة مصغرة إذا كان فيديو
    // ============================================================
    if (
      req.file.mimetype.startsWith('video/') &&
      finalCategory === 'video'
    ) {
      try {
        console.log('🎬 Extracting thumbnail for video...');

        const thumbnailResult = await thumbnailService.extractAndUpload(
          req.file.buffer,
          portalId,
          accountId,
          { width: 640, height: 360 }
        );

        thumbnailFile = thumbnailResult;
        videoDuration = thumbnailResult.duration || 0;
        console.log('📊 Video duration:', videoDuration, 'seconds');
        console.log('✅ Thumbnail created:', thumbnailFile._id);
      } catch (thumbError) {
        console.warn('⚠️ Thumbnail failed:', thumbError.message);
      }
    }

    // ============================================================
    // ✅ ✅ ✅ بناء URL العام للملف
    // ============================================================
    const protocol =
      req.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
      req.protocol ||
      'https';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // ✅ URL يستخدم حسب نوع الملف
    const isVideo = req.file.mimetype.startsWith('video/');
    const endpoint = isVideo ? 'stream' : 'thumbnail';
    const fileUrl = `${baseUrl}/api/files/${endpoint}/${file._id}?portalId=${portalId}`;

    console.log('🔗 Generated URL:', fileUrl);

    // ============================================================
    // ✅ Response
    // ============================================================
    return res.status(201).json({
      success: true,
      data: {
        file: {
          ...file.toObject(),
          url: fileUrl,  // ✅ URL داخل file
        },
        url: fileUrl,    // ✅ URL في الجذر
        thumbnail: thumbnailFile,
        thumbnailId: thumbnailFile?._id,
        duration: videoDuration,
      },
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('❌ Upload file error:', error);

    if (res.headersSent) {
      console.warn('⚠️ Headers already sent, cannot send error response');
      return;
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file',
    });
  }
};
// ============================================================
// ✅ معاينة ملف (مع علامة مائية)
// ============================================================
export const viewFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.portal?._id || req.portalId;
    const account = req.account;

    console.log('👁️ Viewing file:', fileId);

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    console.log(
      '  - Account:',
      account._id,
      '| Role:',
      account.role,
      '| Portal:',
      portalId
    );

    // 🔐 البحث عن الملف داخل البوابة الحالية فقط
    const file = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // 🔐 التحقق من البوابة
    if (!checkPortalAccess(file, account, portalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Invalid portal',
        code: 'FILE_PORTAL_ACCESS_DENIED',
      });
    }

    // 🔐 التحقق من صلاحية مشاهدة الملف
    const hasAccess = await canAccessFileWithSubscription(
      file,
      account
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this file',
        code: 'FILE_ACCESS_DENIED',
      });
    }

    let fileBuffer = await storageService.getFile(file);

    // إضافة علامة مائية للـ PDF
    if (file.mimeType === 'application/pdf') {
      try {
        const userName =
          account.profile?.fullName ||
          account.email ||
          'User';

        const watermarkText = 'Confidential';

        fileBuffer = await addWatermarkToPDF(
          fileBuffer,
          watermarkText,
          userName
        );

        console.log('✅ Watermark added to PDF');
      } catch (watermarkError) {
        console.error(
          '⚠️ Failed to add watermark:',
          watermarkError.message
        );
      }
    }

    const filename = encodeURIComponent(file.originalName);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${filename}"`
    );
    res.setHeader('Content-Length', fileBuffer.length);

    // 🔐 منع التخزين المؤقت للملفات المحمية
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, X-Portal-Id'
    );

    console.log(
      '✅ File viewed successfully:',
      fileId,
      '| Portal:',
      portalId
    );

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
    const portalId = req.portalId;
    const account = req.account;

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const file = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    if (!checkPortalAccess(file, account, portalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Invalid portal',
        code: 'FILE_PORTAL_ACCESS_DENIED',
      });
    }

    const hasAccess = await canAccessFileWithSubscription(file, account);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this file',
        code: 'FILE_ACCESS_DENIED',
      });
    }

    const { stream, contentLength } = await storageService.getFileStream(file);

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', contentLength);
    res.setHeader('Access-Control-Allow-Origin', '*');

    stream.on('error', (error) => {
      console.error('❌ Download stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Download failed' });
      } else {
        res.destroy(error);
      }
    });

    stream.pipe(res);

  } catch (error) {
    console.error('❌ Download error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to download',
      });
    }
  }
};
export const streamVideo = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.portal?._id || req.portalId;
    const account = req.account;

    if (!account) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!portalId) {
      return res.status(400).json({ success: false, message: 'Portal required' });
    }

    const file = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (!checkPortalAccess(file, account, portalId)) {
      return res.status(403).json({ success: false, message: 'Portal denied' });
    }

    const hasAccess = await canAccessFileWithSubscription(file, account);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'No permission' });
    }

    // ✅ استخدام stream
    const fileStream = await storageService.getFileStream(file);

    res.setHeader('Content-Type', file.mimeType || 'video/mp4');
    res.setHeader('Content-Length', file.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');

    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const streamVideoSecure = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.portalId;
    const account = await getAccountFromRequest(req);

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const file = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    if (!checkPortalAccess(file, account, portalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Invalid portal',
        code: 'FILE_PORTAL_ACCESS_DENIED',
      });
    }

    const hasAccess = await canAccessFileWithSubscription(file, account);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this video',
        code: 'FILE_ACCESS_DENIED',
      });
    }

    const fileSize = Number(file.size);
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return res.status(500).json({
        success: false,
        message: 'Invalid file size',
        code: 'INVALID_FILE_SIZE',
      });
    }

    // ✅ Headers موحدة
    const headers = {
      'Content-Type': file.mimeType || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Portal-Id, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
      'Content-Disposition': 'inline',
      // ⚠️ لا نضع X-Content-Type-Options لأنها تكسر الفيديو
    };

    if (req.method === 'OPTIONS') {
      return res.writeHead(204, headers).end();
    }

    const range = req.headers.range;

    // ✅ بدون Range
    if (!range) {
      const { stream, contentLength } = await storageService.getFileStream(file);

      res.writeHead(200, {
        ...headers,
        'Content-Length': contentLength,
      });

      stream.on('error', (error) => {
        console.error('❌ Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Stream failed' });
        } else {
          res.destroy(error);
        }
      });

      stream.pipe(res);
      return;
    }

    // ✅ مع Range
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (!match) {
      res.writeHead(416, {
        ...headers,
        'Content-Range': `bytes */${fileSize}`,
      });
      return res.end();
    }

    let start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
    end = Math.min(end, fileSize - 1);

    if (start >= fileSize || start > end) {
      res.writeHead(416, {
        ...headers,
        'Content-Range': `bytes */${fileSize}`,
      });
      return res.end();
    }

    const rangeHeader = `bytes=${start}-${end}`;

    const { stream, contentLength, contentRange } = 
      await storageService.getFileStream(file, rangeHeader);

    res.writeHead(206, {
      ...headers,
      'Content-Range': contentRange || `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': contentLength,
    });

    stream.on('error', (error) => {
      console.error('❌ Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Stream failed' });
      } else {
        res.destroy(error);
      }
    });

    stream.pipe(res);

    console.log(`✅ Video streamed: ${start}-${end}/${fileSize}`);

  } catch (error) {
    console.error('❌ Stream error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to stream',
      });
    }
    if (!res.destroyed) res.destroy(error);
  }
};

export const getFileInfo = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.portal?._id || req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const fileRecord = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!fileRecord) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const fileInfo = await storageService.getFileInfo(
  fileId,
  portalId
);
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
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

export const getFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const portalId = req.portal?._id || req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    const file = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    })
      .populate('accountId', 'profile.fullName email')
      .populate('requestId', 'title status');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // 🔐 Additional portal validation
    if (!checkPortalAccess(file, req.account, portalId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'FILE_PORTAL_ACCESS_DENIED',
      });
    }

    const fileData = file.toObject();

    try {
      const url = await storageService.getFileUrl(
        fileId,
        req.account,
        3600,
        portalId
      );

      fileData.downloadUrl = url;
    } catch (error) {
      console.log(
        '⚠️ Could not generate download URL:',
        error.message
      );
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
export const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const account = req.account;
    const portalId = req.portal?._id || req.portalId;

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    await storageService.deleteFile(
      fileId,
      account,
      portalId
    );

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
// ✅ إعادة رفع ملف موجود مع التحقق من البوابة والملكية
// ============================================================
export const reuploadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.portal?._id || req.portalId;
    const account = req.account;
    const accountId = req.accountId;

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'Portal context is required',
        code: 'PORTAL_ID_REQUIRED',
      });
    }

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Account ID is required',
        code: 'ACCOUNT_ID_REQUIRED',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // 🔐 البحث عن الملف داخل البوابة الحالية فقط
    const file = await File.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found in this portal',
        code: 'FILE_NOT_FOUND',
      });
    }

    // 🔐 التحقق من صلاحية الوصول للملف
    if (!checkPortalAccess(file, account, portalId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this file',
        code: 'FILE_PORTAL_ACCESS_DENIED',
      });
    }

    // 🔐 إعادة الرفع مسموحة لمالك الملف أو Portal Admin أو Super Admin
    const isOwner =
      file.accountId?.toString() === accountId.toString();

    const isPortalAdmin =
      account.role === 'portal_admin';

    const isSuperAdmin =
      account.role === 'super_admin';

    if (!isOwner && !isPortalAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to re-upload this file',
        code: 'FILE_REUPLOAD_ACCESS_DENIED',
      });
    }

    console.log(
      `🔄 Re-uploading file: ${file._id}, portal: ${portalId}`
    );

    // رفع النسخة الجديدة باستخدام نفس البوابة
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

    console.log('✅ File re-uploaded successfully');

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
// ✅ جلب ملفات المختص
// ============================================================
export const getSpecialistFiles = async (req, res) => {
  try {
    const accountId = req.accountId;
    const portalId = req.portalId;
    const { category, search, page = 1, limit = 20 } = req.query;

    console.log('📤 Fetching specialist files for:', accountId);

    if (!isAdmin(req.account) && req.account?.role !== 'specialist') {
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
// ============================================================
// ✅ endpoint عام للملفات العامة (بدون auth)
// يشمل: الصور المصغرة + صور Hero + فيديوهات Hero
// ============================================================
export const getThumbnailPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const portalId = req.query.portalId || req.headers['x-portal-id'];

    if (!portalId) {
      return res.status(400).json({
        success: false,
        message: 'portalId is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID',
      });
    }

    // ✅ الفئات المسموحة للعرض العام
    const publicCategories = [
      'thumbnail',
      'hero-image',
      'hero-video',
      'popup-image',
      'side-banner-image',
      'mid-banner-image',      // ✅ جديد
      'slide-image',           // ✅ جديد
      'splash-logo',           // ✅ جديد
      'sections-bg',           // ✅ ← الأهم
      'sections-pattern',      // ✅ جديد
      'library',
      'image',
    ];

    console.log('🔍 getThumbnailPublic:', {
      id,
      portalId,
      publicCategories,
    });

    const file = await File.findOne({
      _id: id,
      portalId,
      isDeleted: { $ne: true },
      category: { $in: publicCategories },
    });

    console.log('📄 File lookup result:', file ? {
      _id: file._id,
      category: file.category,
      portalId: file.portalId,
      mimeType: file.mimeType,
      size: file.size,
    } : 'NOT FOUND');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // ✅ جلب الملف كـ stream
    const { stream, contentLength } = await storageService.getFileStream(file);

    // ✅ Headers
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', contentLength || file.size);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    // ✅ دعم Range للفيديوهات
    const range = req.headers.range;
    if (range && file.mimeType?.startsWith('video/')) {
      const match = range.match(/^bytes=(\d*)-(\d*)$/);
      if (match) {
        let start = match[1] ? parseInt(match[1], 10) : 0;
        let end = match[2] ? parseInt(match[2], 10) : (contentLength || file.size) - 1;
        end = Math.min(end, (contentLength || file.size) - 1);

        const chunksize = end - start + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength || file.size}`);
        res.setHeader('Content-Length', chunksize);

        stream.pipe(res);
        return;
      }
    }

    if (req.method === 'OPTIONS') {
      return res.writeHead(204).end();
    }

    stream.on('error', (error) => {
      console.error('❌ Thumbnail stream error:', error);
      if (!res.headersSent) res.status(500).end();
      else res.destroy(error);
    });

    stream.pipe(res);
  } catch (error) {
    console.error('❌ Get thumbnail error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

// ============================================================
// ✅ تصدير جميع الدوال
// ============================================================
export default {
  uploadFile,
  downloadFileDirect,
  streamVideo,
  streamVideoSecure,
  viewFile,
  getFile,
  getFileInfo,
  deleteFile,
  reuploadFile,
  getSpecialistFiles,
  getThumbnailPublic,
};