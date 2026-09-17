// frontend/portal-a/src/pages/AdminExplanations.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSpinner, FaSearch, FaExclamationCircle,
  FaSave, FaTimes, FaChevronDown, FaChevronUp,
  FaUniversity, FaSchool, FaTag, FaBook, FaVideo,
  FaGraduationCap, FaFileAlt,
  FaLock, FaUnlock, FaMoneyBill, FaStar,
  FaUpload, FaFilePdf, FaFileWord,
  FaFileImage, FaFileArchive, FaFile,
  FaFileVideo, FaFileCode,
  FaTrashAlt, FaCloudUploadAlt, FaCheckCircle, FaTimesCircle,
  FaFolderOpen, FaFileImport, FaList,
} from 'react-icons/fa';

// ============================================================
// واجهات البيانات
// ============================================================

interface University {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  icon: string;
  logo?: string;
  slug: string;
  portalId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface College {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  universityId: string | University;
  icon: string;
  slug: string;
  portalId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Specialty {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  code: string;
  universityId: string | University;
  collegeId: string | College;
  icon: string;
  slug: string;
  portalId: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Material {
  _id: string;
  name: string;
  nameAr: string;
  code: string;
  description?: string;
  descriptionAr?: string;
  universityId: string | University;
  collegeId: string | College;
  specialtyId: string | Specialty;
  icon: string;
  instructor: string;
  instructorBio?: string;
  duration: string;
  price: number;
  features: string[];
  featuresAr: string[];
  portalId: string;
  units: {
    _id?: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    files: {
      _id?: string;
      fileId: string;
      filename: string;
      isEncrypted: boolean;
      size?: number;
      mimeType?: string;
    }[];
    order: number;
  }[];
  summaries: {
    _id?: string;
    fileId: string;
    title: string;
    titleAr: string;
    isEncrypted: boolean;
    order: number;
  }[];
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  createdBy: {
    _id: string;
    profile: { fullName: string };
  };
  createdAt: string;
  updatedAt: string;
}

interface Video {
  _id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  universityId: string | University;
  collegeId: string | College;
  specialtyId: string | Specialty;
  materialId: string | Material;
  instructor: string;
  videoUrl: string;
  videoFile?: File;
  thumbnail: string;
  duration: number;
  isEncrypted: boolean;
  isPublished: boolean;
  portalId: string;
  slug: string;
  order: number;
  createdBy: {
    _id: string;
    profile: { fullName: string };
  };
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  _id: string;
  accountId: {
    _id: string;
    profile: { fullName: string };
    email: string;
  };
  materialId: string | Material;
  price: number;
  currency: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  description?: string;
  descriptionAr?: string;
  benefits: string[];
  benefitsAr: string[];
  portalId: string;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'universities' | 'colleges' | 'specialties' | 'materials' | 'videos' | 'subscriptions' | 'units' | 'summaries';

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

const AdminExplanations: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('universities');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // ===== بيانات الجداول =====
  const [universities, setUniversities] = useState<University[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // ===== بيانات النماذج =====
  const [formData, setFormData] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

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
  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoints: Record<TabType, string> = {
        universities: `${API_URL}/explanations/universities`,
        colleges: `${API_URL}/explanations/colleges`,
        specialties: `${API_URL}/explanations/specialties`,
        materials: `${API_URL}/explanations/materials`,
        videos: `${API_URL}/explanations/videos`,
        subscriptions: `${API_URL}/explanations/subscriptions`,
        units: `${API_URL}/explanations/materials`,
        summaries: `${API_URL}/explanations/materials`,
      };

      const response = await fetch(endpoints[activeTab] || endpoints.materials, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });

      if (response.status === 401) {
        setError('غير مصرح لك بالوصول');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('فشل تحميل البيانات');
      }

      const data = await response.json();
      
      if (data.success) {
        switch (activeTab) {
          case 'universities': setUniversities(data.data || []); break;
          case 'colleges': setColleges(data.data || []); break;
          case 'specialties': setSpecialties(data.data || []); break;
          case 'materials': setMaterials(data.data || []); break;
          case 'videos': setVideos(data.data || []); break;
          case 'subscriptions': setSubscriptions(data.data || []); break;
          case 'units': setMaterials(data.data || []); break;
          case 'summaries': setMaterials(data.data || []); break;
        }
      } else {
        setError(data.message || 'حدث خطأ في تحميل البيانات');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // ===== رفع ملف =====
  // ===== رفع ملف =====
const uploadFile = async (
  file: File,
  category: string
): Promise<{ fileId: string; thumbnailId?: string }> => {
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

  // ✅ إرجاع كائن يحوي fileId + thumbnailId
  return {
    fileId: data.data.file._id,
    thumbnailId: data.data.thumbnailId || null,
  };
};

  // ===== حفظ البيانات =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      let fileId = null;

      // ✅ رفع الفيديو إذا كان موجوداً
if (selectedFile && activeTab === 'videos') {
  console.log('📤 Uploading video file:', selectedFile.name);

  // ✅ استقبل كائن { fileId, thumbnailId }
  const uploadResult = await uploadFile(selectedFile, 'video');

  console.log('✅ Video uploaded:');
  console.log('   - fileId:', uploadResult.fileId);
  console.log('   - thumbnailId:', uploadResult.thumbnailId);

  formData.videoUrl = uploadResult.fileId;
  formData.videoFile = selectedFile.name;

  // ✅ ✅ ✅ أضف thumbnail
  if (uploadResult.thumbnailId) {
    formData.thumbnail = uploadResult.thumbnailId;
    console.log('✅ thumbnail saved to formData:', uploadResult.thumbnailId);
  }
}

      const submitData: any = JSON.parse(JSON.stringify(formData));
      submitData.portalId = PORTAL_ID;
      
      // ✅ توليد slug
      if (!submitData.slug || submitData.slug.trim() === '') {
        const name = submitData.nameAr || submitData.name || submitData.titleAr || submitData.title || 'item';
        submitData.slug = generateSlug(name);
      }

      // ✅ تنظيف البيانات - إزالة الملفات الفارغة
      if (submitData.units) {
        submitData.units = submitData.units.map((unit: any) => ({
          ...unit,
          files: unit.files?.filter((f: any) => f.fileId && f.fileId.trim() !== '') || [],
        }));
      }

      if (submitData.summaries) {
        submitData.summaries = submitData.summaries.filter((s: any) => 
          s.fileId && s.fileId.trim() !== ''
        );
      }

      console.log('📤 Sending data:', {
        tab: activeTab,
        data: submitData,
      });

      const endpoint = `${API_URL}/explanations/${activeTab === 'units' || activeTab === 'summaries' ? 'materials' : activeTab}`;
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
        setFilePreview(null);
        setUploadProgress(0);
        alert('✅ تم الحفظ بنجاح!');
      } else {
        setError(data.message || 'حدث خطأ في الحفظ');
        console.error('❌ Server error:', data);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'حدث خطأ في الحفظ');
    } finally {
      setUploading(false);
    }
  };

  // ===== حذف عنصر =====
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;

    try {
      const endpoint = activeTab === 'units' || activeTab === 'summaries' ? 'materials' : activeTab;
      const response = await fetch(`${API_URL}/explanations/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchData();
      } else {
        setError(data.message || 'حدث خطأ في الحذف');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الحذف');
    }
  };

  // ===== حذف ملف =====
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

    try {
      const response = await fetch(`${API_URL}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchData();
      } else {
        setError(data.message || 'حدث خطأ في حذف الملف');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في حذف الملف');
    }
  };

  // ===== تبديل حالة النشر =====
  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const endpoint = activeTab === 'materials' ? 'materials' : 
                       activeTab === 'videos' ? 'videos' : 
                       activeTab === 'units' || activeTab === 'summaries' ? 'materials' : activeTab;
      
      const response = await fetch(`${API_URL}/explanations/${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تغيير الحالة');
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
      universityId: extractId(item.universityId),
      collegeId: extractId(item.collegeId),
      specialtyId: extractId(item.specialtyId),
      materialId: extractId(item.materialId),
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
  const getFileIcon = (filename: string) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, React.ReactNode> = {
      'pdf': <FaFilePdf className="text-red-500" />,
      'doc': <FaFileWord className="text-blue-500" />,
      'docx': <FaFileWord className="text-blue-500" />,
      'xls': <FaFile className="text-green-500" />,
      'xlsx': <FaFile className="text-green-500" />,
      'ppt': <FaFile className="text-orange-500" />,
      'pptx': <FaFile className="text-orange-500" />,
      'jpg': <FaFileImage className="text-purple-500" />,
      'jpeg': <FaFileImage className="text-purple-500" />,
      'png': <FaFileImage className="text-purple-500" />,
      'gif': <FaFileImage className="text-purple-500" />,
      'mp4': <FaFileVideo className="text-red-500" />,
      'zip': <FaFileArchive className="text-gray-500" />,
      'rar': <FaFileArchive className="text-gray-500" />,
      'js': <FaFileCode className="text-yellow-500" />,
      'ts': <FaFileCode className="text-yellow-500" />,
      'py': <FaFileCode className="text-yellow-500" />,
    };
    return icons[ext] || <FaFileAlt className="text-gray-500" />;
  };

  // ===== تنسيق حجم الملف =====
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // ===== تبديل العرض =====
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // ===== الحصول على اسم الجامعة/الكلية/التخصص/المادة =====
  const getUniversityName = (id: string) => {
    if (!id) return 'غير محدد';
    const uni = universities.find(u => u._id === id);
    return uni ? (uni.nameAr || uni.name) : 'غير محدد';
  };

  const getCollegeName = (id: string) => {
    if (!id) return 'غير محدد';
    const col = colleges.find(c => c._id === id);
    return col ? (col.nameAr || col.name) : 'غير محدد';
  };

  const getSpecialtyName = (id: string) => {
    if (!id) return 'غير محدد';
    const spec = specialties.find(s => s._id === id);
    return spec ? (spec.nameAr || spec.name) : 'غير محدد';
  };

  const getMaterialName = (id: string) => {
    if (!id) return 'غير محدد';
    const mat = materials.find(m => m._id === id);
    return mat ? (mat.nameAr || mat.name) : 'غير محدد';
  };

  // ===== الحصول على حالة النشر =====
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <FaCheckCircle className="w-3 h-3" /> نشط
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <FaTimesCircle className="w-3 h-3" /> غير نشط
      </span>
    );
  };

  const getPublishBadge = (isPublished: boolean) => {
    return isPublished ? (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <FaEye className="w-3 h-3" /> منشور
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
        <FaEyeSlash className="w-3 h-3" /> غير منشور
      </span>
    );
  };

  const getEncryptedBadge = (isEncrypted: boolean) => {
    return isEncrypted ? (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        <FaLock className="w-3 h-3" /> مشفر
      </span>
    ) : (
      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <FaUnlock className="w-3 h-3" /> مفتوح
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
              <FaGraduationCap className="text-purple-600" />
              إدارة الشروحات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة الجامعات والكليات والتخصصات والمواد والمحتويات والفيديوهات
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

        {/* Tabs - مع تبويبات جديدة للمحتويات والملخصات */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
          {[
            { id: 'universities', label: '🏛️ الجامعات', icon: <FaUniversity /> },
            { id: 'colleges', label: '🏫 الكليات', icon: <FaSchool /> },
            { id: 'specialties', label: '🏷️ التخصصات', icon: <FaTag /> },
            { id: 'materials', label: '📚 المواد', icon: <FaBook /> },
            { id: 'units', label: '📂 المحتويات', icon: <FaFolderOpen /> },
            { id: 'summaries', label: '📄 الملخصات', icon: <FaFileAlt /> },
            { id: 'videos', label: '🎬 الفيديوهات', icon: <FaVideo /> },
            { id: 'subscriptions', label: '💳 الاشتراكات', icon: <FaMoneyBill /> },
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
                placeholder={`بحث عن ${activeTab === 'universities' ? 'جامعة' : 
                  activeTab === 'colleges' ? 'كلية' :
                  activeTab === 'specialties' ? 'تخصص' :
                  activeTab === 'materials' ? 'مادة' :
                  activeTab === 'units' ? 'مادة' :
                  activeTab === 'summaries' ? 'مادة' :
                  activeTab === 'videos' ? 'فيديو' : 'اشتراك'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {activeTab === 'universities' && universities.length} جامعة
            {activeTab === 'colleges' && colleges.length} كلية
            {activeTab === 'specialties' && specialties.length} تخصص
            {activeTab === 'materials' && materials.length} مادة
            {activeTab === 'units' && materials.length} مادة
            {activeTab === 'summaries' && materials.length} مادة
            {activeTab === 'videos' && videos.length} فيديو
            {activeTab === 'subscriptions' && subscriptions.length} اشتراك
          </div>
        </div>

        {/* ===== Form ===== */}
        {showForm && (
          <ExplanationForm
            activeTab={activeTab}
            formData={formData}
            setFormData={setFormData}
            universities={universities}
            colleges={colleges}
            specialties={specialties}
            materials={materials}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); resetForm(); }}
            loading={uploading}
            editingId={editingId}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            filePreview={filePreview}
            uploadProgress={uploadProgress}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            getUniversityName={getUniversityName}
            getCollegeName={getCollegeName}
            getSpecialtyName={getSpecialtyName}
            getMaterialName={getMaterialName}
            generateSlug={generateSlug}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
          />
        )}

        {/* ===== Data Table ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'universities' && (
              <UniversityTable
                data={universities}
                searchTerm={searchTerm}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getStatusBadge={getStatusBadge}
              />
            )}
            {activeTab === 'colleges' && (
              <CollegeTable
                data={colleges}
                searchTerm={searchTerm}
                universities={universities}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getStatusBadge={getStatusBadge}
                getUniversityName={getUniversityName}
              />
            )}
            {activeTab === 'specialties' && (
              <SpecialtyTable
                data={specialties}
                searchTerm={searchTerm}
                universities={universities}
                colleges={colleges}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getStatusBadge={getStatusBadge}
                getUniversityName={getUniversityName}
                getCollegeName={getCollegeName}
              />
            )}
            {activeTab === 'materials' && (
              <MaterialTable
                data={materials}
                searchTerm={searchTerm}
                universities={universities}
                colleges={colleges}
                specialties={specialties}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getStatusBadge={getStatusBadge}
                getPublishBadge={getPublishBadge}
                getUniversityName={getUniversityName}
                getCollegeName={getCollegeName}
                getSpecialtyName={getSpecialtyName}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                handleDeleteFile={handleDeleteFile}
              />
            )}
            {/* ✅ تبويب المحتويات (الوحدات) - يظهر المواد مع وحداتها */}
            {activeTab === 'units' && (
              <UnitsTable
                data={materials}
                searchTerm={searchTerm}
                universities={universities}
                colleges={colleges}
                specialties={specialties}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getStatusBadge={getStatusBadge}
                getPublishBadge={getPublishBadge}
                getUniversityName={getUniversityName}
                getCollegeName={getCollegeName}
                getSpecialtyName={getSpecialtyName}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                handleDeleteFile={handleDeleteFile}
              />
            )}
            {/* ✅ تبويب الملخصات - يظهر المواد مع ملخصاتها */}
            {activeTab === 'summaries' && (
              <SummariesTable
                data={materials}
                searchTerm={searchTerm}
                universities={universities}
                colleges={colleges}
                specialties={specialties}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getStatusBadge={getStatusBadge}
                getPublishBadge={getPublishBadge}
                getUniversityName={getUniversityName}
                getCollegeName={getCollegeName}
                getSpecialtyName={getSpecialtyName}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                handleDeleteFile={handleDeleteFile}
              />
            )}
            {activeTab === 'videos' && (
              <VideoTable
                data={videos}
                searchTerm={searchTerm}
                universities={universities}
                colleges={colleges}
                specialties={specialties}
                materials={materials}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                getStatusBadge={getStatusBadge}
                getPublishBadge={getPublishBadge}
                getEncryptedBadge={getEncryptedBadge}
                getUniversityName={getUniversityName}
                getCollegeName={getCollegeName}
                getSpecialtyName={getSpecialtyName}
                getMaterialName={getMaterialName}
              />
            )}
            {activeTab === 'subscriptions' && (
              <SubscriptionTable
                data={subscriptions}
                searchTerm={searchTerm}
                materials={materials}
                onDelete={handleDelete}
                getMaterialName={getMaterialName}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ===== ExplanationForm - مع التصفية المتسلسلة =====
// ============================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

const ExplanationForm: React.FC<{
  activeTab: TabType;
  formData: any;
  setFormData: (data: any) => void;
  universities: University[];
  colleges: College[];
  specialties: Specialty[];
  materials: Material[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  editingId: string | null;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  filePreview: string | null;
  uploadProgress: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getUniversityName: (id: string) => string;
  getCollegeName: (id: string) => string;
  getSpecialtyName: (id: string) => string;
  getMaterialName: (id: string) => string;
  generateSlug: (text: string) => string;
  getFileIcon: (filename: string) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
}> = ({
  activeTab,
  formData,
  setFormData,
  universities,
  colleges,
  specialties,
  materials,
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
  getUniversityName,
  getCollegeName,
  getSpecialtyName,
  getMaterialName,
  generateSlug,
  getFileIcon,
  formatFileSize,
}) => {
  // ===== دوال مساعدة =====
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

  // ===== دوال التصفية المتسلسلة =====
  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uniId = e.target.value;
    setFormData({
      ...formData,
      universityId: uniId,
      collegeId: '',
      specialtyId: '',
      materialId: '',
    });
  };

  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const colId = e.target.value;
    setFormData({
      ...formData,
      collegeId: colId,
      specialtyId: '',
      materialId: '',
    });
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const specId = e.target.value;
    setFormData({
      ...formData,
      specialtyId: specId,
      materialId: '',
    });
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matId = e.target.value;
    setFormData({
      ...formData,
      materialId: matId,
    });
  };

  // ===== التصفية =====
  const filteredColleges = colleges.filter(c => {
    const uniId = extractId(c.universityId);
    return uniId === formData.universityId;
  });

  const filteredSpecialties = specialties.filter(s => {
    const colId = extractId(s.collegeId);
    return colId === formData.collegeId;
  });

  const filteredMaterials = materials.filter(m => {
    const specId = extractId(m.specialtyId);
    return specId === formData.specialtyId;
  });


  // ===== رفع ملفات الوحدة =====
  const uploadUnitFile = async (unitIndex: number, file: File) => {
    try {
      const formDataFile = new FormData();
      formDataFile.append('file', file);
      formDataFile.append('category', 'learning_content');
      formDataFile.append('portalId', PORTAL_ID);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formDataFile,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'فشل رفع الملف');
      }
      
      const fileId = data.data.file._id;
      const units = formData.units || [];
      if (!units[unitIndex].files) {
        units[unitIndex].files = [];
      }
      units[unitIndex].files.push({
        fileId: fileId,
        filename: file.name,
        isEncrypted: false,
        size: file.size,
        mimeType: file.type,
      });
      setFormData({ ...formData, units });
      alert('✅ تم رفع الملف بنجاح!');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في رفع الملف');
    }
  };

  // ===== رفع ملفات الملخص =====
  const uploadSummaryFile = async (summaryIndex: number, file: File) => {
    try {
      const formDataFile = new FormData();
      formDataFile.append('file', file);
      formDataFile.append('category', 'learning_content');
      formDataFile.append('portalId', PORTAL_ID);

const response = await fetch(`${API_URL}/files/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: formDataFile,
});

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'فشل رفع الملف');
      }
      
      const fileId = data.data.file._id;
      const summaries = formData.summaries || [];
      summaries[summaryIndex] = {
        ...summaries[summaryIndex],
        fileId: fileId,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      };
      setFormData({ ...formData, summaries });
      alert('✅ تم رفع الملف بنجاح!');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في رفع الملف');
    }
  };

  // ===== دوال الوحدات =====
  const addUnit = () => {
    const units = formData.units || [];
    setFormData({
      ...formData,
      units: [...units, {
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        files: [],
        order: units.length,
      }],
    });
  };

  const removeUnit = (index: number) => {
    const units = formData.units || [];
    setFormData({
      ...formData,
      units: units.filter((_: any, i: number) => i !== index),
    });
  };

  const updateUnit = (index: number, field: string, value: any) => {
    const units = formData.units || [];
    units[index] = { ...units[index], [field]: value };
    setFormData({ ...formData, units });
  };

  const handleUnitFileSelect = (unitIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadUnitFile(unitIndex, file);
      }
    };
    input.click();
  };

  const removeUnitFile = (unitIndex: number, fileIndex: number) => {
    const units = formData.units || [];
    units[unitIndex].files = units[unitIndex].files.filter((_: any, i: number) => i !== fileIndex);
    setFormData({ ...formData, units });
  };

  // ===== دوال الملخصات =====
  const addSummary = () => {
    const summaries = formData.summaries || [];
    setFormData({
      ...formData,
      summaries: [...summaries, {
        title: '',
        titleAr: '',
        isEncrypted: false,
        order: summaries.length,
      }],
    });
  };

  const removeSummary = (index: number) => {
    const summaries = formData.summaries || [];
    setFormData({
      ...formData,
      summaries: summaries.filter((_: any, i: number) => i !== index),
    });
  };

  const updateSummary = (index: number, field: string, value: any) => {
    const summaries = formData.summaries || [];
    summaries[index] = { ...summaries[index], [field]: value };
    setFormData({ ...formData, summaries });
  };

  const handleSummaryFileSelect = (summaryIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadSummaryFile(summaryIndex, file);
      }
    };
    input.click();
  };

  // ===== دوال الفيديو =====
  const handleVideoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeVideo = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFormData({ ...formData, videoUrl: '' });
  };

  // ============================================================
  // عرض النموذج حسب التبويب
  // ============================================================

  const renderForm = () => {
    // إذا كان التبويب هو units أو summaries، نعرض نموذج المادة
    const effectiveTab = (activeTab === 'units' || activeTab === 'summaries') ? 'materials' : activeTab;
    
    switch (effectiveTab) {
      case 'universities':
        return (
          <UniversityForm 
            formData={formData} 
            setFormData={setFormData} 
            handleChange={handleChange} 
            generateSlug={generateSlug} 
          />
        );
      case 'colleges':
        return (
          <CollegeForm 
            formData={formData} 
            setFormData={setFormData} 
            handleChange={handleChange} 
            handleUniversityChange={handleUniversityChange} 
            universities={universities} 
            filteredColleges={filteredColleges}
            generateSlug={generateSlug} 
          />
        );
      case 'specialties':
        return (
          <SpecialtyForm 
            formData={formData} 
            setFormData={setFormData} 
            handleChange={handleChange} 
            handleUniversityChange={handleUniversityChange} 
            handleCollegeChange={handleCollegeChange} 
            universities={universities} 
            colleges={colleges} 
            filteredColleges={filteredColleges}
            filteredSpecialties={filteredSpecialties}
            generateSlug={generateSlug} 
          />
        );
      case 'materials':
        return (
          <MaterialForm 
            formData={formData} 
            setFormData={setFormData} 
            handleChange={handleChange} 
            handleArrayChange={handleArrayChange} 
            handleUniversityChange={handleUniversityChange} 
            handleCollegeChange={handleCollegeChange} 
            handleSpecialtyChange={handleSpecialtyChange} 
            universities={universities} 
            colleges={colleges} 
            specialties={specialties} 
            filteredColleges={filteredColleges} 
            filteredSpecialties={filteredSpecialties} 
            filteredMaterials={filteredMaterials}
            addUnit={addUnit} 
            removeUnit={removeUnit} 
            updateUnit={updateUnit} 
            handleUnitFileSelect={handleUnitFileSelect} 
            removeUnitFile={removeUnitFile} 
            addSummary={addSummary} 
            removeSummary={removeSummary} 
            updateSummary={updateSummary} 
            handleSummaryFileSelect={handleSummaryFileSelect} 
            getFileIcon={getFileIcon} 
            formatFileSize={formatFileSize} 
            generateSlug={generateSlug} 
          />
        );
      case 'videos':
        return (
          <VideoForm 
            formData={formData} 
            setFormData={setFormData} 
            handleChange={handleChange} 
            handleUniversityChange={handleUniversityChange} 
            handleCollegeChange={handleCollegeChange} 
            handleSpecialtyChange={handleSpecialtyChange} 
            handleMaterialChange={handleMaterialChange}
            universities={universities} 
            colleges={colleges} 
            specialties={specialties} 
            materials={materials} 
            filteredColleges={filteredColleges} 
            filteredSpecialties={filteredSpecialties} 
            filteredMaterials={filteredMaterials}
            selectedFile={selectedFile} 
            filePreview={filePreview} 
            uploadProgress={uploadProgress} 
            fileInputRef={fileInputRef} 
            handleFileChange={handleFileChange} 
            handleVideoUpload={handleVideoUpload} 
            removeVideo={removeVideo} 
            formatFileSize={formatFileSize} 
            generateSlug={generateSlug} 
          />
        );
      case 'subscriptions':
        return (
          <SubscriptionForm 
            formData={formData} 
            setFormData={setFormData} 
            handleChange={handleChange} 
            handleArrayChange={handleArrayChange} 
            materials={materials} 
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
          activeTab === 'universities' ? 'جامعة' :
          activeTab === 'colleges' ? 'كلية' :
          activeTab === 'specialties' ? 'تخصص' :
          activeTab === 'materials' || activeTab === 'units' || activeTab === 'summaries' ? 'مادة' :
          activeTab === 'videos' ? 'فيديو' : 'اشتراك'
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
// ===== نماذج الإضافة (مختصرة) =====
// ============================================================
// ============================================================
// ===== نماذج الإضافة لكل تبويب =====
// ============================================================

// ===== نموذج الجامعة =====
const UniversityForm: React.FC<any> = ({ formData, setFormData, handleChange, generateSlug }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <select name="icon" value={formData.icon || 'fa-university'} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition">
        <option value="fa-university">🏛️ جامعة</option>
        <option value="fa-school">🏫 مدرسة</option>
        <option value="fa-graduation-cap">🎓 قبعة تخرج</option>
        <option value="fa-book">📚 كتاب</option>
        <option value="fa-building">🏢 مبنى</option>
        <option value="fa-globe">🌍 عالم</option>
        <option value="fa-star">⭐ نجمة</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الترتيب</label>
      <input type="number" name="order" value={formData.order || 0} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" min="0" />
    </div>
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isActive" checked={formData.isActive !== false} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">نشط</span>
      </label>
    </div>
  </div>
);

// ===== نموذج الكلية =====
const CollegeForm: React.FC<any> = ({ 
  formData, setFormData, handleChange, handleUniversityChange, 
  universities, filteredColleges, generateSlug 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجامعة *</label>
      <select name="universityId" value={formData.universityId || ''} onChange={handleUniversityChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
        <option value="">اختر الجامعة</option>
        {universities.filter((u: any) => u.isActive).map((u: any) => (
          <option key={u._id} value={u._id}>{u.nameAr || u.name}</option>
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
      <select name="icon" value={formData.icon || 'fa-school'} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition">
        <option value="fa-school">🏫 مدرسة</option>
        <option value="fa-university">🏛️ جامعة</option>
        <option value="fa-graduation-cap">🎓 قبعة تخرج</option>
        <option value="fa-book">📚 كتاب</option>
        <option value="fa-building">🏢 مبنى</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الترتيب</label>
      <input type="number" name="order" value={formData.order || 0} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" min="0" />
    </div>
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isActive" checked={formData.isActive !== false} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">نشط</span>
      </label>
    </div>
  </div>
);

// ===== نموذج التخصص =====
const SpecialtyForm: React.FC<any> = ({ 
  formData, setFormData, handleChange, 
  handleUniversityChange, handleCollegeChange,
  universities, colleges, filteredColleges, filteredSpecialties, generateSlug 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجامعة *</label>
      <select name="universityId" value={formData.universityId || ''} onChange={handleUniversityChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
        <option value="">اختر الجامعة</option>
        {universities.filter((u: any) => u.isActive).map((u: any) => (
          <option key={u._id} value={u._id}>{u.nameAr || u.name}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكلية *</label>
      <select name="collegeId" value={formData.collegeId || ''} onChange={handleCollegeChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required
        disabled={!formData.universityId}>
        <option value="">اختر الكلية</option>
        {filteredColleges.filter((c: any) => c.isActive).map((c: any) => (
          <option key={c._id} value={c._id}>{c.nameAr || c.name}</option>
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرمز *</label>
      <input type="text" name="code" value={formData.code || ''} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
        placeholder="مثال: CS101" required />
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
      <select name="icon" value={formData.icon || 'fa-tag'} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition">
        <option value="fa-tag">🏷️ علامة</option>
        <option value="fa-code">💻 برمجة</option>
        <option value="fa-flask">🧪 مختبر</option>
        <option value="fa-calculator">🧮 حاسبة</option>
        <option value="fa-brain">🧠 عقل</option>
        <option value="fa-heart">❤️ قلب</option>
        <option value="fa-star">⭐ نجمة</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الترتيب</label>
      <input type="number" name="order" value={formData.order || 0} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" min="0" />
    </div>
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isActive" checked={formData.isActive !== false} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">نشط</span>
      </label>
    </div>
  </div>
);

// ===== نموذج المواد =====
const MaterialForm: React.FC<any> = ({
  formData, setFormData, handleChange, handleArrayChange,
  handleUniversityChange, handleCollegeChange, handleSpecialtyChange,
  universities, colleges, specialties,
  filteredColleges, filteredSpecialties, filteredMaterials,
  addUnit, removeUnit, updateUnit, handleUnitFileSelect, removeUnitFile,
  addSummary, removeSummary, updateSummary, handleSummaryFileSelect,
  getFileIcon, formatFileSize, generateSlug
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجامعة *</label>
        <select name="universityId" value={formData.universityId || ''} onChange={handleUniversityChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
          <option value="">اختر الجامعة</option>
          {universities.filter((u: any) => u.isActive).map((u: any) => (
            <option key={u._id} value={u._id}>{u.nameAr || u.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكلية *</label>
        <select name="collegeId" value={formData.collegeId || ''} onChange={handleCollegeChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required
          disabled={!formData.universityId}>
          <option value="">اختر الكلية</option>
          {filteredColleges.filter((c: any) => c.isActive).map((c: any) => (
            <option key={c._id} value={c._id}>{c.nameAr || c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التخصص *</label>
        <select name="specialtyId" value={formData.specialtyId || ''} onChange={handleSpecialtyChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required
          disabled={!formData.collegeId}>
          <option value="">اختر التخصص</option>
          {filteredSpecialties.filter((s: any) => s.isActive).map((s: any) => (
            <option key={s._id} value={s._id}>{s.nameAr || s.name} ({s.code})</option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الرمز *</label>
        <input type="text" name="code" value={formData.code || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="مثال: MATH101" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المعرف (Slug)</label>
        <input type="text" name="slug" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="سيتم توليده تلقائياً" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المختص *</label>
        <input type="text" name="instructor" value={formData.instructor || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدة</label>
        <input type="text" name="duration" value={formData.duration || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="مثال: 30 ساعة" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر</label>
        <input type="number" name="price" value={formData.price || 0} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" min="0" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المميزات (عربي) - افصل بينها بفاصلة</label>
        <input type="text" value={(formData.featuresAr || []).join(', ')} onChange={(e) => handleArrayChange('featuresAr', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="مثال: شرح مفصل, تمارين تفاعلية" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المميزات (إنجليزي)</label>
        <input type="text" value={(formData.features || []).join(', ')} onChange={(e) => handleArrayChange('features', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="مثال: Detailed explanation, Interactive exercises" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نبذة عن المختص</label>
        <textarea name="instructorBio" value={formData.instructorBio || ''} onChange={handleChange} rows={2}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
    </div>

    {/* الوحدات */}
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">📂 الوحدات الدراسية</h4>
        <button type="button" onClick={addUnit}
          className="px-3 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm">
          <FaPlus className="inline ml-1" /> إضافة وحدة
        </button>
      </div>
      <div className="space-y-3">
        {(formData.units || []).map((unit: any, index: number) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <h5 className="font-medium text-gray-900 dark:text-white">الوحدة {index + 1}</h5>
              <button type="button" onClick={() => removeUnit(index)} className="text-red-500 hover:text-red-700 transition">
                <FaTrash />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (عربي)</label>
                <input type="text" value={unit.titleAr || ''} onChange={(e) => updateUnit(index, 'titleAr', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (إنجليزي)</label>
                <input type="text" value={unit.title || ''} onChange={(e) => updateUnit(index, 'title', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                <textarea value={unit.descriptionAr || ''} onChange={(e) => updateUnit(index, 'descriptionAr', e.target.value)} rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-sm" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">الملفات:</span>
                <button type="button" onClick={() => handleUnitFileSelect(index)}
                  className="px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-xs">
                  <FaPlus className="inline ml-1" /> إضافة ملف
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(unit.files || []).map((file: any, fileIndex: number) => (
                  <div key={fileIndex} className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                    {getFileIcon(file.filename)}
                    <span className="text-gray-700 dark:text-gray-300">{file.filename}</span>
                    <button type="button" onClick={() => removeUnitFile(index, fileIndex)} className="text-red-500 hover:text-red-700 transition">
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* الملخصات */}
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">📄 الملخصات</h4>
        <button type="button" onClick={addSummary}
          className="px-3 py-1 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm">
          <FaPlus className="inline ml-1" /> إضافة ملخص
        </button>
      </div>
      <div className="space-y-3">
        {(formData.summaries || []).map((summary: any, index: number) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <h5 className="font-medium text-gray-900 dark:text-white">ملخص {index + 1}</h5>
              <button type="button" onClick={() => removeSummary(index)} className="text-red-500 hover:text-red-700 transition">
                <FaTrash />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (عربي)</label>
                <input type="text" value={summary.titleAr || ''} onChange={(e) => updateSummary(index, 'titleAr', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (إنجليزي)</label>
                <input type="text" value={summary.title || ''} onChange={(e) => updateSummary(index, 'title', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-sm" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => handleSummaryFileSelect(index)}
                  className="px-3 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm flex items-center gap-1">
                  <FaUpload className="w-3 h-3" /> رفع ملف
                </button>
                {summary.filename && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">{summary.filename}</span>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={summary.isEncrypted || false} onChange={(e) => updateSummary(index, 'isEncrypted', e.target.checked)}
                    className="w-3 h-3 text-purple-600" />
                  <span className="text-gray-700 dark:text-gray-300">مشفر</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-wrap gap-4 pt-2">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isPublished" checked={formData.isPublished !== undefined ? formData.isPublished : true} onChange={handleChange}
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

// ===== نموذج الفيديوهات =====
const VideoForm: React.FC<any> = ({
  formData, setFormData, handleChange,
  handleUniversityChange, handleCollegeChange, handleSpecialtyChange, handleMaterialChange,
  universities, colleges, specialties, materials,
  filteredColleges, filteredSpecialties, filteredMaterials,
  selectedFile, filePreview, uploadProgress, fileInputRef,
  handleFileChange, handleVideoUpload, removeVideo,
  formatFileSize, generateSlug
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الجامعة *</label>
        <select name="universityId" value={formData.universityId || ''} onChange={handleUniversityChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
          <option value="">اختر الجامعة</option>
          {universities.filter((u: any) => u.isActive).map((u: any) => (
            <option key={u._id} value={u._id}>{u.nameAr || u.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الكلية *</label>
        <select name="collegeId" value={formData.collegeId || ''} onChange={handleCollegeChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required
          disabled={!formData.universityId}>
          <option value="">اختر الكلية</option>
          {filteredColleges.filter((c: any) => c.isActive).map((c: any) => (
            <option key={c._id} value={c._id}>{c.nameAr || c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التخصص *</label>
        <select name="specialtyId" value={formData.specialtyId || ''} onChange={handleSpecialtyChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required
          disabled={!formData.collegeId}>
          <option value="">اختر التخصص</option>
          {filteredSpecialties.filter((s: any) => s.isActive).map((s: any) => (
            <option key={s._id} value={s._id}>{s.nameAr || s.name} ({s.code})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المادة *</label>
        <select name="materialId" value={formData.materialId || ''} onChange={handleMaterialChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required
          disabled={!formData.specialtyId}>
          <option value="">اختر المادة</option>
          {filteredMaterials.filter((m: any) => m.isPublished).map((m: any) => (
            <option key={m._id} value={m._id}>{m.nameAr || m.name} ({m.code})</option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (عربي) *</label>
        <input type="text" name="titleAr" value={formData.titleAr || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (إنجليزي)</label>
        <input type="text" name="title" value={formData.title || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المعرف (Slug)</label>
        <input type="text" name="slug" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="سيتم توليده تلقائياً" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المختص *</label>
        <input type="text" name="instructor" value={formData.instructor || ''} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدة (بالثواني)</label>
        <input type="number" name="duration" value={formData.duration || 0} onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" min="0" />
      </div>
    </div>

    {/* رفع الفيديو */}
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
      {selectedFile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <div className="flex items-center gap-3">
              <FaFileVideo className="w-8 h-8 text-purple-500" />
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)} • {selectedFile.type}</p>
              </div>
            </div>
            <button type="button" onClick={removeVideo} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition">
              <FaTrashAlt />
            </button>
          </div>
          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <FaCloudUploadAlt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">اسحب الفيديو هنا أو اضغط للاختيار</p>
          <button type="button" onClick={handleVideoUpload} className="mt-3 px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition">
            <FaUpload className="inline ml-1" /> اختيار فيديو
          </button>
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (عربي)</label>
        <textarea name="descriptionAr" value={formData.descriptionAr || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (إنجليزي)</label>
        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
      </div>
    </div>

    <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isEncrypted" checked={formData.isEncrypted || false} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">مشفر (يتطلب اشتراك)</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isPublished" checked={formData.isPublished !== undefined ? formData.isPublished : true} onChange={handleChange}
          className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700 dark:text-gray-300">منشور</span>
      </label>
    </div>
  </div>
);

// ===== نموذج الاشتراكات =====
const SubscriptionForm: React.FC<any> = ({ formData, setFormData, handleChange, handleArrayChange, materials }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المادة *</label>
      <select name="materialId" value={formData.materialId || ''} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required>
        <option value="">اختر المادة</option>
        {materials.filter((m: any) => m.isPublished).map((m: any) => (
          <option key={m._id} value={m._id}>{m.nameAr || m.name} ({m.code})</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر *</label>
      <input type="number" name="price" value={formData.price || 0} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" required min="0" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العملة</label>
      <select name="currency" value={formData.currency || 'SAR'} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition">
        <option value="SAR">ريال سعودي (SAR)</option>
        <option value="USD">دولار أمريكي (USD)</option>
        <option value="EUR">يورو (EUR)</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">طريقة الدفع</label>
      <select name="paymentMethod" value={formData.paymentMethod || 'credit_card'} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition">
        <option value="credit_card">بطاقة ائتمان</option>
        <option value="mada">مدى</option>
        <option value="paypal">بايبال</option>
        <option value="bank_transfer">تحويل بنكي</option>
        <option value="manual">يدوي</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ البداية</label>
      <input type="date" name="startDate" value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ النهاية</label>
      <input type="date" name="endDate" value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''} onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف (عربي)</label>
      <textarea name="descriptionAr" value={formData.descriptionAr || ''} onChange={handleChange} rows={2}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المميزات (عربي) - افصل بينها بفاصلة</label>
      <input type="text" value={(formData.benefitsAr || []).join(', ')} onChange={(e) => handleArrayChange('benefitsAr', e.target.value)}
        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
        placeholder="مثال: وصول غير محدود, شهادات معتمدة" />
    </div>
  </div>
);

// ============================================================
// ===== جداول العرض =====
// ============================================================

// ===== جدول الجامعات =====
const UniversityTable: React.FC<{
  data: University[];
  searchTerm: string;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, status: boolean) => void;
  getStatusBadge: (isActive: boolean) => React.ReactNode;
}> = ({ data, searchTerm, onEdit, onDelete, onTogglePublish, getStatusBadge }) => {
  const filtered = data.filter(item =>
    (item.nameAr || item.name).includes(searchTerm) ||
    (item.descriptionAr || item.description)?.includes(searchTerm)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الاسم</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المعرف</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الوصف</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((item, index) => (
            <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900 dark:text-white">{item.nameAr || item.name}</div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.slug}</span>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                {item.descriptionAr || item.description || '-'}
              </td>
              <td className="px-4 py-3">{getStatusBadge(item.isActive)}</td>
              <td className="px-4 py-3">
                <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                  onToggle={() => onTogglePublish(item._id, item.isActive)} isActive={item.isActive} />
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد جامعات</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ===== جدول الكليات =====
const CollegeTable: React.FC<{
  data: College[];
  searchTerm: string;
  universities: University[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, status: boolean) => void;
  getStatusBadge: (isActive: boolean) => React.ReactNode;
  getUniversityName: (id: string) => string;
}> = ({ data, searchTerm, universities, onEdit, onDelete, onTogglePublish, getStatusBadge, getUniversityName }) => {
  const filtered = data.filter(item => {
    const uniId = extractId(item.universityId);
    return (item.nameAr || item.name).includes(searchTerm) ||
      (item.descriptionAr || item.description)?.includes(searchTerm) ||
      getUniversityName(uniId).includes(searchTerm);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الاسم</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المعرف</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الجامعة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((item, index) => {
            const uniId = extractId(item.universityId);
            return (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{item.nameAr || item.name}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.slug}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getUniversityName(uniId)}</td>
                <td className="px-4 py-3">{getStatusBadge(item.isActive)}</td>
                <td className="px-4 py-3">
                  <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                    onToggle={() => onTogglePublish(item._id, item.isActive)} isActive={item.isActive} />
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد كليات</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ===== جدول التخصصات =====
const SpecialtyTable: React.FC<{
  data: Specialty[];
  searchTerm: string;
  universities: University[];
  colleges: College[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, status: boolean) => void;
  getStatusBadge: (isActive: boolean) => React.ReactNode;
  getUniversityName: (id: string) => string;
  getCollegeName: (id: string) => string;
}> = ({ data, searchTerm, universities, colleges, onEdit, onDelete, onTogglePublish, getStatusBadge, getUniversityName, getCollegeName }) => {
  const filtered = data.filter(item => {
    const uniId = extractId(item.universityId);
    const colId = extractId(item.collegeId);
    return (item.nameAr || item.name).includes(searchTerm) ||
      item.code.includes(searchTerm) ||
      getUniversityName(uniId).includes(searchTerm) ||
      getCollegeName(colId).includes(searchTerm);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الاسم</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الرمز</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المعرف</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الجامعة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الكلية</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((item, index) => {
            const uniId = extractId(item.universityId);
            const colId = extractId(item.collegeId);
            return (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{item.nameAr || item.name}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.code}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.slug}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getUniversityName(uniId)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getCollegeName(colId)}</td>
                <td className="px-4 py-3">{getStatusBadge(item.isActive)}</td>
                <td className="px-4 py-3">
                  <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                    onToggle={() => onTogglePublish(item._id, item.isActive)} isActive={item.isActive} />
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد تخصصات</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ===== جدول المواد (مع عرض الجامعة/الكلية/التخصص) =====
const MaterialTable: React.FC<any> = ({ 
  data, searchTerm, universities, colleges, specialties,
  onEdit, onDelete, onTogglePublish,
  getStatusBadge, getPublishBadge,
  getUniversityName, getCollegeName, getSpecialtyName,
  expandedItems, toggleExpand,
  getFileIcon, formatFileSize, handleDeleteFile 
}) => {
  const filtered = data.filter((item: any) => {
    const uniId = extractId(item.universityId);
    const colId = extractId(item.collegeId);
    const specId = extractId(item.specialtyId);
    return (item.nameAr || item.name).includes(searchTerm) ||
      item.code.includes(searchTerm) ||
      getUniversityName(uniId).includes(searchTerm) ||
      getCollegeName(colId).includes(searchTerm) ||
      getSpecialtyName(specId).includes(searchTerm);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الاسم</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الرمز</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المعرف</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الجامعة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الكلية</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التخصص</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((item: any, index: number) => {
            const uniId = extractId(item.universityId);
            const colId = extractId(item.collegeId);
            const specId = extractId(item.specialtyId);
            return (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleExpand(item._id)} className="flex items-center gap-2 hover:text-purple-600 transition">
                    {expandedItems.has(item._id) ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    <span className="font-medium text-gray-900 dark:text-white">{item.nameAr || item.name}</span>
                  </button>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getUniversityName(uniId)} / {getCollegeName(colId)} / {getSpecialtyName(specId)}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.code}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.slug}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getUniversityName(uniId)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getCollegeName(colId)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getSpecialtyName(specId)}</td>
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
                    onToggle={() => onTogglePublish(item._id, item.isPublished)} isActive={item.isPublished} editLabel="تعديل المادة" />
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد مواد</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// ===== ✅ تبويب المحتويات (الوحدات) =====
// ============================================================

const UnitsTable: React.FC<any> = ({ 
  data, searchTerm, universities, colleges, specialties,
  onEdit, onDelete, onTogglePublish,
  getStatusBadge, getPublishBadge,
  getUniversityName, getCollegeName, getSpecialtyName,
  expandedItems, toggleExpand,
  getFileIcon, formatFileSize, handleDeleteFile 
}) => {
  const filtered = data.filter((item: any) => {
    const uniId = extractId(item.universityId);
    const colId = extractId(item.collegeId);
    const specId = extractId(item.specialtyId);
    return (item.nameAr || item.name).includes(searchTerm) ||
      item.code.includes(searchTerm) ||
      getUniversityName(uniId).includes(searchTerm) ||
      getCollegeName(colId).includes(searchTerm) ||
      getSpecialtyName(specId).includes(searchTerm);
  });

  // حساب عدد الوحدات والملفات
  const getUnitsCount = (material: any) => {
    return material.units?.length || 0;
  };

  const getFilesCount = (material: any) => {
    let count = 0;
    if (material.units) {
      material.units.forEach((unit: any) => {
        count += unit.files?.length || 0;
      });
    }
    return count;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المادة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الرمز</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الجامعة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الكلية</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التخصص</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الوحدات</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الملفات</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((item: any, index: number) => {
            const uniId = extractId(item.universityId);
            const colId = extractId(item.collegeId);
            const specId = extractId(item.specialtyId);
            const unitsCount = getUnitsCount(item);
            const filesCount = getFilesCount(item);
            const hasContent = unitsCount > 0 || filesCount > 0;
            return (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleExpand(item._id)} className="flex items-center gap-2 hover:text-purple-600 transition">
                    {expandedItems.has(item._id) ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    <span className="font-medium text-gray-900 dark:text-white">{item.nameAr || item.name}</span>
                  </button>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.code}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.code}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getUniversityName(uniId)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getCollegeName(colId)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getSpecialtyName(specId)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${hasContent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {unitsCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${filesCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {filesCount}
                  </span>
                </td>
                <td className="px-4 py-3">{getPublishBadge(item.isPublished)}</td>
                <td className="px-4 py-3">
                  <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                    onToggle={() => onTogglePublish(item._id, item.isPublished)} isActive={item.isPublished} editLabel="إدارة المحتويات" />
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد مواد</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
// ===== ✅ تبويب الملخصات =====
// ============================================================

const SummariesTable: React.FC<any> = ({ 
  data, searchTerm, universities, colleges, specialties,
  onEdit, onDelete, onTogglePublish,
  getStatusBadge, getPublishBadge,
  getUniversityName, getCollegeName, getSpecialtyName,
  expandedItems, toggleExpand,
  getFileIcon, formatFileSize, handleDeleteFile 
}) => {
  const filtered = data.filter((item: any) => {
    const uniId = extractId(item.universityId);
    const colId = extractId(item.collegeId);
    const specId = extractId(item.specialtyId);
    return (item.nameAr || item.name).includes(searchTerm) ||
      item.code.includes(searchTerm) ||
      getUniversityName(uniId).includes(searchTerm) ||
      getCollegeName(colId).includes(searchTerm) ||
      getSpecialtyName(specId).includes(searchTerm);
  });

  // حساب عدد الملخصات
  const getSummariesCount = (material: any) => {
    return material.summaries?.length || 0;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المادة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الرمز</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الجامعة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الكلية</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التخصص</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الملخصات</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((item: any, index: number) => {
            const uniId = extractId(item.universityId);
            const colId = extractId(item.collegeId);
            const specId = extractId(item.specialtyId);
            const summariesCount = getSummariesCount(item);
            const hasSummaries = summariesCount > 0;
            return (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleExpand(item._id)} className="flex items-center gap-2 hover:text-purple-600 transition">
                    {expandedItems.has(item._id) ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    <span className="font-medium text-gray-900 dark:text-white">{item.nameAr || item.name}</span>
                  </button>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.code}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.code}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getUniversityName(uniId)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getCollegeName(colId)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getSpecialtyName(specId)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${hasSummaries ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {summariesCount}
                  </span>
                </td>
                <td className="px-4 py-3">{getPublishBadge(item.isPublished)}</td>
                <td className="px-4 py-3">
                  <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                    onToggle={() => onTogglePublish(item._id, item.isPublished)} isActive={item.isPublished} editLabel="إدارة الملخصات" />
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد مواد</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ===== جدول الفيديوهات =====
const VideoTable: React.FC<any> = ({ 
  data, searchTerm, universities, colleges, specialties, materials,
  onEdit, onDelete, onTogglePublish,
  getStatusBadge, getPublishBadge, getEncryptedBadge,
  getUniversityName, getCollegeName, getSpecialtyName, getMaterialName 
}) => {
  const filtered = data.filter((item: any) => {
    const matId = extractId(item.materialId);
    return (item.titleAr || item.title).includes(searchTerm) ||
      getMaterialName(matId).includes(searchTerm);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العنوان</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المعرف</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المادة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">النوع</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((item: any, index: number) => {
            const matId = extractId(item.materialId);
            return (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{item.titleAr || item.title}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">{item.slug}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getMaterialName(matId)}</td>
                <td className="px-4 py-3">{getEncryptedBadge(item.isEncrypted)}</td>
                <td className="px-4 py-3">{getPublishBadge(item.isPublished)}</td>
                <td className="px-4 py-3">
                  <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item._id)} 
                    onToggle={() => onTogglePublish(item._id, item.isPublished)} isActive={item.isPublished} editLabel="تعديل الفيديو" />
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد فيديوهات</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ===== جدول الاشتراكات =====
const SubscriptionTable: React.FC<any> = ({ data, searchTerm, materials, onDelete, getMaterialName }) => {
  const filtered = data.filter((item: any) => {
    const matId = extractId(item.materialId);
    return getMaterialName(matId).includes(searchTerm) ||
      item.accountId?.profile?.fullName?.includes(searchTerm) ||
      item.accountId?.email?.includes(searchTerm);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المستخدم</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المادة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((item: any, index: number) => {
            const matId = extractId(item.materialId);
            return (
              <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{item.accountId?.profile?.fullName || 'مستخدم'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.accountId?.email || ''}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getMaterialName(matId)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.price} {item.currency}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {item.status === 'active' ? 'نشط' :
                     item.status === 'pending' ? 'قيد الانتظار' :
                     item.status === 'expired' ? 'منتهي' : 'ملغي'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onDelete(item._id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition" title="إلغاء الاشتراك">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد اشتراكات</td></tr>
          )}
        </tbody>
      </table>
    </div>
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

// ============================================================
// ✅ تصدير المكون الرئيسي
// ============================================================

export default AdminExplanations;