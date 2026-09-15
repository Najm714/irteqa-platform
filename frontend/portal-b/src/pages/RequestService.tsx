// frontend/portal-a/src/pages/RequestService.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaArrowLeft, FaFileAlt, FaUpload,
  FaCheckCircle, FaTimesCircle, FaInfoCircle,
  FaUser, FaEnvelope, FaPhone, FaCalendar,
  FaFile, FaFilePdf, FaFileWord, FaFileImage,
  FaTrash, FaPlus, FaDownload, FaEye,
  FaMoneyBill, FaCreditCard, FaWallet,
} from 'react-icons/fa';

// ============================================================
// ✅ دالة تحويل الأيقونة إلى emoji
// ============================================================
const getServiceIcon = (icon: string | undefined): string => {
  if (!icon) return '📋';

  const normalized = icon
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^(fa[srb]?\s+|fa-)/, '');

  const icons: { [key: string]: string } = {
    'cog': '⚙️', 'book': '📚', 'graduation-cap': '🎓',
    'briefcase': '💼', 'search': '🔍', 'pen': '✏️',
    'chart': '📊', 'chart-line': '📊', 'code': '💻',
    'heart': '❤️', 'star': '⭐', 'flask': '🧪',
    'file-alt': '📄', 'file': '📄', 'language': '🌐',
    'spell-check': '✅', 'users': '👥', 'user': '👤',
    'home': '🏠', 'folder': '📁', 'folder-open': '📂',
    'clipboard': '📋', 'laptop': '💻', 'lightbulb': '💡',
    'microscope': '🔬', 'calculator': '🧮',
    'pen-fancy': '🖊️', 'pencil-alt': '✏️',
    'university': '🏛️', 'award': '🏆', 'trophy': '🏆',
    'envelope': '✉️', 'phone': '📞', 'calendar': '📅',
    'clock': '⏰', 'check': '✅', 'times': '❌',
    'plus': '➕', 'edit': '✏️', 'trash': '🗑️',
    'eye': '👁️', 'download': '⬇️', 'upload': '⬆️',
    'camera': '📷', 'image': '🖼️', 'video': '🎬',
    'music': '🎵', 'map': '🗺️', 'globe': '🌍',
    'shield': '🛡️', 'lock': '🔒', 'key': '🔑',
  };

  return icons[normalized]
    || icons[icon.trim().toLowerCase()]
    || icons[icon.trim()]
    || '📋';
};

// ============================================================
// واجهات البيانات
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
  files: File[];
  proofFiles: File[];
}

// ============================================================
// المكون الرئيسي
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

  const [formData, setFormData] = useState<RequestForm>({
    title: '',
    description: '',
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    additionalInfo: '',
    files: [],
    proofFiles: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ===== جلب بيانات الخدمة =====
  const fetchService = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(`${API_URL}/services/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setService(data.data);
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.fullName || '',
            email: user.email || '',
          }));
        }
      } else {
        setError(data.message || 'حدث خطأ في تحميل بيانات الخدمة');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل بيانات الخدمة');
    } finally {
      setLoading(false);
    }
  }, [id, token, API_URL, PORTAL_ID, user]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchService();
  }, [fetchService]);

  // ===== معالجة تغيير الحقول =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ===== رفع الملفات =====
  const uploadFile = async (file: File, category: string): Promise<string> => {
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    formDataFile.append('category', category);
    formDataFile.append('portalId', PORTAL_ID);

    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formDataFile,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'فشل رفع الملف');
    }
    return data.data.file._id;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      const validFiles = fileList.filter(f => f.size <= 10 * 1024 * 1024);
      if (validFiles.length !== fileList.length) {
        alert('⚠️ بعض الملفات تتجاوز 10MB، تم تخطيها');
      }
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...validFiles],
      }));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      const validFiles = fileList.filter(f => f.size <= 10 * 1024 * 1024);
      if (validFiles.length !== fileList.length) {
        alert('⚠️ بعض الملفات تتجاوز 10MB، تم تخطيها');
      }
      setFormData(prev => ({
        ...prev,
        proofFiles: [...prev.proofFiles, ...validFiles],
      }));
    }
    if (proofInputRef.current) {
      proofInputRef.current.value = '';
    }
  };

  const removeFile = (index: number, type: 'files' | 'proofFiles') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type === 'application/pdf') return <FaFilePdf className="text-red-500 w-5 h-5" />;
    if (type.includes('word')) return <FaFileWord className="text-blue-500 w-5 h-5" />;
    if (type.includes('image')) return <FaFileImage className="text-purple-500 w-5 h-5" />;
    return <FaFile className="text-gray-500 w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // ===== إرسال الطلب =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const uploadedFileIds: string[] = [];
      for (const file of formData.files) {
        const fileId = await uploadFile(file, 'request_file');
        uploadedFileIds.push(fileId);
      }

      const uploadedProofIds: string[] = [];
      for (const file of formData.proofFiles) {
        const fileId = await uploadFile(file, 'payment_proof');
        uploadedProofIds.push(fileId);
      }

      const requestData = {
        serviceId: id,
        formData: {
          title: formData.title,
          description: formData.description,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          preferredDate: formData.preferredDate,
          additionalInfo: formData.additionalInfo,
          files: uploadedFileIds,
          proofFiles: uploadedProofIds,
        },
      };

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        const requestIdValue = data.data?._id || data.data?.id || data.requestId || null;
        setRequestId(requestIdValue);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || 'حدث خطأ في إنشاء الطلب');
      }
    } catch (err: any) {
      console.error('❌ Error creating request:', err);
      setError(err.message || 'حدث خطأ في إنشاء الطلب');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (error || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">عذراً!</h2>
          <p className="text-gray-600 dark:text-gray-400">{error || 'الخدمة غير موجودة'}</p>
          <Link to="/services" className="mt-6 inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            العودة إلى الخدمات
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-green-200 dark:border-green-800">
          <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">✅ تم إرسال الطلب بنجاح!</h2>
          <p className="text-gray-600 dark:text-gray-400">سيتم مراجعة طلبك من قبل الإدارة وسيتم التواصل معك قريباً.</p>
          {requestId && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">رقم الطلب: #{requestId.slice(-8)}</p>
          )}
          <div className="mt-6 space-y-3">
            {requestId && (
              <Link to={`/request/${requestId}`} className="inline-block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                <FaEye className="inline ml-2" /> متابعة الطلب
              </Link>
            )}
            <Link to="/my-requests" className="inline-block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <FaFileAlt className="inline ml-2" /> عرض جميع طلباتي
            </Link>
            <Link to="/services" className="inline-block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              العودة إلى الخدمات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const serviceName = service.nameAr || service.name || 'خدمة';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-purple-600 transition">الرئيسية</Link>
          <span>›</span>
          <Link to="/services" className="hover:text-purple-600 transition">الخدمات</Link>
          <span>›</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{serviceName}</span>
          <span>›</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">طلب الخدمة</span>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-start gap-4">
            {/* ✅ استبدلنا serviceIcon بـ getServiceIcon */}
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-3xl flex-shrink-0">
              {getServiceIcon(service.icon)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">طلب الخدمة</h1>
              <p className="text-gray-600 dark:text-gray-400">{serviceName}</p>
              {service.pricing?.defaultPrice > 0 && (
                <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mt-1">
                  💰 السعر: {service.pricing.defaultPrice} ريال
                </p>
              )}
            </div>
          </div>
        </div>

        {/* نموذج الطلب */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الاسم الكامل *
                </label>
                <div className="relative">
                  <FaUser className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  البريد الإلكتروني *
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رقم الجوال *
              </label>
              <div className="relative">
                <FaPhone className="absolute right-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                عنوان الطلب *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                placeholder="أدخل عنواناً مختصراً للطلب"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                وصف الطلب *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                placeholder="اكتب وصفاً تفصيلياً للخدمة المطلوبة..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                التاريخ المفضل (اختياري)
              </label>
              <div className="relative">
                <FaCalendar className="absolute right-3 top-3 text-gray-400" />
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                معلومات إضافية (اختياري)
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                placeholder="أي معلومات إضافية تود إضافتها..."
              />
            </div>

            {/* رفع ملفات الطلب */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FaFileAlt className="inline ml-1" /> مرفقات الطلب
                </label>
                <span className="text-xs text-gray-400">الحد الأقصى 10MB لكل ملف</span>
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-purple-400 transition">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                >
                  <FaUpload className="inline ml-1" /> اختيار ملفات
                </button>
                <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images</p>
              </div>

              {formData.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFile(index, 'files')} className="text-red-500 hover:text-red-700 transition">
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* رفع إثبات الدفع */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <FaMoneyBill className="inline ml-1" /> إثبات الدفع (اختياري)
                </label>
                <span className="text-xs text-gray-400">الحد الأقصى 10MB لكل ملف</span>
              </div>
              <div className="border-2 border-dashed border-yellow-300 dark:border-yellow-600/30 rounded-xl p-4 text-center hover:border-yellow-400 transition bg-yellow-50/30 dark:bg-yellow-900/10">
                <input type="file" ref={proofInputRef} onChange={handleProofUpload} multiple accept="image/*,.pdf,.doc,.docx" className="hidden" />
                <button
                  type="button"
                  onClick={() => proofInputRef.current?.click()}
                  className="px-4 py-2 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                >
                  <FaUpload className="inline ml-1" /> رفع إثبات الدفع
                </button>
                <p className="text-xs text-gray-400 mt-1">صورة، PDF، وورد - إثبات التحويل البنكي</p>
              </div>

              {formData.proofFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.proofFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFile(index, 'proofFiles')} className="text-red-500 hover:text-red-700 transition">
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                💡 يمكنك رفع إثبات الدفع الآن أو لاحقاً من صفحة متابعة الطلب
              </p>
            </div>

            {/* أزرار الإرسال */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
              <Link
                to={`/service/${id}`}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                إلغاء
              </Link>
            </div>

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