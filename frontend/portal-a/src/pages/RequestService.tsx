// frontend/portal-a/src/pages/RequestService.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

import {
  FaSpinner, FaFileAlt,
  FaCheckCircle, FaTimesCircle, FaInfoCircle,
  FaUser, FaEnvelope, FaPhone, FaCalendar,
} from 'react-icons/fa';

// ============================================================
// ✅ Helper: استخراج portalId
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
// ✅ Helper: تحويل الأيقونة
// ============================================================
const getServiceIcon = (icon: string | undefined): string => {
  if (!icon) return '📋';

  const normalized = icon
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^(fa[srb]?\s+|fa-)/, '');

  const icons: Record<string, string> = {
    'cog': '⚙️', 'book': '📚', 'graduation-cap': '🎓',
    'briefcase': '💼', 'search': '🔍', 'pen': '✏️',
    'chart': '📊', 'chart-line': '📊', 'code': '💻',
    'heart': '❤️', 'star': '⭐', 'flask': '🧪',
    'file-alt': '📄', 'file': '📄', 'language': '🌐',
    'spell-check': '✅', 'users': '👥', 'user': '👤',
    'home': '🏠', 'folder': '📁', 'folder-open': '📂',
    'clipboard': '📋', 'laptop': '💻', 'lightbulb': '💡',
    'microscope': '🔬', 'calculator': '🧮',
    'university': '🏛️', 'award': '🏆', 'trophy': '🏆',
  };

  return icons[normalized] || '📋';
};

// ============================================================
// ✅ Types
// ============================================================
interface Service {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon?: string;
  pricing?: {
    defaultPrice: number;
  };
}

interface RequestForm {
  title: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  preferredDate?: string;
  additionalInfo: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ============================================================
// ✅ Toast Container
// ============================================================
const ToastContainer: React.FC<{
  toasts: Toast[];
  onClose: (id: number) => void;
}> = ({ toasts, onClose }) => (
  <div className="fixed top-4 left-4 z-50 space-y-2" dir="rtl">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] ${
          toast.type === 'success'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : toast.type === 'error'
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}
      >
        {toast.type === 'success' && <FaCheckCircle className="w-5 h-5 flex-shrink-0" />}
        {toast.type === 'error' && <FaTimesCircle className="w-5 h-5 flex-shrink-0" />}
        {toast.type === 'info' && <FaInfoCircle className="w-5 h-5 flex-shrink-0" />}
        <span className="flex-1 text-sm font-medium">{toast.message}</span>
        <button
          onClick={() => onClose(toast.id)}
          className="text-gray-500 hover:text-gray-800 transition"
        >
          ×
        </button>
      </div>
    ))}
  </div>
);

// ============================================================
// ✅ المكوّن الرئيسي
// ============================================================
const RequestService: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [formData, setFormData] = useState<RequestForm>({
    title: '',
    description: '',
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    additionalInfo: '',
  });

  const mountedRef = useRef(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = resolvePortalId();

  // ============================================================
  // ✅ Toast helpers
  // ============================================================
  const showToast = useCallback((type: Toast['type'], message: string) => {
    const toastId = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: toastId, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  }, []);

  const closeToast = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  // ============================================================
  // ✅ Headers
  // ============================================================
  const getHeaders = useCallback(
    (includeJson: boolean = false): Record<string, string> => ({
      ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
      'X-Portal-Id': PORTAL_ID,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [PORTAL_ID, token]
  );

  // ============================================================
  // ✅ جلب الخدمة
  // ============================================================
  const fetchService = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(`${API_URL}/services/${id}`, {
        headers: getHeaders(),
      });

      const data = await response.json();
      if (!mountedRef.current) return;

      if (data.success) {
        setService(data.data);
      } else {
        setError(data.message || 'حدث خطأ في تحميل بيانات الخدمة');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError('حدث خطأ في تحميل بيانات الخدمة');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [id, API_URL, getHeaders]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    mountedRef.current = true;
    fetchService();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchService]);

  // ============================================================
  // ✅ تعيين بيانات المستخدم
  // ============================================================
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || (user as any).phone || '',
      }));
    }
  }, [user]);

  // ============================================================
  // ✅ تغيير الحقول
  // ============================================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: value }));
  };

  // ============================================================
  // ✅ إرسال الطلب
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showToast('error', 'يجب تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const requestData = {
        serviceId: id,
        title: formData.title,
        description: formData.description,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        preferredDate: formData.preferredDate || undefined,
        additionalInfo: formData.additionalInfo || undefined,
      };

      console.log('📤 Submitting request:', requestData);

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        const rid = data.data?._id || data.data?.id || data.requestId || null;
        setRequestId(rid);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('success', 'تم إرسال الطلب بنجاح');
      } else {
        setError(data.message || 'حدث خطأ في إنشاء الطلب');
        showToast('error', data.message || 'حدث خطأ في إنشاء الطلب');
      }
    } catch (err: any) {
      console.error('❌ Error creating request:', err);
      setError(err.message || 'حدث خطأ في إنشاء الطلب');
      showToast('error', err.message || 'حدث خطأ في إنشاء الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // ✅ Loading
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات الخدمة...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ Error / No Service
  // ============================================================
  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">عذراً!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'الخدمة غير موجودة'}
          </p>
          <Link
            to="/services"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            العودة إلى الخدمات
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ Success
  // ============================================================
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-green-200 dark:border-green-800">
          <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
            ✅ تم إرسال الطلب بنجاح!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            سيتم مراجعة طلبك من قبل الإدارة وسيتم التواصل معك قريباً.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4 text-sm text-blue-700 dark:text-blue-300">
            💬 <strong>ملاحظة:</strong> يمكنك إرسال المرفقات وإثبات الدفع لاحقاً من داخل غرفة الطلب
          </div>

          {requestId && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              رقم الطلب: #{requestId.slice(-8)}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {requestId && (
              <Link
                to={`/request/${requestId}`}
                className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <FaFileAlt className="inline ml-2" /> الانتقال إلى غرفة الطلب
              </Link>
            )}
            <Link
              to="/my-requests"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FaFileAlt className="inline ml-2" /> عرض جميع طلباتي
            </Link>
            <Link
              to="/services"
              className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              العودة إلى الخدمات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const serviceName = service.nameAr || service.name || 'خدمة';

  // ============================================================
  // ✅ Render Main
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <ToastContainer toasts={toasts} onClose={closeToast} />

      <div className="container-custom max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-purple-600 transition">الرئيسية</Link>
          <span>›</span>
          <Link to="/services" className="hover:text-purple-600 transition">الخدمات</Link>
          <span>›</span>
          <Link
            to={`/service/${id}`}
            className="hover:text-purple-600 transition truncate"
          >
            {serviceName}
          </Link>
          <span>›</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">طلب الخدمة</span>
        </nav>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-3xl flex-shrink-0">
              {getServiceIcon(service.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                طلب الخدمة
              </h1>
              <p className="text-gray-600 dark:text-gray-400 truncate">{serviceName}</p>
              {service.pricing?.defaultPrice > 0 && (
                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mt-1">
                  💰 السعر: {service.pricing.defaultPrice} ريال
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-3">
          <FaInfoCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>ملاحظة:</strong> بعد إرسال الطلب، سيتم نقلك إلى "غرفة الطلب" حيث يمكنك
            رفع المرفقات، إرسال إثبات الدفع، والتواصل مع الفريق مباشرة.
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* معلومات المستخدم */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم الكامل *
                </label>
                <div className="relative">
                  <FaUser className="absolute right-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  البريد الإلكتروني *
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute right-3 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* الهاتف */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رقم الجوال *
              </label>
              <div className="relative">
                <FaPhone className="absolute right-3 top-3.5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="05XXXXXXXX"
                  className="w-full pr-10 pl-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  required
                />
              </div>
            </div>

            {/* عنوان الطلب */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                عنوان الطلب *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="أدخل عنواناً مختصراً للطلب"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                required
              />
            </div>

            {/* الوصف */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                وصف الطلب *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="اكتب وصفاً تفصيلياً للخدمة المطلوبة..."
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                required
              />
            </div>

            {/* التاريخ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                التاريخ المفضل (اختياري)
              </label>
              <div className="relative">
                <FaCalendar className="absolute right-3 top-3.5 text-gray-400" />
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
            </div>

            {/* معلومات إضافية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                معلومات إضافية (اختياري)
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={2}
                placeholder="أي معلومات إضافية..."
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>

            {/* أزرار */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    إرسال الطلب
                  </>
                )}
              </button>

              <Link
                to={`/service/${id}`}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center"
              >
                إلغاء
              </Link>
            </div>

            {/* Error داخل النموذج */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-xl border border-red-400 flex items-center gap-2">
                <FaTimesCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestService;