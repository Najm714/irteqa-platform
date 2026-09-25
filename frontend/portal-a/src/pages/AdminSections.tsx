// frontend/portal-a/src/pages/AdminSections.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSpinner, FaSearch, FaExclamationCircle,
  FaSave, FaTimes, FaChevronDown, FaChevronUp,
  FaFolder, FaCheckCircle, FaTimesCircle,
  FaUpload, FaImage,
} from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

// ============================================================
// ✅ Helper: استخراج portalId ديناميكياً
// ============================================================
const resolvePortalId = (): string => {
  const envId = import.meta.env.VITE_PORTAL_ID;
  if (envId) return envId;

  const pathMatch = window.location.pathname.match(/\/portal\/([^/]+)/);
  if (pathMatch?.[1]) return pathMatch[1];

  const host = window.location.hostname;
  if (host !== 'localhost' && host.includes('.')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'www') return sub;
  }
  return '';
};

// ============================================================
// ✅ Types
// ============================================================
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

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ============================================================
// ✅ الأيقونات المتاحة
// ============================================================
const AVAILABLE_ICONS = [
  { id: 'fa-folder', label: '📁 مجلد' },
  { id: 'fa-folder-open', label: '📂 مجلد مفتوح' },
  { id: 'fa-book', label: '📚 كتاب' },
  { id: 'fa-graduation-cap', label: '🎓 قبعة التخرج' },
  { id: 'fa-briefcase', label: '💼 حقيبة' },
  { id: 'fa-heart', label: '❤️ قلب' },
  { id: 'fa-star', label: '⭐ نجمة' },
  { id: 'fa-cog', label: '⚙️ إعدادات' },
  { id: 'fa-flask', label: '🧪 مختبر' },
  { id: 'fa-language', label: '🌐 لغة' },
  { id: 'fa-laptop', label: '💻 حاسوب' },
  { id: 'fa-chart-line', label: '📈 رسم بياني' },
  { id: 'fa-lightbulb', label: '💡 فكرة' },
  { id: 'fa-atom', label: '⚛️ ذرة' },
  { id: 'fa-calculator', label: '🧮 آلة حاسبة' },
  { id: 'fa-microscope', label: '🔬 مجهر' },
  { id: 'fa-palette', label: '🎨 لوحة' },
  { id: 'fa-music', label: '🎵 موسيقى' },
  { id: 'fa-pen', label: '✏️ قلم' },
];

// ============================================================
// ✅ Helper: تحويل اسم الأيقونة إلى Component
// ============================================================
const getIconComponent = (iconName: string): React.ComponentType<any> => {
  // "fa-folder" → "FaFolder"
  const name = iconName
    .replace(/^fa-/, '')
    .replace(/-(\w)/g, (_, c) => c.toUpperCase())
    .replace(/^(\w)/, (c) => c.toUpperCase());

  const FaName = `Fa${name}`;
  return (FaIcons as any)[FaName] || FaIcons.FaFolder;
};

// ============================================================
// ✅ Helper: لون الأيقونة
// ============================================================
const getIconColorClass = (icon: string): string => {
  const colors: Record<string, string> = {
    'fa-folder': 'text-yellow-500',
    'fa-folder-open': 'text-yellow-600',
    'fa-book': 'text-blue-500',
    'fa-graduation-cap': 'text-purple-500',
    'fa-briefcase': 'text-green-500',
    'fa-heart': 'text-red-500',
    'fa-star': 'text-amber-500',
    'fa-cog': 'text-gray-500',
    'fa-flask': 'text-purple-600',
    'fa-language': 'text-cyan-500',
    'fa-laptop': 'text-slate-600',
    'fa-chart-line': 'text-emerald-500',
    'fa-lightbulb': 'text-amber-400',
    'fa-atom': 'text-indigo-500',
    'fa-calculator': 'text-teal-500',
    'fa-microscope': 'text-pink-500',
    'fa-palette': 'text-rose-500',
    'fa-music': 'text-fuchsia-500',
    'fa-pen': 'text-orange-500',
  };
  return colors[icon] || 'text-gray-400';
};

const getIconBgClass = (icon: string): string => {
  const colors: Record<string, string> = {
    'fa-folder': 'bg-yellow-100 dark:bg-yellow-900/20',
    'fa-folder-open': 'bg-yellow-100 dark:bg-yellow-900/20',
    'fa-book': 'bg-blue-100 dark:bg-blue-900/20',
    'fa-graduation-cap': 'bg-purple-100 dark:bg-purple-900/20',
    'fa-briefcase': 'bg-green-100 dark:bg-green-900/20',
    'fa-heart': 'bg-red-100 dark:bg-red-900/20',
    'fa-star': 'bg-amber-100 dark:bg-amber-900/20',
    'fa-cog': 'bg-gray-100 dark:bg-gray-700/30',
    'fa-flask': 'bg-purple-100 dark:bg-purple-900/20',
    'fa-language': 'bg-cyan-100 dark:bg-cyan-900/20',
    'fa-laptop': 'bg-slate-100 dark:bg-slate-700/30',
    'fa-chart-line': 'bg-emerald-100 dark:bg-emerald-900/20',
    'fa-lightbulb': 'bg-amber-100 dark:bg-amber-900/20',
    'fa-atom': 'bg-indigo-100 dark:bg-indigo-900/20',
    'fa-calculator': 'bg-teal-100 dark:bg-teal-900/20',
    'fa-microscope': 'bg-pink-100 dark:bg-pink-900/20',
    'fa-palette': 'bg-rose-100 dark:bg-rose-900/20',
    'fa-music': 'bg-fuchsia-100 dark:bg-fuchsia-900/20',
    'fa-pen': 'bg-orange-100 dark:bg-orange-900/20',
  };
  return colors[icon] || 'bg-gray-100 dark:bg-gray-700/30';
};

// ============================================================
// ✅ مكوّن Toast بسيط
// ============================================================
const ToastContainer: React.FC<{
  toasts: Toast[];
  onClose: (id: number) => void;
}> = ({ toasts, onClose }) => (
  <div className="fixed top-4 left-4 z-50 space-y-2" dir="rtl">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] animate-slide-in ${
          toast.type === 'success'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : toast.type === 'error'
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}
      >
        {toast.type === 'success' && <FaCheckCircle className="w-5 h-5 flex-shrink-0" />}
        {toast.type === 'error' && <FaTimesCircle className="w-5 h-5 flex-shrink-0" />}
        {toast.type === 'info' && <FaExclamationCircle className="w-5 h-5 flex-shrink-0" />}
        <span className="flex-1 text-sm font-medium">{toast.message}</span>
        <button
          onClick={() => onClose(toast.id)}
          className="text-gray-500 hover:text-gray-800 transition"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// ============================================================
// ✅ Helper: Debounce
// ============================================================
const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// ============================================================
// ✅ المكوّن الرئيسي
// ============================================================
const AdminSections: React.FC = () => {
  const { token } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  // ✅ Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

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
  const PORTAL_ID = resolvePortalId();

  // ============================================================
  // ✅ Toast helpers
  // ============================================================
  const showToast = useCallback(
    (type: Toast['type'], message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const closeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ============================================================
  // ✅ Headers
  // ============================================================
  const getHeaders = useCallback(
    (contentType: boolean = true): Record<string, string> => ({
      ...(contentType ? { 'Content-Type': 'application/json' } : {}),
      'X-Portal-Id': PORTAL_ID,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [PORTAL_ID, token]
  );

  // ============================================================
  // ✅ جلب الأقسام
  // ============================================================
  const fetchSections = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/sections`, {
        headers: getHeaders(false),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!mountedRef.current) return;

      if (data.success) {
        setSections(data.data || []);
        setError(null);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الأقسام');
      }
    } catch (err: any) {
      console.error('❌ Fetch sections error:', err);
      if (mountedRef.current) {
        setError(
          err.message?.includes('fetch')
            ? 'تعذر الاتصال بالخادم'
            : 'حدث خطأ في تحميل الأقسام'
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [API_URL, getHeaders]);

  // ============================================================
  // ✅ useEffect
  // ============================================================
  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    mountedRef.current = true;
    fetchSections();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchSections]);

  // ============================================================
  // ✅ حفظ (إضافة/تعديل)
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nameAr.trim() && !formData.name.trim()) {
      showToast('error', 'يجب إدخال اسم القسم على الأقل');
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/sections/${editingId}`
        : `${API_URL}/sections`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSections();
        resetForm();
        setShowForm(false);
        setEditingId(null);
        showToast('success', editingId ? 'تم تحديث القسم' : 'تم إضافة القسم');
      } else {
        showToast('error', data.message || 'حدث خطأ في الحفظ');
      }
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      showToast('error', 'حدث خطأ في حفظ القسم');
    }
  };

  // ============================================================
  // ✅ تبديل النشر
  // ============================================================
  const toggleStatus = async (id: string) => {
    if (togglingId) return;
    setTogglingId(id);

    try {
      const response = await fetch(`${API_URL}/sections/${id}/toggle`, {
        method: 'PATCH',
        headers: getHeaders(false),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSections();
        showToast('success', 'تم تحديث حالة النشر');
      } else {
        showToast('error', data.message || 'فشل تحديث الحالة');
      }
    } catch (err) {
      console.error('❌ Toggle error:', err);
      showToast('error', 'حدث خطأ في تغيير الحالة');
    } finally {
      setTogglingId(null);
    }
  };

  // ============================================================
  // ✅ حذف
  // ============================================================
  const deleteSection = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف قسم "${name}"؟\n\n⚠️ سيتم حذف جميع الأقسام الفرعية.`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}/sections/${id}`, {
        method: 'DELETE',
        headers: getHeaders(false),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSections();
        showToast('success', 'تم حذف القسم');
      } else {
        showToast('error', data.message || 'فشل الحذف');
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      showToast('error', 'حدث خطأ في حذف القسم');
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // ✅ رفع صورة القسم
  // ============================================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('category', 'image');

      const res = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'X-Portal-Id': PORTAL_ID,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formDataUpload,
      });

      const data = await res.json();

      if (data.success) {
        const url = data.data?.file?.url || data.data?.url;
        if (url) {
          setFormData((prev) => ({ ...prev, image: url }));
          showToast('success', 'تم رفع الصورة');
        } else {
          throw new Error('لم يتم استلام رابط الصورة');
        }
      } else {
        throw new Error(data.message || 'فشل الرفع');
      }
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      showToast('error', 'فشل رفع الصورة: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // ============================================================
  // ✅ إعادة تعيين النموذج
  // ============================================================
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

  // ============================================================
  // ✅ تعديل قسم
  // ============================================================
  const editSection = (section: Section) => {
    setFormData({
      name: section.name || '',
      nameAr: section.nameAr || '',
      description: section.description || '',
      descriptionAr: section.descriptionAr || '',
      icon: section.icon || 'fa-folder',
      image: section.image || '',
      slug: section.slug || '',
      parentId: section.parentId || '',
      order: section.order || 0,
      isPublished: section.isPublished ?? true,
    });
    setEditingId(section._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================
  // ✅ توسيع/طي
  // ============================================================
  const toggleExpand = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ============================================================
  // ✅ Status Badge
  // ============================================================
  const getStatusBadge = (isPublished: boolean) =>
    isPublished ? (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <FaCheckCircle className="w-3 h-3" /> منشور
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <FaTimesCircle className="w-3 h-3" /> غير منشور
      </span>
    );

  // ============================================================
  // ✅ بحث ذكي (يشمل الأبناء)
  // ============================================================
  const { rootSections, childSections } = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    const allSections = sections;

    const matchSection = (s: Section) =>
      !term ||
      (s.name || '').toLowerCase().includes(term) ||
      (s.nameAr || '').toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term) ||
      (s.descriptionAr || '').toLowerCase().includes(term);

    const children = allSections.filter((s) => s.parentId);

    // ✅ إذا كان الابن مطابقاً، اعرض الأب
    const matchedParentIds = new Set<string>();
    if (term) {
      children.forEach((child) => {
        if (matchSection(child) && child.parentId) {
          matchedParentIds.add(child.parentId);
        }
      });
    }

    const roots = allSections
      .filter((s) => !s.parentId)
      .filter((s) => !term || matchSection(s) || matchedParentIds.has(s._id))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const filteredChildren = children
      .filter((s) => !term || matchSection(s) || matchedParentIds.has(s.parentId || ''))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return { rootSections: roots, childSections: filteredChildren };
  }, [sections, debouncedSearch]);

  const getChildren = useCallback(
    (parentId: string) => childSections.filter((s) => s.parentId === parentId),
    [childSections]
  );

  // ✅ توسيع تلقائي عند البحث
  useEffect(() => {
    if (debouncedSearch.trim()) {
      const toExpand = new Set<string>();
      rootSections.forEach((r) => {
        if (getChildren(r._id).length > 0) toExpand.add(r._id);
      });
      setExpandedSections(toExpand);
    }
  }, [debouncedSearch, rootSections, getChildren]);

  // ============================================================
  // ✅ Loading
  // ============================================================
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

  // ============================================================
  // ✅ Render
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ToastContainer toasts={toasts} onClose={closeToast} />

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
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowForm(!showForm);
            }}
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

              {/* ✅ الأيقونة مع معاينة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الأيقونة
                </label>
                <div className="flex gap-3 items-center">
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.id} value={ic.id}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                  <div
                    className={`w-10 h-10 rounded-full ${getIconBgClass(formData.icon)} ${getIconColorClass(formData.icon)} flex items-center justify-center flex-shrink-0`}
                  >
                    {React.createElement(getIconComponent(formData.icon), {
                      className: 'w-5 h-5',
                    })}
                  </div>
                </div>
              </div>

              {/* ✅ القسم الرئيسي */}
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
                  {sections
                    .filter((s) => !s.parentId && s._id !== editingId)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((s) => (
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
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublished: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
                </label>
              </div>

              {/* ✅ رفع صورة القسم */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaImage className="inline ml-2" />
                  صورة القسم (اختياري)
                </label>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                  {formData.image ? (
                    <div className="space-y-3">
                      <img
                        src={formData.image}
                        alt="Section"
                        className="max-h-40 mx-auto rounded-lg shadow"
                      />
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          {uploadingImage ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaUpload />
                          )}
                          تغيير
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, image: '' }))
                          }
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-2 text-sm"
                        >
                          <FaTrash /> حذف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="py-4 w-full"
                    >
                      {uploadingImage ? (
                        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                      ) : (
                        <>
                          <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            اضغط لرفع صورة من جهازك
                          </p>
                        </>
                      )}
                    </button>
                  )}
                </div>
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
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setEditingId(null);
                  }}
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
              <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن قسم... (يشمل الأقسام الفرعية)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {rootSections.length} قسم رئيسي • {childSections.length} قسم فرعي
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6 flex items-center justify-between">
            <div>
              <FaExclamationCircle className="inline ml-2" />
              {error}
            </div>
            <button
              onClick={fetchSections}
              className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Sections Tree */}
        {rootSections.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4 opacity-30">📂</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {debouncedSearch ? 'لا توجد نتائج' : 'لا توجد أقسام'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {debouncedSearch
                ? `لا توجد أقسام تطابق "${debouncedSearch}"`
                : 'أضف قسمك الأول الآن'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rootSections.map((section) => {
              const children = getChildren(section._id);
              const isExpanded = expandedSections.has(section._id);
              const isToggling = togglingId === section._id;
              const isDeleting = deletingId === section._id;
              const IconComp = getIconComponent(section.icon);

              return (
                <div
                  key={section._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button
                        onClick={() => toggleExpand(section._id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      >
                        {children.length > 0 ? (
                          isExpanded ? (
                            <FaChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <FaChevronDown className="w-4 h-4 text-gray-500" />
                          )
                        ) : (
                          <span className="w-4 h-4 inline-block" />
                        )}
                      </button>

                      <div
                        className={`w-10 h-10 rounded-full ${getIconBgClass(section.icon)} ${getIconColorClass(section.icon)} flex items-center justify-center flex-shrink-0`}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate">
                            {section.nameAr || section.name}
                          </h4>
                          {getStatusBadge(section.isPublished)}
                          {children.length > 0 && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
                              {children.length} أقسام فرعية
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {section.descriptionAr || section.description || 'لا يوجد وصف'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(section._id)}
                        disabled={isToggling}
                        className={`p-2 rounded-lg transition disabled:opacity-50 ${
                          section.isPublished
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                        }`}
                        title={section.isPublished ? 'إخفاء' : 'نشر'}
                      >
                        {isToggling ? (
                          <FaSpinner className="animate-spin" />
                        ) : section.isPublished ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>

                      <button
                        onClick={() => editSection(section)}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                        title="تعديل"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() =>
                          deleteSection(section._id, section.nameAr || section.name)
                        }
                        disabled={isDeleting}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition disabled:opacity-50"
                        title="حذف"
                      >
                        {isDeleting ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  {isExpanded && children.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20 p-3 space-y-2">
                      {children.map((child) => {
                        const childToggling = togglingId === child._id;
                        const childDeleting = deletingId === child._id;
                        const ChildIcon = getIconComponent(child.icon);

                        return (
                          <div
                            key={child._id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition border border-gray-200 dark:border-gray-700 ml-8"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-full ${getIconBgClass(child.icon)} ${getIconColorClass(child.icon)} flex items-center justify-center flex-shrink-0`}
                              >
                                <ChildIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="font-medium text-gray-900 dark:text-white truncate">
                                    {child.nameAr || child.name}
                                  </span>
                                  {getStatusBadge(child.isPublished)}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => toggleStatus(child._id)}
                                disabled={childToggling}
                                className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                                  child.isPublished
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                                }`}
                                title={child.isPublished ? 'إخفاء' : 'نشر'}
                              >
                                {childToggling ? (
                                  <FaSpinner className="w-3 h-3 animate-spin" />
                                ) : child.isPublished ? (
                                  <FaEyeSlash className="w-3 h-3" />
                                ) : (
                                  <FaEye className="w-3 h-3" />
                                )}
                              </button>

                              <button
                                onClick={() => editSection(child)}
                                className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                                title="تعديل"
                              >
                                <FaEdit className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() =>
                                  deleteSection(child._id, child.nameAr || child.name)
                                }
                                disabled={childDeleting}
                                className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition disabled:opacity-50"
                                title="حذف"
                              >
                                {childDeleting ? (
                                  <FaSpinner className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FaTrash className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ CSS Animations */}
      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminSections;