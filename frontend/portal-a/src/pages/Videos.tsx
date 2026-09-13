// frontend/portal-a/src/pages/Videos.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaSearch, FaPlay, FaEye, FaClock,
  FaStar, FaFilter, FaTimes, FaVideo, FaUser,
  FaCalendarAlt, FaTag,
} from 'react-icons/fa';

// ============================================================
// ✅ واجهات البيانات
// ============================================================

interface VideoFile {
  _id: string;
  fileId: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  thumbnailId?: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
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
// ✅ المكون الرئيسي
// ============================================================

const Videos: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: 'tutorial', label: '📖 درس تعليمي' },
    { value: 'lecture', label: '🎓 محاضرة' },
    { value: 'workshop', label: '🔧 ورشة عمل' },
    { value: 'webinar', label: '💻 ندوة عبر الإنترنت' },
    { value: 'presentation', label: '🎯 عرض تقديمي' },
    { value: 'interview', label: '🎙️ مقابلة' },
    { value: 'other', label: '📁 أخرى' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== جلب الفيديوهات =====
  const fetchVideos = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/videos-library?isPublished=true&limit=100`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setVideos(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  }, [token, categoryFilter, searchTerm]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchVideos();
  }, [fetchVideos]);

// frontend/portal-a/src/pages/VideosLibrary.tsx

// ===== تشغيل الفيديو =====
const handlePlayVideo = (id: string) => {
  const token = localStorage.getItem('token');
  // ✅ إرسال التوكن في Query String
  window.open(`${API_URL}/videos-library/${id}/stream?token=${token}`, '_blank');
};

  // ===== تنسيق المدة =====
  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== تصفية الفيديوهات =====
  const filteredVideos = videos.filter(video => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (video.titleAr || '').toLowerCase().includes(search) ||
      (video.title || '').toLowerCase().includes(search) ||
      (video.descriptionAr || '').toLowerCase().includes(search) ||
      (video.description || '').toLowerCase().includes(search) ||
      video.tags?.some(t => t.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الفيديوهات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom max-w-7xl">
        {/* ===== Header ===== */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <FaVideo className="text-purple-600" />
            مكتبة الفيديوهات التعليمية
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            استعرض وتعلم من خلال الفيديوهات التعليمية المتاحة
          </p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredVideos.length} فيديو متاح
          </div>
        </div>

        {/* ===== Search & Filter ===== */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث في الفيديوهات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
          >
            <FaFilter />
            تصفية
            {categoryFilter && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
          </button>
        </div>

        {/* ===== Filters ===== */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  !categoryFilter
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    categoryFilter === cat.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              {categoryFilter && (
                <button
                  onClick={() => setCategoryFilter('')}
                  className="px-3 py-1.5 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                >
                  <FaTimes className="inline ml-1" /> إزالة التصفية
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===== Grid ===== */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video, index) => (
              <div
                key={video._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group"
                data-aos="fade-up"
                data-aos-delay={index * 50}
              >
                {/* ===== Thumbnail ===== */}
                <div className="relative aspect-video bg-gray-900 flex items-center justify-center cursor-pointer">
                  {video.thumbnailId ? (
                    <img
                      src={`${API_URL}/files/${video.thumbnailId._id}/download-direct`}
                      alt={video.titleAr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FaVideo className="w-16 h-16 text-gray-600" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      onClick={() => handlePlayVideo(video._id)}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition transform hover:scale-110"
                    >
                      <FaPlay className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs">
                    {video.durationFormatted || formatDuration(video.duration)}
                  </div>
                  {video.isFeatured && (
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
                      <FaStar className="inline ml-1" /> مميز
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs bg-black/50 text-white">
                    {video.categoryAr || 'فيديو'}
                  </span>
                </div>

                {/* ===== Content ===== */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                    {video.titleAr || video.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {video.descriptionAr || video.description || 'لا يوجد وصف'}
                  </p>

                  {/* ===== Tags ===== */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {video.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ===== Stats ===== */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaEye className="w-3 h-3" /> {video.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" /> {formatDate(video.createdAt)}
                    </span>
                  </div>

                  {/* ===== Actions ===== */}
                  <button
                    onClick={() => handlePlayVideo(video._id)}
                    className="w-full mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <FaPlay className="w-4 h-4" />
                    تشغيل الفيديو
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <FaVideo className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد فيديوهات</h4>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || categoryFilter ? 'لا توجد فيديوهات تطابق البحث' : 'لم يتم إضافة أي فيديوهات إلى المكتبة بعد'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Videos;