// frontend/portal-a/src/pages/Videos.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

import {
  FaSpinner,
  FaSearch,
  FaPlay,
  FaEye,
  FaClock,
  FaStar,
  FaFilter,
  FaTimes,
  FaVideo,
  FaExclamationTriangle,
} from 'react-icons/fa';

// ============================================================
// إعدادات API
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const PORTAL_ID =
  import.meta.env.VITE_PORTAL_ID || '';

// ============================================================
// واجهات البيانات
// ============================================================

interface VideoFileReference {
  _id: string;
  originalName: string;
  size: number;
  mimeType: string;
}

interface VideoFile {
  _id: string;

  fileId: VideoFileReference;

  thumbnailId?: VideoFileReference;

  title: string;
  titleAr: string;

  description: string;
  descriptionAr: string;

  category: string;
  categoryAr: string;

  tags: string[];

  duration: number;
  durationFormatted: string;

  isPublished: boolean;
  isFeatured: boolean;

  views: number;
  likes: number;

  createdAt: string;
}

// ============================================================
// المكون الرئيسي
// ============================================================

const Videos: React.FC = () => {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoFile[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ==========================================================
  // التصنيفات
  // ==========================================================

  const categories = [
    {
      value: 'tutorial',
      label: 'درس تعليمي',
    },
    {
      value: 'lecture',
      label: 'محاضرة',
    },
    {
      value: 'workshop',
      label: 'ورشة عمل',
    },
    {
      value: 'webinar',
      label: 'ندوة عبر الإنترنت',
    },
    {
      value: 'presentation',
      label: 'عرض تقديمي',
    },
    {
      value: 'interview',
      label: 'مقابلة',
    },
    {
      value: 'other',
      label: 'أخرى',
    },
  ];

  // ==========================================================
  // إنشاء رابط ملف موثق
  // مهم جداً لأن <img> لا يرسل Authorization Header
  // ==========================================================

  const getFileUrl = useCallback(
    (
      fileId?: string,
      action: 'view' | 'download-direct' = 'download-direct'
    ) => {
      if (!fileId || !token) return '';

      const params = new URLSearchParams({
        token,
        portalId: PORTAL_ID,
      });

      return `${API_URL}/files/${encodeURIComponent(
        fileId
      )}/${action}?${params.toString()}`;
    },
    [token]
  );

  // ==========================================================
  // جلب الفيديوهات
  // ==========================================================

  const fetchVideos = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      let url = `${API_URL}/videos-library?isPublished=true&limit=100`;

      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }

      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();

      if (data.success) {
        setVideos(data.data || []);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('❌ Error fetching videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [token, categoryFilter, searchTerm]);

  // ==========================================================
  // تشغيل AOS وجلب البيانات
  // ==========================================================

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
      easing: 'ease-out-cubic',
    });

    fetchVideos();
  }, [fetchVideos]);

  // ==========================================================
  // تشغيل الفيديو
  // ==========================================================

  const handlePlayVideo = (id: string) => {
    if (!token || !id) return;

    const params = new URLSearchParams({
      token,
      portalId: PORTAL_ID,
    });

    window.open(
      `${API_URL}/videos-library/${encodeURIComponent(
        id
      )}/stream?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // ==========================================================
  // تنسيق المدة
  // ==========================================================

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // ==========================================================
  // تنسيق التاريخ
  // ==========================================================

  const formatDate = (date: string) => {
    if (!date) return '';

    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ==========================================================
  // تصفية الفيديوهات محلياً
  // ==========================================================

  const filteredVideos = videos.filter((video) => {
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase().trim();

    return (
      (video.titleAr || '').toLowerCase().includes(search) ||
      (video.title || '').toLowerCase().includes(search) ||
      (video.descriptionAr || '').toLowerCase().includes(search) ||
      (video.description || '').toLowerCase().includes(search) ||
      video.tags?.some((tag) =>
        tag.toLowerCase().includes(search)
      )
    );
  });

  // ==========================================================
  // Loading
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
            <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
          </div>

          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            جاري تحميل الفيديوهات...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/70 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20 py-8 md:py-10"
    >
      <div className="container-custom max-w-7xl px-4 mx-auto">

        {/* ======================================================
            Header
        ====================================================== */}

        <div
          className="text-center mb-8"
          data-aos="fade-down"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mb-4">
            <FaVideo className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            مكتبة الفيديوهات التعليمية
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
            استعرض الفيديوهات التعليمية والمحاضرات والورش المتاحة
          </p>

          <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filteredVideos.length} فيديو متاح
            </span>
          </div>
        </div>

        {/* ======================================================
            Search & Filter
        ====================================================== */}

        <div
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-6"
          data-aos="fade-up"
        >
          <div className="flex flex-col md:flex-row gap-3">

            {/* Search */}

            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

                <input
                  type="text"
                  placeholder="ابحث في الفيديوهات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-11 pl-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition"
                />
              </div>
            </div>

            {/* Filter */}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                showFilters || categoryFilter
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <FaFilter className="w-3.5 h-3.5" />

              تصفية

              {categoryFilter && (
                <span className="w-2 h-2 bg-white rounded-full" />
              )}
            </button>
          </div>

          {/* ====================================================
              Filters
          ==================================================== */}

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">

                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                    !categoryFilter
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  الكل
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() =>
                      setCategoryFilter(cat.value)
                    }
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                      categoryFilter === cat.value
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}

                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition flex items-center gap-1"
                  >
                    <FaTimes className="w-3 h-3" />
                    إزالة التصفية
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================
            Videos Grid
        ====================================================== */}

        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {filteredVideos.map((video, index) => {

              const thumbnailUrl = video.thumbnailId
                ? getFileUrl(video.thumbnailId._id)
                : '';

              return (
                <div
                  key={video._id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  data-aos="fade-up"
                  data-aos-delay={Math.min(index * 50, 300)}
                >

                  {/* ==================================================
                      Thumbnail
                  ================================================== */}

                  <div
                    className="relative aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-purple-950 overflow-hidden cursor-pointer"
                    onClick={() => handlePlayVideo(video._id)}
                  >

                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={video.titleAr || video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';

                          const fallback =
                            e.currentTarget.parentElement?.querySelector(
                              '[data-video-fallback]'
                            ) as HTMLElement | null;

                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}

                    {/* Image fallback */}

                    <div
                      data-video-fallback
                      className={`absolute inset-0 items-center justify-center ${
                        thumbnailUrl ? 'hidden' : 'flex'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                          <FaVideo className="w-7 h-7 text-white/60" />
                        </div>

                        <p className="text-xs text-white/50">
                          لا توجد صورة مصغرة
                        </p>
                      </div>
                    </div>

                    {/* Dark overlay */}

                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/45 transition-all duration-300" />

                    {/* Play button */}

                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVideo(video._id);
                        }}
                        aria-label="تشغيل الفيديو"
                        className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl opacity-90 group-hover:scale-110 group-hover:bg-purple-600/90 transition-all duration-300"
                      >
                        <FaPlay className="w-5 h-5 mr-[-2px]" />
                      </button>
                    </div>

                    {/* Duration */}

                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-white text-[11px] font-medium">
                      {video.durationFormatted ||
                        formatDuration(video.duration)}
                    </div>

                    {/* Featured */}

                    {video.isFeatured && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                        <FaStar className="w-2.5 h-2.5" />
                        مميز
                      </span>
                    )}

                    {/* Category */}

                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] bg-black/60 backdrop-blur-sm text-white">
                      {video.categoryAr || 'فيديو'}
                    </span>
                  </div>

                  {/* ==================================================
                      Content
                  ================================================== */}

                  <div className="p-4">

                    <h3 className="font-bold text-[15px] text-gray-900 dark:text-white truncate">
                      {video.titleAr || video.title}
                    </h3>

                    <p className="text-xs leading-5 text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5 min-h-[40px]">
                      {video.descriptionAr ||
                        video.description ||
                        'لا يوجد وصف لهذا الفيديو'}
                    </p>

                    {/* Tags */}

                    {video.tags &&
                      video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {video.tags
                            .slice(0, 3)
                            .map((tag, i) => (
                              <span
                                key={`${tag}-${i}`}
                                className="px-2 py-0.5 rounded-full text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300"
                              >
                                #{tag}
                              </span>
                            ))}
                        </div>
                      )}

                    {/* Stats */}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400">

                      <span className="flex items-center gap-1">
                        <FaEye className="w-3 h-3" />
                        {video.views || 0} مشاهدة
                      </span>

                      <span className="flex items-center gap-1">
                        <FaClock className="w-3 h-3" />
                        {formatDate(video.createdAt)}
                      </span>
                    </div>

                    {/* Action */}

                    <button
                      onClick={() =>
                        handlePlayVideo(video._id)
                      }
                      className="w-full mt-3 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-[0.98] transition flex items-center justify-center gap-2 text-xs font-semibold shadow-sm hover:shadow-md"
                    >
                      <FaPlay className="w-3.5 h-3.5" />
                      تشغيل الفيديو
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (

          /* ====================================================
             Empty State
          ==================================================== */

          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-sm"
            data-aos="fade-up"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
              <FaVideo className="w-7 h-7 text-purple-400" />
            </div>

            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              لا توجد فيديوهات
            </h4>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || categoryFilter
                ? 'لا توجد فيديوهات تطابق معايير البحث أو التصفية'
                : 'لم يتم إضافة أي فيديوهات إلى المكتبة بعد'}
            </p>

            {(searchTerm || categoryFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                }}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
              >
                مسح البحث والتصفية
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Videos;