// frontend/portal-a/src/pages/Admin/AdminAbout.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaSave, FaUpload, FaImage, FaFileAlt,
  FaPlus, FaTrash, FaEdit, FaTimes, FaEye,
  FaUsers, FaChartBar, FaAward, FaQuoteRight,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe,
  FaFacebook, FaTwitter, FaInstagram, FaYoutube,
  FaLinkedin, FaWhatsapp, FaInfoCircle,
  FaCheckCircle, FaArrowUp, FaArrowDown,
} from 'react-icons/fa';

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const AdminAbout: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [about, setAbout] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'story' | 'vision' | 'values' | 'stats' | 'team' | 'achievements' | 'testimonials' | 'contact'>('basic');
  
  // ===== رفع الملفات =====
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const teamImageInputRef = useRef<HTMLInputElement>(null);
  const achievementImageInputRef = useRef<HTMLInputElement>(null);
  const testimonialImageInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<{
    logo?: File;
    cover?: File;
    profile?: File;
    teamImage?: { index: number; file: File };
    achievementImage?: { index: number; file: File };
    testimonialImage?: { index: number; file: File };
  }>({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== جلب البيانات =====
  const fetchAbout = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/about`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAbout(data.data);
        setFormData({
          ...data.data,
          foundedDate: data.data.foundedDate ? new Date(data.data.foundedDate).toISOString().slice(0, 10) : '',
        });
      } else {
        // ✅ بيانات افتراضية
        const defaultData = {
          platformName: '',
          platformNameAr: '',
          platformDescription: '',
          platformDescriptionAr: '',
          story: '',
          storyAr: '',
          foundedDate: '',
          vision: '',
          visionAr: '',
          mission: '',
          missionAr: '',
          values: [],
          stats: [
            { label: 'عملاء', labelAr: 'عملاء', value: '0', icon: 'users' },
            { label: 'مشاريع', labelAr: 'مشاريع', value: '0', icon: 'chart-bar' },
            { label: 'جوائز', labelAr: 'جوائز', value: '0', icon: 'award' },
          ],
          team: [],
          achievements: [],
          testimonials: [],
          contactInfo: {
            email: '',
            phone: '',
            address: '',
            addressAr: '',
            mapUrl: '',
            workingHours: '',
            workingHoursAr: '',
            socialMedia: {
              facebook: '',
              twitter: '',
              instagram: '',
              youtube: '',
              linkedin: '',
              whatsapp: '',
            },
          },
          isPublished: true,
        };
        setAbout(defaultData);
        setFormData(defaultData);
      }
    } catch (error) {
      console.error('Error fetching about:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchAbout();
  }, [fetchAbout]);

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

  // ===== حفظ البيانات =====
  const handleSave = async () => {
    setSaving(true);

    try {
      // ✅ رفع الملفات المضافة حديثاً
      const uploadPromises: Promise<void>[] = [];
      
      if (selectedFiles.logo) {
        const fileId = await uploadFile(selectedFiles.logo, 'image');
        formData.platformLogo = fileId;
      }
      if (selectedFiles.cover) {
        const fileId = await uploadFile(selectedFiles.cover, 'image');
        formData.platformCover = fileId;
      }
      if (selectedFiles.profile) {
        const fileId = await uploadFile(selectedFiles.profile, 'document');
        formData.profileFileId = fileId;
      }
      if (selectedFiles.teamImage) {
        const { index, file } = selectedFiles.teamImage;
        const fileId = await uploadFile(file, 'image');
        formData.team[index].imageId = fileId;
      }
      if (selectedFiles.achievementImage) {
        const { index, file } = selectedFiles.achievementImage;
        const fileId = await uploadFile(file, 'image');
        formData.achievements[index].imageId = fileId;
      }
      if (selectedFiles.testimonialImage) {
        const { index, file } = selectedFiles.testimonialImage;
        const fileId = await uploadFile(file, 'image');
        formData.testimonials[index].imageId = fileId;
      }

      // ✅ تنظيف selectedFiles بعد الرفع
      setSelectedFiles({});

      const response = await fetch(`${API_URL}/about`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setAbout(data.data);
        alert('✅ تم حفظ صفحة نبذة عنا بنجاح!');
      } else {
        alert(data.message || 'حدث خطأ في الحفظ');
      }
    } catch (error: any) {
      alert(error.message || 'حدث خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // ===== إضافة عنصر إلى القائمة =====
  const addItem = (field: string, template: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), { ...template, order: (prev[field]?.length || 0) }],
    }));
  };

  // ===== حذف عنصر من القائمة =====
  const removeItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: any, i: number) => i !== index),
    }));
  };

  // ===== تحديث عنصر في القائمة =====
  const updateItem = (field: string, index: number, key: string, value: any) => {
    setFormData((prev: any) => {
      const items = [...(prev[field] || [])];
      items[index] = { ...items[index], [key]: value };
      return { ...prev, [field]: items };
    });
  };

  // ===== ترتيب العناصر =====
  const moveItem = (field: string, index: number, direction: 'up' | 'down') => {
    setFormData((prev: any) => {
      const items = [...(prev[field] || [])];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return prev;
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      return { ...prev, [field]: items };
    });
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA');
  };

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
      <div className="container-custom max-w-7xl">
        {/* ===== Header ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaInfoCircle className="text-purple-600" />
              إدارة صفحة نبذة عنا
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              تحكم بجميع محتويات صفحة نبذة عنا
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving || uploading ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'جاري الحفظ...' : uploading ? 'جاري الرفع...' : 'حفظ التغييرات'}
          </button>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: 'basic', label: '📋 معلومات أساسية' },
            { id: 'story', label: '📖 القصة والرؤية' },
            { id: 'values', label: '💎 القيم' },
            { id: 'stats', label: '📊 إحصائيات' },
            { id: 'team', label: '👥 فريق العمل' },
            { id: 'achievements', label: '🏆 الإنجازات' },
            { id: 'testimonials', label: '💬 آراء العملاء' },
            { id: 'contact', label: '📞 معلومات الاتصال' },
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

        {/* ===== محتوى التبويبات ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          
          {/* ===== تبويب المعلومات الأساسية ===== */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">📋 المعلومات الأساسية</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    اسم المنصة (عربي) *
                  </label>
                  <input
                    type="text"
                    value={formData.platformNameAr || ''}
                    onChange={(e) => setFormData({ ...formData, platformNameAr: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    اسم المنصة (إنجليزي)
                  </label>
                  <input
                    type="text"
                    value={formData.platformName || ''}
                    onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    وصف المنصة (عربي)
                  </label>
                  <textarea
                    value={formData.platformDescriptionAr || ''}
                    onChange={(e) => setFormData({ ...formData, platformDescriptionAr: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    وصف المنصة (إنجليزي)
                  </label>
                  <textarea
                    value={formData.platformDescription || ''}
                    onChange={(e) => setFormData({ ...formData, platformDescription: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    شعار المنصة
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFiles({ ...selectedFiles, logo: file });
                        }
                      }}
                      className="hidden"
                    />
                    {selectedFiles.logo ? (
                      <div>
                        <p className="text-sm text-green-600">✅ {selectedFiles.logo.name}</p>
                        <button
                          onClick={() => setSelectedFiles({ ...selectedFiles, logo: undefined })}
                          className="text-red-500 text-sm mt-1"
                        >
                          إزالة
                        </button>
                      </div>
                    ) : about?.platformLogo ? (
                      <div>
                        <img
                          src={`${API_URL}/about/file/${typeof about.platformLogo === 'object' ? about.platformLogo._id : about.platformLogo}?token=${localStorage.getItem('token')}`}
                          alt="Logo"
                          className="max-h-20 mx-auto"
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="mt-2 px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm"
                        >
                          تغيير الشعار
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FaImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm"
                        >
                          رفع شعار
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    صورة الغلاف
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      ref={coverInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFiles({ ...selectedFiles, cover: file });
                        }
                      }}
                      className="hidden"
                    />
                    {selectedFiles.cover ? (
                      <div>
                        <p className="text-sm text-green-600">✅ {selectedFiles.cover.name}</p>
                        <button
                          onClick={() => setSelectedFiles({ ...selectedFiles, cover: undefined })}
                          className="text-red-500 text-sm mt-1"
                        >
                          إزالة
                        </button>
                      </div>
                    ) : about?.platformCover ? (
                      <div>
                        <img
                          src={`${API_URL}/about/file/${typeof about.platformCover === 'object' ? about.platformCover._id : about.platformCover}?token=${localStorage.getItem('token')}`}
                          alt="Cover"
                          className="max-h-20 mx-auto"
                        />
                        <button
                          onClick={() => coverInputRef.current?.click()}
                          className="mt-2 px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm"
                        >
                          تغيير الغلاف
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FaImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <button
                          onClick={() => coverInputRef.current?.click()}
                          className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm"
                        >
                          رفع غلاف
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ملف التعريف (PDF)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      ref={profileInputRef}
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFiles({ ...selectedFiles, profile: file });
                        }
                      }}
                      className="hidden"
                    />
                    {selectedFiles.profile ? (
                      <div>
                        <FaFileAlt className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-green-600">{selectedFiles.profile.name}</p>
                        <button
                          onClick={() => setSelectedFiles({ ...selectedFiles, profile: undefined })}
                          className="text-red-500 text-sm mt-1"
                        >
                          إزالة
                        </button>
                      </div>
                    ) : about?.profileFileId ? (
                      <div>
                        <FaFileAlt className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">ملف موجود</p>
                        <button
                          onClick={() => profileInputRef.current?.click()}
                          className="mt-2 px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm"
                        >
                          تغيير الملف
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FaFileAlt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <button
                          onClick={() => profileInputRef.current?.click()}
                          className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm"
                        >
                          رفع ملف PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">نشر الصفحة</span>
                </label>
              </div>
            </div>
          )}

          {/* ===== تبويب القصة والرؤية ===== */}
          {activeTab === 'story' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">📖 القصة والرؤية</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    قصة التأسيس (عربي)
                  </label>
                  <textarea
                    value={formData.storyAr || ''}
                    onChange={(e) => setFormData({ ...formData, storyAr: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="كيف بدأت الفكرة، ومتى تأسست المنصة..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    قصة التأسيس (إنجليزي)
                  </label>
                  <textarea
                    value={formData.story || ''}
                    onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="How the idea started..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تاريخ التأسيس
                  </label>
                  <input
                    type="date"
                    value={formData.foundedDate || ''}
                    onChange={(e) => setFormData({ ...formData, foundedDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الرؤية (عربي)
                  </label>
                  <textarea
                    value={formData.visionAr || ''}
                    onChange={(e) => setFormData({ ...formData, visionAr: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="الطموح المستقبلي للمنصة..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الرؤية (إنجليزي)
                  </label>
                  <textarea
                    value={formData.vision || ''}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="The future vision..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الرسالة (عربي)
                  </label>
                  <textarea
                    value={formData.missionAr || ''}
                    onChange={(e) => setFormData({ ...formData, missionAr: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="الهدف الحالي للمنصة..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الرسالة (إنجليزي)
                  </label>
                  <textarea
                    value={formData.mission || ''}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                    placeholder="The mission..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ===== تبويب القيم ===== */}
          {activeTab === 'values' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">💎 القيم الجوهرية</h3>
                <button
                  onClick={() => addItem('values', { title: '', titleAr: '', description: '', descriptionAr: '', icon: 'star' })}
                  className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm"
                >
                  <FaPlus /> إضافة قيمة
                </button>
              </div>

              {(formData.values || []).map((value: any, index: number) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">القيمة {index + 1}</span>
                    <div className="flex gap-2">
                      <button onClick={() => moveItem('values', index, 'up')} className="text-gray-400 hover:text-gray-600">
                        <FaArrowUp />
                      </button>
                      <button onClick={() => moveItem('values', index, 'down')} className="text-gray-400 hover:text-gray-600">
                        <FaArrowDown />
                      </button>
                      <button onClick={() => removeItem('values', index)} className="text-red-500 hover:text-red-700">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={value.titleAr || ''}
                      onChange={(e) => updateItem('values', index, 'titleAr', e.target.value)}
                      placeholder="العنوان (عربي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={value.title || ''}
                      onChange={(e) => updateItem('values', index, 'title', e.target.value)}
                      placeholder="العنوان (إنجليزي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <textarea
                      value={value.descriptionAr || ''}
                      onChange={(e) => updateItem('values', index, 'descriptionAr', e.target.value)}
                      placeholder="الوصف (عربي)"
                      rows={2}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <textarea
                      value={value.description || ''}
                      onChange={(e) => updateItem('values', index, 'description', e.target.value)}
                      placeholder="الوصف (إنجليزي)"
                      rows={2}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={value.icon || ''}
                      onChange={(e) => updateItem('values', index, 'icon', e.target.value)}
                      placeholder="الأيقونة (star, heart, shield...)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                  </div>
                </div>
              ))}
              {(formData.values || []).length === 0 && (
                <div className="text-center py-8 text-gray-400">لا توجد قيم مضافة</div>
              )}
            </div>
          )}

          {/* ===== تبويب الإحصائيات ===== */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">📊 إحصائيات المنصة</h3>
                <button
                  onClick={() => addItem('stats', { label: '', labelAr: '', value: '0', icon: 'chart-bar' })}
                  className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm"
                >
                  <FaPlus /> إضافة إحصائية
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.stats || []).map((stat: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">#{index + 1}</span>
                      <button onClick={() => removeItem('stats', index)} className="text-red-500 hover:text-red-700">
                        <FaTrash />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={stat.labelAr || ''}
                        onChange={(e) => updateItem('stats', index, 'labelAr', e.target.value)}
                        placeholder="الاسم (عربي)"
                        className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      />
                      <input
                        type="text"
                        value={stat.label || ''}
                        onChange={(e) => updateItem('stats', index, 'label', e.target.value)}
                        placeholder="الاسم (إنجليزي)"
                        className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      />
                      <input
                        type="text"
                        value={stat.value || ''}
                        onChange={(e) => updateItem('stats', index, 'value', e.target.value)}
                        placeholder="القيمة (مثال: 1000+)"
                        className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      />
                      <input
                        type="text"
                        value={stat.icon || ''}
                        onChange={(e) => updateItem('stats', index, 'icon', e.target.value)}
                        placeholder="الأيقونة (users, award, chart-bar...)"
                        className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {(formData.stats || []).length === 0 && (
                <div className="text-center py-8 text-gray-400">لا توجد إحصائيات</div>
              )}
            </div>
          )}

          {/* ===== تبويب فريق العمل ===== */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">👥 فريق العمل</h3>
                <button
                  onClick={() => addItem('team', { name: '', nameAr: '', position: '', positionAr: '', bio: '', bioAr: '', email: '', linkedin: '', twitter: '', isActive: true })}
                  className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm"
                >
                  <FaPlus /> إضافة عضو
                </button>
              </div>

              {(formData.team || []).map((member: any, index: number) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">عضو {index + 1}</span>
                    <div className="flex gap-2">
                      <button onClick={() => moveItem('team', index, 'up')} className="text-gray-400 hover:text-gray-600">
                        <FaArrowUp />
                      </button>
                      <button onClick={() => moveItem('team', index, 'down')} className="text-gray-400 hover:text-gray-600">
                        <FaArrowDown />
                      </button>
                      <button onClick={() => removeItem('team', index)} className="text-red-500 hover:text-red-700">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={member.nameAr || ''}
                      onChange={(e) => updateItem('team', index, 'nameAr', e.target.value)}
                      placeholder="الاسم (عربي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={member.name || ''}
                      onChange={(e) => updateItem('team', index, 'name', e.target.value)}
                      placeholder="الاسم (إنجليزي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={member.positionAr || ''}
                      onChange={(e) => updateItem('team', index, 'positionAr', e.target.value)}
                      placeholder="المنصب (عربي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={member.position || ''}
                      onChange={(e) => updateItem('team', index, 'position', e.target.value)}
                      placeholder="المنصب (إنجليزي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <textarea
                      value={member.bioAr || ''}
                      onChange={(e) => updateItem('team', index, 'bioAr', e.target.value)}
                      placeholder="السيرة الذاتية (عربي)"
                      rows={2}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <textarea
                      value={member.bio || ''}
                      onChange={(e) => updateItem('team', index, 'bio', e.target.value)}
                      placeholder="السيرة الذاتية (إنجليزي)"
                      rows={2}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="email"
                      value={member.email || ''}
                      onChange={(e) => updateItem('team', index, 'email', e.target.value)}
                      placeholder="البريد الإلكتروني"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={member.linkedin || ''}
                      onChange={(e) => updateItem('team', index, 'linkedin', e.target.value)}
                      placeholder="رابط LinkedIn"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={member.twitter || ''}
                      onChange={(e) => updateItem('team', index, 'twitter', e.target.value)}
                      placeholder="رابط Twitter/X"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">صورة العضو</label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFiles({ ...selectedFiles, teamImage: { index, file } });
                            }
                          }}
                          className="hidden"
                          id={`team-image-${index}`}
                        />
                        {selectedFiles.teamImage?.index === index ? (
                          <p className="text-sm text-green-600">{selectedFiles.teamImage.file.name}</p>
                        ) : member.imageId ? (
                          <div>
                            <img
                              src={`${API_URL}/about/file/${typeof member.imageId === 'object' ? member.imageId._id : member.imageId}?token=${localStorage.getItem('token')}`}
                              alt="Member"
                              className="max-h-12 mx-auto"
                            />
                          </div>
                        ) : (
                          <label htmlFor={`team-image-${index}`} className="cursor-pointer text-sm text-gray-400">
                            <FaImage className="w-6 h-6 mx-auto" />
                            رفع صورة
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={member.isActive !== false}
                          onChange={(e) => updateItem('team', index, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        نشط
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              {(formData.team || []).length === 0 && (
                <div className="text-center py-8 text-gray-400">لا يوجد أعضاء في الفريق</div>
              )}
            </div>
          )}

          {/* ===== تبويب الإنجازات ===== */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">🏆 الإنجازات والجوائز</h3>
                <button
                  onClick={() => addItem('achievements', { title: '', titleAr: '', description: '', descriptionAr: '', date: '', isActive: true })}
                  className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm"
                >
                  <FaPlus /> إضافة إنجاز
                </button>
              </div>

              {(formData.achievements || []).map((achievement: any, index: number) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">إنجاز {index + 1}</span>
                    <div className="flex gap-2">
                      <button onClick={() => moveItem('achievements', index, 'up')} className="text-gray-400 hover:text-gray-600">
                        <FaArrowUp />
                      </button>
                      <button onClick={() => moveItem('achievements', index, 'down')} className="text-gray-400 hover:text-gray-600">
                        <FaArrowDown />
                      </button>
                      <button onClick={() => removeItem('achievements', index)} className="text-red-500 hover:text-red-700">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={achievement.titleAr || ''}
                      onChange={(e) => updateItem('achievements', index, 'titleAr', e.target.value)}
                      placeholder="العنوان (عربي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={achievement.title || ''}
                      onChange={(e) => updateItem('achievements', index, 'title', e.target.value)}
                      placeholder="العنوان (إنجليزي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <textarea
                      value={achievement.descriptionAr || ''}
                      onChange={(e) => updateItem('achievements', index, 'descriptionAr', e.target.value)}
                      placeholder="الوصف (عربي)"
                      rows={2}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <textarea
                      value={achievement.description || ''}
                      onChange={(e) => updateItem('achievements', index, 'description', e.target.value)}
                      placeholder="الوصف (إنجليزي)"
                      rows={2}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="date"
                      value={achievement.date ? new Date(achievement.date).toISOString().slice(0, 10) : ''}
                      onChange={(e) => updateItem('achievements', index, 'date', e.target.value)}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">صورة الإنجاز</label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFiles({ ...selectedFiles, achievementImage: { index, file } });
                            }
                          }}
                          className="hidden"
                          id={`achievement-image-${index}`}
                        />
                        {selectedFiles.achievementImage?.index === index ? (
                          <p className="text-sm text-green-600">{selectedFiles.achievementImage.file.name}</p>
                        ) : achievement.imageId ? (
                          <img
                            src={`${API_URL}/about/file/${typeof achievement.imageId === 'object' ? achievement.imageId._id : achievement.imageId}?token=${localStorage.getItem('token')}`}
                            alt="Achievement"
                            className="max-h-12 mx-auto"
                          />
                        ) : (
                          <label htmlFor={`achievement-image-${index}`} className="cursor-pointer text-sm text-gray-400">
                            <FaImage className="w-6 h-6 mx-auto" />
                            رفع صورة
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={achievement.isActive !== false}
                          onChange={(e) => updateItem('achievements', index, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        نشط
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              {(formData.achievements || []).length === 0 && (
                <div className="text-center py-8 text-gray-400">لا توجد إنجازات</div>
              )}
            </div>
          )}

          {/* ===== تبويب آراء العملاء ===== */}
          {activeTab === 'testimonials' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">💬 آراء العملاء</h3>
                <button
                  onClick={() => addItem('testimonials', { name: '', nameAr: '', position: '', positionAr: '', content: '', contentAr: '', rating: 5, isActive: true })}
                  className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 flex items-center gap-1 text-sm"
                >
                  <FaPlus /> إضافة رأي
                </button>
              </div>

              {(formData.testimonials || []).map((testimonial: any, index: number) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">رأي {index + 1}</span>
                    <div className="flex gap-2">
                      <button onClick={() => moveItem('testimonials', index, 'up')} className="text-gray-400 hover:text-gray-600">
                        <FaArrowUp />
                      </button>
                      <button onClick={() => moveItem('testimonials', index, 'down')} className="text-gray-400 hover:text-gray-600">
                        <FaArrowDown />
                      </button>
                      <button onClick={() => removeItem('testimonials', index)} className="text-red-500 hover:text-red-700">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={testimonial.nameAr || ''}
                      onChange={(e) => updateItem('testimonials', index, 'nameAr', e.target.value)}
                      placeholder="الاسم (عربي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={testimonial.name || ''}
                      onChange={(e) => updateItem('testimonials', index, 'name', e.target.value)}
                      placeholder="الاسم (إنجليزي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={testimonial.positionAr || ''}
                      onChange={(e) => updateItem('testimonials', index, 'positionAr', e.target.value)}
                      placeholder="المنصب (عربي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <input
                      type="text"
                      value={testimonial.position || ''}
                      onChange={(e) => updateItem('testimonials', index, 'position', e.target.value)}
                      placeholder="المنصب (إنجليزي)"
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <textarea
                      value={testimonial.contentAr || ''}
                      onChange={(e) => updateItem('testimonials', index, 'contentAr', e.target.value)}
                      placeholder="المحتوى (عربي)"
                      rows={2}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <textarea
                      value={testimonial.content || ''}
                      onChange={(e) => updateItem('testimonials', index, 'content', e.target.value)}
                      placeholder="المحتوى (إنجليزي)"
                      rows={2}
                      className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                    />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">صورة العميل</label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFiles({ ...selectedFiles, testimonialImage: { index, file } });
                            }
                          }}
                          className="hidden"
                          id={`testimonial-image-${index}`}
                        />
                        {selectedFiles.testimonialImage?.index === index ? (
                          <p className="text-sm text-green-600">{selectedFiles.testimonialImage.file.name}</p>
                        ) : testimonial.imageId ? (
                          <img
                            src={`${API_URL}/about/file/${typeof testimonial.imageId === 'object' ? testimonial.imageId._id : testimonial.imageId}?token=${localStorage.getItem('token')}`}
                            alt="Client"
                            className="max-h-12 mx-auto"
                          />
                        ) : (
                          <label htmlFor={`testimonial-image-${index}`} className="cursor-pointer text-sm text-gray-400">
                            <FaImage className="w-6 h-6 mx-auto" />
                            رفع صورة
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-700 dark:text-gray-300">التقييم:</label>
                      <select
                        value={testimonial.rating || 5}
                        onChange={(e) => updateItem('testimonials', index, 'rating', parseInt(e.target.value))}
                        className="px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      >
                        {[1, 2, 3, 4, 5].map((r) => (
                          <option key={r} value={r}>{r} ⭐</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={testimonial.isActive !== false}
                          onChange={(e) => updateItem('testimonials', index, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        نشط
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              {(formData.testimonials || []).length === 0 && (
                <div className="text-center py-8 text-gray-400">لا توجد آراء</div>
              )}
            </div>
          )}

          {/* ===== تبويب معلومات الاتصال ===== */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">📞 معلومات الاتصال</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formData.contactInfo?.email || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, email: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo?.phone || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, phone: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العنوان (عربي)
                  </label>
                  <textarea
                    value={formData.contactInfo?.addressAr || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, addressAr: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العنوان (إنجليزي)
                  </label>
                  <textarea
                    value={formData.contactInfo?.address || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, address: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    رابط الخريطة (Google Maps)
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo?.mapUrl || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, mapUrl: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ساعات العمل (عربي)
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo?.workingHoursAr || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, workingHoursAr: e.target.value }
                    })}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ساعات العمل (إنجليزي)
                </label>
                <input
                  type="text"
                  value={formData.contactInfo?.workingHours || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, workingHours: e.target.value }
                  })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">🌐 وسائل التواصل الاجتماعي</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">فيسبوك</label>
                    <input
                      type="text"
                      value={formData.contactInfo?.socialMedia?.facebook || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          socialMedia: { ...formData.contactInfo?.socialMedia, facebook: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      placeholder="رابط فيسبوك"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">تويتر/X</label>
                    <input
                      type="text"
                      value={formData.contactInfo?.socialMedia?.twitter || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          socialMedia: { ...formData.contactInfo?.socialMedia, twitter: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      placeholder="رابط تويتر"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">انستغرام</label>
                    <input
                      type="text"
                      value={formData.contactInfo?.socialMedia?.instagram || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          socialMedia: { ...formData.contactInfo?.socialMedia, instagram: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      placeholder="رابط انستغرام"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">يوتيوب</label>
                    <input
                      type="text"
                      value={formData.contactInfo?.socialMedia?.youtube || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          socialMedia: { ...formData.contactInfo?.socialMedia, youtube: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      placeholder="رابط يوتيوب"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">لينكد إن</label>
                    <input
                      type="text"
                      value={formData.contactInfo?.socialMedia?.linkedin || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          socialMedia: { ...formData.contactInfo?.socialMedia, linkedin: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      placeholder="رابط لينكد إن"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">واتساب</label>
                    <input
                      type="text"
                      value={formData.contactInfo?.socialMedia?.whatsapp || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: {
                          ...formData.contactInfo,
                          socialMedia: { ...formData.contactInfo?.socialMedia, whatsapp: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-1.5 rounded border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 outline-none transition"
                      placeholder="رابط واتساب"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminAbout;