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

// ============================================================
// ✅ مزود التخزين المحلي (Local Storage)
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

  async getFileStream(key) {
    const fullPath = this.getFullPath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found on disk: ${key}`);
    }
    return fs.createReadStream(fullPath);
  }
}

// ============================================================
// ✅ مزود تخزين R2 (Cloudflare) - مُحسَّن بالكامل
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

  // ✅ تنظيف المفتاح من الأحرف غير القابلة للقراءة
  sanitizeKey(key) {
    if (!key) return key;
    
    // إزالة الأحرف غير القابلة للطباعة
    let cleaned = key.replace(/[^\x20-\x7E\u0600-\u06FF]/g, '');
    
    // توحيد المسافات
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // إزالة المسافات من البداية والنهاية
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  // ✅ إنشاء مفتاح آمن للتخزين
  generateSafeKey(portalId, accountId, originalName, category, timestamp) {
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    // ✅ استخدام encodeURIComponent لتشفير الأحرف العربية
    const encodedName = encodeURIComponent(baseName).substring(0, 100);
    const random = crypto.randomBytes(8).toString('hex');
    const time = timestamp || Date.now();
    
    // ✅ بناء مفتاح آمن
    return `portals/${portalId}/accounts/${accountId}/${category}/${time}-${random}-${encodedName}${extension}`;
  }

  async upload(file, key, metadata = {}) {
    // ✅ تنظيف المفتاح
    const cleanKey = this.sanitizeKey(key);
    
    console.log('📤 Uploading to R2:');
    console.log('  - Original key:', key);
    console.log('  - Clean key:', cleanKey);
    console.log('  - Original name:', file.originalname);
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

  async getFile(key) {
    // ✅ محاولة عدة طرق للعثور على الملف
    const strategies = [
      () => this.tryGetFile(key),                    // المفتاح الأصلي
      () => this.tryGetFile(this.sanitizeKey(key)), // المفتاح المنظف
      () => this.tryGetFile(this.decodeKey(key)),   // المفتاح المفكوك ترميزه
      () => this.tryGetFile(this.encodeKey(key)),   // المفتاح المشفر
    ];

    let lastError = null;

    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (result) {
          return result;
        }
      } catch (error) {
        lastError = error;
        console.log(`⚠️ Strategy failed:`, error.message);
      }
    }

    throw lastError || new Error(`File not found: ${key}`);
  }

  async tryGetFile(key) {
    if (!key) return null;
    
    const cleanKey = this.sanitizeKey(key);
    console.log('📂 Trying key:', cleanKey);

    try {
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
    } catch (error) {
      if (error.name === 'NotFound' || error.Code === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  decodeKey(key) {
    try {
      return decodeURIComponent(key);
    } catch {
      return key;
    }
  }

  encodeKey(key) {
    try {
      return encodeURIComponent(key);
    } catch {
      return key;
    }
  }

  async getFileStream(key) {
    const cleanKey = this.sanitizeKey(key);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });
    
    const response = await this.client.send(command);
    return response.Body;
  }
}

// ============================================================
// ✅ خدمة التخزين الرئيسية - مُحسَّنة بالكامل
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

  // ✅ إنشاء مفتاح آمن للتخزين
  generateKey(portalId, accountId, originalName, category = 'general') {
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    // ✅ استخدام encodeURIComponent للأحرف العربية
    const encodedName = encodeURIComponent(baseName).substring(0, 100);
    const random = crypto.randomBytes(8).toString('hex');
    
    return `portals/${portalId}/accounts/${accountId}/${category}/${timestamp}-${random}-${encodedName}${extension}`;
  }

  // ✅ رفع ملف
  async uploadFile(file, portalId, accountId, category, requestId = null, metadata = {}) {
    // ✅ استخدام المفتاح الآمن
    const key = this.generateKey(portalId, accountId, file.originalname, category);

    console.log('📤 Uploading file:');
    console.log('  - Original name:', file.originalname);
    console.log('  - Category:', category);
    console.log('  - Generated key:', key);

    const result = await this.provider.upload(file, key, metadata);

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
  async getFileUrl(fileId, account, expiresIn = 3600) {
    const fileRecord = await File.findById(fileId);
    if (!fileRecord) {
      throw new Error('File not found');
    }

    if (!this.canAccessFile(fileRecord, account)) {
      throw new Error('Access denied to this file');
    }

    return await this.provider.getUrl(fileRecord.storageKey, expiresIn);
  }

  // ✅ الحصول على محتوى الملف
  async getFile(fileRecord) {
    try {
      console.log('📂 Getting file from storage:', fileRecord._id);
      console.log('  - Storage key:', fileRecord.storageKey);
      console.log('  - Provider:', this.providerType);
      
      return await this.provider.getFile(fileRecord.storageKey);
    } catch (error) {
      console.error('❌ Get file error:', error.message);
      
      // ✅ محاولة إصلاح المفتاح إذا كان الملف غير موجود
      if (error.message.includes('not found') || error.Code === 'NoSuchKey') {
        console.log('🔄 Attempting to fix storage key...');
        
        // ✅ محاولة إيجاد الملف باستخدام اسم الملف الأصلي
        const fixedKey = await this.tryFixKey(fileRecord);
        if (fixedKey) {
          console.log('✅ Found file with fixed key:', fixedKey);
          fileRecord.storageKey = fixedKey;
          await fileRecord.save();
          return await this.provider.getFile(fixedKey);
        }
      }
      
      throw error;
    }
  }

  // ✅ محاولة إصلاح المفتاح التالف
  async tryFixKey(fileRecord) {
    const strategies = [
      // 1. تنظيف المفتاح
      () => fileRecord.storageKey.replace(/[^\x20-\x7E\u0600-\u06FF]/g, '').trim(),
      
      // 2. محاولة فك الترميز
      () => {
        try {
          return decodeURIComponent(fileRecord.storageKey);
        } catch {
          return null;
        }
      },
      
      // 3. محاولة تشفير المفتاح
      () => {
        try {
          return encodeURIComponent(fileRecord.storageKey);
        } catch {
          return null;
        }
      },
      
      // 4. البحث عن الملف باستخدام الاسم الأصلي
      async () => {
        const keyParts = fileRecord.storageKey.split('/');
        const fileName = keyParts[keyParts.length - 1];
        const basePath = keyParts.slice(0, -1).join('/');
        
        if (!basePath || !fileName) return null;
        
        // البحث عن ملفات في نفس المجلد
        const files = await this.provider.list(basePath);
        for (const file of files) {
          if (file.Key && file.Key.includes(fileName.split('-').slice(0, -1).join('-'))) {
            return file.Key;
          }
        }
        return null;
      },
    ];

    for (const strategy of strategies) {
      try {
        let result;
        if (typeof strategy === 'function') {
          result = await strategy();
        }
        if (result && result !== fileRecord.storageKey) {
          // التحقق من وجود الملف بالمفتاح الجديد
          const exists = await this.provider.exists(result);
          if (exists) {
            return result;
          }
        }
      } catch (error) {
        console.log('⚠️ Strategy failed:', error.message);
      }
    }

    return null;
  }

  // ✅ الحصول على تدفق الملف
  async getFileStream(fileRecord) {
    try {
      console.log('📂 Getting file stream from storage:', fileRecord._id);
      return await this.provider.getFileStream(fileRecord.storageKey);
    } catch (error) {
      console.error('❌ Get file stream error:', error);
      throw error;
    }
  }

  // ✅ حذف الملف
  async deleteFile(fileId, account) {
    const fileRecord = await File.findById(fileId);
    if (!fileRecord) {
      throw new Error('File not found');
    }

    const isOwner = fileRecord.accountId.toString() === account._id.toString();
    const isAdmin = account.role === 'portal_admin' || account.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      throw new Error('You do not have permission to delete this file');
    }

    await this.provider.delete(fileRecord.storageKey);

    fileRecord.isDeleted = true;
    fileRecord.deletedAt = new Date();
    await fileRecord.save();

    return true;
  }

  // ===== ✅ التحقق من صلاحية الوصول =====
  canAccessFile(file, account) {
    if (!account) {
      return false;
    }

    // التحقق من البوابة
    const filePortalId = file.portalId?.toString?.() || file.portalId;
    const accountPortalId = account.portalId?._id?.toString?.() || account.portalId?.toString?.() || account.portalId;
    
    if (filePortalId !== accountPortalId) {
      return false;
    }

    // الملفات العامة متاحة للجميع
    if (file.visibility === 'public') {
      return true;
    }

    // مالك الملف يمكنه الوصول
    if (file.accountId.toString() === account._id.toString()) {
      return true;
    }

    // المدير لديه صلاحية مطلقة
    if (account.role === 'portal_admin' || account.role === 'super_admin') {
      return true;
    }

    // الملفات غير المشفرة متاحة للمستخدمين العاديين
    if (!file.isEncrypted) {
      return true;
    }

    return false;
  }

  // ✅ الحصول على معلومات الملف
  async getFileInfo(fileId) {
    const fileRecord = await File.findById(fileId);
    if (!fileRecord) {
      throw new Error('File not found');
    }

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
    if (!fileRecord) {
      return false;
    }
    return await this.provider.exists(fileRecord.storageKey);
  }

  // ✅ إصلاح المفاتيح التالفة في قاعدة البيانات
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