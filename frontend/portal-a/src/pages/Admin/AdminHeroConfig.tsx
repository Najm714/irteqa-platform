// src/components/admin/AdminHeroConfig.tsx
import React, { useState, useEffect, useRef } from 'react';
import { usePortalConfig } from '../../context/PortalConfigContext';
import {
  FaSave, FaEye, FaPlus, FaTrash, FaBullhorn, FaImage,
  FaChartBar, FaSpinner, FaCheckCircle, FaUpload,
  FaVideo,
} from 'react-icons/fa';

// ============================================================
// ✅ Helper: مكوّن رفع صورة قابل لإعادة الاستخدام
// ============================================================
interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  label?: string;
  hint?: string;
  maxHeight?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onUpload,
  uploading,
  label = 'صورة',
  hint = 'PNG, JPG, WebP',
  maxHeight = 'max-h-48',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2">
          <FaImage className="inline ml-2" />
          {label}
        </label>
      )}

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-purple-400 transition">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {value ? (
          <div className="space-y-3">
            <img
              src={value}
              alt={label}
              className={`${maxHeight} mx-auto rounded-lg shadow-lg object-cover`}
            />
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin" /> جاري الرفع...
                  </>
                ) : (
                  <>
                    <FaUpload /> تغيير
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-2 hover:bg-red-200"
              >
                <FaTrash /> حذف
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="py-4 w-full"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">جاري الرفع...</p>
              </>
            ) : (
              <>
                <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">اضغط لرفع صورة من جهازك</p>
                <p className="text-xs text-gray-400 mt-1">{hint}</p>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ✅ المكوّن الرئيسي
// ============================================================
const AdminHeroConfig: React.FC = () => {
  const { config, loading, updateConfig, uploadHeroFile } = usePortalConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('layout');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ✅ حالات الرفع
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [uploadingBgImage, setUploadingBgImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPopup, setUploadingPopup] = useState(false);
  const [uploadingSideBanner, setUploadingSideBanner] = useState(false);
  const [uploadingMidBanner, setUploadingMidBanner] = useState(false);
  const [uploadingSplashLogo, setUploadingSplashLogo] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState<number | null>(null);

  // ✅ refs للفيديو
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) setLocalConfig(JSON.parse(JSON.stringify(config)));
  }, [config]);

  // ============================================================
  // ✅ حفظ
  // ============================================================
  const handleSave = async () => {
    setSaving(true);
    try {
      if (
        localConfig.ctas &&
        (localConfig.ctas.length < 2 || localConfig.ctas.length > 4)
      ) {
        alert('⚠️ عدد الأزرار يجب أن يكون بين 2 و 4');
        setSaving(false);
        return;
      }
      await updateConfig(localConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('❌ فشل الحفظ: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ✅ تحديث حقل متداخل
  // ============================================================
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...localConfig };
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setLocalConfig(newConfig);
  };

  // ============================================================
  // ✅ دالة رفع عامة
  // ============================================================
  const doUpload = async (
    file: File,
    category: string,
    onSuccess: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const result = await uploadHeroFile(file, category);
      onSuccess(result.url);
      console.log(`✅ Upload success [${category}]:`, result.url);
    } catch (err: any) {
      alert('❌ فشل الرفع: ' + (err.message || 'خطأ غير معروف'));
      console.error('❌ Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // ✅ دوال الرفع المتخصصة
  // ============================================================
  const handleHeroImageUpload = async (file: File) => {
    await doUpload(
      file,
      'main',
      (url) => updateField('mainContent.image', url),
      setUploadingHeroImage
    );
  };

  const handleBackgroundImageUpload = async (file: File) => {
    await doUpload(
      file,
      'main',
      (url) => {
        updateField('background.type', 'image');
        updateField('background.value', url);
      },
      setUploadingBgImage
    );
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await doUpload(
      file,
      'main',
      (url) => {
        updateField('background.type', 'video');
        updateField('background.value', url);
      },
      setUploadingVideo
    );
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handlePopupImageUpload = async (file: File) => {
    await doUpload(
      file,
      'popup',
      (url) => updateField('announcements.popup.image', url),
      setUploadingPopup
    );
  };

  const handleSideBannerUpload = async (file: File) => {
    await doUpload(
      file,
      'sideBanner',
      (url) => updateField('announcements.sideBanner.image', url),
      setUploadingSideBanner
    );
  };

  const handleMidBannerUpload = async (file: File) => {
    await doUpload(
      file,
      'midBanner',
      (url) => updateField('announcements.midBanner.image', url),
      setUploadingMidBanner
    );
  };

  const handleSplashLogoUpload = async (file: File) => {
    await doUpload(
      file,
      'splash',
      (url) => updateField('splashScreen.logo', url),
      setUploadingSplashLogo
    );
  };

  const handleSlideImageUpload = async (file: File, slideIndex: number) => {
    setUploadingSlideIndex(slideIndex);
    try {
      const result = await uploadHeroFile(file, 'slide');
      setLocalConfig((prev: any) => {
        const slides = [...(prev.slides || [])];
        slides[slideIndex] = { ...slides[slideIndex], image: result.url };
        return { ...prev, slides };
      });
    } catch (err: any) {
      alert('❌ فشل الرفع: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setUploadingSlideIndex(null);
    }
  };

  // ============================================================
  // ✅ شاشة التحميل
  // ============================================================
  if (loading || !localConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'layout', label: '🎨 التصميم' },
    { id: 'content', label: '📝 المحتوى' },
    { id: 'ctas', label: '🔘 الأزرار' },
    { id: 'badges', label: '⭐ الشارات' },
    { id: 'background', label: '🖼️ الخلفية' },
    { id: 'slides', label: '🎠 الشرائح' },
    { id: 'announcements', label: '📢 الإعلانات' },
    { id: 'stats', label: '📊 الإحصائيات' },
    { id: 'splash', label: '💫 شاشة البداية' },
    { id: 'sections', label: '📑 الأقسام' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🎨 إدارة الصفحة الرئيسية
          </h1>
          <p className="text-gray-500 mt-1">
            تخصيص Hero + الإعلانات + الإحصائيات + الشرائح
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium"
          >
            <FaEye className="inline ml-2" /> معاينة
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-2">
          <FaCheckCircle /> تم الحفظ بنجاح!
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        {/* ===== Layout ===== */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">اختر نمط Hero</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 'cinematic', name: '🎬 سينمائي', desc: 'فيديو خلفية + نجوم' },
                { id: 'split', name: '⚖️ منقسم', desc: 'صورة + محتوى' },
                { id: 'carousel', name: '🎠 كاروسيل', desc: 'شرائح متعددة' },
                { id: 'magazine', name: '📰 مجلة', desc: 'إعلانات جانبية' },
                { id: 'interactive', name: '🎮 تفاعلي', desc: 'يستجيب للماوس' },
                { id: 'minimal', name: '✨ بسيط', desc: 'حديث وأنيق' },
              ].map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => updateField('layout', layout.id)}
                  className={`p-4 rounded-xl border-2 text-right transition ${
                    localConfig.layout === layout.id
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-bold text-lg">{layout.name}</div>
                  <div className="text-sm text-gray-500">{layout.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== Content ===== */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">المحتوى الرئيسي</h2>

            <div>
              <label className="block text-sm font-medium mb-2">العنوان</label>
              <input
                type="text"
                value={localConfig.mainContent?.title || ''}
                onChange={(e) => updateField('mainContent.title', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                الكلمة المميزة (Highlight)
              </label>
              <input
                type="text"
                value={localConfig.mainContent?.titleHighlight || ''}
                onChange={(e) =>
                  updateField('mainContent.titleHighlight', e.target.value)
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <textarea
                rows={3}
                value={localConfig.mainContent?.description || ''}
                onChange={(e) =>
                  updateField('mainContent.description', e.target.value)
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            <ImageUploader
              label="صورة Hero"
              value={localConfig.mainContent?.image || ''}
              onChange={(url) => updateField('mainContent.image', url)}
              onUpload={handleHeroImageUpload}
              uploading={uploadingHeroImage}
            />

            {/* imagePosition — للنمط split */}
            {localConfig.layout === 'split' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  موضع الصورة
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'right', label: 'يمين' },
                    { value: 'left', label: 'يسار' },
                  ].map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() =>
                        updateField('mainContent.imagePosition', pos.value)
                      }
                      className={`px-4 py-2 rounded-lg border-2 ${
                        localConfig.mainContent?.imagePosition === pos.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== CTAs ===== */}
        {activeTab === 'ctas' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">
                الأزرار ({localConfig.ctas?.length || 0}/4)
              </h2>
              <button
                onClick={() => {
                  const ctas = [...(localConfig.ctas || [])];
                  if (ctas.length >= 4) {
                    alert('⚠️ الحد الأقصى 4 أزرار');
                    return;
                  }
                  ctas.push({
                    text: 'زر جديد',
                    link: '/',
                    variant: 'primary',
                    order: ctas.length,
                    isActive: true,
                    target: '_self',
                  });
                  updateField('ctas', ctas);
                }}
                disabled={(localConfig.ctas?.length || 0) >= 4}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FaPlus /> إضافة زر
              </button>
            </div>

            {(localConfig.ctas || []).map((cta: any, i: number) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">زر {i + 1}</span>
                  <button
                    onClick={() => {
                      if ((localConfig.ctas?.length || 0) <= 2) {
                        alert('⚠️ الحد الأدنى زرّان');
                        return;
                      }
                      if (!confirm('هل تريد حذف هذا الزر؟')) return;
                      const ctas = localConfig.ctas.filter(
                        (_: any, idx: number) => idx !== i
                      );
                      updateField('ctas', ctas);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="النص"
                    value={cta.text}
                    onChange={(e) => {
                      const ctas = [...localConfig.ctas];
                      ctas[i].text = e.target.value;
                      updateField('ctas', ctas);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  />
                  <input
                    type="text"
                    placeholder="الرابط"
                    value={cta.link}
                    onChange={(e) => {
                      const ctas = [...localConfig.ctas];
                      ctas[i].link = e.target.value;
                      updateField('ctas', ctas);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  />
                  <select
                    value={cta.variant}
                    onChange={(e) => {
                      const ctas = [...localConfig.ctas];
                      ctas[i].variant = e.target.value;
                      updateField('ctas', ctas);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  >
                    <option value="primary">أساسي</option>
                    <option value="secondary">ثانوي</option>
                    <option value="outline">إطار</option>
                    <option value="ghost">شفاف</option>
                  </select>
                  <select
                    value={cta.target || '_self'}
                    onChange={(e) => {
                      const ctas = [...localConfig.ctas];
                      ctas[i].target = e.target.value;
                      updateField('ctas', ctas);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  >
                    <option value="_self">نفس النافذة</option>
                    <option value="_blank">نافذة جديدة</option>
                  </select>
                  <input
                    type="text"
                    placeholder="أيقونة (fa-...)"
                    value={cta.icon || ''}
                    onChange={(e) => {
                      const ctas = [...localConfig.ctas];
                      ctas[i].icon = e.target.value;
                      updateField('ctas', ctas);
                    }}
                    className="px-3 py-2 rounded-lg border col-span-2"
                  />
                  <label className="flex items-center gap-2 col-span-2">
                    <input
                      type="checkbox"
                      checked={cta.isActive !== false}
                      onChange={(e) => {
                        const ctas = [...localConfig.ctas];
                        ctas[i].isActive = e.target.checked;
                        updateField('ctas', ctas);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">نشط</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== Badges ===== */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">الشارات</h2>
              <button
                onClick={() => {
                  const badges = [...(localConfig.badges || [])];
                  badges.push({
                    text: 'شارة جديدة',
                    icon: 'fa-check',
                    color: '#7c3aed',
                    order: badges.length,
                    isActive: true,
                  });
                  updateField('badges', badges);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaPlus /> إضافة شارة
              </button>
            </div>

            {(localConfig.badges || []).map((badge: any, i: number) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl"
              >
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="النص"
                    value={badge.text}
                    onChange={(e) => {
                      const badges = [...localConfig.badges];
                      badges[i].text = e.target.value;
                      updateField('badges', badges);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  />
                  <input
                    type="text"
                    placeholder="أيقونة"
                    value={badge.icon}
                    onChange={(e) => {
                      const badges = [...localConfig.badges];
                      badges[i].icon = e.target.value;
                      updateField('badges', badges);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={badge.color}
                      onChange={(e) => {
                        const badges = [...localConfig.badges];
                        badges[i].color = e.target.value;
                        updateField('badges', badges);
                      }}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={badge.isActive !== false}
                        onChange={(e) => {
                          const badges = [...localConfig.badges];
                          badges[i].isActive = e.target.checked;
                          updateField('badges', badges);
                        }}
                        className="w-4 h-4"
                      />
                    </label>
                    <button
                      onClick={() => {
                        if (!confirm('حذف الشارة؟')) return;
                        const badges = localConfig.badges.filter(
                          (_: any, idx: number) => idx !== i
                        );
                        updateField('badges', badges);
                      }}
                      className="text-red-500"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== Background ===== */}
        {activeTab === 'background' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">الخلفية</h2>

            <div>
              <label className="block text-sm font-medium mb-2">النوع</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { id: 'animated', label: '🌟 متحرك' },
                  { id: 'gradient', label: '🌈 تدرج' },
                  { id: 'solid', label: '🎨 لون صلب' },
                  { id: 'image', label: '🖼️ صورة' },
                  { id: 'video', label: '🎬 فيديو' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateField('background.type', t.id)}
                    className={`p-3 rounded-lg border-2 ${
                      localConfig.background?.type === t.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {localConfig.background?.type === 'solid' && (
              <div>
                <label className="block text-sm font-medium mb-2">اللون</label>
                <input
                  type="color"
                  value={localConfig.background?.value || '#0f0f23'}
                  onChange={(e) =>
                    updateField('background.value', e.target.value)
                  }
                  className="w-24 h-12 rounded cursor-pointer"
                />
              </div>
            )}

            {localConfig.background?.type === 'gradient' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  ألوان التدرج (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  placeholder="#7c3aed, #ec4899"
                  value={(localConfig.background?.gradientColors || []).join(
                    ', '
                  )}
                  onChange={(e) =>
                    updateField(
                      'background.gradientColors',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
            )}

            {localConfig.background?.type === 'image' && (
              <ImageUploader
                label="صورة الخلفية"
                value={localConfig.background?.value || ''}
                onChange={(url) => updateField('background.value', url)}
                onUpload={handleBackgroundImageUpload}
                uploading={uploadingBgImage}
              />
            )}

            {localConfig.background?.type === 'video' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FaVideo className="inline ml-2" /> فيديو الخلفية (MP4)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  {localConfig.background?.value ? (
                    <div className="space-y-3">
                      <video
                        src={localConfig.background.value}
                        controls
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <div className="flex gap-3 justify-center">
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
                          disabled={uploadingVideo}
                        >
                          {uploadingVideo ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaUpload />
                          )}
                          تغيير الفيديو
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('background.value', '')}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-2"
                        >
                          <FaTrash /> حذف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="py-4 w-full"
                      disabled={uploadingVideo}
                    >
                      {uploadingVideo ? (
                        <>
                          <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            جاري رفع الفيديو... قد يستغرق دقيقة
                          </p>
                        </>
                      ) : (
                        <>
                          <FaVideo className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            اضغط لرفع فيديو MP4
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            حتى 500MB
                          </p>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.background?.starsEnabled}
                onChange={(e) =>
                  updateField('background.starsEnabled', e.target.checked)
                }
                className="w-5 h-5"
              />
              <label>تفعيل النجوم المتحركة</label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  لون Overlay
                </label>
                <input
                  type="color"
                  value={localConfig.background?.overlayColor || '#000000'}
                  onChange={(e) =>
                    updateField('background.overlayColor', e.target.value)
                  }
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  شفافية Overlay:{' '}
                  {Math.round(
                    (localConfig.background?.overlayOpacity || 0.3) * 100
                  )}
                  %
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localConfig.background?.overlayOpacity || 0.3}
                  onChange={(e) =>
                    updateField(
                      'background.overlayOpacity',
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== Slides ===== */}
        {activeTab === 'slides' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">
                شرائح الكاروسيل ({localConfig.slides?.length || 0})
              </h2>
              <button
                onClick={() => {
                  const slides = [...(localConfig.slides || [])];
                  slides.push({
                    title: 'شريحة جديدة',
                    description: '',
                    image: '',
                    bgColor: '#7c3aed',
                    cta: { text: '', link: '' },
                    duration: 5000,
                    order: slides.length,
                    isActive: true,
                  });
                  updateField('slides', slides);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaPlus /> إضافة شريحة
              </button>
            </div>

            <p className="text-sm text-gray-500">
              ℹ️ الشرائح تُستخدم فقط عند اختيار نمط "كاروسيل"
            </p>

            {(localConfig.slides || []).map((slide: any, i: number) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl space-y-4 border-2 border-gray-200 dark:border-gray-600"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">شريحة {i + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={slide.isActive !== false}
                        onChange={(e) => {
                          const slides = [...localConfig.slides];
                          slides[i].isActive = e.target.checked;
                          updateField('slides', slides);
                        }}
                        className="w-4 h-4"
                      />
                      <span>نشط</span>
                    </label>
                    <button
                      onClick={() => {
                        if (!confirm('حذف الشريحة؟')) return;
                        const slides = localConfig.slides.filter(
                          (_: any, idx: number) => idx !== i
                        );
                        updateField('slides', slides);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      العنوان
                    </label>
                    <input
                      type="text"
                      placeholder="عنوان الشريحة"
                      value={slide.title || ''}
                      onChange={(e) => {
                        const slides = [...localConfig.slides];
                        slides[i].title = e.target.value;
                        updateField('slides', slides);
                      }}
                      className="w-full px-3 py-2 rounded-lg border"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      الوصف
                    </label>
                    <textarea
                      placeholder="وصف الشريحة"
                      value={slide.description || ''}
                      onChange={(e) => {
                        const slides = [...localConfig.slides];
                        slides[i].description = e.target.value;
                        updateField('slides', slides);
                      }}
                      className="w-full px-3 py-2 rounded-lg border"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      نص الزر
                    </label>
                    <input
                      type="text"
                      placeholder="اعرف المزيد"
                      value={slide.cta?.text || ''}
                      onChange={(e) => {
                        const slides = [...localConfig.slides];
                        slides[i].cta = {
                          ...slides[i].cta,
                          text: e.target.value,
                        };
                        updateField('slides', slides);
                      }}
                      className="w-full px-3 py-2 rounded-lg border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      رابط الزر
                    </label>
                    <input
                      type="text"
                      placeholder="/services"
                      value={slide.cta?.link || ''}
                      onChange={(e) => {
                        const slides = [...localConfig.slides];
                        slides[i].cta = {
                          ...slides[i].cta,
                          link: e.target.value,
                        };
                        updateField('slides', slides);
                      }}
                      className="w-full px-3 py-2 rounded-lg border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      المدة (ms)
                    </label>
                    <input
                      type="number"
                      value={slide.duration || 5000}
                      onChange={(e) => {
                        const slides = [...localConfig.slides];
                        slides[i].duration =
                          parseInt(e.target.value) || 5000;
                        updateField('slides', slides);
                      }}
                      className="w-full px-3 py-2 rounded-lg border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      لون الخلفية
                    </label>
                    <input
                      type="color"
                      value={slide.bgColor || '#7c3aed'}
                      onChange={(e) => {
                        const slides = [...localConfig.slides];
                        slides[i].bgColor = e.target.value;
                        updateField('slides', slides);
                      }}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* ✅ رفع صورة الشريحة */}
                <ImageUploader
                  label="صورة الشريحة"
                  value={slide.image || ''}
                  onChange={(url) => {
                    const slides = [...localConfig.slides];
                    slides[i].image = url;
                    updateField('slides', slides);
                  }}
                  onUpload={(file) => handleSlideImageUpload(file, i)}
                  uploading={uploadingSlideIndex === i}
                  hint="PNG, JPG, WebP — يُفضّل 1920×1080"
                />
              </div>
            ))}

            {(!localConfig.slides || localConfig.slides.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <FaImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>لا توجد شرائح بعد</p>
                <p className="text-sm mt-1">اضغط "إضافة شريحة" للبدء</p>
              </div>
            )}
          </div>
        )}

        {/* ===== Announcements ===== */}
        {activeTab === 'announcements' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold">الإعلانات</h2>

            {/* Top Bar */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={localConfig.announcements?.topBar?.enabled}
                  onChange={(e) =>
                    updateField(
                      'announcements.topBar.enabled',
                      e.target.checked
                    )
                  }
                  className="w-5 h-5"
                />
                <h3 className="font-bold">📢 إعلان علوي</h3>
              </div>

              {localConfig.announcements?.topBar?.enabled && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="النص"
                    value={localConfig.announcements.topBar.text || ''}
                    onChange={(e) =>
                      updateField('announcements.topBar.text', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                  <input
                    type="text"
                    placeholder="الرابط"
                    value={localConfig.announcements.topBar.link || ''}
                    onChange={(e) =>
                      updateField('announcements.topBar.link', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">لون الخلفية</label>
                      <input
                        type="color"
                        value={
                          localConfig.announcements.topBar.bgColor ||
                          '#7c3aed'
                        }
                        onChange={(e) =>
                          updateField(
                            'announcements.topBar.bgColor',
                            e.target.value
                          )
                        }
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-sm">لون النص</label>
                      <input
                        type="color"
                        value={
                          localConfig.announcements.topBar.textColor ||
                          '#ffffff'
                        }
                        onChange={(e) =>
                          updateField(
                            'announcements.topBar.textColor',
                            e.target.value
                          )
                        }
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mid Banner */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={localConfig.announcements?.midBanner?.enabled}
                  onChange={(e) =>
                    updateField(
                      'announcements.midBanner.enabled',
                      e.target.checked
                    )
                  }
                  className="w-5 h-5"
                />
                <h3 className="font-bold">📣 بانر وسط الصفحة</h3>
              </div>

              {localConfig.announcements?.midBanner?.enabled && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="العنوان"
                    value={localConfig.announcements.midBanner.title || ''}
                    onChange={(e) =>
                      updateField(
                        'announcements.midBanner.title',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                  <textarea
                    placeholder="الوصف"
                    value={
                      localConfig.announcements.midBanner.description || ''
                    }
                    onChange={(e) =>
                      updateField(
                        'announcements.midBanner.description',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="نص الزر"
                      value={localConfig.announcements.midBanner.ctaText || ''}
                      onChange={(e) =>
                        updateField(
                          'announcements.midBanner.ctaText',
                          e.target.value
                        )
                      }
                      className="px-3 py-2 rounded-lg border"
                    />
                    <input
                      type="text"
                      placeholder="رابط الزر"
                      value={localConfig.announcements.midBanner.link || ''}
                      onChange={(e) =>
                        updateField(
                          'announcements.midBanner.link',
                          e.target.value
                        )
                      }
                      className="px-3 py-2 rounded-lg border"
                    />
                  </div>

                  <ImageUploader
                    label="صورة البانر"
                    value={localConfig.announcements.midBanner.image || ''}
                    onChange={(url) =>
                      updateField('announcements.midBanner.image', url)
                    }
                    onUpload={handleMidBannerUpload}
                    uploading={uploadingMidBanner}
                    maxHeight="max-h-32"
                  />
                </div>
              )}
            </div>

            {/* Popup */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={localConfig.announcements?.popup?.enabled}
                  onChange={(e) =>
                    updateField(
                      'announcements.popup.enabled',
                      e.target.checked
                    )
                  }
                  className="w-5 h-5"
                />
                <h3 className="font-bold">💬 Popup إعلاني</h3>
              </div>

              {localConfig.announcements?.popup?.enabled && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="العنوان"
                    value={localConfig.announcements.popup.title || ''}
                    onChange={(e) =>
                      updateField('announcements.popup.title', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                  <textarea
                    placeholder="الوصف"
                    value={localConfig.announcements.popup.description || ''}
                    onChange={(e) =>
                      updateField(
                        'announcements.popup.description',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />

                  <ImageUploader
                    label="صورة Popup"
                    value={localConfig.announcements.popup.image || ''}
                    onChange={(url) =>
                      updateField('announcements.popup.image', url)
                    }
                    onUpload={handlePopupImageUpload}
                    uploading={uploadingPopup}
                    maxHeight="max-h-32"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="نص الزر"
                      value={localConfig.announcements.popup.ctaText || ''}
                      onChange={(e) =>
                        updateField(
                          'announcements.popup.ctaText',
                          e.target.value
                        )
                      }
                      className="px-3 py-2 rounded-lg border"
                    />
                    <input
                      type="text"
                      placeholder="رابط الزر"
                      value={localConfig.announcements.popup.ctaLink || ''}
                      onChange={(e) =>
                        updateField(
                          'announcements.popup.ctaLink',
                          e.target.value
                        )
                      }
                      className="px-3 py-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="text-sm">يظهر بعد (ms)</label>
                    <input
                      type="number"
                      value={localConfig.announcements.popup.showAfter || 5000}
                      onChange={(e) =>
                        updateField(
                          'announcements.popup.showAfter',
                          parseInt(e.target.value) || 5000
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Side Banner */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={localConfig.announcements?.sideBanner?.enabled}
                  onChange={(e) =>
                    updateField(
                      'announcements.sideBanner.enabled',
                      e.target.checked
                    )
                  }
                  className="w-5 h-5"
                />
                <h3 className="font-bold">📌 إعلان جانبي</h3>
              </div>

              {localConfig.announcements?.sideBanner?.enabled && (
                <div className="space-y-3">
                  <ImageUploader
                    label="صورة الجانب"
                    value={localConfig.announcements.sideBanner.image || ''}
                    onChange={(url) =>
                      updateField('announcements.sideBanner.image', url)
                    }
                    onUpload={handleSideBannerUpload}
                    uploading={uploadingSideBanner}
                    maxHeight="max-h-32"
                  />

                  <input
                    type="text"
                    placeholder="الرابط"
                    value={localConfig.announcements.sideBanner.link || ''}
                    onChange={(e) =>
                      updateField(
                        'announcements.sideBanner.link',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                  <select
                    value={
                      localConfig.announcements.sideBanner.position || 'right'
                    }
                    onChange={(e) =>
                      updateField(
                        'announcements.sideBanner.position',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  >
                    <option value="right">يمين</option>
                    <option value="left">يسار</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Stats ===== */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.liveStats?.enabled}
                onChange={(e) =>
                  updateField('liveStats.enabled', e.target.checked)
                }
                className="w-5 h-5"
              />
              <h2 className="text-xl font-bold">📊 تفعيل الإحصائيات المباشرة</h2>
            </div>

            {localConfig.liveStats?.enabled && (
              <div className="space-y-3">
                {(localConfig.liveStats.items || []).map(
                  (item: any, i: number) => (
                    <div
                      key={i}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl"
                    >
                      <div className="grid grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="التسمية"
                          value={item.label}
                          onChange={(e) => {
                            const items = [...localConfig.liveStats.items];
                            items[i].label = e.target.value;
                            updateField('liveStats.items', items);
                          }}
                          className="px-3 py-2 rounded-lg border"
                        />
                        <select
                          value={item.dynamicKey}
                          onChange={(e) => {
                            const items = [...localConfig.liveStats.items];
                            items[i].dynamicKey = e.target.value;
                            items[i].isDynamic = e.target.value !== 'custom';
                            updateField('liveStats.items', items);
                          }}
                          className="px-3 py-2 rounded-lg border"
                        >
                          <option value="users">المستخدمون</option>
                          <option value="requests">الطلبات</option>
                          <option value="services">الخدمات</option>
                          <option value="rating">التقييم</option>
                          <option value="custom">مخصص</option>
                        </select>
                        <input
                          type="text"
                          placeholder="قيمة ثابتة (إن custom)"
                          value={item.staticValue || ''}
                          onChange={(e) => {
                            const items = [...localConfig.liveStats.items];
                            items[i].staticValue = e.target.value;
                            updateField('liveStats.items', items);
                          }}
                          disabled={item.dynamicKey !== 'custom'}
                          className="px-3 py-2 rounded-lg border disabled:opacity-50"
                        />
                        <button
                          onClick={() => {
                            if (!confirm('حذف الإحصائية؟')) return;
                            const items = localConfig.liveStats.items.filter(
                              (_: any, idx: number) => idx !== i
                            );
                            updateField('liveStats.items', items);
                          }}
                          className="text-red-500"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )
                )}

                <button
                  onClick={() => {
                    const items = [...(localConfig.liveStats.items || [])];
                    items.push({
                      label: 'إحصائية',
                      dynamicKey: 'custom',
                      isDynamic: false,
                      staticValue: '0',
                      color: '#7c3aed',
                    });
                    updateField('liveStats.items', items);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
                >
                  <FaPlus /> إضافة إحصائية
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== Splash Screen ===== */}
        {activeTab === 'splash' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">💫 شاشة البداية</h2>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.splashScreen?.enabled !== false}
                onChange={(e) =>
                  updateField('splashScreen.enabled', e.target.checked)
                }
                className="w-5 h-5"
              />
              <label>تفعيل شاشة البداية</label>
            </div>

            {localConfig.splashScreen?.enabled !== false && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    النص
                  </label>
                  <input
                    type="text"
                    value={localConfig.splashScreen?.text || ''}
                    onChange={(e) =>
                      updateField('splashScreen.text', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    المدة (ms)
                  </label>
                  <input
                    type="number"
                    value={localConfig.splashScreen?.duration || 3500}
                    onChange={(e) =>
                      updateField(
                        'splashScreen.duration',
                        parseInt(e.target.value) || 3500
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    لون الخلفية
                  </label>
                  <input
                    type="color"
                    value={localConfig.splashScreen?.bgColor || '#0f0f23'}
                    onChange={(e) =>
                      updateField('splashScreen.bgColor', e.target.value)
                    }
                    className="w-24 h-12 rounded cursor-pointer"
                  />
                </div>

                <ImageUploader
                  label="شعار Splash"
                  value={localConfig.splashScreen?.logo || ''}
                  onChange={(url) => updateField('splashScreen.logo', url)}
                  onUpload={handleSplashLogoUpload}
                  uploading={uploadingSplashLogo}
                  maxHeight="max-h-32"
                />
              </div>
            )}
          </div>
        )}

        {/* ===== Sections ===== */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">تفعيل/تعطيل الأقسام</h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'promotions', label: '🎁 العروض' },
                { key: 'testimonials', label: '💬 آراء العملاء' },
                { key: 'partners', label: '🤝 الشركاء' },
                { key: 'stats', label: '📊 الإحصائيات' },
                { key: 'latestNews', label: '📰 آخر الأخبار' },
                { key: 'newsletter', label: '📧 النشرة البريدية' },
                { key: 'faq', label: '❓ الأسئلة الشائعة' },
              ].map((section) => (
                <div
                  key={section.key}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <input
                    type="checkbox"
                    checked={localConfig.sections?.[section.key] || false}
                    onChange={(e) =>
                      updateField(
                        `sections.${section.key}`,
                        e.target.checked
                      )
                    }
                    className="w-5 h-5"
                  />
                  <label className="font-medium">{section.label}</label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeroConfig;