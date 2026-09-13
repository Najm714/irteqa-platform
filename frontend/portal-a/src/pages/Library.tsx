// frontend/portal-a/src/pages/Library.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaSearch, FaDownload, FaEye,
  FaFilePdf, FaFileWord, FaFileExcel, FaFileImage,
  FaFile, FaStar, FaClock, FaUser, FaCalendarAlt,
  FaTag, FaFilter, FaTimes,FaFileAlt
} from 'react-icons/fa';

// ============================================================
// ✅ واجهات البيانات
// ============================================================

interface LibraryFile {
  _id: string;
  fileId: {
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
  downloads: number;
  views: number;
  createdAt: string;
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const Library: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: 'guide', label: '📚 دليل' },
    { value: 'template', label: '📄 نموذج' },
    { value: 'policy', label: '📋 سياسة' },
    { value: 'manual', label: '📖 دليل إرشادي' },
    { value: 'report', label: '📊 تقرير' },
    { value: 'presentation', label: '🎯 عرض تقديمي' },
    { value: 'research', label: '🔬 بحث' },
    { value: 'other', label: '📁 أخرى' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== جلب الملفات =====
  const fetchFiles = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/library?isPublished=true&limit=100`;
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
        setFiles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching library files:', error);
    } finally {
      setLoading(false);
    }
  }, [token, categoryFilter, searchTerm]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchFiles();
  }, [fetchFiles]);

  // ===== تحميل ملف =====
  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await fetch(`${API_URL}/library/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('حدث خطأ في تحميل الملف');
    }
  };

  // ===== أيقونة الملف =====
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-8 h-8" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-8 h-8" />;
    if (mimeType.includes('excel')) return <FaFileExcel className="text-green-500 w-8 h-8" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-8 h-8" />;
    return <FaFile className="text-gray-500 w-8 h-8" />;
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== تصفية الملفات =====
  const filteredFiles = files.filter(file => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (file.titleAr || '').toLowerCase().includes(search) ||
      (file.title || '').toLowerCase().includes(search) ||
      (file.descriptionAr || '').toLowerCase().includes(search) ||
      (file.description || '').toLowerCase().includes(search) ||
      file.tags?.some(t => t.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل المكتبة...</p>
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
            <FaFileAlt className="text-purple-600" />
            المكتبة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            استعرض وتحميل الملفات والموارد المتاحة
          </p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredFiles.length} ملف متاح
          </div>
        </div>

        {/* ===== Search & Filter ===== */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث في المكتبة..."
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
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file, index) => (
              <div
                key={file._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                data-aos="fade-up"
                data-aos-delay={index * 50}
              >
                {/* ===== Icon & Featured ===== */}
                <div className="relative p-6 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-center">
                  {getFileIcon(file.fileId?.mimeType)}
                  {file.isFeatured && (
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <FaStar className="inline ml-1" /> مميز
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs bg-black/50 text-white">
                    {file.categoryAr || 'ملف'}
                  </span>
                </div>

                {/* ===== Content ===== */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                    {file.titleAr || file.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                    {file.descriptionAr || file.description || 'لا يوجد وصف'}
                  </p>

                  {/* ===== Tags ===== */}
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {file.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          #{tag}
                        </span>
                      ))}
                      {file.tags.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-400">
                          +{file.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ===== Stats ===== */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaDownload className="w-3 h-3" /> {file.downloads || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaEye className="w-3 h-3" /> {file.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" /> {formatDate(file.createdAt)}
                    </span>
                  </div>

                  {/* ===== Actions ===== */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleDownload(file._id, file.fileId?.originalName || 'file')}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                      <FaDownload className="w-4 h-4" />
                      تحميل
                    </button>
                    <button
                      onClick={() => window.open(`${API_URL}/files/${file.fileId?._id}/view?token=${localStorage.getItem('token')}`, '_blank')}
                      className="px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <FaEye className="w-4 h-4" />
                      معاينة
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <FaFileAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد ملفات</h4>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || categoryFilter ? 'لا توجد ملفات تطابق البحث' : 'لم يتم إضافة أي ملفات إلى المكتبة بعد'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;