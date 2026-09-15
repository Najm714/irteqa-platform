// frontend/portal-a/src/pages/AdminSections.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSpinner, FaSearch, FaExclamationCircle,
  FaSave, FaTimes, FaChevronDown, FaChevronUp,
  FaFolder,
  FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface Section {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon: string;
  image?: string;
  slug: string;
  parentId?: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Section[];
}

const AdminSections: React.FC = () => {
  const { token } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    icon: 'fa-folder',
    image: '',
    slug: '',
    parentId: '',
    order: 0,
    isPublished: true,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/sections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });
      const data = await response.json();
      if (data.success) {
        setSections(data.data || []);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الأقسام');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل الأقسام');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${API_URL}/sections/${editingId}`
        : `${API_URL}/sections`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        await fetchSections();
        resetForm();
        setShowForm(false);
        setEditingId(null);
        alert('✅ تم حفظ القسم بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في حفظ القسم');
      }
    } catch (err) {
      alert('حدث خطأ في حفظ القسم');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/sections/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (data.success) await fetchSections();
    } catch (err) {
      alert('حدث خطأ في تغيير الحالة');
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    try {
      const response = await fetch(`${API_URL}/sections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (data.success) await fetchSections();
    } catch (err) {
      alert('حدث خطأ في حذف القسم');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      icon: 'fa-folder',
      image: '',
      slug: '',
      parentId: '',
      order: 0,
      isPublished: true,
    });
  };

  const editSection = (section: Section) => {
    setFormData({
      name: section.name,
      nameAr: section.nameAr || '',
      description: section.description || '',
      descriptionAr: section.descriptionAr || '',
      icon: section.icon || 'fa-folder',
      image: section.image || '',
      slug: section.slug || '',
      parentId: section.parentId || '',
      order: section.order || 0,
      isPublished: section.isPublished,
    });
    setEditingId(section._id);
    setShowForm(true);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const getIconColor = (icon: string) => {
    const colors: { [key: string]: string } = {
      'fa-folder': 'text-yellow-500',
      'fa-folder-open': 'text-yellow-600',
      'fa-book': 'text-blue-500',
      'fa-graduation-cap': 'text-purple-500',
      'fa-briefcase': 'text-green-500',
      'fa-heart': 'text-red-500',
      'fa-star': 'text-amber-500',
      'fa-cog': 'text-gray-500',
    };
    return colors[icon] || 'text-gray-400';
  };

  const getIconBg = (icon: string) => {
    const colors: { [key: string]: string } = {
      'fa-folder': 'bg-yellow-100 dark:bg-yellow-900/20',
      'fa-folder-open': 'bg-yellow-100 dark:bg-yellow-900/20',
      'fa-book': 'bg-blue-100 dark:bg-blue-900/20',
      'fa-graduation-cap': 'bg-purple-100 dark:bg-purple-900/20',
      'fa-briefcase': 'bg-green-100 dark:bg-green-900/20',
      'fa-heart': 'bg-red-100 dark:bg-red-900/20',
      'fa-star': 'bg-amber-100 dark:bg-amber-900/20',
      'fa-cog': 'bg-gray-100 dark:bg-gray-700/30',
    };
    return colors[icon] || 'bg-gray-100 dark:bg-gray-700/30';
  };

  const getStatusBadge = (isPublished: boolean) => {
    return isPublished ? (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <FaCheckCircle className="w-3 h-3" /> منشور
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <FaTimesCircle className="w-3 h-3" /> غير منشور
      </span>
    );
  };

  const filteredSections = sections.filter(s =>
    (s.name || '').includes(searchTerm) ||
    (s.nameAr || '').includes(searchTerm) ||
    (s.description || '').includes(searchTerm)
  );

  const rootSections = filteredSections.filter(s => !s.parentId);
  const childSections = filteredSections.filter(s => s.parentId);

  const getChildren = (parentId: string) => {
    return childSections.filter(s => s.parentId === parentId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الأقسام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaFolder className="text-purple-600" />
              إدارة الأقسام
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إضافة وتعديل وحذف الأقسام وتنظيمها
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setEditingId(null); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة قسم جديد'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'تعديل القسم' : 'إضافة قسم جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم (عربي) *
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم (إنجليزي)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الأيقونة
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                >
                  <option value="fa-folder">📁 مجلد</option>
                  <option value="fa-folder-open">📂 مجلد مفتوح</option>
                  <option value="fa-book">📚 كتاب</option>
                  <option value="fa-graduation-cap">🎓 قبعة التخرج</option>
                  <option value="fa-briefcase">💼 حقيبة</option>
                  <option value="fa-heart">❤️ قلب</option>
                  <option value="fa-star">⭐ نجمة</option>
                  <option value="fa-cog">⚙️ إعدادات</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  القسم الرئيسي
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                >
                  <option value="">قسم رئيسي</option>
                  {rootSections.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.nameAr || s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الترتيب
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <FaSave /> حفظ
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); setEditingId(null); }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن قسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {filteredSections.length} قسم
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6">
            <FaExclamationCircle className="inline ml-2" />
            {error}
          </div>
        )}

        {/* Sections Tree */}
        {rootSections.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4 opacity-30">📂</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد أقسام</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'لا توجد أقسام تطابق بحثك' : 'أضف قسمك الأول الآن'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rootSections.map((section) => {
              const children = getChildren(section._id);
              const isExpanded = expandedSections.has(section._id);

              return (
                <div
                  key={section._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                  data-aos="fade-up"
                >
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleExpand(section._id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      >
                        {children.length > 0 ? (
                          isExpanded ? <FaChevronUp className="w-4 h-4 text-gray-500" /> : <FaChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <span className="w-4 h-4 inline-block" />
                        )}
                      </button>
                      <div className={`w-10 h-10 rounded-full ${getIconBg(section.icon)} flex items-center justify-center ${getIconColor(section.icon)}`}>
                        <i className={`fas ${section.icon || 'fa-folder'} text-lg`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {section.nameAr || section.name}
                          </h4>
                          {getStatusBadge(section.isPublished)}
                          {children.length > 0 && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
                              {children.length} أقسام فرعية
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {section.descriptionAr || section.description || 'لا يوجد وصف'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(section._id)}
                        className={`p-2 rounded-lg transition ${
                          section.isPublished
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                        }`}
                        title={section.isPublished ? 'إخفاء' : 'نشر'}
                      >
                        {section.isPublished ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        onClick={() => editSection(section)}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                        title="تعديل"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteSection(section._id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                        title="حذف"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  {isExpanded && children.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20 p-3 space-y-2">
                      {children.map((child) => (
                        <div
                          key={child._id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition border border-gray-200 dark:border-gray-700 ml-8"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-full ${getIconBg(child.icon)} flex items-center justify-center ${getIconColor(child.icon)}`}>
                              <i className={`fas ${child.icon || 'fa-folder'} text-sm`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {child.nameAr || child.name}
                                </span>
                                {getStatusBadge(child.isPublished)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleStatus(child._id)}
                              className={`p-1.5 rounded-lg transition ${
                                child.isPublished
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                              }`}
                              title={child.isPublished ? 'إخفاء' : 'نشر'}
                            >
                              {child.isPublished ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => editSection(child)}
                              className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                              title="تعديل"
                            >
                              <FaEdit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteSection(child._id)}
                              className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                              title="حذف"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSections;