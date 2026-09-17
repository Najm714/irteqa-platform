// backend/src/services/storage.service.js
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { File } from '../models/File.model.js';
import { extractPortalId } from '../utils/portalHelpers.js';

// ============================================================
// ✅ مزود التخزين المحلي (Local Storage) — مع دعم Range
// ============================================================
class LocalStorageProvider {
  constructor() {
    this.basePath = path.join(process.cwd(), 'uploads');
    this.ensureDirectory();
  }

  ensureDirectory() {
    const dirs = ['uploads', 'uploads/portals', 'uploads/temp', 'uploads/files'];
    for (const dir of dirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  getFullPath(key) {
    return path.join(this.basePath, key);
  }

  async upload(file, key, metadata = {}) {
    const fullPath = this.getFullPath(key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, file.buffer);
    return {
      key,
      size: file.size,
      etag: crypto.createHash('md5').update(file.buffer).digest('hex'),
    };
  }

  async getUrl(key, expiresIn = 3600) {
    return `/uploads/${key}`;
  }

  async delete(key) {
    const fullPath = this.getFullPath(key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return true;
  }

  async exists(key) {
    return fs.existsSync(this.getFullPath(key));
  }

  async getInfo(key) {
    const fullPath = this.getFullPath(key);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const stats = fs.statSync(fullPath);
    return {
      size: stats.size,
      lastModified: stats.mtime,
    };
  }

  async getFile(key) {
    const fullPath = this.getFullPath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found on disk: ${key}`);
    }
    return fs.readFileSync(fullPath);
  }

  // ✅ ✅ getFileStream مع دعم Range كامل
  async getFileStream(key, range = null) {
    const fullPath = this.getFullPath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found on disk: ${key}`);
    }

    const fileSize = fs.statSync(fullPath).size;

    // بدون Range → الملف كاملاً
    if (!range) {
      return {
        stream: fs.createReadStream(fullPath),
        contentLength: fileSize,
        contentRange: null,
        acceptRanges: 'bytes',
      };
    }

    // ✅ مع Range
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (!match) {
      throw new Error('Invalid Range header');
    }

    const startString = match[1];
    const endString = match[2];

    let start;
    let end;

    // bytes=-N
    if (!startString && endString) {
      const suffixLength = parseInt(endString, 10);
      start = Math.max(fileSize - suffixLength, 0);
      end = fileSize - 1;
    }
    // bytes=N-
    else if (startString && !endString) {
      start = parseInt(startString, 10);
      end = fileSize - 1;
    }
    // bytes=N-M
    else if (startString && endString) {
      start = parseInt(startString, 10);
      end = parseInt(endString, 10);
    } else {
      throw new Error('Invalid Range header');
    }

    end = Math.min(end, fileSize - 1);

    if (start < 0 || end < 0 || start >= fileSize || start > end) {
      throw new Error('Range Not Satisfiable');
    }

    return {
      stream: fs.createReadStream(fullPath, { start, end }),
      contentLength: end - start + 1,
      contentRange: `bytes ${start}-${end}/${fileSize}`,
      acceptRanges: 'bytes',
    };
  }
}

// ============================================================
// ✅ مزود تخزين R2 (Cloudflare) — مع دعم Range كامل
// ============================================================
class R2StorageProvider {
  constructor() {
    this.client = new S3Client({
      endpoint: config.r2.endpoint,
      region: 'auto',
      credentials: {
        accessKeyId: config.r2.accessKey,
        secretAccessKey: config.r2.secretKey,
      },
      forcePathStyle: true,
    });
    this.bucket = config.r2.bucket;
    this.publicUrl = config.r2.publicUrl;
  }

  // ✅ تنظيف المفتاح
  sanitizeKey(key) {
    if (!key) return key;

    let cleaned = key.replace(/[^\x20-\x7E\u0600-\u06FF]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.trim();

    return cleaned;
  }

  async upload(file, key, metadata = {}) {
    const cleanKey = this.sanitizeKey(key);

    console.log('📤 Uploading to R2:');
    console.log('  - Key:', cleanKey);
    console.log('  - Size:', file.size);

    const uploadParams = {
      Bucket: this.bucket,
      Key: cleanKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: encodeURIComponent(file.originalname),
        uploadDate: new Date().toISOString(),
        ...metadata,
      },
    };

    try {
      const command = new PutObjectCommand(uploadParams);
      const result = await this.client.send(command);

      return {
        key: cleanKey,
        size: file.size,
        etag: result.ETag,
      };
    } catch (error) {
      console.error('❌ R2 upload error:', error);
      throw error;
    }
  }

  async getUrl(key, expiresIn = 3600) {
    const cleanKey = this.sanitizeKey(key);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });
    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key) {
    const cleanKey = this.sanitizeKey(key);
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });
    await this.client.send(command);
    return true;
  }

  async exists(key) {
    try {
      const cleanKey = this.sanitizeKey(key);
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.Code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getInfo(key) {
    try {
      const cleanKey = this.sanitizeKey(key);
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      const response = await this.client.send(command);
      return {
        size: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata,
      };
    } catch (error) {
      if (error.name === 'NotFound' || error.Code === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  async list(prefix) {
    const cleanPrefix = this.sanitizeKey(prefix);
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: cleanPrefix,
    });
    const response = await this.client.send(command);
    return response.Contents || [];
  }

  // ✅ getFile — يجمع في buffer (للملفات الصغيرة فقط)
  async getFile(key) {
    const cleanKey = this.sanitizeKey(key);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });

    const response = await this.client.send(command);

    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  // ============================================================
  // ✅ ✅ getFileStream — دعم Range كامل (الحل الجذري)
  // ============================================================
  async getFileStream(key, range = null) {
    const cleanKey = this.sanitizeKey(key);

    const commandParams = {
      Bucket: this.bucket,
      Key: cleanKey,
    };

    // ✅ إضافة Range إذا تم توفيره
    if (range) {
      commandParams.Range = range;
    }

    const command = new GetObjectCommand(commandParams);
    const response = await this.client.send(command);

    // ✅ R2/S3 يرجع ContentRange عند طلب Range
    return {
      stream: response.Body,
      contentLength: response.ContentLength,
      contentRange: response.ContentRange || null,
      acceptRanges: response.AcceptRanges || 'bytes',
    };
  }
}

// ============================================================
// ✅ خدمة التخزين الرئيسية — موحدة وآمنة
// ============================================================
class StorageService {
  constructor() {
    const useR2 = config.r2 && config.r2.endpoint && config.r2.accessKey && config.r2.secretKey;

    this.provider = useR2
      ? new R2StorageProvider()
      : new LocalStorageProvider();

    this.providerType = useR2 ? 'r2' : 'local';
    console.log(`📁 Storage provider: ${this.providerType.toUpperCase()}`);
  }

  // ✅ إنشاء مفتاح آمن
  generateKey(portalId, accountId, originalName, category = 'general') {
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);

    const encodedName = encodeURIComponent(baseName).substring(0, 100);
    const random = crypto.randomBytes(8).toString('hex');

    return `portals/${portalId}/accounts/${accountId}/${category}/${timestamp}-${random}-${encodedName}${extension}`;
  }

  // ✅ رفع ملف
  async uploadFile(file, portalId, accountId, category, requestId = null, metadata = {}) {
    if (!file) throw new Error('File is required');
    if (!portalId) throw new Error('Portal context is required');
    if (!accountId) throw new Error('Account ID is required');

    console.log('📤 Uploading file:');
    console.log('  - Original name:', file.originalname);
    console.log('  - Portal:', portalId);
    console.log('  - Account:', accountId);
    console.log('  - Category:', category);

    const key = this.generateKey(portalId, accountId, file.originalname, category);

    await this.provider.upload(file, key, metadata);

    const fileRecord = new File({
      portalId,
      accountId,
      requestId,
      originalName: file.originalname,
      storageKey: key,
      mimeType: file.mimetype,
      size: file.size,
      category,
      storageProvider: this.providerType,
      visibility: 'private',
      isEncrypted: false,
      metadata: {
        ...metadata,
        uploadDate: new Date(),
        originalKey: key,
      },
    });

    await fileRecord.save();

    return {
      file: fileRecord,
      key,
      provider: this.providerType,
    };
  }

  // ✅ الحصول على رابط الملف
  async getFileUrl(fileId, account, expiresIn = 3600, portalId = null) {
    if (!account) throw new Error('Authentication required');
    if (!portalId) throw new Error('Portal context is required');

    const fileRecord = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!fileRecord) throw new Error('File not found');

    if (!this.canAccessFile(fileRecord, account, portalId)) {
      throw new Error('Access denied to this file');
    }

    return await this.provider.getUrl(fileRecord.storageKey, expiresIn);
  }

  // ✅ الحصول على محتوى الملف (buffer)
  async getFile(fileRecord) {
    console.log('📂 Getting file from storage:', fileRecord._id);
    console.log('  - Storage key:', fileRecord.storageKey);
    console.log('  - Provider:', this.providerType);

    return await this.provider.getFile(fileRecord.storageKey);
  }

  // ============================================================
  // ✅ ✅ getFileStream — موحدة مع دعم Range (الحل الجذري)
  // ============================================================
  async getFileStream(fileRecord, range = null) {
    console.log('📂 Getting file stream:', {
      fileId: fileRecord._id,
      provider: this.providerType,
      range: range || 'full',
    });

    try {
      const result = await this.provider.getFileStream(
        fileRecord.storageKey,
        range
      );

      console.log('✅ Stream ready:', {
        contentLength: result.contentLength,
        contentRange: result.contentRange,
      });

      return result;
    } catch (error) {
      console.error('❌ Get file stream error:', error.message);
      throw error;
    }
  }

  // ✅ حذف ملف
  async deleteFile(fileId, account, portalId = null) {
    if (!account) throw new Error('Authentication required');
    if (!fileId) throw new Error('File ID is required');
    if (!portalId) throw new Error('Portal context is required');

    const fileRecord = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!fileRecord) throw new Error('File not found');

    const filePortalId = extractPortalId(fileRecord.portalId);
    const accountPortalId = extractPortalId(account.portalId);

    if (!filePortalId) throw new Error('File portal context is missing');

    // SUPER ADMIN
    if (account.role === 'super_admin') {
      if (filePortalId !== extractPortalId(portalId)) {
        throw new Error('You are not authorized to access this portal');
      }
    } else {
      if (!accountPortalId) {
        throw new Error('Your account is not assigned to a portal');
      }
      if (filePortalId !== accountPortalId) {
        throw new Error('You are not authorized to access this portal');
      }
      if (extractPortalId(portalId) !== accountPortalId) {
        throw new Error('You are not authorized to access this portal');
      }
    }

    const isOwner =
      fileRecord.accountId?.toString() === account._id.toString();
    const isPortalAdmin = account.role === 'portal_admin';

    if (!isOwner && !isPortalAdmin && account.role !== 'super_admin') {
      throw new Error('You do not have permission to delete this file');
    }

    await this.provider.delete(fileRecord.storageKey);

    fileRecord.isDeleted = true;
    fileRecord.deletedAt = new Date();
    fileRecord.deletedBy = account._id;

    await fileRecord.save();

    return true;
  }

  // ✅ ✅ canAccessFile — موحدة وآمنة (بدون مشاكل populated)
  canAccessFile(file, account, portalId = null) {
    if (!file || !account) return false;

    const filePortalId = extractPortalId(file.portalId);
    if (!filePortalId) return false;

    // SUPER ADMIN
    if (account.role === 'super_admin') {
      if (!portalId) return false;
      return filePortalId === extractPortalId(portalId);
    }

    // باقي الأدوار
    const accountPortalId = extractPortalId(account.portalId);
    if (!accountPortalId) return false;

    if (filePortalId !== accountPortalId) return false;

    if (portalId && extractPortalId(portalId) !== accountPortalId) {
      return false;
    }

    // Public files
    if (file.visibility === 'public') return true;

    // Owner
    if (file.accountId?.toString() === account._id.toString()) return true;

    // Portal admin
    if (account.role === 'portal_admin') return true;

    // Super admin (already checked above, لكن للاحتياط)
    if (account.role === 'super_admin') return true;

    // Non-encrypted
    if (!file.isEncrypted) return true;

    return false;
  }

  // ✅ الحصول على معلومات الملف
  async getFileInfo(fileId, portalId = null) {
    if (!portalId) throw new Error('Portal context is required');

    const fileRecord = await File.findOne({
      _id: fileId,
      portalId,
      isDeleted: { $ne: true },
    });

    if (!fileRecord) throw new Error('File not found');

    return {
      id: fileRecord._id,
      name: fileRecord.originalName,
      size: fileRecord.size,
      mimeType: fileRecord.mimeType,
      category: fileRecord.category,
      visibility: fileRecord.visibility,
      storageProvider: fileRecord.storageProvider,
      createdAt: fileRecord.createdAt,
      uploadedBy: fileRecord.accountId,
      requestId: fileRecord.requestId,
      isEncrypted: fileRecord.isEncrypted,
      storageKey: fileRecord.storageKey,
    };
  }

  // ✅ التحقق من وجود الملف
  async fileExists(fileId) {
    const fileRecord = await File.findById(fileId);
    if (!fileRecord) return false;
    return await this.provider.exists(fileRecord.storageKey);
  }

  // ✅ إصلاح المفاتيح التالفة
  async fixCorruptedKeys() {
    const files = await File.find({
      storageKey: { $regex: /[^\x20-\x7E\u0600-\u06FF]/ },
    });

    console.log(`📁 Found ${files.length} files with corrupted keys`);

    let fixedCount = 0;
    for (const file of files) {
      try {
        const cleanKey = file.storageKey
          .replace(/[^\x20-\x7E\u0600-\u06FF]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanKey !== file.storageKey) {
          console.log(`🔄 Fixing key for file ${file._id}:`);
          console.log(`   Old: ${file.storageKey}`);
          console.log(`   New: ${cleanKey}`);

          file.storageKey = cleanKey;
          await file.save();
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error fixing file ${file._id}:`, error.message);
      }
    }

    console.log(`✅ Fixed ${fixedCount} files`);
    return fixedCount;
  }
}

export const storageService = new StorageService();
export default storageService;