// frontend/portal-a/src/pages/Admin/AdminInfographics.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSearch, FaFilter, FaTimes, FaSave, FaUpload,
  FaImage, FaStar, FaClock, FaUser, FaDownload,
  FaChartBar, FaInfoCircle,
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
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  downloads: number;
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

const AdminInfographics: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [infographics, setInfographics] = useState<Infographic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    category: 'educational',
    categoryAr: 'تعليمي',
    tags: '',
    isPublished: true,
    isFeatured: false,
    order: 0,
  });

  const categories = [
    { value: 'educational', label: 'تعليمي' },
    { value: 'statistical', label: 'إحصائي' },
    { value: 'process', label: 'عمليات' },
    { value: 'comparison', label: 'مقارنات' },
    { value: 'timeline', label: 'تسلسل زمني' },
    { value: 'hierarchy', label: 'هرمي' },
    { value: 'geographical', label: 'جغرافي' },
    { value: 'other', label: 'أخرى' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ===== جلب الإنفوجرافيك =====
  const fetchInfographics = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/infographics?limit=100`;
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

  // ===== حفظ الإنفوجرافيك =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile && !editingId) {
      alert('⚠️ يرجى اختيار ملف للرفع');
      return;
    }

    try {
      let fileId = null;
      let thumbnailId = null;

      if (imageFile && !editingId) {
        fileId = await uploadFile(imageFile, 'image');
      }

      if (thumbnailFile) {
        thumbnailId = await uploadFile(thumbnailFile, 'image');
      }

      const payload = {
        ...formData,
        fileId: fileId || undefined,
        thumbnailId: thumbnailId || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const url = editingId ? `${API_URL}/infographics/${editingId}` : `${API_URL}/infographics`;
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
        await fetchInfographics();
        resetForm();
        alert(editingId ? '✅ تم تحديث الإنفوجرافيك بنجاح' : '✅ تم إضافة الإنفوجرافيك بنجاح');
      } else {
        alert(data.message || 'حدث خطأ');
      }
    } catch (error: any) {
      alert(error.message || 'حدث خطأ');
    }
  };

  // ===== حذف إنفوجرافيك =====
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإنفوجرافيك؟')) return;

    try {
      const response = await fetch(`${API_URL}/infographics/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchInfographics();
        alert('✅ تم حذف الإنفوجرافيك بنجاح');
      }
    } catch (error) {
      alert('حدث خطأ في الحذف');
    }
  };

  // ===== تبديل حالة النشر =====
  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/infographics/${id}`, {
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
        await fetchInfographics();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // ===== تبديل المميز =====
  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/infographics/${id}`, {
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
        await fetchInfographics();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // ===== عرض الإنفوجرافيك =====
  const handleView = (id: string) => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/infographics/${id}/view?token=${token}`, '_blank');
  };

  // ===== تحميل الإنفوجرافيك =====
  const handleDownload = async (id: string, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      window.open(`${API_URL}/infographics/${id}/download?token=${token}`, '_blank');
    } catch (error) {
      alert('حدث خطأ في تحميل الملف');
    }
  };

  // ===== إعادة تعيين النموذج =====
  const resetForm = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      category: 'educational',
      categoryAr: 'تعليمي',
      tags: '',
      isPublished: true,
      isFeatured: false,
      order: 0,
    });
    setImageFile(null);
    setThumbnailFile(null);
    setEditingId(null);
    setShowForm(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  // ===== تحرير إنفوجرافيك =====
  const editInfographic = (infographic: Infographic) => {
    setFormData({
      title: infographic.title || '',
      titleAr: infographic.titleAr || '',
      description: infographic.description || '',
      descriptionAr: infographic.descriptionAr || '',
      category: infographic.category || 'educational',
      categoryAr: infographic.categoryAr || 'تعليمي',
      tags: infographic.tags?.join(', ') || '',
      isPublished: infographic.isPublished !== undefined ? infographic.isPublished : true,
      isFeatured: infographic.isFeatured || false,
      order: infographic.order || 0,
    });
    setEditingId(infographic._id);
    setShowForm(true);
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
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الإنفوجرافيك...</p>
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
              <FaChartBar className="text-purple-600" />
              إدارة الإنفوجرافيك
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({infographics.length} إنفوجرافيك)
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة الإنفوجرافيك وإضافة إنفوجرافيك جديد
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة إنفوجرافيك جديد'}
          </button>
        </div>

        {/* ===== نموذج الإضافة ===== */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'تعديل إنفوجرافيك' : 'إضافة إنفوجرافيك جديد'}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        categoryAr: cat?.label || 'تعليمي',
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
                    الكلمات المفتاحية
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="مثال: تعليم, إحصاء, تقارير"
                  />
                </div>
              </div>

              {/* رفع الملف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ملف الإنفوجرافيك *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {imageFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          <FaImage className="text-purple-500 w-6 h-6" />
                          <span className="font-medium text-gray-900 dark:text-white">{imageFile.name}</span>
                          <span className="text-sm text-gray-500">({(imageFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                          className="text-red-500 text-sm hover:text-red-700 transition"
                        >
                          إزالة الملف
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">اضغط لرفع ملف الإنفوجرافيك</p>
                        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, SVG - الحد الأقصى 10MB</p>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="mt-2 px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm"
                        >
                          اختيار ملف
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
                placeholder="بحث في الإنفوجرافيك..."
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

        {/* ===== جدول الإنفوجرافيك ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التصنيف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">مشاهدات</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">تحميلات</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {infographics.map((infographic, index) => (
                  <tr key={infographic._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{infographic.titleAr || infographic.title}</p>
                        {infographic.isFeatured && <FaStar className="text-amber-500 text-xs inline ml-1" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {infographic.categoryAr || infographic.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {infographic.views || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {infographic.downloads || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        infographic.isPublished
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {infographic.isPublished ? 'منشور' : 'غير منشور'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleView(infographic._id)}
                          className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                          title="عرض"
                        >
                          <FaEye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDownload(infographic._id, infographic.fileId?.originalName || 'infographic')}
                          className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 transition"
                          title="تحميل"
                        >
                          <FaDownload className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(infographic._id, infographic.isPublished)}
                          className={`p-1.5 rounded-lg transition ${
                            infographic.isPublished
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                          title={infographic.isPublished ? 'إخفاء' : 'نشر'}
                        >
                          {infographic.isPublished ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(infographic._id, infographic.isFeatured)}
                          className={`p-1.5 rounded-lg transition ${
                            infographic.isFeatured
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                          title={infographic.isFeatured ? 'إزالة المميز' : 'جعل مميز'}
                        >
                          <FaStar className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => editInfographic(infographic)}
                          className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition"
                          title="تعديل"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(infographic._id)}
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                          title="حذف"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {infographics.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <FaChartBar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>لا توجد إنفوجرافيك في المكتبة</p>
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

export default AdminInfographics;