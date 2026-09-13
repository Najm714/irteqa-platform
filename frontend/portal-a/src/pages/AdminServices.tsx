// frontend/portal-a/src/pages/AdminServices.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSpinner, FaSearch, FaExclamationCircle,
  FaSave, FaTimes, FaChevronDown, FaChevronUp,
  FaCog, FaInfoCircle, FaFileAlt, FaUpload,
  FaCheckCircle, FaTimesCircle, FaFolder,
  FaFilePdf, FaFileWord, FaFileImage, FaFile,
  FaDownload,FaStar
} from 'react-icons/fa';

// ============================================================
// واجهات البيانات
// ============================================================

interface Section {
  _id: string;
  name: string;
  nameAr: string;
}

interface Service {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon: string;
  slug: string;
  sectionId: string | Section;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  pricing: {
    type: string;
    defaultPrice: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ServiceDetail {
  _id: string;
  sectionId: Section | string;
  serviceId: Service | string;
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
  sectionId: Section | string;
  serviceId: Service | string;
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

type TabType = 'services' | 'details' | 'forms';

// ============================================================
// ✅ دالة مساعدة لاستخراج المعرف
// ============================================================

const extractId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    return value._id || value.id || '';
  }
  return '';
};

// ============================================================
// المكون الرئيسي
// ============================================================

const AdminServices: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ===== بيانات الجداول =====
  const [services, setServices] = useState<Service[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
  const [serviceForms, setServiceForms] = useState<ServiceForm[]>([]);

  // ===== بيانات النماذج =====
  const [formData, setFormData] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== دالة توليد slug =====
  const generateSlug = (text: string): string => {
    if (!text || text.trim() === '') return 'item-' + Date.now();
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // ===== تحميل البيانات =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [servicesRes, sectionsRes, detailsRes, formsRes] = await Promise.all([
        fetch(`${API_URL}/services`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID }
        }),
        fetch(`${API_URL}/sections`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID }
        }),
        fetch(`${API_URL}/service-details`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID }
        }),
        fetch(`${API_URL}/service-forms`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID }
        }),
      ]);

      const servicesData = await servicesRes.json();
      const sectionsData = await sectionsRes.json();
      const detailsData = await detailsRes.json();
      const formsData = await formsRes.json();

      if (servicesData.success) setServices(servicesData.data || []);
      if (sectionsData.success) setSections(sectionsData.data || []);
      if (detailsData.success) setServiceDetails(detailsData.data || []);
      if (formsData.success) setServiceForms(formsData.data || []);
    } catch (err) {
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, PORTAL_ID]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchData();
  }, [fetchData]);

  // ===== رفع ملف =====
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

  // ===== رفع ملف النموذج =====
  const uploadFormFile = async (file: File): Promise<any> => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const formDataFile = new FormData();
      formDataFile.append('file', file);
      formDataFile.append('portalId', PORTAL_ID);

      const response = await fetch(`${API_URL}/service-forms/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataFile,
      });

      const data = await response.json();
      if (data.success) {
        setUploadProgress(100);
        return data.data;
      }
      throw new Error(data.message || 'فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  // ===== حفظ الخدمة =====
  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const submitData: any = JSON.parse(JSON.stringify(formData));
      submitData.portalId = PORTAL_ID;

      if (!submitData.slug || submitData.slug.trim() === '') {
        submitData.slug = generateSlug(submitData.nameAr || submitData.name || 'service');
      }

      const endpoint = `${API_URL}/services`;
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchData();
        resetForm();
        setShowForm(false);
        setEditingId(null);
        alert('✅ تم الحفظ بنجاح!');
      } else {
        setError(data.message || 'حدث خطأ في الحفظ');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الحفظ');
    } finally {
      setUploading(false);
    }
  };

  // ===== حفظ تفاصيل الخدمة =====
  const handleSubmitDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const submitData: any = JSON.parse(JSON.stringify(formData));
      submitData.portalId = PORTAL_ID;

      const endpoint = `${API_URL}/service-details`;
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchData();
        resetForm();
        setShowForm(false);
        setEditingId(null);
        alert('✅ تم حفظ التفاصيل بنجاح!');
      } else {
        setError(data.message || 'حدث خطأ في الحفظ');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الحفظ');
    } finally {
      setUploading(false);
    }
  };

  // ===== حفظ نموذج الخدمة =====
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      let fileData = null;

      // ✅ رفع الملف إذا تم اختياره
      if (selectedFile) {
        fileData = await uploadFormFile(selectedFile);
        formData.fileId = fileData.fileId;
        formData.filename = fileData.filename;
        formData.fileSize = fileData.size;
        formData.fileMimeType = fileData.mimeType;
      }

      const submitData: any = JSON.parse(JSON.stringify(formData));
      submitData.portalId = PORTAL_ID;

      const endpoint = `${API_URL}/service-forms`;
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchData();
        resetForm();
        setShowForm(false);
        setEditingId(null);
        setSelectedFile(null);
        alert('✅ تم حفظ النموذج بنجاح!');
      } else {
        setError(data.message || 'حدث خطأ في الحفظ');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الحفظ');
    } finally {
      setUploading(false);
    }
  };

  // ===== حذف عنصر =====
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;

    try {
      let endpoint = '';
      if (activeTab === 'services') endpoint = `${API_URL}/services/${id}`;
      else if (activeTab === 'details') endpoint = `${API_URL}/service-details/${id}`;
      else if (activeTab === 'forms') endpoint = `${API_URL}/service-forms/${id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) await fetchData();
    } catch (err) {
      setError('حدث خطأ في الحذف');
    }
  };

  // ===== تبديل حالة النشر =====
  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      let endpoint = '';
      if (activeTab === 'services') endpoint = `${API_URL}/services/${id}/toggle`;
      else if (activeTab === 'details') endpoint = `${API_URL}/service-details/${id}/toggle`;
      else if (activeTab === 'forms') endpoint = `${API_URL}/service-forms/${id}/toggle`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) await fetchData();
    } catch (err) {
      setError('حدث خطأ في تغيير الحالة');
    }
  };

  // ===== إعادة تعيين النموذج =====
  const resetForm = () => {
    setFormData({});
    setSelectedFile(null);
    setFilePreview(null);
    setEditingId(null);
    setUploadProgress(0);
    setError(null);
  };

  // ===== تحرير عنصر =====
  const handleEdit = (item: any) => {
    const editData = {
      ...item,
      sectionId: extractId(item.sectionId),
      serviceId: extractId(item.serviceId),
    };
    setFormData(editData);
    setEditingId(item._id);
    setShowForm(true);
    setSelectedFile(null);
    setFilePreview(null);
  };

  // ===== معالجة اختيار الملف =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // ===== الحصول على أيقونة الملف =====
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FaFile className="text-gray-500" />;
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500" />;
    return <FaFile className="text-gray-500" />;
  };

  // ===== تنسيق حجم الملف =====
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // ===== الحصول على اسم القسم =====
  const getSectionName = (id: string) => {
    const section = sections.find(s => s._id === id);
    return section ? (section.nameAr || section.name) : 'غير محدد';
  };

  const getServiceName = (id: string) => {
    const service = services.find(s => s._id === id);
    return service ? (service.nameAr || service.name) : 'غير محدد';
  };

  // ===== الحصول على حالة النشر =====
  const getPublishBadge = (isPublished: boolean) => {
    return isPublished ? (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <FaCheckCircle className="w-3 h-3" /> منشور
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
        <FaTimesCircle className="w-3 h-3" /> غير منشور
      </span>
    );
  };

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
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
              <FaCog className="text-purple-600" />
              إدارة الخدمات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة الخدمات وتفاصيلها والنماذج السابقة
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة جديد'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
          {[
            { id: 'services', label: '⚙️ الخدمات', icon: <FaCog /> },
            { id: 'details', label: '📋 تفاصيل الخدمات', icon: <FaInfoCircle /> },
            { id: 'forms', label: '📄 النماذج السابقة', icon: <FaFileAlt /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as TabType); setShowForm(false); resetForm(); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6">
            <FaExclamationCircle className="inline ml-2" />
            {error}
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={`بحث عن ${activeTab === 'services' ? 'خدمة' : activeTab === 'details' ? 'تفاصيل' : 'نموذج'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {activeTab === 'services' && services.length} خدمة
            {activeTab === 'details' && serviceDetails.length} تفاصيل
            {activeTab === 'forms' && serviceForms.length} نموذج
          </div>
        </div>

        {/* ===== Form ===== */}
        {showForm && (
          <ServiceFormManager
            activeTab={activeTab}
            formData={formData}
            setFormData={setFormData}
            sections={sections}
            services={services}
            serviceDetails={serviceDetails}
            serviceForms={serviceForms}
            onSubmit={activeTab === 'services' ? handleSubmitService : activeTab === 'details' ? handleSubmitDetail : handleSubmitForm}
            onCancel={() => { setShowForm(false); resetForm(); }}
            loading={uploading}
            editingId={editingId}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            filePreview={filePreview}
            uploadProgress={uploadProgress}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            getSectionName={getSectionName}
            getServiceName={getServiceName}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
            generateSlug={generateSlug}
          />
        )}

        {/* ===== Data Tables ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'services' && (
              <ServiceTable
                data={services}
                sections={sections}
                searchTerm={searchTerm}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getPublishBadge={getPublishBadge}
                getSectionName={getSectionName}
              />
            )}
            {activeTab === 'details' && (
              <ServiceDetailTable
                data={serviceDetails}
                sections={sections}
                services={services}
                searchTerm={searchTerm}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getPublishBadge={getPublishBadge}
                getSectionName={getSectionName}
                getServiceName={getServiceName}
              />
            )}
            {activeTab === 'forms' && (
              <ServiceFormTable
                data={serviceForms}
                sections={sections}
                services={services}
                searchTerm={searchTerm}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getPublishBadge={getPublishBadge}
                getSectionName={getSectionName}
                getServiceName={getServiceName}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ===== مكون إدارة النموذج =====
// ============================================================

const ServiceFormManager: React.FC<any> = ({
  activeTab,
  formData,
  setFormData,
  sections,
  services,
  serviceDetails,
  serviceForms,
  onSubmit,
  onCancel,
  loading,
  editingId,
  selectedFile,
  setSelectedFile,
  filePreview,
  uploadProgress,
  fileInputRef,
  handleFileChange,
  getSectionName,
  getServiceName,
  getFileIcon,
  formatFileSize,
  generateSlug,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      if ((name === 'nameAr' || name === 'name') && !formData.slug) {
        const slug = generateSlug(value);
        setFormData({ ...formData, [name]: value, slug });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
  };

  const handleArrayChange = (name: string, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData({ ...formData, [name]: array });
  };

  // إضافة FAQ
  const addFAQ = () => {
    const faqs = formData.faqs || [];
    setFormData({
      ...formData,
      faqs: [...faqs, { question: '', questionAr: '', answer: '', answerAr: '', order: faqs.length }],
    });
  };

  const removeFAQ = (index: number) => {
    const faqs = formData.faqs || [];
    setFormData({ ...formData, faqs: faqs.filter((_: any, i: number) => i !== index) });
  };

  const updateFAQ = (index: number, field: string, value: string) => {
    const faqs = formData.faqs || [];
    faqs[index] = { ...faqs[index], [field]: value };
    setFormData({ ...formData, faqs });
  };

  // إضافة نوع طلب
  const addRequestType = () => {
    const requestTypes = formData.requestTypes || [];
    setFormData({
      ...formData,
      requestTypes: [...requestTypes, { type: 'email', label: 'Email', labelAr: 'بريد إلكتروني', isActive: true }],
    });
  };

  const removeRequestType = (index: number) => {
    const requestTypes = formData.requestTypes || [];
    setFormData({ ...formData, requestTypes: requestTypes.filter((_: any, i: number) => i !== index) });
  };

  const updateRequestType = (index: number, field: string, value: any) => {
    const requestTypes = formData.requestTypes || [];
    requestTypes[index] = { ...requestTypes[index], [field]: value };
    setFormData({ ...formData, requestTypes });
  };

  // ===== عرض النموذج حسب التبويب =====
  const renderForm = () => {
    switch (activeTab) {
      case 'services':
        return (
          <ServiceForm
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            handleArrayChange={handleArrayChange}
            sections={sections}
            generateSlug={generateSlug}
          />
        );
      case 'details':
        return (
          <ServiceDetailForm
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            sections={sections}
            services={services}
            addFAQ={addFAQ}
            removeFAQ={removeFAQ}
            updateFAQ={updateFAQ}
            addRequestType={addRequestType}
            removeRequestType={removeRequestType}
            updateRequestType={updateRequestType}
          />
        );
      case 'forms':
        return (
          <ServiceFormForm
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            sections={sections}
            services={services}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            filePreview={filePreview}
            uploadProgress={uploadProgress}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {editingId ? 'تعديل' : 'إضافة'} {
          activeTab === 'services' ? 'خدمة' :
          activeTab === 'details' ? 'تفاصيل خدمة' : 'نموذج خدمة'
        }
      </h3>
      <form onSubmit={onSubmit}>
        {renderForm()}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
            حفظ
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================
// ===== نماذج الإضافة =====
// ============================================================

// ===== نموذج الخدمة =====
const ServiceForm: React.FC<any> = ({ formData, setFormData, handleChange, handleArrayChange, sections, generateSlug }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">القسم *</label>
      <select name="sectionId" value={formData.sectionId || ''} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
        <option value="">اختر القسم</option>
        {sections.map((s: any) => (
          <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم (عربي) *</label>
      <input type="text" name="nameAr" value={formData.nameAr || ''} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم (إنجليزي)</label>
      <input type="text" name="name" value={formData.name || ''} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المعرف (Slug)</label>
      <input type="text" name="slug" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
        placeholder="سيتم توليده تلقائياً" />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (عربي)</label>
      <textarea name="descriptionAr" value={formData.descriptionAr || ''} onChange={handleChange} rows={3}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (إنجليزي)</label>
      <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأيقونة</label>
      <select name="icon" value={formData.icon || 'fa-cog'} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition">
        <option value="fa-cog">⚙️ إعدادات</option>
        <option value="fa-book">📚 كتاب</option>
        <option value="fa-graduation-cap">🎓 قبعة التخرج</option>
        <option value="fa-briefcase">💼 حقيبة</option>
        <option value="fa-search">🔍 بحث</option>
        <option value="fa-pen">✏️ قلم</option>
        <option value="fa-chart">📊 رسم بياني</option>
        <option value="fa-code">💻 برمجة</option>
        <option value="fa-heart">❤️ قلب</option>
        <option value="fa-star">⭐ نجمة</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر الافتراضي</label>
      <input type="number" name="pricing.defaultPrice" value={formData.pricing?.defaultPrice || 0}
        onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, defaultPrice: parseFloat(e.target.value) || 0 } })}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" min="0" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الترتيب</label>
      <input type="number" name="order" value={formData.order || 0} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" min="0" />
    </div>
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isPublished" checked={formData.isPublished !== false} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isFeatured" checked={formData.isFeatured || false} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">مميز</span>
      </label>
    </div>
  </div>
);

// ===== نموذج تفاصيل الخدمة =====
const ServiceDetailForm: React.FC<any> = ({
  formData, setFormData, handleChange,
  sections, services,
  addFAQ, removeFAQ, updateFAQ,
  addRequestType, removeRequestType, updateRequestType,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">القسم *</label>
        <select name="sectionId" value={formData.sectionId || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
          <option value="">اختر القسم</option>
          {sections.map((s: any) => (
            <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الخدمة *</label>
        <select name="serviceId" value={formData.serviceId || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
          <option value="">اختر الخدمة</option>
          {services.filter((s: any) => {
            const sSectionId = typeof s.sectionId === 'object' ? s.sectionId?._id : s.sectionId;
            return sSectionId === formData.sectionId || !formData.sectionId;
          }).map((s: any) => (
            <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نبذة الخدمة (عربي)</label>
        <textarea name="overviewAr" value={formData.overviewAr || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نبذة الخدمة (إنجليزي)</label>
        <textarea name="overview" value={formData.overview || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ما هي الخدمة؟ (عربي)</label>
        <textarea name="whatIsServiceAr" value={formData.whatIsServiceAr || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ما هي الخدمة؟ (إنجليزي)</label>
        <textarea name="whatIsService" value={formData.whatIsService || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من يستفيد؟ (عربي)</label>
        <textarea name="whoBenefitsAr" value={formData.whoBenefitsAr || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">من يستفيد؟ (إنجليزي)</label>
        <textarea name="whoBenefits" value={formData.whoBenefits || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المنهجيات (عربي)</label>
        <textarea name="methodologiesAr" value={formData.methodologiesAr || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المنهجيات (إنجليزي)</label>
        <textarea name="methodologies" value={formData.methodologies || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
    </div>

    {/* أنواع الطلبات */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">أنواع الطلبات</label>
        <button type="button" onClick={addRequestType} className="px-3 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm">
          <FaPlus className="inline ml-1" /> إضافة نوع
        </button>
      </div>
      <div className="space-y-2">
        {(formData.requestTypes || []).map((rt: any, index: number) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg flex-wrap">
            <select value={rt.type} onChange={(e) => updateRequestType(index, 'type', e.target.value)}
              className="px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
              <option value="online">عبر الإنترنت</option>
              <option value="in_person">حضوري</option>
              <option value="phone">هاتف</option>
              <option value="email">بريد إلكتروني</option>
            </select>
            <input type="text" value={rt.labelAr} onChange={(e) => updateRequestType(index, 'labelAr', e.target.value)}
              placeholder="الاسم (عربي)" className="flex-1 min-w-[100px] px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            <input type="text" value={rt.label} onChange={(e) => updateRequestType(index, 'label', e.target.value)}
              placeholder="الاسم (إنجليزي)" className="flex-1 min-w-[100px] px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={rt.isActive} onChange={(e) => updateRequestType(index, 'isActive', e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded" />
              نشط
            </label>
            <button type="button" onClick={() => removeRequestType(index)} className="text-red-500 hover:text-red-700 transition">
              <FaTimes />
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* الأسئلة الشائعة */}
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الأسئلة الشائعة</label>
        <button type="button" onClick={addFAQ} className="px-3 py-1 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm">
          <FaPlus className="inline ml-1" /> إضافة سؤال
        </button>
      </div>
      <div className="space-y-3">
        {(formData.faqs || []).map((faq: any, index: number) => (
          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-gray-900 dark:text-white">سؤال {index + 1}</span>
              <button type="button" onClick={() => removeFAQ(index)} className="text-red-500 hover:text-red-700 transition">
                <FaTrash />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input type="text" value={faq.questionAr} onChange={(e) => updateFAQ(index, 'questionAr', e.target.value)}
                placeholder="السؤال (عربي)" className="px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              <input type="text" value={faq.question} onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                placeholder="السؤال (إنجليزي)" className="px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              <textarea value={faq.answerAr} onChange={(e) => updateFAQ(index, 'answerAr', e.target.value)}
                placeholder="الإجابة (عربي)" rows={2} className="px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              <textarea value={faq.answer} onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                placeholder="الإجابة (إنجليزي)" rows={2} className="px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isPublished" checked={formData.isPublished !== false} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
      </label>
    </div>
  </div>
);

// ===== نموذج النموذج السابق =====
const ServiceFormForm: React.FC<any> = ({
  formData, setFormData, handleChange,
  sections, services,
  selectedFile, setSelectedFile, filePreview, uploadProgress,
  fileInputRef, handleFileChange,
  getFileIcon, formatFileSize,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">القسم *</label>
        <select name="sectionId" value={formData.sectionId || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
          <option value="">اختر القسم</option>
          {sections.map((s: any) => (
            <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الخدمة *</label>
        <select name="serviceId" value={formData.serviceId || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
          <option value="">اختر الخدمة</option>
          {services.filter((s: any) => {
            const sSectionId = typeof s.sectionId === 'object' ? s.sectionId?._id : s.sectionId;
            return sSectionId === formData.sectionId || !formData.sectionId;
          }).map((s: any) => (
            <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم النموذج (عربي) *</label>
        <input type="text" name="nameAr" value={formData.nameAr || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم النموذج (إنجليزي)</label>
        <input type="text" name="name" value={formData.name || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (عربي)</label>
        <textarea name="descriptionAr" value={formData.descriptionAr || ''} onChange={handleChange} rows={2}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (إنجليزي)</label>
        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={2}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
    </div>

    {/* رفع الملف */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملف النموذج *</label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt" className="hidden" />
        {selectedFile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              {getFileIcon(selectedFile.type)}
              <span className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</span>
              <span className="text-sm text-gray-500">({formatFileSize(selectedFile.size)})</span>
            </div>
            <button type="button" onClick={() => { setSelectedFile(null); }} className="text-red-500 text-sm hover:text-red-700 transition">
              إزالة الملف
            </button>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <div>
            <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">اضغط لرفع ملف النموذج</p>
            <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint, Images - الحد الأقصى 10MB</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition">
              اختيار ملف
            </button>
          </div>
        )}
      </div>
    </div>

    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isPublished" checked={formData.isPublished !== false} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
      </label>
      <div>
        <label className="text-sm text-gray-700 dark:text-gray-300 mr-2">الترتيب</label>
        <input type="number" name="order" value={formData.order || 0} onChange={handleChange}
          className="w-20 px-2 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" min="0" />
      </div>
    </div>
  </div>
);

// ============================================================
// ===== جداول العرض =====
// ============================================================

// ===== جدول الخدمات =====
const ServiceTable: React.FC<any> = ({ data, sections, searchTerm, onEdit, onDelete, onTogglePublish, getPublishBadge, getSectionName }) => {
  const filtered = data.filter((item: any) =>
    (item.nameAr || item.name).includes(searchTerm) ||
    getSectionName(typeof item.sectionId === 'object' ? item.sectionId?._id : item.sectionId).includes(searchTerm)
  );

  return (
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الخدمة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">القسم</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المعرف</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {filtered.map((item: any, index: number) => {
          const sectionId = typeof item.sectionId === 'object' ? item.sectionId?._id : item.sectionId;
          return (
            <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900 dark:text-white">{item.nameAr || item.name}</div>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getSectionName(sectionId)}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.slug}</span>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {item.pricing?.defaultPrice > 0 ? `${item.pricing.defaultPrice} ريال` : 'مجاني'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  {getPublishBadge(item.isPublished)}
                  {item.isFeatured && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <FaStar className="w-3 h-3" /> مميز
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                  onToggle={() => onTogglePublish(item._id, item.isPublished)} isActive={item.isPublished} />
              </td>
            </tr>
          );
        })}
        {filtered.length === 0 && (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد خدمات</td></tr>
        )}
      </tbody>
    </table>
  );
};

// ===== جدول تفاصيل الخدمات =====
const ServiceDetailTable: React.FC<any> = ({ data, sections, services, searchTerm, onEdit, onDelete, onTogglePublish, getPublishBadge, getSectionName, getServiceName }) => {
  const filtered = data.filter((item: any) => {
    const serviceId = typeof item.serviceId === 'object' ? item.serviceId?._id : item.serviceId;
    const sectionId = typeof item.sectionId === 'object' ? item.sectionId?._id : item.sectionId;
    return getServiceName(serviceId).includes(searchTerm) || getSectionName(sectionId).includes(searchTerm);
  });

  return (
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الخدمة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">القسم</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الأسئلة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {filtered.map((item: any, index: number) => {
          const serviceId = typeof item.serviceId === 'object' ? item.serviceId?._id : item.serviceId;
          const sectionId = typeof item.sectionId === 'object' ? item.sectionId?._id : item.sectionId;
          return (
            <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{getServiceName(serviceId)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getSectionName(sectionId)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.faqs?.length || 0}</td>
              <td className="px-4 py-3">{getPublishBadge(item.isPublished)}</td>
              <td className="px-4 py-3">
                <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                  onToggle={() => onTogglePublish(item._id, item.isPublished)} isActive={item.isPublished} />
              </td>
            </tr>
          );
        })}
        {filtered.length === 0 && (
          <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد تفاصيل</td></tr>
        )}
      </tbody>
    </table>
  );
};

// ===== جدول نماذج الخدمات =====
const ServiceFormTable: React.FC<any> = ({ data, sections, services, searchTerm, onEdit, onDelete, onTogglePublish, getPublishBadge, getSectionName, getServiceName, getFileIcon, formatFileSize }) => {
  const filtered = data.filter((item: any) => {
    const serviceId = typeof item.serviceId === 'object' ? item.serviceId?._id : item.serviceId;
    const sectionId = typeof item.sectionId === 'object' ? item.sectionId?._id : item.sectionId;
    return getServiceName(serviceId).includes(searchTerm) || 
           getSectionName(sectionId).includes(searchTerm) ||
           (item.nameAr || item.name).includes(searchTerm);
  });

  return (
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الخدمة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">القسم</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">اسم النموذج</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الملف</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {filtered.map((item: any, index: number) => {
          const serviceId = typeof item.serviceId === 'object' ? item.serviceId?._id : item.serviceId;
          const sectionId = typeof item.sectionId === 'object' ? item.sectionId?._id : item.sectionId;
          const fileInfo = typeof item.fileId === 'object' ? item.fileId : null;
          return (
            <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{getServiceName(serviceId)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getSectionName(sectionId)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.nameAr || item.name}</td>
              <td className="px-4 py-3">
                {fileInfo ? (
                  <div className="flex items-center gap-2">
                    {getFileIcon(fileInfo.mimeType)}
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                      {fileInfo.originalName || item.filename}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">لا يوجد</span>
                )}
              </td>
              <td className="px-4 py-3">{getPublishBadge(item.isPublished)}</td>
              <td className="px-4 py-3">
                <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                  onToggle={() => onTogglePublish(item._id, item.isPublished)} isActive={item.isPublished} />
              </td>
            </tr>
          );
        })}
        {filtered.length === 0 && (
          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد نماذج</td></tr>
        )}
      </tbody>
    </table>
  );
};

// ============================================================
// ===== مكون الأزرار الإجرائية =====
// ============================================================

const ActionButtons: React.FC<{
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isActive: boolean;
  editLabel?: string;
}> = ({ onEdit, onDelete, onToggle, isActive, editLabel = 'تعديل' }) => {
  return (
    <div className="flex gap-2">
      <button onClick={onToggle} className={`p-2 rounded-lg transition ${
        isActive ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400' :
        'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
      }`} title={isActive ? 'إخفاء' : 'نشر'}>
        {isActive ? <FaEyeSlash /> : <FaEye />}
      </button>
      <button onClick={onEdit} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition" title={editLabel}>
        <FaEdit />
      </button>
      <button onClick={onDelete} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition" title="حذف">
        <FaTrash />
      </button>
    </div>
  );
};

export default AdminServices;