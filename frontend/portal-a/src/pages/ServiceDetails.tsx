// frontend/portal-a/src/pages/ServiceDetails.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

import {
  FaSpinner, FaInfoCircle, FaQuestionCircle,
  FaFileAlt, FaDownload, FaEye, FaClock, FaUser,
  FaCheckCircle, FaComments, FaShieldAlt,
  FaFilePdf, FaFileWord, FaFileImage, FaFile,
  FaExclamationTriangle, FaPlus, FaEdit, FaUpload,
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
  if (!icon) return '📁';

  const normalized = icon
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^(fa[srb]?\s+|fa-)/, '');

  const icons: Record<string, string> = {
    'cog': '⚙️',
    'book': '📚',
    'graduation-cap': '🎓',
    'briefcase': '💼',
    'search': '🔍',
    'pen': '✏️',
    'chart': '📊',
    'chart-line': '📊',
    'code': '💻',
    'heart': '❤️',
    'star': '⭐',
    'flask': '🧪',
    'file-alt': '📄',
    'file': '📄',
    'language': '🌐',
    'spell-check': '✅',
    'users': '👥',
    'user': '👤',
    'home': '🏠',
    'folder': '📁',
    'folder-open': '📂',
    'clipboard': '📋',
    'laptop': '💻',
    'lightbulb': '💡',
    'microscope': '🔬',
    'calculator': '🧮',
    'university': '🏛️',
    'award': '🏆',
    'trophy': '🏆',
  };

  return icons[normalized] || '📁';
};

// ============================================================
// ✅ Helper: أيقونة الملف
// ============================================================
const getFileIconComponent = (mimeType?: string) => {
  if (!mimeType) return <FaFile className="text-gray-500 w-5 h-5" />;
  if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-5 h-5" />;
  if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-5 h-5" />;
  if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-5 h-5" />;
  return <FaFile className="text-gray-500 w-5 h-5" />;
};

// ============================================================
// ✅ Helper: تنسيق حجم الملف
// ============================================================
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

// ============================================================
// ✅ Helper: استخراج ID من كائن أو نص
// ============================================================
const extractId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value._id || value.id || '';
  return '';
};

// ============================================================
// ✅ Types
// ============================================================
interface ServiceDetail {
  _id: string;
  sectionId: {
    _id: string;
    name: string;
    nameAr: string;
  };
  serviceId: {
    _id: string;
    name: string;
    nameAr: string;
    icon: string;
    image?: string;
  };
  overview: string;
  overviewAr: string;
  whatIsService: string;
  whatIsServiceAr: string;
  whoBenefits: string;
  whoBenefitsAr: string;
  methodologies: string;
  methodologiesAr: string;
  gallery: { fileId: string; caption: string; captionAr: string; order: number }[];
  requestTypes: { type: string; label: string; labelAr: string; isActive: boolean }[];
  faqs: { question: string; questionAr: string; answer: string; answerAr: string; order: number }[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ServiceForm {
  _id: string;
  sectionId: { _id: string; name: string; nameAr: string };
  serviceId: { _id: string; name: string; nameAr: string };
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  fileId: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
  } | string;
  filename: string;
  fileSize: number;
  fileMimeType: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
}

// ============================================================
// ✅ المكوّن الرئيسي
// ============================================================
const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(null);
  const [serviceForms, setServiceForms] = useState<ServiceForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'faqs' | 'forms' | 'request'>('overview');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = resolvePortalId();

  const isAdmin = user?.role === 'portal_admin' || user?.role === 'super_admin';

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
  // ✅ جلب تفاصيل الخدمة
  // ============================================================
  const fetchServiceDetail = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(`${API_URL}/service-details/${id}`, {
        headers: getHeaders(),
      });

      if (response.status === 404) {
        setError('لا توجد تفاصيل لهذه الخدمة. يمكنك إضافة التفاصيل من لوحة التحكم.');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setServiceDetail(data.data);
      } else {
        setError(data.message || 'حدث خطأ في تحميل تفاصيل الخدمة');
      }
    } catch (err) {
      console.error('❌ Error fetching service detail:', err);
      setError('حدث خطأ في تحميل تفاصيل الخدمة');
    }
  }, [id, API_URL, getHeaders]);

  // ============================================================
  // ✅ جلب النماذج
  // ============================================================
  const fetchServiceForms = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(
        `${API_URL}/service-forms?serviceId=${id}&isPublished=true`,
        { headers: getHeaders() }
      );

      const data = await response.json();
      if (data.success) {
        setServiceForms(data.data || []);
      }
    } catch (err) {
      console.error('❌ Error fetching service forms:', err);
    }
  }, [id, API_URL, getHeaders]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    Promise.all([fetchServiceDetail(), fetchServiceForms()]).finally(() => {
      setLoading(false);
    });
  }, [fetchServiceDetail, fetchServiceForms]);

  // ============================================================
  // ✅ تحميل ملف آمن (بدون token في URL)
  // ============================================================
  const handleDownloadFile = useCallback(
    async (fileId: string, filename: string) => {
      if (!fileId) {
        alert('⚠️ لا يوجد معرف للملف');
        return;
      }

      if (!token) {
        alert('⚠️ يرجى تسجيل الدخول أولاً');
        navigate('/login');
        return;
      }

      setDownloadingId(fileId);

      try {
        console.log('📥 Downloading:', fileId, filename);

        const response = await fetch(`${API_URL}/files/${fileId}/download-direct`, {
          headers: getHeaders(),
        });

        if (response.status === 401) {
          alert('⚠️ انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // ✅ تأخير revoke لضمان التحميل
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        console.log('✅ Downloaded:', filename);
      } catch (err: any) {
        console.error('❌ Download error:', err);
        alert('حدث خطأ في تحميل الملف');
      } finally {
        setDownloadingId(null);
      }
    },
    [token, API_URL, getHeaders, navigate]
  );

  // ============================================================
  // ✅ معاينة ملف آمن (بدون token في URL)
  // ============================================================
  const handleViewFile = useCallback(
    async (fileId: string) => {
      if (!fileId) return;

      if (!token) {
        alert('⚠️ يرجى تسجيل الدخول أولاً');
        navigate('/login');
        return;
      }

      setViewingId(fileId);

      try {
        const response = await fetch(`${API_URL}/files/${fileId}/view`, {
          headers: getHeaders(),
        });

        if (response.status === 401) {
          alert('⚠️ انتهت صلاحية الجلسة.');
          navigate('/login');
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // ✅ فتح في نافذة جديدة
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
          alert('⚠️ يرجى السماح بالنوافذ المنبثقة لمعاينة الملف');
          URL.revokeObjectURL(url);
          return;
        }

        // ✅ تنظيف بعد دقيقة
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch (err: any) {
        console.error('❌ View error:', err);
        alert('حدث خطأ في معاينة الملف');
      } finally {
        setViewingId(null);
      }
    },
    [token, API_URL, getHeaders, navigate]
  );

  // ============================================================
  // ✅ طلب الخدمة
  // ============================================================
  const handleRequestService = useCallback(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    navigate(`/request-service/${id}`);
  }, [token, id, navigate]);

  // ============================================================
  // ✅ قيم محسوبة
  // ============================================================
  const serviceName = useMemo(
    () => serviceDetail?.serviceId?.nameAr || serviceDetail?.serviceId?.name || 'خدمة',
    [serviceDetail]
  );

  const sectionName = useMemo(
    () => serviceDetail?.sectionId?.nameAr || serviceDetail?.sectionId?.name || 'قسم',
    [serviceDetail]
  );

  const hasCompleteDetails = useMemo(() => {
    if (!serviceDetail) return false;
    return Boolean(
      serviceDetail.whatIsServiceAr ||
        serviceDetail.whatIsService ||
        serviceDetail.whoBenefitsAr ||
        serviceDetail.whoBenefits ||
        serviceDetail.methodologiesAr ||
        serviceDetail.methodologies
    );
  }, [serviceDetail]);

  // ============================================================
  // ✅ Loading
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل تفاصيل الخدمة...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ Error State
  // ============================================================
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaExclamationTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">عذراً!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>

          <div className="space-y-3">
            <Link
              to="/services"
              className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center"
            >
              العودة إلى الخدمات
            </Link>

            {isAdmin && (
              <Link
                to="/admin-service-details"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
              >
                <FaPlus className="inline ml-2" />
                إضافة تفاصيل الخدمة
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ No Details
  // ============================================================
  if (!serviceDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            لا توجد تفاصيل
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            لم يتم إضافة تفاصيل لهذه الخدمة بعد.
          </p>

          <div className="space-y-3">
            <Link
              to="/services"
              className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center"
            >
              العودة إلى الخدمات
            </Link>

            {isAdmin && (
              <Link
                to="/admin-service-details"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
              >
                <FaPlus className="inline ml-2" />
                إضافة تفاصيل الخدمة
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ Render Main
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-purple-600 transition">الرئيسية</Link>
          <span>›</span>
          <Link to="/services" className="hover:text-purple-600 transition">الخدمات</Link>
          <span>›</span>
          {serviceDetail.sectionId?._id && (
            <>
              <Link
                to={`/services?section=${serviceDetail.sectionId._id}`}
                className="hover:text-purple-600 transition"
              >
                {sectionName}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
            {serviceName}
          </span>
        </nav>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* أيقونة الخدمة */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
              {serviceDetail.serviceId?.image ? (
                <img
                  src={serviceDetail.serviceId.image}
                  alt={serviceName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                getServiceIcon(serviceDetail.serviceId?.icon)
              )}
            </div>

            {/* المعلومات */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {serviceName}
                </h1>
                {sectionName && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {sectionName}
                  </span>
                )}
                {serviceDetail.isPublished && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <FaCheckCircle className="w-3 h-3" /> متاحة
                  </span>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {serviceDetail.overviewAr ||
                  serviceDetail.overview ||
                  'لا يوجد وصف للخدمة'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FaClock className="w-4 h-4" />
                  {new Date(serviceDetail.createdAt).toLocaleDateString('ar-SA')}
                </span>
                <span className="flex items-center gap-1">
                  <FaFileAlt className="w-4 h-4" />
                  {serviceForms.length} نموذج
                </span>
                <span className="flex items-center gap-1">
                  <FaQuestionCircle className="w-4 h-4" />
                  {serviceDetail.faqs?.length || 0} سؤال شائع
                </span>
              </div>
            </div>

            {/* زر الطلب */}
            <div className="flex-shrink-0 w-full md:w-auto">
              <button
                onClick={handleRequestService}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
              >
                <FaFileAlt className="w-4 h-4" />
                طلب الخدمة
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                {token ? 'ابدأ طلبك الآن' : 'سجل دخول للطلب'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: 'overview', label: '📋 نظرة عامة' },
            { id: 'faqs', label: '❓ الأسئلة الشائعة' },
            { id: 'forms', label: '📄 النماذج' },
            { id: 'request', label: '📝 طلب الخدمة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ====================================================
            تبويب نظرة عامة
        ==================================================== */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            {!hasCompleteDetails ? (
              <div className="text-center py-8">
                <FaInfoCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  لا توجد تفاصيل كاملة لهذه الخدمة
                </p>
                {isAdmin && (
                  <Link
                    to="/admin-service-details"
                    className="inline-block mt-2 text-purple-600 hover:underline"
                  >
                    <FaEdit className="inline ml-1" /> إضافة تفاصيل
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {(serviceDetail.whatIsServiceAr || serviceDetail.whatIsService) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <FaInfoCircle className="text-purple-600" />
                        ما هي هذه الخدمة؟
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                        {serviceDetail.whatIsServiceAr || serviceDetail.whatIsService}
                      </p>
                    </div>
                  )}

                  {(serviceDetail.whoBenefitsAr || serviceDetail.whoBenefits) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <FaUser className="text-blue-600" />
                        من يستفيد من هذه الخدمة؟
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                        {serviceDetail.whoBenefitsAr || serviceDetail.whoBenefits}
                      </p>
                    </div>
                  )}

                  {(serviceDetail.methodologiesAr || serviceDetail.methodologies) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <FaShieldAlt className="text-green-600" />
                        المنهجيات والأساليب
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                        {serviceDetail.methodologiesAr || serviceDetail.methodologies}
                      </p>
                    </div>
                  )}

                  {serviceDetail.requestTypes?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <FaComments className="text-orange-600" />
                        أنواع الطلبات المتاحة
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {serviceDetail.requestTypes
                          .filter((rt) => rt.isActive)
                          .map((rt, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                            >
                              {rt.labelAr || rt.label}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <aside className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
                    📊 معلومات سريعة
                  </h4>

                  <div className="space-y-3">
                    <InfoRow label="🏷️ الخدمة" value={serviceName} />
                    <InfoRow label="📂 القسم" value={sectionName} />
                    <InfoRow
                      label="📄 النماذج"
                      value={String(serviceForms.length)}
                      valueClass="text-purple-600"
                    />
                    <InfoRow
                      label="❓ الأسئلة"
                      value={String(serviceDetail.faqs?.length || 0)}
                      valueClass="text-blue-600"
                    />
                    <InfoRow
                      label="📅 النشر"
                      value={new Date(serviceDetail.createdAt).toLocaleDateString('ar-SA')}
                    />
                  </div>

                  <button
                    onClick={handleRequestService}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <FaFileAlt className="w-4 h-4" />
                    طلب الخدمة الآن
                  </button>
                </aside>
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            تبويب الأسئلة الشائعة
        ==================================================== */}
        {activeTab === 'faqs' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaQuestionCircle className="text-purple-600" />
              الأسئلة الشائعة
            </h3>

            {serviceDetail.faqs?.length > 0 ? (
              <div className="space-y-4">
                {serviceDetail.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                  >
                    <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {faq.questionAr || faq.question}
                      </h4>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                        {faq.answerAr || faq.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FaQuestionCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                لا توجد أسئلة شائعة لهذه الخدمة
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            تبويب النماذج
        ==================================================== */}
        {activeTab === 'forms' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFileAlt className="text-purple-600" />
              نماذج الخدمة
            </h3>

            {serviceForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceForms.map((form, index) => {
                  const fileId = extractId(form.fileId);
                  const fileInfo = typeof form.fileId === 'object' ? form.fileId : null;
                  const fileName = fileInfo?.originalName || form.filename || 'ملف';
                  const mimeType = fileInfo?.mimeType || form.fileMimeType;

                  const isDownloading = downloadingId === fileId;
                  const isViewing = viewingId === fileId;

                  return (
                    <div
                      key={form._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                      data-aos="fade-up"
                      data-aos-delay={index * 50}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                          {getFileIconComponent(mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {form.nameAr || form.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {form.descriptionAr || form.description || 'نموذج الخدمة'}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>{formatFileSize(fileInfo?.size || form.fileSize)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleDownloadFile(fileId, fileName)}
                          disabled={isDownloading}
                          className="flex-1 px-4 py-2 bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <FaSpinner className="w-4 h-4 animate-spin" />
                              جاري التحميل...
                            </>
                          ) : (
                            <>
                              <FaDownload className="w-4 h-4" />
                              تحميل
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleViewFile(fileId)}
                          disabled={isViewing}
                          className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isViewing ? (
                            <FaSpinner className="w-4 h-4 animate-spin" />
                          ) : (
                            <FaEye className="w-4 h-4" />
                          )}
                          معاينة
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FaFileAlt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                لا توجد نماذج لهذه الخدمة
                <div className="mt-2 text-sm">سيتم إضافة النماذج قريباً</div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            تبويب طلب الخدمة
        ==================================================== */}
        {activeTab === 'request' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFileAlt className="text-purple-600" />
              طلب الخدمة
            </h3>

            {!token ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-30">🔒</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  يرجى تسجيل الدخول
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  لتتمكن من طلب هذه الخدمة، يرجى تسجيل الدخول أولاً
                </p>
                <Link
                  to="/login"
                  className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  تسجيل الدخول
                </Link>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 mb-6">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaInfoCircle className="text-purple-600" />
                    معلومات الطلب
                  </h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <InfoRow label="الخدمة" value={serviceName} />
                    <InfoRow label="القسم" value={sectionName} />
                    <InfoRow label="المستخدم" value={user?.fullName || 'مستخدم'} />
                  </div>
                </div>

                <div className="text-center py-8">
                  <button
                    onClick={handleRequestService}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all inline-flex items-center gap-2"
                  >
                    <FaFileAlt className="w-4 h-4" />
                    الانتقال إلى نموذج الطلب
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    سيتم نقلك إلى صفحة نموذج الطلب الكامل
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ✅ InfoRow Component
// ============================================================
const InfoRow: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className={`font-bold text-sm text-gray-900 dark:text-white ${valueClass}`}>
      {value}
    </span>
  </div>
);

export default ServiceDetails;