// frontend/portal-a/src/pages/Admin/AdminVideos.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSearch, FaFilter, FaTimes, FaSave, FaUpload,
  FaVideo, FaPlay, FaStar, FaClock, FaUser,
  FaFileVideo, FaImage, FaChevronLeft, FaChevronRight,
  FaDownload, FaInfoCircle,
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
    storageKey: string;
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
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    profile: { fullName: string };
  };
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const AdminVideos: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    category: 'tutorial',
    categoryAr: 'درس تعليمي',
    tags: '',
    duration: 0,
    durationFormatted: '00:00',
    isPublished: true,
    isFeatured: false,
    order: 0,
  });

  const categories = [
    { value: 'tutorial', label: 'درس تعليمي' },
    { value: 'lecture', label: 'محاضرة' },
    { value: 'workshop', label: 'ورشة عمل' },
    { value: 'webinar', label: 'ندوة عبر الإنترنت' },
    { value: 'presentation', label: 'عرض تقديمي' },
    { value: 'interview', label: 'مقابلة' },
    { value: 'other', label: 'أخرى' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ===== جلب الفيديوهات =====
  const fetchVideos = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/videos-library?limit=100`;
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

  // ===== رفع ملف =====
  const uploadFile = async (file: File, category: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('portalId', PORTAL_ID);

    setUploading(true);

    try {
      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'فشل رفع الملف');
      }
      return data.data.file._id;
    } finally {
      setUploading(false);
    }
  };

  // ===== حفظ الفيديو =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile && !editingId) {
      alert('⚠️ يرجى اختيار ملف فيديو للرفع');
      return;
    }

    try {
      let fileId = null;
      let thumbnailId = null;

      if (videoFile && !editingId) {
        fileId = await uploadFile(videoFile, 'video');
      }

      if (thumbnailFile) {
        thumbnailId = await uploadFile(thumbnailFile, 'image');
      }

      const payload = {
        ...formData,
        fileId: fileId || undefined,
        thumbnailId: thumbnailId || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        duration: formData.duration || 0,
        durationFormatted: formData.durationFormatted || '00:00',
      };

      const url = editingId ? `${API_URL}/videos-library/${editingId}` : `${API_URL}/videos-library`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        await fetchVideos();
        resetForm();
        alert(editingId ? '✅ تم تحديث الفيديو بنجاح' : '✅ تم إضافة الفيديو بنجاح');
      } else {
        alert(data.message || 'حدث خطأ');
      }
    } catch (error: any) {
      alert(error.message || 'حدث خطأ');
    }
  };

  // ===== حذف فيديو =====
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

    try {
      const response = await fetch(`${API_URL}/videos-library/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchVideos();
        alert('✅ تم حذف الفيديو بنجاح');
      }
    } catch (error) {
      alert('حدث خطأ في الحذف');
    }
  };

  // ===== تبديل حالة النشر =====
  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/videos-library/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ isPublished: !current }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchVideos();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // ===== تبديل المميز =====
  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/videos-library/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ isFeatured: !current }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchVideos();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

// frontend/portal-a/src/pages/Admin/AdminVideosLibrary.tsx

// ===== تشغيل الفيديو =====
const handlePlayVideo = (id: string) => {
  const token = localStorage.getItem('token');
  // ✅ إرسال التوكن في Query String
  window.open(`${API_URL}/videos-library/${id}/stream?token=${token}`, '_blank');
};

  // ===== إعادة تعيين النموذج =====
  const resetForm = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      category: 'tutorial',
      categoryAr: 'درس تعليمي',
      tags: '',
      duration: 0,
      durationFormatted: '00:00',
      isPublished: true,
      isFeatured: false,
      order: 0,
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setEditingId(null);
    setShowForm(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  // ===== تحرير فيديو =====
  const editVideo = (video: VideoFile) => {
    setFormData({
      title: video.title || '',
      titleAr: video.titleAr || '',
      description: video.description || '',
      descriptionAr: video.descriptionAr || '',
      category: video.category || 'tutorial',
      categoryAr: video.categoryAr || 'درس تعليمي',
      tags: video.tags?.join(', ') || '',
      duration: video.duration || 0,
      durationFormatted: video.durationFormatted || '00:00',
      isPublished: video.isPublished !== undefined ? video.isPublished : true,
      isFeatured: video.isFeatured || false,
      order: video.order || 0,
    });
    setEditingId(video._id);
    setShowForm(true);
  };

  // ===== تنسيق الوقت =====
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaVideo className="text-purple-600" />
              إدارة مكتبة الفيديوهات
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({videos.length} فيديو)
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة الفيديوهات التعليمية وإضافة فيديوهات جديدة
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة فيديو جديد'}
          </button>
        </div>

        {/* ===== نموذج الإضافة ===== */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'تعديل فيديو' : 'إضافة فيديو جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العنوان (عربي) *
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العنوان (إنجليزي)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الوصف (عربي)
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الوصف (إنجليزي)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    التصنيف *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = categories.find(c => c.value === e.target.value);
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        categoryAr: cat?.label || 'درس تعليمي',
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    المدة (ثانية)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        duration: val,
                        durationFormatted: formatDuration(val),
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    min="0"
                  />
                  <p className="text-xs text-gray-400 mt-1">المدة: {formData.durationFormatted}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الكلمات المفتاحية
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="مثال: تعليم, برمجة, تصميم"
                  />
                </div>
              </div>

              {/* رفع الفيديو */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ملف الفيديو *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      ref={videoInputRef}
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {videoFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          <FaFileVideo className="text-purple-500 w-6 h-6" />
                          <span className="font-medium text-gray-900 dark:text-white">{videoFile.name}</span>
                          <span className="text-sm text-gray-500">({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setVideoFile(null); if (videoInputRef.current) videoInputRef.current.value = ''; }}
                          className="text-red-500 text-sm hover:text-red-700 transition"
                        >
                          إزالة الملف
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">اضغط لرفع ملف الفيديو</p>
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="mt-2 px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm"
                        >
                          اختيار فيديو
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الصورة المصغرة (اختياري)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      accept="image/*"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {thumbnailFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          <FaImage className="text-blue-500 w-6 h-6" />
                          <span className="font-medium text-gray-900 dark:text-white">{thumbnailFile.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setThumbnailFile(null); if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''; }}
                          className="text-red-500 text-sm hover:text-red-700 transition"
                        >
                          إزالة الملف
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FaImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">اضغط لرفع الصورة المصغرة</p>
                        <button
                          type="button"
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="mt-2 px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm"
                        >
                          اختيار صورة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-amber-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">مميز</span>
                </label>
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 mr-2">الترتيب</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {uploading ? 'جاري الرفع...' : (editingId ? 'تحديث' : 'إضافة')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== Search & Filter ===== */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <button
              onClick={() => { setCategoryFilter(''); setSearchTerm(''); }}
              className="px-4 py-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <FaFilter />
            </button>
          </div>
        </div>

        {/* ===== جدول الفيديوهات ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التصنيف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المدة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">مشاهدات</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {videos.map((video, index) => (
                  <tr key={video._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{video.titleAr || video.title}</p>
                        {video.isFeatured && <FaStar className="text-amber-500 text-xs inline ml-1" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {video.categoryAr || video.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {video.durationFormatted || formatDuration(video.duration)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {video.views || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        video.isPublished
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {video.isPublished ? 'منشور' : 'غير منشور'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handlePlayVideo(video._id)}
                          className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 transition"
                          title="تشغيل"
                        >
                          <FaPlay className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(video._id, video.isPublished)}
                          className={`p-1.5 rounded-lg transition ${
                            video.isPublished
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                          title={video.isPublished ? 'إخفاء' : 'نشر'}
                        >
                          {video.isPublished ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(video._id, video.isFeatured)}
                          className={`p-1.5 rounded-lg transition ${
                            video.isFeatured
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                          title={video.isFeatured ? 'إزالة المميز' : 'جعل مميز'}
                        >
                          <FaStar className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => editVideo(video)}
                          className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition"
                          title="تعديل"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(video._id)}
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                          title="حذف"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {videos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <FaVideo className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>لا توجد فيديوهات في المكتبة</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVideos;