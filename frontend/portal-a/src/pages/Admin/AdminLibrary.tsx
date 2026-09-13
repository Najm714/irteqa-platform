// frontend/portal-a/src/pages/Admin/AdminLibrary.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaDownload, FaSearch, FaFilter, FaTimes,
  FaSave, FaUpload, FaFileAlt, FaFilePdf, FaFileWord,
  FaFileExcel, FaFileImage, FaFile, FaStar, FaStarHalf,
  FaChevronLeft, FaChevronRight, FaInfoCircle,
  FaTag, FaClock, FaUser, FaCalendarAlt,
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
    storageKey: string;
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
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    profile: { fullName: string };
  };
}

interface Category {
  value: string;
  label: string;
  labelAr: string;
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const AdminLibrary: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    category: 'other',
    categoryAr: 'أخرى',
    tags: '',
    isPublished: true,
    isFeatured: false,
    order: 0,
  });

  const categories: Category[] = [
    { value: 'guide', label: 'Guide', labelAr: 'دليل' },
    { value: 'template', label: 'Template', labelAr: 'نموذج' },
    { value: 'policy', label: 'Policy', labelAr: 'سياسة' },
    { value: 'manual', label: 'Manual', labelAr: 'دليل إرشادي' },
    { value: 'report', label: 'Report', labelAr: 'تقرير' },
    { value: 'presentation', label: 'Presentation', labelAr: 'عرض تقديمي' },
    { value: 'research', label: 'Research', labelAr: 'بحث' },
    { value: 'other', label: 'Other', labelAr: 'أخرى' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== جلب الملفات =====
  const fetchFiles = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/library?limit=100`;
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

  // ===== رفع ملف =====
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'library');
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

  // ===== حفظ الملف =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !editingId) {
      alert('⚠️ يرجى اختيار ملف للرفع');
      return;
    }

    try {
      let fileId = null;

      // رفع الملف إذا كان جديداً
      if (selectedFile && !editingId) {
        fileId = await uploadFile(selectedFile);
      }

      const payload = {
        ...formData,
        fileId: fileId || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const url = editingId ? `${API_URL}/library/${editingId}` : `${API_URL}/library`;
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
        await fetchFiles();
        resetForm();
        alert(editingId ? '✅ تم تحديث الملف بنجاح' : '✅ تم إضافة الملف إلى المكتبة بنجاح');
      } else {
        alert(data.message || 'حدث خطأ');
      }
    } catch (error: any) {
      alert(error.message || 'حدث خطأ');
    }
  };

  // ===== حذف ملف =====
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف من المكتبة؟')) return;

    try {
      const response = await fetch(`${API_URL}/library/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchFiles();
        alert('✅ تم حذف الملف بنجاح');
      }
    } catch (error) {
      alert('حدث خطأ في الحذف');
    }
  };

  // ===== تبديل حالة النشر =====
  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/library/${id}`, {
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
        await fetchFiles();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // ===== تبديل المميز =====
  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/library/${id}`, {
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
        await fetchFiles();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

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

  // ===== إعادة تعيين النموذج =====
  const resetForm = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      category: 'other',
      categoryAr: 'أخرى',
      tags: '',
      isPublished: true,
      isFeatured: false,
      order: 0,
    });
    setSelectedFile(null);
    setEditingId(null);
    setShowForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ===== تحرير ملف =====
  const editFile = (file: LibraryFile) => {
    setFormData({
      title: file.title || '',
      titleAr: file.titleAr || '',
      description: file.description || '',
      descriptionAr: file.descriptionAr || '',
      category: file.category || 'other',
      categoryAr: file.categoryAr || 'أخرى',
      tags: file.tags?.join(', ') || '',
      isPublished: file.isPublished !== undefined ? file.isPublished : true,
      isFeatured: file.isFeatured || false,
      order: file.order || 0,
    });
    setEditingId(file._id);
    setShowForm(true);
  };

  // ===== أيقونة الملف =====
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-5 h-5" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-5 h-5" />;
    if (mimeType.includes('excel')) return <FaFileExcel className="text-green-500 w-5 h-5" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-5 h-5" />;
    return <FaFile className="text-gray-500 w-5 h-5" />;
  };

  // ===== تنسيق حجم الملف =====
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== الحصول على اسم الفئة =====
  const getCategoryLabel = (value: string) => {
    const cat = categories.find(c => c.value === value);
    return cat?.labelAr || value || 'أخرى';
  };

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaFileAlt className="text-purple-600" />
              إدارة المكتبة
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({files.length} ملف)
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة ملفات المكتبة وإضافة ملفات جديدة
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة ملف جديد'}
          </button>
        </div>

        {/* ===== نموذج الإضافة ===== */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'تعديل ملف' : 'إضافة ملف جديد'}
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
                        categoryAr: cat?.labelAr || 'أخرى',
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.labelAr} ({cat.label})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الكلمات المفتاحية (مفصولة بفاصلة)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="مثال: دليل, نموذج, تقرير"
                  />
                </div>
              </div>

              {/* رفع الملف */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الملف *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          {getFileIcon(selectedFile.type)}
                          <span className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</span>
                          <span className="text-sm text-gray-500">({formatFileSize(selectedFile.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="text-red-500 text-sm hover:text-red-700 transition"
                        >
                          إزالة الملف
                        </button>
                        {uploading && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full animate-pulse w-full" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">اضغط لرفع الملف</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint, Images - الحد الأقصى 20MB</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-3 px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                        >
                          اختيار ملف
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                placeholder="بحث في المكتبة..."
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
                <option key={cat.value} value={cat.value}>{cat.labelAr}</option>
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

        {/* ===== جدول الملفات ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الملف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التصنيف</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحجم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">تحميلات</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {files.map((file, index) => (
                  <tr key={file._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.fileId?.mimeType)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                          {file.fileId?.originalName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{file.titleAr || file.title}</p>
                        {file.isFeatured && <FaStar className="text-amber-500 text-xs inline ml-1" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {file.categoryAr || getCategoryLabel(file.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.fileId?.size || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {file.downloads || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        file.isPublished
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {file.isPublished ? 'منشور' : 'غير منشور'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => handleTogglePublish(file._id, file.isPublished)}
                          className={`p-1.5 rounded-lg transition ${
                            file.isPublished
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                          title={file.isPublished ? 'إخفاء' : 'نشر'}
                        >
                          {file.isPublished ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(file._id, file.isFeatured)}
                          className={`p-1.5 rounded-lg transition ${
                            file.isFeatured
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                          title={file.isFeatured ? 'إزالة المميز' : 'جعل مميز'}
                        >
                          <FaStar className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDownload(file._id, file.fileId?.originalName || 'file')}
                          className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                          title="تحميل"
                        >
                          <FaDownload className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => editFile(file)}
                          className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition"
                          title="تعديل"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(file._id)}
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                          title="حذف"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {files.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <FaFileAlt className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>لا توجد ملفات في المكتبة</p>
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

export default AdminLibrary;