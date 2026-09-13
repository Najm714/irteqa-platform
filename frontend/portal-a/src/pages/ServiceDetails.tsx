// frontend/portal-a/src/pages/ServiceDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaInfoCircle, FaQuestionCircle,
  FaFileAlt, FaDownload, FaEye, FaClock, FaUser,
  FaCheckCircle,
  FaComments, FaShieldAlt,
  FaFilePdf, FaFileWord, FaFileImage, FaFile,
  FaExclamationTriangle, FaPlus, FaEdit, FaUpload
} from 'react-icons/fa';

// ============================================================
// ✅ دالة تحويل الأيقونة إلى emoji
// ============================================================
const getServiceIcon = (icon: string | undefined): string => {
  if (!icon) return '📁';

  // ✅ تطبيع النص: احذف المسافات، fa-، fas ، إلخ
  const normalized = icon
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^(fa[srb]?\s+|fa-)/, '');

  const icons: { [key: string]: string } = {
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
    'pen-fancy': '🖊️',
    'pencil-alt': '✏️',
    'university': '🏛️',
    'award': '🏆',
    'trophy': '🏆',
    'envelope': '✉️',
    'phone': '📞',
    'calendar': '📅',
    'clock': '⏰',
    'check': '✅',
    'times': '❌',
    'plus': '➕',
    'edit': '✏️',
    'trash': '🗑️',
    'eye': '👁️',
    'download': '⬇️',
    'upload': '⬆️',
    'camera': '📷',
    'image': '🖼️',
    'video': '🎬',
    'music': '🎵',
    'map': '🗺️',
    'globe': '🌍',
    'shield': '🛡️',
    'lock': '🔒',
    'key': '🔑',
  };

  return icons[normalized]
    || icons[icon.trim().toLowerCase()]
    || icons[icon.trim()]
    || '📁';
};

// ============================================================
// واجهات البيانات
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
  sectionId: {
    _id: string;
    name: string;
    nameAr: string;
  };
  serviceId: {
    _id: string;
    name: string;
    nameAr: string;
  };
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  fileId: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  filename: string;
  fileSize: number;
  fileMimeType: string;
  isPublished: boolean;
  order: number;
  createdAt: string;
}

// ============================================================
// المكون الرئيسي
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  // ===== جلب تفاصيل الخدمة =====
  const fetchServiceDetail = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(`${API_URL}/service-details/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Portal-Id': PORTAL_ID,
        },
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
      console.error('Error fetching service detail:', err);
      setError('حدث خطأ في تحميل تفاصيل الخدمة');
    }
  }, [id, token, API_URL, PORTAL_ID]);

  // ===== جلب نماذج الخدمة =====
  const fetchServiceForms = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(`${API_URL}/service-forms?serviceId=${id}&isPublished=true`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setServiceForms(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching service forms:', err);
    }
  }, [id, token, API_URL, PORTAL_ID]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    Promise.all([fetchServiceDetail(), fetchServiceForms()]).then(() => {
      setLoading(false);
    });
  }, [fetchServiceDetail, fetchServiceForms]);

  // ===== تحميل ملف النموذج =====
  const handleDownloadFile = async (fileId: string, filename: string) => {
    if (!fileId) {
      alert('⚠️ لا يوجد معرف للملف');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ يرجى تسجيل الدخول أولاً');
      navigate('/login');
      return;
    }

    try {
      console.log('📥 Downloading file:', fileId, filename);

      const response = await fetch(`${API_URL}/files/${fileId}/download-direct`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      if (response.status === 401) {
        alert('⚠️ انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('✅ File downloaded successfully');
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('حدث خطأ في تحميل الملف');
    }
  };

  // ===== طلب الخدمة =====
  const handleRequestService = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    navigate(`/request-service/${id}`);
  };

  // ===== الحصول على أيقونة الملف =====
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-5 h-5" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-5 h-5" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-5 h-5" />;
    return <FaFile className="text-gray-500 w-5 h-5" />;
  };

  // ===== تنسيق حجم الملف =====
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // ===== عرض حالة التحميل =====
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

  // ===== عرض الخطأ =====
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaExclamationTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">عذراً!</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <div className="mt-6 space-y-3">
            <Link
              to="/services"
              className="inline-block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              العودة إلى الخدمات
            </Link>
            {user?.role === 'portal_admin' || user?.role === 'super_admin' ? (
              <Link
                to="/admin-service-details"
                className="inline-block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FaPlus className="inline ml-2" />
                إضافة تفاصيل الخدمة (لوحة التحكم)
              </Link>
            ) : (
              <p className="text-sm text-gray-400 mt-2">
                💡 تواصل مع المدير لإضافة تفاصيل هذه الخدمة
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== إذا لم توجد تفاصيل =====
  if (!serviceDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">لا توجد تفاصيل</h2>
          <p className="text-gray-600 dark:text-gray-400">
            لم يتم إضافة تفاصيل لهذه الخدمة بعد.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              to="/services"
              className="inline-block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              العودة إلى الخدمات
            </Link>
            {(user?.role === 'portal_admin' || user?.role === 'super_admin') && (
              <Link
                to="/admin-service-details"
                className="inline-block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

  const service = serviceDetail;
  const serviceName = service.serviceId?.nameAr || service.serviceId?.name || 'خدمة';
  const sectionName = service.sectionId?.nameAr || service.sectionId?.name || 'قسم';

  const hasCompleteDetails = service.whatIsServiceAr || service.whatIsService ||
                            service.whoBenefitsAr || service.whoBenefits ||
                            service.methodologiesAr || service.methodologies;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-purple-600 transition">الرئيسية</Link>
          <span>›</span>
          <Link to="/services" className="hover:text-purple-600 transition">الخدمات</Link>
          <span>›</span>
          <Link to={`/services?section=${service.sectionId?._id}`} className="hover:text-purple-600 transition">
            {sectionName}
          </Link>
          <span>›</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{serviceName}</span>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* ✅ أيقونة الخدمة - الآن تستخدم getServiceIcon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-4xl flex-shrink-0">
              {getServiceIcon(service.serviceId?.icon)}
            </div>

            {/* معلومات الخدمة */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {serviceName}
                </h1>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {sectionName}
                </span>
                {service.isPublished && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <FaCheckCircle className="w-3 h-3" /> متاحة
                  </span>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {service.overviewAr || service.overview || 'لا يوجد وصف للخدمة'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FaClock className="w-4 h-4" />
                  تم النشر: {new Date(service.createdAt).toLocaleDateString('ar-SA')}
                </span>
                <span className="flex items-center gap-1">
                  <FaFileAlt className="w-4 h-4" />
                  {serviceForms.length} نموذج
                </span>
                <span className="flex items-center gap-1">
                  <FaQuestionCircle className="w-4 h-4" />
                  {service.faqs?.length || 0} سؤال شائع
                </span>
              </div>
            </div>

            {/* زر طلب الخدمة */}
            <div className="flex-shrink-0">
              <button
                onClick={handleRequestService}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
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

        {/* تبويب نظرة عامة */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            {!hasCompleteDetails ? (
              <div className="text-center py-8">
                <FaInfoCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">لا توجد تفاصيل كاملة لهذه الخدمة</p>
                {(user?.role === 'portal_admin' || user?.role === 'super_admin') && (
                  <Link to="/admin-service-details" className="mt-4 inline-block text-purple-600 hover:underline">
                    <FaEdit className="inline ml-1" /> إضافة تفاصيل
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FaInfoCircle className="text-purple-600" />
                      ما هي هذه الخدمة؟
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {service.whatIsServiceAr || service.whatIsService || 'لا يوجد وصف تفصيلي للخدمة'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FaUser className="text-blue-600" />
                      من يستفيد من هذه الخدمة؟
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {service.whoBenefitsAr || service.whoBenefits || 'الخدمة متاحة للجميع'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FaShieldAlt className="text-green-600" />
                      المنهجيات والأساليب المستخدمة
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {service.methodologiesAr || service.methodologies || 'لا توجد منهجيات محددة'}
                    </p>
                  </div>

                  {service.requestTypes && service.requestTypes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <FaComments className="text-orange-600" />
                        أنواع الطلبات المتاحة
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {service.requestTypes.filter(rt => rt.isActive).map((rt, index) => (
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

                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">📊 معلومات سريعة</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-500 dark:text-gray-400">🏷️ الخدمة</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{serviceName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-500 dark:text-gray-400">📂 القسم</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{sectionName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-500 dark:text-gray-400">📄 النماذج</span>
                      <span className="font-bold text-purple-600">{serviceForms.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-500 dark:text-gray-400">❓ الأسئلة</span>
                      <span className="font-bold text-blue-600">{service.faqs?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-500 dark:text-gray-400">📅 النشر</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {new Date(service.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleRequestService}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <FaFileAlt className="w-4 h-4" />
                    طلب الخدمة الآن
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* تبويب الأسئلة الشائعة */}
        {activeTab === 'faqs' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaQuestionCircle className="text-purple-600" />
              الأسئلة الشائعة
            </h3>
            {service.faqs && service.faqs.length > 0 ? (
              <div className="space-y-4">
                {service.faqs.map((faq, index) => (
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
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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

        {/* تبويب النماذج */}
        {activeTab === 'forms' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFileAlt className="text-purple-600" />
              نماذج الخدمة
            </h3>
            {serviceForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceForms.map((form, index) => (
                  <div
                    key={form._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        {getFileIcon(form.fileMimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {form.nameAr || form.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {form.descriptionAr || form.description || 'نموذج الخدمة'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>{formatFileSize(form.fileSize)}</span>
                          <span>•</span>
                          <span>{form.fileMimeType || 'غير معروف'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleDownloadFile(
                          typeof form.fileId === 'object' ? form.fileId._id : form.fileId,
                          form.filename
                        )}
                        className="flex-1 px-4 py-2 bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                      >
                        <FaDownload className="w-4 h-4" />
                        تحميل النموذج
                      </button>
                      <button
                        onClick={() => window.open(`${API_URL}/files/${form.fileId?._id}/view?token=${localStorage.getItem('token')}`, '_blank')}
                        className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                      >
                        <FaEye className="w-4 h-4" />
                        معاينة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FaFileAlt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                لا توجد نماذج لهذه الخدمة
                <div className="mt-2 text-sm">
                  سيتم إضافة النماذج قريباً
                </div>
              </div>
            )}
          </div>
        )}

        {/* تبويب طلب الخدمة */}
        {activeTab === 'request' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFileAlt className="text-purple-600" />
              طلب الخدمة
            </h3>

            {!token ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-30">🔒</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">يرجى تسجيل الدخول</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  لتتمكن من طلب هذه الخدمة، يرجى تسجيل الدخول أولاً
                </p>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
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
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">الخدمة</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{serviceName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">القسم</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{sectionName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">المستخدم</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{user?.fullName || 'مستخدم'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      وصف الطلب *
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      placeholder="اكتب وصفاً تفصيلياً للخدمة المطلوبة..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      المرفقات (اختياري)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                      <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">اسحب الملفات هنا أو اضغط للاختيار</p>
                      <p className="text-xs text-gray-400 mt-1">الحد الأقصى 10MB</p>
                      <button className="mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        اختيار ملفات
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('✅ سيتم إرسال الطلب إلى المدير للموافقة عليه')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <FaFileAlt className="w-4 h-4" />
                    إرسال الطلب
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetails;