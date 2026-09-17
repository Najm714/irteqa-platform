// backend/src/services/stream.service.js
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

class StreamService {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.subdomain =
      process.env.CLOUDFLARE_STREAM_SUBDOMAIN ||
      'customer-816myz1pksxmupid.cloudflarestream.com';

    if (!this.accountId) {
      console.warn('⚠️ CLOUDFLARE_ACCOUNT_ID is not set');
    }
    if (!this.apiToken) {
      console.warn('⚠️ CLOUDFLARE_API_TOKEN is not set');
    }

    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  _getHeaders(additionalHeaders = {}) {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }

  _isConfigured() {
    if (!this.accountId || !this.apiToken) {
      throw new Error('Cloudflare Stream is not configured');
    }
    return true;
  }

  // ============================================================
  // ✅ رفع الفيديوهات (كما هو)
  // ============================================================
  async uploadVideo(fileBuffer, filename, options = {}) {
    try {
      this._isConfigured();

      console.log(`📤 Uploading video: ${filename}`);

      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename,
        contentType: options.contentType || this._getContentType(filename),
      });

      if (options.metadata) {
        formData.append('meta', JSON.stringify(options.metadata));
      }
      if (options.requireSignedURLs !== undefined) {
        formData.append(
          'requireSignedURLs',
          options.requireSignedURLs ? 'true' : 'false'
        );
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
        throw new Error(data.errors?.[0]?.message || 'Upload failed');
      }

      const result = data.result;
      console.log(`✅ Video uploaded: ${result.uid}`);

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

  async uploadVideoFromPath(filePath, options = {}) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const fileBuffer = fs.readFileSync(filePath);
    return this.uploadVideo(fileBuffer, path.basename(filePath), options);
  }

  async uploadFromUrl(url, metadata = {}) {
    try {
      this._isConfigured();

      const response = await fetch(`${this.baseUrl}/copy`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({ url, meta: metadata }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'Upload failed');
      }

      const result = data.result;
      return {
        success: true,
        uid: result.uid,
        url: result.playback?.hls || result.playback?.dash,
        thumbnail: result.thumbnail,
        duration: result.duration,
        readyToStream: result.readyToStream,
        status: result.status,
      };
    } catch (error) {
      console.error('❌ Upload from URL error:', error);
      throw error;
    }
  }

  // ============================================================
  // ✅ معلومات الفيديو
  // ============================================================
  async getVideoInfo(uid) {
    try {
      this._isConfigured();

      const response = await fetch(`${this.baseUrl}/${uid}`, {
        method: 'GET',
        headers: this._getHeaders(),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.errors?.[0]?.code === 10000) return null;
        throw new Error(data.errors?.[0]?.message || 'Failed');
      }

      const r = data.result;
      return {
        uid: r.uid,
        name: r.name,
        url: r.playback?.hls || r.playback?.dash,
        thumbnail: r.thumbnail,
        duration: r.duration,
        readyToStream: r.readyToStream,
        status: r.status,
        views: r.views,
        created: r.created,
        modified: r.modified,
        size: r.size,
        meta: r.meta,
        preview: r.preview,
        watermark: r.watermark,
        allowedOrigins: r.allowedOrigins,
        requireSignedURLs: r.requireSignedURLs,
      };
    } catch (error) {
      console.error('❌ Get video info error:', error);
      return null;
    }
  }

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

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: this._getHeaders(),
      });

      const data = await response.json();
      if (!data.success) throw new Error('List failed');

      return {
        success: true,
        videos: data.result.map((v) => ({
          uid: v.uid,
          name: v.name,
          url: v.playback?.hls || v.playback?.dash,
          thumbnail: v.thumbnail,
          duration: v.duration,
          readyToStream: v.readyToStream,
          status: v.status,
          views: v.views,
          created: v.created,
          modified: v.modified,
          size: v.size,
          meta: v.meta,
        })),
        total: data.result.length,
        hasMore: data.result_info?.has_more || false,
      };
    } catch (error) {
      console.error('❌ List videos error:', error);
      return { success: false, videos: [], total: 0 };
    }
  }

  // ============================================================
  // ✅ حذف الفيديو
  // ============================================================
  async deleteVideo(uid) {
    try {
      this._isConfigured();

      const response = await fetch(`${this.baseUrl}/${uid}`, {
        method: 'DELETE',
        headers: this._getHeaders(),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('❌ Delete video error:', error);
      return false;
    }
  }

  // ============================================================
  // ✅ ✅ ✅ البث المباشر (محدّث — Live Inputs API)
  // ============================================================

  /**
   * ✅ إنشاء بث مباشر جديد
   * يستخدم /stream/live_inputs (API الحديث)
   */
  async createLiveStream(options = {}) {
    try {
      this._isConfigured();

      console.log('📡 Creating live stream (new API)...');

      const body = {
        meta: options.metadata || {},
        recording: {
          mode: options.recording !== false ? 'automatic' : 'off',
          requireSignedURLs: options.requireSignedURLs || false,
        },
        preferredProtocol: options.preferredProtocol || 'rtmps',
      };

      if (options.creator) {
        body.creator = options.creator;
      }

      const response = await fetch(`${this.baseUrl}/live_inputs`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Create live stream failed:', data.errors);
        throw new Error(
          data.errors?.[0]?.message || 'Create live stream failed'
        );
      }

      const result = data.result;
      console.log(`✅ Live stream created: ${result.uid}`);

      return {
        success: true,
        uid: result.uid,
        rtmpUrl: result.rtmps?.url || result.rtmp?.url,
        rtmpKey: result.rtmps?.streamKey || result.rtmp?.streamKey,
        srtUrl: result.srt?.url,
        srtKey: result.srt?.streamId,
        playbackUrl:
          result.playback?.hls ||
          `https://${this.subdomain}/${result.uid}/manifest/video.m3u8`,
        status: result.status,
        recording: result.recording,
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
   * ✅ جلب تفاصيل بث مباشر
   */
  async getLiveStreamInfo(uid) {
    try {
      this._isConfigured();

      const response = await fetch(`${this.baseUrl}/live_inputs/${uid}`, {
        method: 'GET',
        headers: this._getHeaders(),
      });

      const data = await response.json();

      if (!data.success) return null;

      const result = data.result;
      return {
        uid: result.uid,
        status: result.status,
        rtmpUrl: result.rtmps?.url || result.rtmp?.url,
        rtmpKey: result.rtmps?.streamKey || result.rtmp?.streamKey,
        srtUrl: result.srt?.url,
        srtKey: result.srt?.streamId,
        playbackUrl:
          result.playback?.hls ||
          `https://${this.subdomain}/${result.uid}/manifest/video.m3u8`,
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
   * ✅ تحديث إعدادات البث
   */
  async updateLiveStream(uid, options = {}) {
    try {
      this._isConfigured();

      const body = {};

      if (options.recording !== undefined) {
        body.recording = {
          mode: options.recording ? 'automatic' : 'off',
          requireSignedURLs: options.requireSignedURLs || false,
        };
      }

      if (options.metadata) {
        body.meta = options.metadata;
      }

      const response = await fetch(`${this.baseUrl}/live_inputs/${uid}`, {
        method: 'PUT',
        headers: this._getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('❌ Update live stream error:', error);
      return false;
    }
  }

  /**
   * ✅ حذف بث مباشر
   */
  async deleteLiveStream(uid) {
    try {
      this._isConfigured();

      console.log(`🗑️ Deleting live stream: ${uid}`);

      const response = await fetch(`${this.baseUrl}/live_inputs/${uid}`, {
        method: 'DELETE',
        headers: this._getHeaders(),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('❌ Delete live stream error:', error);
      return false;
    }
  }

  /**
   * ✅ جلب جميع البثوث المباشرة
   */
  async listLiveStreams(options = {}) {
    try {
      this._isConfigured();

      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.status) params.append('status', options.status);

      const response = await fetch(
        `${this.baseUrl}/live_inputs?${params.toString()}`,
        {
          method: 'GET',
          headers: this._getHeaders(),
        }
      );

      const data = await response.json();

      if (!data.success) throw new Error('List failed');

      return data.result || [];
    } catch (error) {
      console.error('❌ List live streams error:', error);
      return [];
    }
  }

  /**
   * ✅ جلب فيديوهات البث المسجلة
   * بعد انتهاء البث، Cloudflare ينشئ فيديو تلقائياً
   */
  async getLiveStreamVideos(uid) {
    try {
      this._isConfigured();

      const response = await fetch(
        `${this.baseUrl}/live_inputs/${uid}/videos`,
        {
          method: 'GET',
          headers: this._getHeaders(),
        }
      );

      const data = await response.json();

      if (!data.success) return [];

      return data.result || [];
    } catch (error) {
      console.error('❌ Get live videos error:', error);
      return [];
    }
  }

  // ============================================================
  // ✅ الروابط الموقعة
  // ============================================================
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
      return data.success ? data.result.token : null;
    } catch (error) {
      console.error('❌ Get signed URL error:', error);
      return null;
    }
  }

  async getSignedUrlForUser(uid, userId, expiresIn = 3600) {
    return this.getSignedUrl(uid, expiresIn);
  }

  // ============================================================
  // ✅ دوال مساعدة
  // ============================================================
  getPlaybackUrl(uid) {
    return `https://${this.subdomain}/${uid}/manifest/video.m3u8`;
  }

  getThumbnailUrl(uid, size = 'default') {
    const sizes = {
      default: '',
      small: '/thumbnails/thumbnail.jpg',
      medium: '/thumbnails/medium.jpg',
      large: '/thumbnails/large.jpg',
    };
    return `https://${this.subdomain}/${uid}${sizes[size] || ''}`;
  }

  getEmbedUrl(uid, options = {}) {
    const params = new URLSearchParams();
    if (options.autoplay) params.append('autoplay', 'true');
    if (options.controls === false) params.append('controls', 'false');
    if (options.loop) params.append('loop', 'true');
    if (options.muted) params.append('muted', 'true');
    if (options.poster) params.append('poster', options.poster);

    const qs = params.toString();
    return `https://${this.subdomain}/${uid}${qs ? '?' + qs : ''}`;
  }

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

  async isVideoReady(uid) {
    const info = await this.getVideoInfo(uid);
    return info?.readyToStream || false;
  }

  async waitForVideoReady(uid, maxAttempts = 30, delayMs = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isVideoReady(uid)) return true;
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return false;
  }
}

export const streamService = new StreamService();
export default streamService;