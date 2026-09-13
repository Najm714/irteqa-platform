// frontend/portal-a/src/pages/AdminServiceDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash,
  FaSpinner, FaSearch, FaExclamationCircle,
  FaSave, FaTimes, FaChevronDown, FaChevronUp,
  FaInfoCircle, FaQuestionCircle, FaImage,
  FaCheckCircle, FaTimesCircle, FaList,
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

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
  icon: string;
  sectionId?: string | { _id: string; name: string; nameAr: string }; // ✅ إضافة 
  isPublished?: boolean;
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

// ============================================================
// المكون الرئيسي
// ============================================================

const AdminServiceDetails: React.FC = () => {
  const { token } = useAuth();
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    sectionId: '',
    serviceId: '',
    overview: '',
    overviewAr: '',
    whatIsService: '',
    whatIsServiceAr: '',
    whoBenefits: '',
    whoBenefitsAr: '',
    methodologies: '',
    methodologiesAr: '',
    gallery: [],
    requestTypes: [
      { type: 'online', label: 'Online', labelAr: 'عبر الإنترنت', isActive: true },
      { type: 'in_person', label: 'In Person', labelAr: 'حضوري', isActive: true },
    ],
    faqs: [],
    isPublished: true,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // جلب البيانات
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [detailsRes, sectionsRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/service-details`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
        }),
        fetch(`${API_URL}/sections`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
        }),
        fetch(`${API_URL}/services`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
        }),
      ]);

      const detailsData = await detailsRes.json();
      const sectionsData = await sectionsRes.json();
      const servicesData = await servicesRes.json();

      if (detailsData.success) setServiceDetails(detailsData.data || []);
      if (sectionsData.success) setSections(sectionsData.data || []);
      if (servicesData.success) setServices(servicesData.data || []);
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

  // حفظ البيانات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API_URL}/service-details/${editingId}` : `${API_URL}/service-details`;
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
        await fetchData();
        resetForm();
        setShowForm(false);
        setEditingId(null);
        alert('✅ تم حفظ تفاصيل الخدمة بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في حفظ التفاصيل');
      }
    } catch (err) {
      alert('حدث خطأ في حفظ التفاصيل');
    }
  };

  const resetForm = () => {
    setFormData({
      sectionId: '',
      serviceId: '',
      overview: '',
      overviewAr: '',
      whatIsService: '',
      whatIsServiceAr: '',
      whoBenefits: '',
      whoBenefitsAr: '',
      methodologies: '',
      methodologiesAr: '',
      gallery: [],
      requestTypes: [
        { type: 'online', label: 'Online', labelAr: 'عبر الإنترنت', isActive: true },
        { type: 'in_person', label: 'In Person', labelAr: 'حضوري', isActive: true },
      ],
      faqs: [],
      isPublished: true,
    });
  };

  const editDetail = (detail: ServiceDetail) => {
    setFormData({
      ...detail,
      sectionId: typeof detail.sectionId === 'object' ? detail.sectionId._id : detail.sectionId,
      serviceId: typeof detail.serviceId === 'object' ? detail.serviceId._id : detail.serviceId,
    });
    setEditingId(detail._id);
    setShowForm(true);
  };

  const deleteDetail = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه التفاصيل؟')) return;
    try {
      const response = await fetch(`${API_URL}/service-details/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
      });
      const data = await response.json();
      if (data.success) await fetchData();
    } catch (err) {
      alert('حدث خطأ في الحذف');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/service-details/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'X-Portal-Id': PORTAL_ID },
      });
      const data = await response.json();
      if (data.success) await fetchData();
    } catch (err) {
      alert('حدث خطأ في تغيير الحالة');
    }
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

  const filteredDetails = serviceDetails.filter(d => {
    const serviceName = typeof d.serviceId === 'object' ? (d.serviceId.nameAr || d.serviceId.name) : '';
    const sectionName = typeof d.sectionId === 'object' ? (d.sectionId.nameAr || d.sectionId.name) : '';
    return serviceName.includes(searchTerm) || sectionName.includes(searchTerm);
  });

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
              <FaInfoCircle className="text-purple-600" />
              إدارة تفاصيل الخدمات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة تفاصيل الخدمات والأسئلة الشائعة
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setEditingId(null); setShowForm(!showForm); }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'إلغاء' : 'إضافة تفاصيل جديدة'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'تعديل تفاصيل الخدمة' : 'إضافة تفاصيل خدمة جديدة'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* اختيار القسم والخدمة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    القسم *
                  </label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  >
                    <option value="">اختر القسم</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الخدمة *
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    required
                  >
                    <option value="">اختر الخدمة</option>
                    {services
                      .filter(s => {
                        const sSectionId = typeof s.sectionId === 'object' ? s.sectionId?._id : s.sectionId;
                        return sSectionId === formData.sectionId || !formData.sectionId;
                      })
                      .map((s) => (
                        <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* نبذة الخدمة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    نبذة الخدمة (عربي)
                  </label>
                  <textarea
                    value={formData.overviewAr}
                    onChange={(e) => setFormData({ ...formData, overviewAr: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="نبذة مختصرة عن الخدمة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    نبذة الخدمة (إنجليزي)
                  </label>
                  <textarea
                    value={formData.overview}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="Brief overview of the service"
                  />
                </div>
              </div>

              {/* ما هي الخدمة؟ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ما هي الخدمة؟ (عربي)
                  </label>
                  <textarea
                    value={formData.whatIsServiceAr}
                    onChange={(e) => setFormData({ ...formData, whatIsServiceAr: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="وصف تفصيلي للخدمة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ما هي الخدمة؟ (إنجليزي)
                  </label>
                  <textarea
                    value={formData.whatIsService}
                    onChange={(e) => setFormData({ ...formData, whatIsService: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="Detailed description of the service"
                  />
                </div>
              </div>

              {/* من يستفيد؟ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    من يستفيد من هذه الخدمة؟ (عربي)
                  </label>
                  <textarea
                    value={formData.whoBenefitsAr}
                    onChange={(e) => setFormData({ ...formData, whoBenefitsAr: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="الجمهور المستهدف للخدمة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    من يستفيد من هذه الخدمة؟ (إنجليزي)
                  </label>
                  <textarea
                    value={formData.whoBenefits}
                    onChange={(e) => setFormData({ ...formData, whoBenefits: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="Target audience for the service"
                  />
                </div>
              </div>

              {/* المنهجيات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    المنهجيات والأساليب (عربي)
                  </label>
                  <textarea
                    value={formData.methodologiesAr}
                    onChange={(e) => setFormData({ ...formData, methodologiesAr: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="المنهجيات والأساليب المستخدمة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    المنهجيات والأساليب (إنجليزي)
                  </label>
                  <textarea
                    value={formData.methodologies}
                    onChange={(e) => setFormData({ ...formData, methodologies: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="Methodologies and approaches used"
                  />
                </div>
              </div>

              {/* أنواع الطلبات */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    أنواع الطلبات المتاحة
                  </label>
                  <button
                    type="button"
                    onClick={addRequestType}
                    className="px-3 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm"
                  >
                    <FaPlus className="inline ml-1" /> إضافة نوع
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.requestTypes || []).map((rt: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <select
                        value={rt.type}
                        onChange={(e) => updateRequestType(index, 'type', e.target.value)}
                        className="px-3 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      >
                        <option value="online">عبر الإنترنت</option>
                        <option value="in_person">حضوري</option>
                        <option value="phone">هاتف</option>
                        <option value="email">بريد إلكتروني</option>
                      </select>
                      <input
                        type="text"
                        value={rt.labelAr}
                        onChange={(e) => updateRequestType(index, 'labelAr', e.target.value)}
                        placeholder="الاسم (عربي)"
                        className="flex-1 px-3 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      />
                      <input
                        type="text"
                        value={rt.label}
                        onChange={(e) => updateRequestType(index, 'label', e.target.value)}
                        placeholder="الاسم (إنجليزي)"
                        className="flex-1 px-3 py-1 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={rt.isActive}
                          onChange={(e) => updateRequestType(index, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        نشط
                      </label>
                      <button
                        type="button"
                        onClick={() => removeRequestType(index)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* الأسئلة الشائعة */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    الأسئلة الشائعة
                  </label>
                  <button
                    type="button"
                    onClick={addFAQ}
                    className="px-3 py-1 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition text-sm"
                  >
                    <FaPlus className="inline ml-1" /> إضافة سؤال
                  </button>
                </div>
                <div className="space-y-3">
                  {(formData.faqs || []).map((faq: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">سؤال {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFAQ(index)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={faq.questionAr}
                          onChange={(e) => updateFAQ(index, 'questionAr', e.target.value)}
                          placeholder="السؤال (عربي)"
                          className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        />
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                          placeholder="السؤال (إنجليزي)"
                          className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        />
                        <textarea
                          value={faq.answerAr}
                          onChange={(e) => updateFAQ(index, 'answerAr', e.target.value)}
                          placeholder="الإجابة (عربي)"
                          rows={2}
                          className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                          placeholder="الإجابة (إنجليزي)"
                          rows={2}
                          className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* نشر */}
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

              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
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
                placeholder="بحث عن تفاصيل خدمة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {filteredDetails.length} تفاصيل
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
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
                {filteredDetails.map((detail, index) => {
                  const serviceName = typeof detail.serviceId === 'object' ? (detail.serviceId.nameAr || detail.serviceId.name) : '';
                  const sectionName = typeof detail.sectionId === 'object' ? (detail.sectionId.nameAr || detail.sectionId.name) : '';
                  return (
                    <tr key={detail._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{serviceName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{sectionName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{detail.faqs?.length || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          detail.isPublished
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {detail.isPublished ? 'منشور' : 'غير منشور'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleStatus(detail._id)} className={`p-2 rounded-lg transition ${
                            detail.isPublished
                              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                          }`} title={detail.isPublished ? 'إخفاء' : 'نشر'}>
                            {detail.isPublished ? <FaEyeSlash /> : <FaEye />}
                          </button>
                          <button onClick={() => editDetail(detail)} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition" title="تعديل">
                            <FaEdit />
                          </button>
                          <button onClick={() => deleteDetail(detail._id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition" title="حذف">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredDetails.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">لا توجد تفاصيل</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminServiceDetails;