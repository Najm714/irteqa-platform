// src/services/stream.service.js
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

/**
 * ✅ خدمة Cloudflare Stream
 * توفر واجهة للتعامل مع خدمة بث الفيديو من Cloudflare
 */
class StreamService {
  constructor() {
    // ✅ التحقق من وجود المتغيرات البيئية
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.subdomain = process.env.CLOUDFLARE_STREAM_SUBDOMAIN || 'customer-816myz1pksxmupid.cloudflarestream.com';
    
    // ✅ التحقق من صحة الإعدادات
    if (!this.accountId) {
      console.warn('⚠️ CLOUDFLARE_ACCOUNT_ID is not set in environment variables');
    }
    if (!this.apiToken) {
      console.warn('⚠️ CLOUDFLARE_API_TOKEN is not set in environment variables');
    }
    
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  /**
   * ✅ الحصول على رؤوس الطلبات
   */
  _getHeaders(additionalHeaders = {}) {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }

  /**
   * ✅ التحقق من اكتمال الإعدادات
   */
  _isConfigured() {
    if (!this.accountId || !this.apiToken) {
      throw new Error('Cloudflare Stream is not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
    }
    return true;
  }

  // ============================================================
  // ✅ رفع الفيديوهات
  // ============================================================

  /**
   * ✅ رفع فيديو من ملف Buffer
   * @param {Buffer} fileBuffer - محتوى الملف
   * @param {string} filename - اسم الملف
   * @param {Object} options - خيارات إضافية
   * @param {string} options.contentType - نوع الملف
   * @param {Object} options.metadata - بيانات وصفية
   * @param {boolean} options.requireSignedURLs - طلب روابط موقعة
   * @param {number} options.maxDurationSeconds - الحد الأقصى للمدة
   * @param {string} options.creator - معرف المنشئ
   * @param {string} options.thumbnailTimestampPct - توقيت الصورة المصغرة
   */
  async uploadVideo(fileBuffer, filename, options = {}) {
    try {
      this._isConfigured();

      console.log(`📤 Uploading video: ${filename}`);
      console.log(`  - Size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      const formData = new FormData();
      
      // ✅ إضافة الملف
      formData.append('file', fileBuffer, {
        filename: filename,
        contentType: options.contentType || this._getContentType(filename),
      });

      // ✅ إضافة البيانات الوصفية
      if (options.metadata) {
        formData.append('meta', JSON.stringify(options.metadata));
      }

      // ✅ خيارات إضافية
      if (options.requireSignedURLs !== undefined) {
        formData.append('requireSignedURLs', options.requireSignedURLs ? 'true' : 'false');
      }

      if (options.maxDurationSeconds) {
        formData.append('maxDurationSeconds', options.maxDurationSeconds);
      }

      if (options.creator) {
        formData.append('creator', options.creator);
      }

      if (options.thumbnailTimestampPct) {
        formData.append('thumbnailTimestampPct', options.thumbnailTimestampPct);
      }

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Upload failed:', data.errors);
        throw new Error(data.errors?.[0]?.message || 'Upload failed');
      }

      const result = data.result;
      console.log(`✅ Video uploaded successfully: ${result.uid}`);

      return {
        success: true,
        uid: result.uid,
        name: result.name || filename,
        url: result.playback?.hls || result.playback?.dash,
        thumbnail: result.thumbnail,
        duration: result.duration,
        readyToStream: result.readyToStream,
        status: result.status,
        created: result.created,
        modified: result.modified,
        size: result.size,
        meta: result.meta,
        preview: result.preview,
        uploadUrl: result.uploadUrl,
        watermark: result.watermark,
      };
    } catch (error) {
      console.error('❌ Stream upload error:', error);
      throw new Error(`Stream upload failed: ${error.message}`);
    }
  }

  /**
   * ✅ رفع فيديو من مسار ملف
   * @param {string} filePath - مسار الملف
   * @param {Object} options - خيارات إضافية
   */
  async uploadVideoFromPath(filePath, options = {}) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const filename = path.basename(filePath);
      
      return this.uploadVideo(fileBuffer, filename, options);
    } catch (error) {
      console.error('❌ Upload from path error:', error);
      throw new Error(`Upload from path failed: ${error.message}`);
    }
  }

  /**
   * ✅ رفع فيديو من رابط (URL)
   * @param {string} url - رابط الفيديو
   * @param {Object} metadata - بيانات وصفية
   */
  async uploadFromUrl(url, metadata = {}) {
    try {
      this._isConfigured();

      console.log(`📤 Uploading video from URL: ${url}`);

      const response = await fetch(`${this.baseUrl}/copy`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          url: url,
          meta: metadata,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Upload from URL failed:', data.errors);
        throw new Error(data.errors?.[0]?.message || 'Upload from URL failed');
      }

      const result = data.result;
      console.log(`✅ Video uploaded from URL: ${result.uid}`);

      return {
        success: true,
        uid: result.uid,
        url: result.playback?.hls || result.playback?.dash,
        thumbnail: result.thumbnail,
        duration: result.duration,
        readyToStream: result.readyToStream,
        status: result.status,
        created: result.created,
        modified: result.modified,
        meta: result.meta,
      };
    } catch (error) {
      console.error('❌ Stream upload from URL error:', error);
      throw new Error(`Stream upload from URL failed: ${error.message}`);
    }
  }

  // ============================================================
  // ✅ الحصول على معلومات الفيديو
  // ============================================================

  /**
   * ✅ الحصول على معلومات فيديو محدد
   * @param {string} uid - معرف الفيديو
   */
  async getVideoInfo(uid) {
    try {
      this._isConfigured();

      const response = await fetch(`${this.baseUrl}/${uid}`, {
        method: 'GET',
        headers: this._getHeaders(),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.errors?.[0]?.code === 10000) {
          return null; // الفيديو غير موجود
        }
        throw new Error(data.errors?.[0]?.message || 'Get video info failed');
      }

      const result = data.result;
      return {
        uid: result.uid,
        name: result.name,
        url: result.playback?.hls || result.playback?.dash,
        thumbnail: result.thumbnail,
        duration: result.duration,
        readyToStream: result.readyToStream,
        status: result.status,
        views: result.views,
        created: result.created,
        modified: result.modified,
        size: result.size,
        meta: result.meta,
        preview: result.preview,
        watermark: result.watermark,
        allowedOrigins: result.allowedOrigins,
        requireSignedURLs: result.requireSignedURLs,
      };
    } catch (error) {
      console.error('❌ Get video info error:', error);
      return null;
    }
  }

  /**
   * ✅ الحصول على قائمة الفيديوهات
   * @param {Object} options - خيارات التصفية
   * @param {number} options.limit - عدد النتائج
   * @param {string} options.after - معرف البداية
   * @param {string} options.before - معرف النهاية
   * @param {string} options.status - حالة الفيديو
   * @param {string} options.creator - معرف المنشئ
   * @param {string} options.search - بحث في الاسم
   */
  async listVideos(options = {}) {
    try {
      this._isConfigured();

      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.after) params.append('after', options.after);
      if (options.before) params.append('before', options.before);
      if (options.status) params.append('status', options.status);
      if (options.creator) params.append('creator', options.creator);
      if (options.search) params.append('search', options.search);

      const url = `${this.baseUrl}?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this._getHeaders(),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'List videos failed');
      }

      return {
        success: true,
        videos: data.result.map(video => ({
          uid: video.uid,
          name: video.name,
          url: video.playback?.hls || video.playback?.dash,
          thumbnail: video.thumbnail,
          duration: video.duration,
          readyToStream: video.readyToStream,
          status: video.status,
          views: video.views,
          created: video.created,
          modified: video.modified,
          size: video.size,
          meta: video.meta,
        })),
        total: data.result.length,
        hasMore: data.result_info?.has_more || false,
        cursor: data.result_info?.cursor || null,
      };
    } catch (error) {
      console.error('❌ List videos error:', error);
      return { success: false, videos: [], total: 0, hasMore: false };
    }
  }

  // ============================================================
  // ✅ حذف الفيديوهات
  // ============================================================

  /**
   * ✅ حذف فيديو من Stream
   * @param {string} uid - معرف الفيديو
   */
  async deleteVideo(uid) {
    try {
      this._isConfigured();

      console.log(`🗑️ Deleting video: ${uid}`);

      const response = await fetch(`${this.baseUrl}/${uid}`, {
        method: 'DELETE',
        headers: this._getHeaders(),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'Delete video failed');
      }

      console.log(`✅ Video deleted: ${uid}`);
      return true;
    } catch (error) {
      console.error('❌ Delete video error:', error);
      return false;
    }
  }

  /**
   * ✅ حذف عدة فيديوهات
   * @param {string[]} uids - قائمة معرفات الفيديوهات
   */
  async deleteMultipleVideos(uids) {
    try {
      const results = [];
      for (const uid of uids) {
        const result = await this.deleteVideo(uid);
        results.push({ uid, success: result });
      }
      return results;
    } catch (error) {
      console.error('❌ Delete multiple videos error:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ البث المباشر (Live Stream)
  // ============================================================

  /**
   * ✅ إنشاء بث مباشر جديد
   * @param {Object} options - خيارات البث
   * @param {Object} options.metadata - بيانات وصفية
   * @param {boolean} options.recording - تسجيل البث
   * @param {string} options.creator - معرف المنشئ
   */
  async createLiveStream(options = {}) {
    try {
      this._isConfigured();

      console.log('📡 Creating live stream...');

      const body = {
        meta: options.metadata || {},
        recording: options.recording !== false,
      };

      if (options.creator) {
        body.creator = options.creator;
      }

      const response = await fetch(`${this.baseUrl}/live`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'Create live stream failed');
      }

      const result = data.result;
      console.log(`✅ Live stream created: ${result.uid}`);

      return {
        success: true,
        uid: result.uid,
        rtmpUrl: result.rtmps?.url || result.rtmp?.url,
        rtmpKey: result.rtmps?.streamKey || result.rtmp?.streamKey,
        playbackUrl: result.playback?.hls || result.playback?.dash,
        status: result.status,
        created: result.created,
        modified: result.modified,
        meta: result.meta,
      };
    } catch (error) {
      console.error('❌ Create live stream error:', error);
      throw new Error(`Create live stream failed: ${error.message}`);
    }
  }

  /**
   * ✅ الحصول على معلومات البث المباشر
   * @param {string} uid - معرف البث
   */
  async getLiveStreamInfo(uid) {
    try {
      this._isConfigured();

      const response = await fetch(`${this.baseUrl}/live/${uid}`, {
        method: 'GET',
        headers: this._getHeaders(),
      });

      const data = await response.json();

      if (!data.success) {
        return null;
      }

      const result = data.result;
      return {
        uid: result.uid,
        status: result.status,
        rtmpUrl: result.rtmps?.url || result.rtmp?.url,
        rtmpKey: result.rtmps?.streamKey || result.rtmp?.streamKey,
        playbackUrl: result.playback?.hls || result.playback?.dash,
        recording: result.recording,
        created: result.created,
        modified: result.modified,
        meta: result.meta,
      };
    } catch (error) {
      console.error('❌ Get live stream info error:', error);
      return null;
    }
  }

  /**
   * ✅ تحديث البث المباشر
   * @param {string} uid - معرف البث
   * @param {Object} options - خيارات التحديث
   * @param {boolean} options.recording - تفعيل/إلغاء التسجيل
   */
  async updateLiveStream(uid, options = {}) {
    try {
      this._isConfigured();

      const response = await fetch(`${this.baseUrl}/live/${uid}`, {
        method: 'PUT',
        headers: this._getHeaders(),
        body: JSON.stringify({
          recording: options.recording,
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('❌ Update live stream error:', error);
      return false;
    }
  }

  // ============================================================
  // ✅ الروابط الموقعة (Signed URLs)
  // ============================================================

  /**
   * ✅ الحصول على رابط تشغيل موقّع
   * @param {string} uid - معرف الفيديو
   * @param {number} expiresIn - مدة الصلاحية بالثواني (افتراضي: 3600)
   * @param {string[]} allowedOrigins - النطاقات المسموحة
   */
  async getSignedUrl(uid, expiresIn = 3600, allowedOrigins = []) {
    try {
      this._isConfigured();

      const response = await fetch(`${this.baseUrl}/${uid}/token`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + expiresIn,
          ...(allowedOrigins.length > 0 && { allowedOrigins }),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        return null;
      }

      return data.result.token;
    } catch (error) {
      console.error('❌ Get signed URL error:', error);
      return null;
    }
  }

  /**
   * ✅ الحصول على رابط تشغيل للمستخدم
   * @param {string} uid - معرف الفيديو
   * @param {string} userId - معرف المستخدم
   * @param {number} expiresIn - مدة الصلاحية
   */
  async getSignedUrlForUser(uid, userId, expiresIn = 3600) {
    return this.getSignedUrl(uid, expiresIn);
  }

  // ============================================================
  // ✅ دوال مساعدة للحصول على الروابط
  // ============================================================

  /**
   * ✅ الحصول على رابط البث
   * @param {string} uid - معرف الفيديو
   * @param {boolean} signed - هل تريد رابط موقّع
   */
  getPlaybackUrl(uid, signed = false) {
    if (signed) {
      return `https://${this.subdomain}/${uid}/manifest/video.m3u8`;
    }
    return `https://${this.subdomain}/${uid}/manifest/video.m3u8`;
  }

  /**
   * ✅ الحصول على رابط الصورة المصغرة
   * @param {string} uid - معرف الفيديو
   * @param {string} size - حجم الصورة (default, small, medium, large)
   */
  getThumbnailUrl(uid, size = 'default') {
    const sizes = {
      default: '',
      small: '/thumbnails/thumbnail.jpg',
      medium: '/thumbnails/medium.jpg',
      large: '/thumbnails/large.jpg',
    };
    const suffix = sizes[size] || sizes.default;
    return `https://${this.subdomain}/${uid}${suffix}`;
  }

  /**
   * ✅ الحصول على رابط التضمين (Embed)
   * @param {string} uid - معرف الفيديو
   * @param {Object} options - خيارات التضمين
   * @param {boolean} options.autoplay - تشغيل تلقائي
   * @param {boolean} options.controls - أزرار التحكم
   * @param {boolean} options.loop - تكرار
   * @param {boolean} options.muted - كتم الصوت
   * @param {string} options.poster - رابط الصورة المصغرة
   */
  getEmbedUrl(uid, options = {}) {
    const params = new URLSearchParams();
    if (options.autoplay) params.append('autoplay', 'true');
    if (options.controls === false) params.append('controls', 'false');
    if (options.loop) params.append('loop', 'true');
    if (options.muted) params.append('muted', 'true');
    if (options.poster) params.append('poster', options.poster);

    const queryString = params.toString();
    return `https://${this.subdomain}/${uid}${queryString ? '?' + queryString : ''}`;
  }

  // ============================================================
  // ✅ دوال مساعدة
  // ============================================================

  /**
   * ✅ تحديد نوع الملف من اسمه
   * @param {string} filename - اسم الملف
   */
  _getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.flv': 'video/x-flv',
      '.m4v': 'video/mp4',
      '.3gp': 'video/3gpp',
      '.ts': 'video/mp2t',
    };
    return types[ext] || 'video/mp4';
  }

  /**
   * ✅ التحقق من جاهزية الفيديو للبث
   * @param {string} uid - معرف الفيديو
   */
  async isVideoReady(uid) {
    const info = await this.getVideoInfo(uid);
    return info?.readyToStream || false;
  }

  /**
   * ✅ انتظار جاهزية الفيديو
   * @param {string} uid - معرف الفيديو
   * @param {number} maxAttempts - الحد الأقصى للمحاولات
   * @param {number} delayMs - التأخير بين المحاولات
   */
  async waitForVideoReady(uid, maxAttempts = 30, delayMs = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      const ready = await this.isVideoReady(uid);
      if (ready) {
        console.log(`✅ Video ${uid} is ready`);
        return true;
      }
      console.log(`⏳ Waiting for video ${uid} to be ready... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    console.log(`⚠️ Video ${uid} not ready after ${maxAttempts} attempts`);
    return false;
  }
}

// ============================================================
// ✅ تصدير الخدمة
// ============================================================

export const streamService = new StreamService();
export default streamService;