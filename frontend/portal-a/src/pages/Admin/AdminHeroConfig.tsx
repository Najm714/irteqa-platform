import React, { useState, useEffect, useRef } from 'react';
import { usePortalConfig } from '../../context/PortalConfigContext';
import {
  FaSave, FaEye, FaPlus, FaTrash, FaPalette, FaBullhorn, FaImage,
  FaChartBar, FaLayerGroup, FaSpinner, FaCheckCircle, FaUpload,
  FaVideo, FaTimes,
} from 'react-icons/fa';

const AdminHeroConfig: React.FC = () => {
const { config, loading, updateConfig, uploadHeroFile } = usePortalConfig();
const [localConfig, setLocalConfig] = useState<any>(null);
const [activeTab, setActiveTab] = useState('layout');
const [saving, setSaving] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);

// ✅ حالات رفع الملفات
const [uploadingImage, setUploadingImage] = useState(false);
const [uploadingVideo, setUploadingVideo] = useState(false);
const [uploadingPopup, setUploadingPopup] = useState(false);
const [uploadingSideBanner, setUploadingSideBanner] = useState(false);

// ✅ Refs للملفات
const imageInputRef = useRef<HTMLInputElement>(null);
const videoInputRef = useRef<HTMLInputElement>(null);
const popupInputRef = useRef<HTMLInputElement>(null);
const sideBannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) setLocalConfig(JSON.parse(JSON.stringify(config)));
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(localConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

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
// ✅ رفع صورة Hero
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  try {
    const result = await uploadHeroFile(file);
    setLocalConfig({
      ...localConfig,
      mainContent: {
        ...localConfig.mainContent,
        image: result.url,
      },
    });
    alert('✅ تم رفع الصورة');
  } catch (err: any) {
    alert('❌ فشل رفع الصورة: ' + err.message);
  } finally {
    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }
};

// ✅ رفع فيديو الخلفية
const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadingVideo(true);
  try {
    const result = await uploadHeroFile(file);
    setLocalConfig({
      ...localConfig,
      background: {
        ...localConfig.background,
        type: 'video',
        value: result.url,
      },
    });
    alert('✅ تم رفع الفيديو');
  } catch (err: any) {
    alert('❌ فشل رفع الفيديو: ' + err.message);
  } finally {
    setUploadingVideo(false);
    if (videoInputRef.current) videoInputRef.current.value = '';
  }
};

// ✅ رفع صورة خلفية (نوع image)
const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  try {
    const result = await uploadHeroFile(file);
    setLocalConfig({
      ...localConfig,
      background: {
        ...localConfig.background,
        type: 'image',
        value: result.url,
      },
    });
    alert('✅ تم رفع صورة الخلفية');
  } catch (err: any) {
    alert('❌ فشل رفع الصورة: ' + err.message);
  } finally {
    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }
};

// ✅ رفع صورة Popup
const handlePopupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadingPopup(true);
  try {
    const result = await uploadHeroFile(file);
    setLocalConfig({
      ...localConfig,
      announcements: {
        ...localConfig.announcements,
        popup: {
          ...localConfig.announcements?.popup,
          image: result.url,
        },
      },
    });
    alert('✅ تم رفع صورة Popup');
  } catch (err: any) {
    alert('❌ فشل رفع الصورة: ' + err.message);
  } finally {
    setUploadingPopup(false);
    if (popupInputRef.current) popupInputRef.current.value = '';
  }
};

// ✅ رفع صورة Side Banner
const handleSideBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadingSideBanner(true);
  try {
    const result = await uploadHeroFile(file);
    setLocalConfig({
      ...localConfig,
      announcements: {
        ...localConfig.announcements,
        sideBanner: {
          ...localConfig.announcements?.sideBanner,
          image: result.url,
        },
      },
    });
    alert('✅ تم رفع صورة Side Banner');
  } catch (err: any) {
    alert('❌ فشل رفع الصورة: ' + err.message);
  } finally {
    setUploadingSideBanner(false);
    if (sideBannerInputRef.current) sideBannerInputRef.current.value = '';
  }
};
  if (loading || !localConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'layout', label: '🎨 التصميم', icon: <FaPalette /> },
    { id: 'content', label: '📝 المحتوى', icon: <FaLayerGroup /> },
    { id: 'ctas', label: '🔘 الأزرار', icon: <FaPlus /> },
    { id: 'badges', label: '⭐ الشارات' },
    { id: 'background', label: '🖼️ الخلفية', icon: <FaImage /> },
    { id: 'announcements', label: '📢 الإعلانات', icon: <FaBullhorn /> },
    { id: 'stats', label: '📊 الإحصائيات', icon: <FaChartBar /> },
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
          <p className="text-gray-500 mt-1">تخصيص Hero + الإعلانات + الإحصائيات</p>
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

      {/* Success Message */}
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

      {/* Content */}
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
                      ? 'border-purple-600 bg-purple-50'
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
              <label className="block text-sm font-medium mb-2">الكلمة المميزة (Highlight)</label>
              <input
                type="text"
                value={localConfig.mainContent?.titleHighlight || ''}
                onChange={(e) => updateField('mainContent.titleHighlight', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <textarea
                rows={3}
                value={localConfig.mainContent?.description || ''}
                onChange={(e) => updateField('mainContent.description', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            {/* ✅ ✅ ✅ رفع صورة Hero من الجهاز */}
<div>
  <label className="block text-sm font-medium mb-2">
    <FaImage className="inline ml-2" />
    صورة Hero
  </label>

  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-purple-400 transition">
    <input
      ref={imageInputRef}
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="hidden"
    />

    {localConfig.mainContent?.image ? (
      <div className="space-y-3">
        <img
          src={localConfig.mainContent.image}
          alt="Hero"
          className="max-h-48 mx-auto rounded-lg shadow-lg"
        />
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaUpload />
            )}
            تغيير الصورة
          </button>
          <button
            type="button"
            onClick={() => updateField('mainContent.image', '')}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center gap-2"
          >
            <FaTrash />
            حذف
          </button>
        </div>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        className="py-4 w-full"
        disabled={uploadingImage}
      >
        {uploadingImage ? (
          <>
            <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">جاري الرفع...</p>
          </>
        ) : (
          <>
            <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">اضغط لرفع صورة من جهازك</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP</p>
          </>
        )}
      </button>
    )}
  </div>
</div>
          </div>
        )}

        {/* ===== CTAs ===== */}
        {activeTab === 'ctas' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">الأزرار (2-4)</h2>
              <button
                onClick={() => {
                  const ctas = [...(localConfig.ctas || [])];
                  ctas.push({
                    text: 'زر جديد',
                    link: '/',
                    variant: 'primary',
                    order: ctas.length,
                    isActive: true,
                  });
                  updateField('ctas', ctas);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
              >
                <FaPlus /> إضافة زر
              </button>
            </div>

            {(localConfig.ctas || []).map((cta: any, i: number) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold">زر {i + 1}</span>
                  <button
                    onClick={() => {
                      const ctas = localConfig.ctas.filter((_: any, idx: number) => idx !== i);
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
                  <input
                    type="text"
                    placeholder="أيقونة (fa-...)"
                    value={cta.icon || ''}
                    onChange={(e) => {
                      const ctas = [...localConfig.ctas];
                      ctas[i].icon = e.target.value;
                      updateField('ctas', ctas);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  />
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
              <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
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
                      className="w-12 h-10 rounded"
                    />
                    <button
                      onClick={() => {
                        const badges = localConfig.badges.filter((_: any, idx: number) => idx !== i);
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
              <div className="grid grid-cols-3 gap-3">
                {['animated', 'gradient', 'image', 'video'].map((type) => (
                  <button
                    key={type}
                    onClick={() => updateField('background.type', type)}
                    className={`p-3 rounded-lg border-2 ${
                      localConfig.background?.type === type
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {type === 'animated' && '🌟 متحرك'}
                    {type === 'gradient' && '🌈 تدرج'}
                    {type === 'image' && '🖼️ صورة'}
                    {type === 'video' && '🎬 فيديو'}
                  </button>
                ))}
              </div>
            </div>
{/* ✅ رفع صورة خلفية */}
{localConfig.background?.type === 'image' && (
  <div>
    <label className="block text-sm font-medium mb-2">
      <FaImage className="inline ml-2" />
      صورة الخلفية
    </label>

    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-purple-400">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundImageUpload}
        className="hidden"
      />

      {localConfig.background?.value ? (
        <div className="space-y-3">
          <img
            src={localConfig.background.value}
            alt="Background"
            className="max-h-48 mx-auto rounded-lg"
          />
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"
              disabled={uploadingImage}
            >
              <FaUpload /> تغيير
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
          onClick={() => imageInputRef.current?.click()}
          className="py-4 w-full"
          disabled={uploadingImage}
        >
          <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">اضغط لرفع صورة خلفية</p>
        </button>
      )}
    </div>
  </div>
)}

{/* ✅ رفع فيديو خلفية */}
{localConfig.background?.type === 'video' && (
  <div>
    <label className="block text-sm font-medium mb-2">
      <FaVideo className="inline ml-2" />
      فيديو الخلفية (MP4)
    </label>

    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-purple-400">
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
              {uploadingVideo ? <FaSpinner className="animate-spin" /> : <FaUpload />}
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
              <p className="text-sm text-gray-500">جاري رفع الفيديو... قد يستغرق دقيقة</p>
            </>
          ) : (
            <>
              <FaVideo className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">اضغط لرفع فيديو MP4</p>
              <p className="text-xs text-gray-400 mt-1">حتى 500MB</p>
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
                onChange={(e) => updateField('background.starsEnabled', e.target.checked)}
                className="w-5 h-5"
              />
              <label>تفعيل النجوم المتحركة</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                شفافية Overlay: {Math.round((localConfig.background?.overlayOpacity || 0.5) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localConfig.background?.overlayOpacity || 0.5}
                onChange={(e) => updateField('background.overlayOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
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
                  onChange={(e) => updateField('announcements.topBar.enabled', e.target.checked)}
                  className="w-5 h-5"
                />
                <h3 className="font-bold">📢 إعلان علوي</h3>
              </div>

              {localConfig.announcements?.topBar?.enabled && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="النص"
                    value={localConfig.announcements.topBar.text}
                    onChange={(e) => updateField('announcements.topBar.text', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                  <div>
  <label className="block text-sm font-medium mb-2">صورة Popup</label>

  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
    <input
      ref={popupInputRef}
      type="file"
      accept="image/*"
      onChange={handlePopupImageUpload}
      className="hidden"
    />

    {localConfig.announcements?.popup?.image ? (
      <div className="space-y-2">
        <img
          src={localConfig.announcements.popup.image}
          alt="Popup"
          className="max-h-32 mx-auto rounded-lg"
        />
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => popupInputRef.current?.click()}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
            disabled={uploadingPopup}
          >
            تغيير
          </button>
          <button
            type="button"
            onClick={() => updateField('announcements.popup.image', '')}
            className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm"
          >
            حذف
          </button>
        </div>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => popupInputRef.current?.click()}
        className="py-3 w-full"
        disabled={uploadingPopup}
      >
        {uploadingPopup ? (
          <FaSpinner className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
        ) : (
          <>
            <FaUpload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">رفع صورة</p>
          </>
        )}
      </button>
    )}
  </div>
</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">لون الخلفية</label>
                      <input
                        type="color"
                        value={localConfig.announcements.topBar.bgColor}
                        onChange={(e) => updateField('announcements.topBar.bgColor', e.target.value)}
                        className="w-full h-10 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm">لون النص</label>
                      <input
                        type="color"
                        value={localConfig.announcements.topBar.textColor}
                        onChange={(e) => updateField('announcements.topBar.textColor', e.target.value)}
                        className="w-full h-10 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Popup */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={localConfig.announcements?.popup?.enabled}
                  onChange={(e) => updateField('announcements.popup.enabled', e.target.checked)}
                  className="w-5 h-5"
                />
                <h3 className="font-bold">💬 Popup إعلاني</h3>
              </div>

              {localConfig.announcements?.popup?.enabled && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="العنوان"
                    value={localConfig.announcements.popup.title}
                    onChange={(e) => updateField('announcements.popup.title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                  <textarea
                    placeholder="الوصف"
                    value={localConfig.announcements.popup.description}
                    onChange={(e) => updateField('announcements.popup.description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="نص الزر"
                      value={localConfig.announcements.popup.ctaText}
                      onChange={(e) => updateField('announcements.popup.ctaText', e.target.value)}
                      className="px-3 py-2 rounded-lg border"
                    />
                    <input
                      type="text"
                      placeholder="رابط الزر"
                      value={localConfig.announcements.popup.ctaLink}
                      onChange={(e) => updateField('announcements.popup.ctaLink', e.target.value)}
                      className="px-3 py-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="text-sm">يظهر بعد (ms)</label>
                    <input
                      type="number"
                      value={localConfig.announcements.popup.showAfter}
                      onChange={(e) => updateField('announcements.popup.showAfter', parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border"
                    />
                  </div>
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
                onChange={(e) => updateField('liveStats.enabled', e.target.checked)}
                className="w-5 h-5"
              />
              <h2 className="text-xl font-bold">📊 تفعيل الإحصائيات المباشرة</h2>
            </div>

            {localConfig.liveStats?.enabled && (
              <div className="space-y-3">
                {(localConfig.liveStats.items || []).map((item: any, i: number) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <div className="grid grid-cols-3 gap-3">
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
                      <button
                        onClick={() => {
                          const items = localConfig.liveStats.items.filter((_: any, idx: number) => idx !== i);
                          updateField('liveStats.items', items);
                        }}
                        className="text-red-500"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const items = [...(localConfig.liveStats.items || [])];
                    items.push({ label: 'إحصائية', dynamicKey: 'users', color: '#7c3aed' });
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
                <div key={section.key} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <input
                    type="checkbox"
                    checked={localConfig.sections?.[section.key] || false}
                    onChange={(e) => updateField(`sections.${section.key}`, e.target.checked)}
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