// backend/src/services/thumbnail.service.js
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';
import storageService from './storage.service.js';

// ✅ إعداد مسار ffmpeg من الحزمة المثبتة
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

class ThumbnailService {
  /**
   * استخراج صورة مصغرة من فيديو (buffer)
   * @param {Buffer} videoBuffer - محتوى الفيديو
   * @param {Object} options - خيارات
   * @returns {Promise<Buffer>} - صورة JPEG
   */
  async extractThumbnail(videoBuffer, options = {}) {
    const {
      timestamps = ['00:00:01', '00:00:03', '00:00:05'],
      width = 640,
      height = 360,
    } = options;

    const tempDir = os.tmpdir();
    const tempVideoPath = path.join(
      tempDir,
      `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`
    );

    try {
      // 1. كتابة الفيديو مؤقتاً
      fs.writeFileSync(tempVideoPath, videoBuffer);
      console.log('📁 Temp video saved:', tempVideoPath);
      console.log('  - Size:', (videoBuffer.length / 1024 / 1024).toFixed(2), 'MB');

      // 2. الحصول على مدة الفيديو
      let videoDuration = 0;
      try {
        const metadata = await this.getVideoMetadata(tempVideoPath);
        videoDuration = metadata.duration || 0;
        console.log('📊 Video duration:', videoDuration, 'seconds');
      } catch (err) {
        console.warn('⚠️ Could not get duration:', err.message);
      }

      // 3. بناء قائمة توقيتات ذكية
      let finalTimestamps = timestamps;

      if (videoDuration > 5) {
        // اختر 3 توقيتات موزعة
        const t1 = Math.min(1, videoDuration * 0.1);
        const t2 = Math.min(3, videoDuration * 0.25);
        const t3 = Math.min(10, videoDuration * 0.5);

        finalTimestamps = [
          this.formatTime(t1),
          this.formatTime(t2),
          this.formatTime(t3),
        ];
      }

      console.log('🎬 Extracting at timestamps:', finalTimestamps);

      // 4. جرّب كل توقيت حتى نجح واحد
      for (const timestamp of finalTimestamps) {
        try {
          const thumbnailBuffer = await this.extractAtTimestamp(
            tempVideoPath,
            timestamp,
            width,
            height
          );

          if (thumbnailBuffer && thumbnailBuffer.length > 0) {
            console.log(
              `✅ Thumbnail extracted at ${timestamp} (${thumbnailBuffer.length} bytes)`
            );
            return thumbnailBuffer;
          }
        } catch (err) {
          console.warn(`⚠️ Failed at ${timestamp}:`, err.message);
        }
      }

      throw new Error('All thumbnail extraction attempts failed');
    } finally {
      // 5. تنظيف
      try {
        if (fs.existsSync(tempVideoPath)) {
          fs.unlinkSync(tempVideoPath);
        }
      } catch (err) {
        console.warn('⚠️ Cleanup error:', err.message);
      }
    }
  }

  /**
   * استخراج صورة عند توقيت محدد
   */
  async extractAtTimestamp(videoPath, timestamp, width, height) {
    const tempDir = os.tmpdir();
    const thumbFilename = `thumb-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}.jpg`;
    const thumbPath = path.join(tempDir, thumbFilename);

    try {
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp],
            filename: thumbFilename,
            folder: tempDir,
            size: `${width}x${height}`,
          })
          .on('start', (cmd) => {
            console.log('🎬 ffmpeg started');
          })
          .on('end', () => {
            console.log('✅ ffmpeg finished');
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ ffmpeg error:', err.message);
            reject(err);
          });
      });

      if (!fs.existsSync(thumbPath)) {
        throw new Error('Thumbnail file was not created');
      }

      const buffer = fs.readFileSync(thumbPath);
      return buffer;
    } finally {
      // تنظيف
      try {
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      } catch {}
    }
  }

  /**
   * الحصول على metadata الفيديو
   */
  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const duration = metadata.format?.duration || 0;
        const videoStream = metadata.streams?.find(
          (s) => s.codec_type === 'video'
        );

        resolve({
          duration: parseFloat(duration),
          width: videoStream?.width,
          height: videoStream?.height,
          codec: videoStream?.codec_name,
          bitrate: metadata.format?.bit_rate,
        });
      });
    });
  }

  /**
   * تنسيق الوقت إلى HH:MM:SS
   */
  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * استخراج + رفع إلى R2
   */
  async extractAndUpload(videoBuffer, portalId, accountId, options = {}) {
    try {
      // 1. استخراج الصورة
      const thumbnailBuffer = await this.extractThumbnail(videoBuffer, options);

      // 2. رفعها إلى R2
      const thumbnailFile = await storageService.uploadFile(
        {
          buffer: thumbnailBuffer,
          originalname: `thumb-${Date.now()}.jpg`,
          mimetype: 'image/jpeg',
          size: thumbnailBuffer.length,
        },
        portalId,
        accountId,
        'thumbnail',
        null,
        {
          generatedAt: new Date().toISOString(),
        }
      );

      console.log('✅ Thumbnail uploaded to R2:', thumbnailFile.file._id);

      return thumbnailFile.file;
    } catch (error) {
      console.error('❌ extractAndUpload failed:', error);
      throw error;
    }
  }
}

export const thumbnailService = new ThumbnailService();
export default thumbnailService;