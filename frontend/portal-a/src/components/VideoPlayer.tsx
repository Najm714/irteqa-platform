import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { FaSpinner, FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute, FaLock } from 'react-icons/fa';

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
  poster?: string;
  title?: string;
  isEncrypted?: boolean;
  isSubscribed?: boolean;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoUrl,
  poster,
  title,
  isEncrypted = false,
  isSubscribed = false,
  onEnded,
  onError,
  autoPlay = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const hlsRef = useRef<Hls | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // منع قائمة السياق
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    video.addEventListener('contextmenu', handleContextMenu);
    return () => video.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // منع Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ✅ تحميل الفيديو
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);

    let cancelled = false;

    // تنظيف blob سابق
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    // ========================================================
    // HLS
    // ========================================================
    if (Hls.isSupported() && videoUrl.includes('.m3u8')) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        xhrSetup: (xhr) => {
          const token = localStorage.getItem('token');
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        },
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (cancelled) return;
        setLoading(false);
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal && !cancelled) {
          setError('فشل تحميل الفيديو');
          if (onError) onError(new Error('HLS fatal error'));
        }
      });

      hlsRef.current = hls;
      return () => {
        cancelled = true;
        hls.destroy();
      };
    }

    // ========================================================
    // ✅ MP4 مباشر - استخدم fetch + Blob
    // هذا يتجنب مشاكل CORS نهائياً
    // ========================================================
    const loadVideo = async () => {
      try {
        console.log('🎬 Loading video:', videoUrl);

        const token = localStorage.getItem('token');

        const response = await fetch(videoUrl, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();

        if (cancelled) return;

        if (blob.size === 0) {
          throw new Error('Empty video');
        }

        console.log('✅ Video loaded:', blob.size, 'bytes');

        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        video.src = blobUrl;
        video.load();

        const handleLoaded = () => {
          if (cancelled) return;
          setLoading(false);
          if (autoPlay) video.play().catch(() => {});
        };

        video.addEventListener('loadedmetadata', handleLoaded, { once: true });

      } catch (err: any) {
        if (cancelled) return;
        console.error('❌ Video load error:', err);
        setError('حدث خطأ في تشغيل الفيديو');
        if (onError) onError(err);
      }
    };

    loadVideo();

    // ✅ أحداث الفيديو
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      cancelled = true;

      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [videoUrl, autoPlay, onEnded, onError]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play().catch(() => {});
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const value = parseFloat(e.target.value);
    video.currentTime = (value / 100) * duration;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        poster={poster}
        className="w-full aspect-video"
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <FaSpinner className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center text-white p-4">
            <div className="text-4xl mb-2">⚠️</div>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {title && (
        <div className="absolute top-4 left-4 right-4">
          <p className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full truncate max-w-xs">
            {title}
          </p>
        </div>
      )}

      {isEncrypted && !isSubscribed && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <FaLock className="w-3 h-3" /> مشفر
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/30">
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition hover:scale-110"
        >
          {isPlaying ? <FaPause className="w-6 h-6" /> : <FaPlay className="w-6 h-6 mr-1" />}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white hover:text-purple-400 transition">
            {isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
          </button>

          <span className="text-white text-xs font-mono min-w-[70px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
          />

          <button onClick={toggleMute} className="text-white hover:text-purple-400 transition">
            {isMuted ? <FaVolumeMute className="w-4 h-4" /> : <FaVolumeUp className="w-4 h-4" />}
          </button>

          <button onClick={toggleFullscreen} className="text-white hover:text-purple-400 transition">
            {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;