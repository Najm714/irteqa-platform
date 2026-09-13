// frontend/portal-a/src/pages/Infographics.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaSearch, FaEye, FaDownload, FaStar,
  FaFilter, FaTimes, FaChartBar, FaUser, FaClock,
  FaTag,
} from 'react-icons/fa';

// ============================================================
// ✅ واجهات البيانات
// ============================================================

interface Infographic {
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
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  downloads: number;
  createdAt: string;
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const Infographics: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [infographics, setInfographics] = useState<Infographic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: 'educational', label: '📚 تعليمي' },
    { value: 'statistical', label: '📊 إحصائي' },
    { value: 'process', label: '⚙️ عمليات' },
    { value: 'comparison', label: '🔍 مقارنات' },
    { value: 'timeline', label: '📅 تسلسل زمني' },
    { value: 'hierarchy', label: '🏛️ هرمي' },
    { value: 'geographical', label: '🌍 جغرافي' },
    { value: 'other', label: '📁 أخرى' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== جلب الإنفوجرافيك =====
  const fetchInfographics = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/infographics?isPublished=true&limit=100`;
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
        setInfographics(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching infographics:', error);
    } finally {
      setLoading(false);
    }
  }, [token, categoryFilter, searchTerm]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchInfographics();
  }, [fetchInfographics]);

  // ===== عرض الإنفوجرافيك =====
  const handleView = (id: string) => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/infographics/${id}/view?token=${token}`, '_blank');
  };

  // ===== تحميل الإنفوجرافيك =====
  const handleDownload = (id: string) => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/infographics/${id}/download?token=${token}`, '_blank');
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== تصفية الإنفوجرافيك =====
  const filteredInfographics = infographics.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (item.titleAr || '').toLowerCase().includes(search) ||
      (item.title || '').toLowerCase().includes(search) ||
      (item.descriptionAr || '').toLowerCase().includes(search) ||
      (item.description || '').toLowerCase().includes(search) ||
      item.tags?.some(t => t.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الإنفوجرافيك...</p>
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
            <FaChartBar className="text-purple-600" />
            الإنفوجرافيك
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            استعرض وتحميل الإنفوجرافيك المتاحة
          </p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredInfographics.length} إنفوجرافيك متاح
          </div>
        </div>

        {/* ===== Search & Filter ===== */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث في الإنفوجرافيك..."
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
        {filteredInfographics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInfographics.map((item, index) => (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group"
                data-aos="fade-up"
                data-aos-delay={index * 50}
              >
                {/* ===== Thumbnail ===== */}
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer">
                  {item.thumbnailId ? (
                    <img
                      src={`${API_URL}/files/${item.thumbnailId._id}/download-direct`}
                      alt={item.titleAr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : item.fileId ? (
                    <img
                      src={`${API_URL}/files/${item.fileId._id}/download-direct`}
                      alt={item.titleAr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FaChartBar className="w-16 h-16 text-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      onClick={() => handleView(item._id)}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition transform hover:scale-110"
                    >
                      <FaEye className="w-6 h-6" />
                    </button>
                  </div>
                  {item.isFeatured && (
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
                      <FaStar className="inline ml-1" /> مميز
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs bg-black/50 text-white">
                    {item.categoryAr || 'إنفوجرافيك'}
                  </span>
                </div>

                {/* ===== Content ===== */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                    {item.titleAr || item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {item.descriptionAr || item.description || 'لا يوجد وصف'}
                  </p>

                  {/* ===== Tags ===== */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ===== Stats ===== */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaEye className="w-3 h-3" /> {item.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaDownload className="w-3 h-3" /> {item.downloads || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" /> {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* ===== Actions ===== */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleView(item._id)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                      <FaEye className="w-4 h-4" />
                      عرض
                    </button>
                    <button
                      onClick={() => handleDownload(item._id)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <FaDownload className="w-4 h-4" />
                      تحميل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <FaChartBar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد إنفوجرافيك</h4>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || categoryFilter ? 'لا توجد إنفوجرافيك تطابق البحث' : 'لم يتم إضافة أي إنفوجرافيك إلى المكتبة بعد'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Infographics;