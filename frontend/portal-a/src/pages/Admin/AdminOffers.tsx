// frontend/portal-a/src/pages/Admin/AdminOffers.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSearch, FaFilter, FaTimes, FaSave, FaUpload,
  FaImage, FaStar, FaClock, FaUser, FaTag,
  FaPercentage, FaMoneyBill, FaCalendarAlt,
  FaChevronLeft, FaChevronRight, FaInfoCircle,FaCheckCircle
} from 'react-icons/fa';

// ============================================================
// ✅ واجهات البيانات
// ============================================================

interface Offer {
  _id: string;
  imageId?: {
    _id: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  discountType: string;
  discountValue: number;
  discountValueAr: string;
  originalPrice: number;
  offerPrice: number;
  currency: string;
  startDate: string;
  endDate: string;
  category: string;
  categoryAr: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  views: number;
  clicks: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    profile: { fullName: string };
  };
  isActiveOffer: boolean;
  discountPercentage: number;
  savings: number;
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const AdminOffers: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    discountType: 'percentage',
    discountValue: 0,
    originalPrice: 0,
    currency: 'SAR',
    startDate: '',
    endDate: '',
    category: 'service',
    categoryAr: 'خدمات',
    tags: '',
    isPublished: true,
    isFeatured: false,
    isActive: true,
    order: 0,
  });

  const categories = [
    { value: 'service', label: 'خدمات' },
    { value: 'product', label: 'منتجات' },
    { value: 'subscription', label: 'اشتراكات' },
    { value: 'event', label: 'فعاليات' },
    { value: 'course', label: 'دورات' },
    { value: 'other', label: 'أخرى' },
  ];

  const discountTypes = [
    { value: 'percentage', label: 'نسبة مئوية (%)' },
    { value: 'fixed', label: 'مبلغ ثابت (ريال)' },
    { value: 'free', label: 'مجاني' },
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  // ===== جلب العروض =====
  const fetchOffers = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      let url = `${API_URL}/offers?limit=100`;
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
        setOffers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  }, [token, categoryFilter, searchTerm]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchOffers();
  }, [fetchOffers]);

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

  // ===== حفظ العرض =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile && !editingId) {
      alert('⚠️ يرجى اختيار صورة للعرض');
      return;
    }

    try {
      let imageId = null;

      if (imageFile && !editingId) {
        imageId = await uploadFile(imageFile, 'image');
      }

      const payload = {
        ...formData,
        imageId: imageId || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate,
      };

      const url = editingId ? `${API_URL}/offers/${editingId}` : `${API_URL}/offers`;
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
        await fetchOffers();
        resetForm();
        alert(editingId ? '✅ تم تحديث العرض بنجاح' : '✅ تم إضافة العرض بنجاح');
      } else {
        alert(data.message || 'حدث خطأ');
      }
    } catch (error: any) {
      alert(error.message || 'حدث خطأ');
    }
  };

  // ===== حذف عرض =====
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchOffers();
        alert('✅ تم حذف العرض بنجاح');
      }
    } catch (error) {
      alert('حدث خطأ في الحذف');
    }
  };

  // ===== تبديل حالة النشر =====
  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
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
        await fetchOffers();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // ===== تبديل المميز =====
  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
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
        await fetchOffers();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // ===== تبديل حالة النشاط =====
  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ isActive: !current }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchOffers();
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // ===== إعادة تعيين النموذج =====
  const resetForm = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      discountType: 'percentage',
      discountValue: 0,
      originalPrice: 0,
      currency: 'SAR',
      startDate: '',
      endDate: '',
      category: 'service',
      categoryAr: 'خدمات',
      tags: '',
      isPublished: true,
      isFeatured: false,
      isActive: true,
      order: 0,
    });
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // ===== تحرير عرض =====
  const editOffer = (offer: Offer) => {
    setFormData({
      title: offer.title || '',
      titleAr: offer.titleAr || '',
      description: offer.description || '',
      descriptionAr: offer.descriptionAr || '',
      discountType: offer.discountType || 'percentage',
      discountValue: offer.discountValue || 0,
      originalPrice: offer.originalPrice || 0,
      currency: offer.currency || 'SAR',
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '',
      category: offer.category || 'service',
      categoryAr: offer.categoryAr || 'خدمات',
      tags: offer.tags?.join(', ') || '',
      isPublished: offer.isPublished !== undefined ? offer.isPublished : true,
      isFeatured: offer.isFeatured || false,
      isActive: offer.isActive !== undefined ? offer.isActive : true,
      order: offer.order || 0,
    });
    setEditingId(offer._id);
    setShowForm(true);
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== تنسيق المدة الزمنية =====
  const formatDateTime = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ===== الحصول على حالة العرض =====
  const getOfferStatus = (offer: Offer) => {
    if (!offer.isPublished) return { label: 'غير منشور', color: 'bg-gray-100 text-gray-700' };
    if (!offer.isActive) return { label: 'غير نشط', color: 'bg-red-100 text-red-700' };
    if (offer.isActiveOffer) return { label: 'نشط', color: 'bg-green-100 text-green-700' };
    return { label: 'منتهي', color: 'bg-yellow-100 text-yellow-700' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل العروض...</p>
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
              <FaTag className="text-purple-600" />
              إدارة العروض
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({offers.length} عرض)
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة العروض والخصومات وإضافة عروض جديدة
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة عرض جديد'}
          </button>
        </div>

        {/* ===== نموذج الإضافة ===== */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'تعديل عرض' : 'إضافة عرض جديد'}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        categoryAr: cat?.label || 'خدمات',
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
                    نوع الخصم *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  >
                    {discountTypes.map((dt) => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    قيمة الخصم *
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    السعر الأصلي (ريال)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العملة
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تاريخ البداية
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تاريخ الانتهاء *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  />
                </div>
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
                  placeholder="مثال: تخفيضات, عروض, خصم"
                />
              </div>

              {/* رفع الصورة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  صورة العرض *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
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
                      <FaUpload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">اضغط لرفع صورة العرض</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP - الحد الأقصى 5MB</p>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="mt-3 px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                      >
                        اختيار صورة
                      </button>
                    </div>
                  )}
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">نشط</span>
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
                placeholder="بحث في العروض..."
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

        {/* ===== جدول العروض ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العرض</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الخصم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المدة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {offers.map((offer, index) => {
                  const status = getOfferStatus(offer);
                  return (
                    <tr key={offer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{offer.titleAr || offer.title}</p>
                          {offer.isFeatured && <FaStar className="text-amber-500 text-xs inline ml-1" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {offer.discountValueAr || `${offer.discountValue}%`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="line-through text-gray-400">{offer.originalPrice} ريال</span>
                          <span className="font-bold text-purple-600 mr-2">{offer.offerPrice} ريال</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col">
                          <span>من: {formatDate(offer.startDate)}</span>
                          <span>إلى: {formatDate(offer.endDate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => handleTogglePublish(offer._id, offer.isPublished)}
                            className={`p-1.5 rounded-lg transition ${
                              offer.isPublished
                                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                            }`}
                            title={offer.isPublished ? 'إخفاء' : 'نشر'}
                          >
                            {offer.isPublished ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(offer._id, offer.isFeatured)}
                            className={`p-1.5 rounded-lg transition ${
                              offer.isFeatured
                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                            title={offer.isFeatured ? 'إزالة المميز' : 'جعل مميز'}
                          >
                            <FaStar className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(offer._id, offer.isActive)}
                            className={`p-1.5 rounded-lg transition ${
                              offer.isActive
                                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                            }`}
                            title={offer.isActive ? 'تعطيل' : 'تفعيل'}
                          >
                            {offer.isActive ? <FaTimes className="w-3 h-3" /> : <FaCheckCircle className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => editOffer(offer)}
                            className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition"
                            title="تعديل"
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(offer._id)}
                            className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                            title="حذف"
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {offers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <FaTag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>لا توجد عروض</p>
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

export default AdminOffers;