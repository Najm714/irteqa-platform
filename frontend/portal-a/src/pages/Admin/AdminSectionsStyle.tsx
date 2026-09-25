// src/pages/Admin/AdminSectionsStyle.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FaSave, FaEye, FaSpinner, FaCheckCircle, FaPalette,
  FaLayerGroup, FaImage, FaFont, FaMagic, FaRedo,
  FaUpload, FaTrash,
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
// ✅ Presets
// ============================================================
const PRESETS = [
  { id: 'default', name: '⭐ افتراضي', desc: 'بنفسجي كلاسيكي', colors: ['#7c3aed', '#ec4899'] },
  { id: 'dark', name: '🌙 داكن', desc: 'زجاجي بلمسة داكنة', colors: ['#a78bfa', '#f472b6'] },
  { id: 'light', name: '☀️ فاتح', desc: 'بسيط ومشرق', colors: ['#4f46e5', '#db2777'] },
  { id: 'minimal', name: '⚪ بسيط', desc: 'بدون زخارف', colors: ['#111827', '#374151'] },
  { id: 'vibrant', name: '🌈 حيوي', desc: 'ألوان جريئة', colors: ['#8b5cf6', '#ec4899', '#f59e0b'] },
  { id: 'ocean', name: '🌊 محيط', desc: 'أزرق سماوي', colors: ['#0891b2', '#06b6d4'] },
  { id: 'sunset', name: '🌅 غروب', desc: 'برتقالي دافئ', colors: ['#f97316', '#ef4444'] },
];

// ============================================================
// ✅ Types
// ============================================================
interface SectionsStyleConfig {
  header: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    alignment: 'right' | 'center' | 'left';
    showLine: boolean;
    showEyebrowDot: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    sectionBg: string;
    cardBg: string;
    cardBgDark: string;
    titleColor: string;
    titleColorDark: string;
    descriptionColor: string;
    descriptionColorDark: string;
    borderColor: string;
    borderColorDark: string;
    gradientStart: string;
    gradientEnd: string;
  };
  background: {
    type: 'none' | 'solid' | 'gradient' | 'image' | 'pattern';
    value: string;
    gradientColors: string[];
    opacity: number;
    pattern: 'dots' | 'lines' | 'grid' | 'waves' | 'circles' | 'none';
  };
  card: {
    style: 'elevated' | 'flat' | 'outlined' | 'gradient' | 'glass';
    borderRadius: number;
    shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hoverEffect: 'lift' | 'scale' | 'glow' | 'border' | 'none';
    borderWidth: number;
    padding: number;
  };
  layout: {
    gridColumns: number;
    gap: number;
    maxWidth: number;
    paddingVertical: number;
    showDecorCircles: boolean;
  };
  icons: {
    size: 'sm' | 'md' | 'lg' | 'xl';
    style: 'emoji' | 'circle' | 'square' | 'rounded';
    background: string;
  };
  typography: {
    titleSize: number;
    descriptionSize: number;
    fontFamily: string;
    titleWeight: number;
  };
  animations: {
    enabled: boolean;
    type: 'fade' | 'slide' | 'zoom' | 'none';
    duration: number;
    stagger: boolean;
  };
  preset: string;
}

// ============================================================
// ✅ Default Config
// ============================================================
const DEFAULT_CONFIG: SectionsStyleConfig = {
  header: {
    enabled: true,
    eyebrow: 'الخدمات الأكاديمية',
    title: 'الأقسام',
    titleHighlight: 'الرئيسية',
    description:
      'اختر القسم المناسب لاحتياجاتك واستكشف الخدمات المتخصصة المقدمة من منصة ارتقاء',
    alignment: 'center',
    showLine: true,
    showEyebrowDot: true,
  },
  colors: {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#a855f7',
    sectionBg: 'transparent',
    cardBg: '#ffffff',
    cardBgDark: '#111827',
    titleColor: '#111827',
    titleColorDark: '#f9fafb',
    descriptionColor: '#6b7280',
    descriptionColorDark: '#9ca3af',
    borderColor: '#e5e7eb',
    borderColorDark: '#374151',
    gradientStart: '#7c3aed',
    gradientEnd: '#ec4899',
  },
  background: {
    type: 'none',
    value: '',
    gradientColors: [],
    opacity: 1,
    pattern: 'none',
  },
  card: {
    style: 'elevated',
    borderRadius: 24,
    shadow: 'lg',
    hoverEffect: 'lift',
    borderWidth: 1,
    padding: 28,
  },
  layout: {
    gridColumns: 3,
    gap: 16,
    maxWidth: 1200,
    paddingVertical: 80,
    showDecorCircles: true,
  },
  icons: {
    size: 'md',
    style: 'rounded',
    background: 'gradient',
  },
  typography: {
    titleSize: 24,
    descriptionSize: 15,
    fontFamily: 'inherit',
    titleWeight: 800,
  },
  animations: {
    enabled: true,
    type: 'fade',
    duration: 500,
    stagger: true,
  },
  preset: 'default',
};

// ============================================================
// ✅ المكوّن الرئيسي
// ============================================================
const AdminSectionsStyle: React.FC = () => {
  const { token } = useAuth();
  const [config, setConfig] = useState<SectionsStyleConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preset');
  const [uploadingImage, setUploadingImage] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = resolvePortalId();
  const ENDPOINT = `${API_URL}/appearance/sections`;

  const getHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'X-Portal-Id': PORTAL_ID,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  // ============================================================
  // ✅ جلب الإعدادات
  // ============================================================
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(ENDPOINT, { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.success) {
        // ✅ Merge عميق مع DEFAULT_CONFIG لضمان اكتمال الحقول
        const merged: SectionsStyleConfig = {
          ...DEFAULT_CONFIG,
          ...data.data,
          header: { ...DEFAULT_CONFIG.header, ...(data.data?.header || {}) },
          colors: { ...DEFAULT_CONFIG.colors, ...(data.data?.colors || {}) },
          background: { ...DEFAULT_CONFIG.background, ...(data.data?.background || {}) },
          card: { ...DEFAULT_CONFIG.card, ...(data.data?.card || {}) },
          layout: { ...DEFAULT_CONFIG.layout, ...(data.data?.layout || {}) },
          icons: { ...DEFAULT_CONFIG.icons, ...(data.data?.icons || {}) },
          typography: { ...DEFAULT_CONFIG.typography, ...(data.data?.typography || {}) },
          animations: { ...DEFAULT_CONFIG.animations, ...(data.data?.animations || {}) },
        };
        setConfig(merged);
      } else {
        setError(data.message || 'فشل تحميل الإعدادات');
      }
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError(err.message || 'فشل التحميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // ✅ حفظ
  // ============================================================
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(data.message || 'فشل الحفظ');
      }
    } catch (err: any) {
      alert('❌ فشل الحفظ: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ✅ تطبيق Preset
  // ============================================================
  const handleApplyPreset = async (presetId: string) => {
    if (!confirm(`تطبيق القالب "${presetId}"؟ سيستبدل الإعدادات الحالية.`)) return;

    try {
      setSaving(true);
      const res = await fetch(`${ENDPOINT}/preset/${presetId}`, {
        method: 'POST',
        headers: getHeaders(),
      });

      const data = await res.json();
      if (data.success) {
        const merged: SectionsStyleConfig = {
          ...DEFAULT_CONFIG,
          ...data.data,
          header: { ...DEFAULT_CONFIG.header, ...(data.data?.header || {}) },
          colors: { ...DEFAULT_CONFIG.colors, ...(data.data?.colors || {}) },
          background: { ...DEFAULT_CONFIG.background, ...(data.data?.background || {}) },
          card: { ...DEFAULT_CONFIG.card, ...(data.data?.card || {}) },
          layout: { ...DEFAULT_CONFIG.layout, ...(data.data?.layout || {}) },
          icons: { ...DEFAULT_CONFIG.icons, ...(data.data?.icons || {}) },
          typography: { ...DEFAULT_CONFIG.typography, ...(data.data?.typography || {}) },
          animations: { ...DEFAULT_CONFIG.animations, ...(data.data?.animations || {}) },
        };
        setConfig(merged);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert('❌ فشل تطبيق القالب: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ✅ إعادة تعيين
  // ============================================================
  const handleReset = async () => {
    if (!confirm('⚠️ سيتم حذف كل الإعدادات المخصصة والعودة للافتراضي. متابعة؟')) return;

    try {
      setSaving(true);
      const res = await fetch(`${ENDPOINT}/reset`, {
        method: 'POST',
        headers: getHeaders(),
      });

      const data = await res.json();
      if (data.success) {
        setConfig(DEFAULT_CONFIG);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert('❌ فشل إعادة التعيين: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ✅ رفع صورة الخلفية
  // ============================================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'sections-bg');

      const res = await fetch(`${API_URL}/appearance/hero/upload`, {
        method: 'POST',
        headers: {
          'X-Portal-Id': PORTAL_ID,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      console.log('📤 Upload response:', data);

      if (!data.success) throw new Error(data.message);

      // ✅ استخدم setConfig مع spread — أضمن من updateField
      setConfig((prev) => ({
        ...prev,
        background: {
          ...prev.background,
          type: 'image',
          value: data.data.url,
        },
      }));

      console.log('✅ Image set:', data.data.url);
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      alert('❌ فشل الرفع: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // ============================================================
  // ✅ تحديث حقل — مع setConfig((prev) => ...) (أضمن)
  // ============================================================
  const updateField = (path: string, value: any) => {
    setConfig((prev) => {
      const keys = path.split('.');
      // ✅ Deep clone ذكي
      const newConfig: any = JSON.parse(JSON.stringify(prev));
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  // ============================================================
  // ✅ Loading
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  // ============================================================
  // ✅ Tabs
  // ============================================================
  const tabs = [
    { id: 'preset', label: '✨ القوالب' },
    { id: 'header', label: '📝 العنوان' },
    { id: 'colors', label: '🎨 الألوان' },
    { id: 'background', label: '🖼️ الخلفية' },
    { id: 'card', label: '🃏 البطاقات' },
    { id: 'layout', label: '📐 التخطيط' },
    { id: 'icons', label: '⭐ الأيقونات' },
    { id: 'typography', label: '🅰️ الخطوط' },
    { id: 'animations', label: '🎬 الحركات' },
  ];

  // ============================================================
  // ✅ Render
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🎨 تخصيص الأقسام الرئيسية
          </h1>
          <p className="text-gray-500 mt-1">
            التحكم الكامل في الألوان والخلفيات والبطاقات
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <FaEye /> معاينة
          </button>

          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium flex items-center gap-2 hover:bg-red-200 transition disabled:opacity-50"
          >
            <FaRedo /> إعادة تعيين
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      {/* Success */}
      {saveSuccess && (
        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-2">
          <FaCheckCircle /> تم الحفظ بنجاح!
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6">
          ⚠️ {error}
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
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        {/* ================================================
            Preset Tab
        ================================================ */}
        {activeTab === 'preset' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">🎨 قوالب جاهزة</h2>
              <p className="text-sm text-gray-500 mb-6">
                اختر قالباً جاهزاً وطبّقه بضغطة واحدة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  disabled={saving}
                  className={`p-4 rounded-xl border-2 text-right transition hover:shadow-lg disabled:opacity-50 ${
                    config.preset === preset.id
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex gap-1">
                      {preset.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                    {config.preset === preset.id && (
                      <FaCheckCircle className="text-purple-600" />
                    )}
                  </div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {preset.name}
                  </div>
                  <div className="text-sm text-gray-500">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================================================
            Header Tab
        ================================================ */}
        {activeTab === 'header' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">📝 عنوان القسم</h2>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.header.enabled}
                onChange={(e) => updateField('header.enabled', e.target.checked)}
                className="w-5 h-5"
              />
              <label>تفعيل العنوان</label>
            </div>

            {config.header.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Eyebrow</label>
                    <input
                      type="text"
                      value={config.header.eyebrow}
                      onChange={(e) => updateField('header.eyebrow', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">المحاذاة</label>
                    <select
                      value={config.header.alignment}
                      onChange={(e) => updateField('header.alignment', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                    >
                      <option value="right">يمين</option>
                      <option value="center">وسط</option>
                      <option value="left">يسار</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">العنوان</label>
                    <input
                      type="text"
                      value={config.header.title}
                      onChange={(e) => updateField('header.title', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">الكلمة المميزة</label>
                    <input
                      type="text"
                      value={config.header.titleHighlight}
                      onChange={(e) =>
                        updateField('header.titleHighlight', e.target.value)
                      }
                      className="w-full px-4 py-2 rounded-lg border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الوصف</label>
                  <textarea
                    rows={3}
                    value={config.header.description}
                    onChange={(e) => updateField('header.description', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border"
                  />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.header.showLine}
                      onChange={(e) => updateField('header.showLine', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">إظهار الخط الزخرفي</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.header.showEyebrowDot}
                      onChange={(e) =>
                        updateField('header.showEyebrowDot', e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">إظهار النقطة الزخرفية</span>
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================================================
            Colors Tab
        ================================================ */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">🎨 الألوان</h2>

            <div>
              <h3 className="font-bold mb-3 text-gray-700 dark:text-gray-300">
                الألوان الأساسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'primary', label: 'اللون الأساسي' },
                  { key: 'secondary', label: 'اللون الثانوي' },
                  { key: 'accent', label: 'لون التمييز' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2">{label}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-gray-700 dark:text-gray-300">
                التدرجات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'gradientStart', label: 'بداية التدرج' },
                  { key: 'gradientEnd', label: 'نهاية التدرج' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2">{label}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="h-12 rounded-lg mt-2"
                style={{
                  background: `linear-gradient(135deg, ${config.colors.gradientStart}, ${config.colors.gradientEnd})`,
                }}
              />
            </div>

            <div>
              <h3 className="font-bold mb-3 text-gray-700 dark:text-gray-300">
                البطاقات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'cardBg', label: 'خلفية البطاقة (فاتح)' },
                  { key: 'cardBgDark', label: 'خلفية البطاقة (داكن)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2">{label}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-gray-700 dark:text-gray-300">
                النصوص
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'titleColor', label: 'لون العنوان (فاتح)' },
                  { key: 'titleColorDark', label: 'لون العنوان (داكن)' },
                  { key: 'descriptionColor', label: 'لون الوصف (فاتح)' },
                  { key: 'descriptionColorDark', label: 'لون الوصف (داكن)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2">{label}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-gray-700 dark:text-gray-300">
                الحدود
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'borderColor', label: 'لون الحدود (فاتح)' },
                  { key: 'borderColorDark', label: 'لون الحدود (داكن)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2">{label}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateField(`colors.${key}`, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================
            Background Tab
        ================================================ */}
        {activeTab === 'background' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">🖼️ خلفية القسم</h2>

            <div>
              <label className="block text-sm font-medium mb-2">نوع الخلفية</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { id: 'none', label: '⚪ بدون' },
                  { id: 'solid', label: '🎨 لون صلب' },
                  { id: 'gradient', label: '🌈 تدرج' },
                  { id: 'image', label: '🖼️ صورة' },
                  { id: 'pattern', label: '🔷 نمط' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateField('background.type', t.id)}
                    className={`p-3 rounded-lg border-2 ${
                      config.background.type === t.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Solid */}
            {config.background.type === 'solid' && (
              <div>
                <label className="block text-sm font-medium mb-2">اللون</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.background.value || '#ffffff'}
                    onChange={(e) => updateField('background.value', e.target.value)}
                    className="w-20 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.background.value || '#ffffff'}
                    onChange={(e) => updateField('background.value', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Gradient */}
            {config.background.type === 'gradient' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  ألوان التدرج (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  placeholder="#7c3aed, #ec4899, #f59e0b"
                  value={(config.background.gradientColors || []).join(', ')}
                  onChange={(e) =>
                    updateField(
                      'background.gradientColors',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full px-4 py-2 rounded-lg border font-mono text-sm"
                />
                {config.background.gradientColors?.length > 1 && (
                  <div
                    className="h-16 rounded-lg mt-3"
                    style={{
                      background: `linear-gradient(135deg, ${config.background.gradientColors.join(', ')})`,
                    }}
                  />
                )}
              </div>
            )}

            {/* Image */}
            {config.background.type === 'image' && (
              <div>
                <label className="block text-sm font-medium mb-2">صورة الخلفية</label>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
                  {config.background.value ? (
                    <div className="space-y-3">
                      <img
                        src={config.background.value}
                        alt="Background"
                        className="max-h-48 mx-auto rounded-lg shadow-lg"
                        onError={(e) => {
                          console.error('❌ Failed to load image:', config.background.value);
                        }}
                      />
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
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
                      disabled={uploadingImage}
                      className="py-4 w-full"
                    >
                      {uploadingImage ? (
                        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                      ) : (
                        <>
                          <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            اضغط لرفع صورة من جهازك
                          </p>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Pattern */}
            {config.background.type === 'pattern' && (
              <div>
                <label className="block text-sm font-medium mb-2">النمط</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {['none', 'dots', 'lines', 'grid', 'waves', 'circles'].map(
                    (pattern) => (
                      <button
                        key={pattern}
                        onClick={() => updateField('background.pattern', pattern)}
                        className={`p-3 rounded-lg border-2 ${
                          config.background.pattern === pattern
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {pattern}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium mb-2">
                الشفافية: {Math.round(config.background.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.background.opacity}
                onChange={(e) =>
                  updateField('background.opacity', parseFloat(e.target.value))
                }
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* ================================================
            Card Tab
        ================================================ */}
        {activeTab === 'card' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">🃏 نمط البطاقات</h2>

            <div>
              <label className="block text-sm font-medium mb-2">نمط البطاقة</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { id: 'elevated', label: '🎈 مرتفع' },
                  { id: 'flat', label: '▫️ مسطح' },
                  { id: 'outlined', label: '🔲 محدّد' },
                  { id: 'gradient', label: '🌈 تدرج' },
                  { id: 'glass', label: '💎 زجاجي' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateField('card.style', s.id)}
                    className={`p-3 rounded-lg border-2 ${
                      config.card.style === s.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  الحواف: {config.card.borderRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={config.card.borderRadius}
                  onChange={(e) =>
                    updateField('card.borderRadius', parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  سماكة الحدود: {config.card.borderWidth}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={config.card.borderWidth}
                  onChange={(e) =>
                    updateField('card.borderWidth', parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">الظل</label>
                <select
                  value={config.card.shadow}
                  onChange={(e) => updateField('card.shadow', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border"
                >
                  <option value="none">بدون</option>
                  <option value="sm">صغير</option>
                  <option value="md">متوسط</option>
                  <option value="lg">كبير</option>
                  <option value="xl">ضخم</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  تأثير Hover
                </label>
                <select
                  value={config.card.hoverEffect}
                  onChange={(e) =>
                    updateField('card.hoverEffect', e.target.value)
                  }
                  className="w-full px-4 py-2 rounded-lg border"
                >
                  <option value="lift">ارتفاع</option>
                  <option value="scale">تكبير</option>
                  <option value="glow">توهج</option>
                  <option value="border">حدود ملونة</option>
                  <option value="none">بدون</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                الحشو الداخلي: {config.card.padding}px
              </label>
              <input
                type="range"
                min="12"
                max="64"
                value={config.card.padding}
                onChange={(e) =>
                  updateField('card.padding', parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* ================================================
            Layout Tab
        ================================================ */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">📐 التخطيط</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                عدد الأعمدة: {config.layout.gridColumns}
              </label>
              <input
                type="range"
                min="1"
                max="4"
                value={config.layout.gridColumns}
                onChange={(e) =>
                  updateField('layout.gridColumns', parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                المسافة بين البطاقات: {config.layout.gap}px
              </label>
              <input
                type="range"
                min="0"
                max="64"
                value={config.layout.gap}
                onChange={(e) =>
                  updateField('layout.gap', parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                العرض الأقصى: {config.layout.maxWidth}px
              </label>
              <input
                type="range"
                min="800"
                max="1600"
                step="50"
                value={config.layout.maxWidth}
                onChange={(e) =>
                  updateField('layout.maxWidth', parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                الحشو العمودي: {config.layout.paddingVertical}px
              </label>
              <input
                type="range"
                min="40"
                max="200"
                step="10"
                value={config.layout.paddingVertical}
                onChange={(e) =>
                  updateField('layout.paddingVertical', parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.layout.showDecorCircles}
                onChange={(e) =>
                  updateField('layout.showDecorCircles', e.target.checked)
                }
                className="w-4 h-4"
              />
              <span className="text-sm">إظهار الدوائر الزخرفية</span>
            </label>
          </div>
        )}

        {/* ================================================
            Icons Tab
        ================================================ */}
        {activeTab === 'icons' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">⭐ الأيقونات</h2>

            <div>
              <label className="block text-sm font-medium mb-2">الحجم</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'sm', label: 'صغير (48)' },
                  { id: 'md', label: 'متوسط (58)' },
                  { id: 'lg', label: 'كبير (68)' },
                  { id: 'xl', label: 'ضخم (80)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateField('icons.size', s.id)}
                    className={`p-3 rounded-lg border-2 ${
                      config.icons.size === s.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">النمط</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'emoji', label: '😀 Emoji' },
                  { id: 'circle', label: '⭕ دائري' },
                  { id: 'square', label: '⬛ مربع' },
                  { id: 'rounded', label: '▢ مستدير' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateField('icons.style', s.id)}
                    className={`p-3 rounded-lg border-2 ${
                      config.icons.style === s.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================
            Typography Tab
        ================================================ */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">🅰️ الخطوط</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                حجم العنوان: {config.typography.titleSize}px
              </label>
              <input
                type="range"
                min="16"
                max="48"
                value={config.typography.titleSize}
                onChange={(e) =>
                  updateField('typography.titleSize', parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                حجم الوصف: {config.typography.descriptionSize}px
              </label>
              <input
                type="range"
                min="12"
                max="24"
                value={config.typography.descriptionSize}
                onChange={(e) =>
                  updateField(
                    'typography.descriptionSize',
                    parseInt(e.target.value)
                  )
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                سماكة العنوان: {config.typography.titleWeight}
              </label>
              <input
                type="range"
                min="400"
                max="900"
                step="100"
                value={config.typography.titleWeight}
                onChange={(e) =>
                  updateField('typography.titleWeight', parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                عائلة الخط
              </label>
              <select
                value={config.typography.fontFamily}
                onChange={(e) =>
                  updateField('typography.fontFamily', e.target.value)
                }
                className="w-full px-4 py-2 rounded-lg border"
              >
                <option value="inherit">افتراضي</option>
                <option value="Tajawal, sans-serif">Tajawal</option>
                <option value="Cairo, sans-serif">Cairo</option>
                <option value="Almarai, sans-serif">Almarai</option>
                <option value="IBM Plex Sans Arabic, sans-serif">
                  IBM Plex Sans Arabic
                </option>
              </select>
            </div>
          </div>
        )}

        {/* ================================================
            Animations Tab
        ================================================ */}
        {activeTab === 'animations' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">🎬 الحركات</h2>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.animations.enabled}
                onChange={(e) =>
                  updateField('animations.enabled', e.target.checked)
                }
                className="w-5 h-5"
              />
              <span>تفعيل الحركات</span>
            </label>

            {config.animations.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    نوع الحركة
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'fade', label: '🌫️ ظهور' },
                      { id: 'slide', label: '👉 انزلاق' },
                      { id: 'zoom', label: '🔍 تكبير' },
                      { id: 'none', label: '⬜ بدون' },
                    ].map((a) => (
                      <button
                        key={a.id}
                        onClick={() => updateField('animations.type', a.id)}
                        className={`p-3 rounded-lg border-2 ${
                          config.animations.type === a.id
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    المدة: {config.animations.duration}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={config.animations.duration}
                    onChange={(e) =>
                      updateField(
                        'animations.duration',
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.animations.stagger}
                    onChange={(e) =>
                      updateField('animations.stagger', e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    تأخير تدريجي بين البطاقات (Stagger)
                  </span>
                </label>
              </>
            )}
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FaEye className="text-purple-600" /> معاينة مباشرة
        </h3>

        <div
          className="rounded-xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700"
          style={{
            background:
              config.background.type === 'solid'
                ? config.background.value
                : config.background.type === 'gradient' &&
                  config.background.gradientColors?.length >= 2
                ? `linear-gradient(135deg, ${config.background.gradientColors.join(', ')})`
                : config.background.type === 'image' && config.background.value
                ? `url("${config.background.value}") center/cover no-repeat`
                : 'transparent',
            maxWidth: config.layout.maxWidth,
            margin: '0 auto',
            padding: `${config.layout.paddingVertical * 0.3}px 20px`,
          }}
        >
          {/* Header Preview */}
          {config.header.enabled && (
            <div
              className={`mb-6 text-${config.header.alignment === 'right' ? 'right' : config.header.alignment === 'left' ? 'left' : 'center'}`}
            >
              <span
                className="inline-flex items-center gap-2 text-sm font-bold mb-2"
                style={{ color: config.colors.primary }}
              >
                {config.header.showEyebrowDot && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: config.colors.accent }}
                  />
                )}
                {config.header.eyebrow}
              </span>
              <h3
                style={{
                  color: config.colors.titleColor,
                  fontSize: config.typography.titleSize,
                  fontWeight: config.typography.titleWeight,
                }}
              >
                {config.header.title}{' '}
                <span
                  style={{
                    background: `linear-gradient(135deg, ${config.colors.gradientStart}, ${config.colors.gradientEnd})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {config.header.titleHighlight}
                </span>
              </h3>
              <p
                className="text-sm mt-2"
                style={{ color: config.colors.descriptionColor }}
              >
                {config.header.description}
              </p>
            </div>
          )}

          {/* Cards Preview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${config.layout.gridColumns}, minmax(0, 1fr))`,
              gap: `${config.layout.gap}px`,
            }}
          >
            {[1, 2, 3].slice(0, config.layout.gridColumns).map((i) => (
              <div
                key={i}
                className={
                  config.card.style === 'gradient' ? 'ms-card-gradient' : ''
                }
                style={{
                  background:
                    config.card.style === 'gradient'
                      ? `linear-gradient(135deg, ${config.colors.gradientStart}, ${config.colors.gradientEnd})`
                      : config.card.style === 'glass'
                      ? 'rgba(255,255,255,0.1)'
                      : config.colors.cardBg,
                  borderRadius: config.card.borderRadius,
                  border: `${config.card.borderWidth}px solid ${config.colors.borderColor}`,
                  padding: config.card.padding,
                  boxShadow:
                    config.card.shadow === 'none'
                      ? 'none'
                      : config.card.shadow === 'lg'
                      ? '0 10px 35px rgba(17,24,39,0.06)'
                      : '0 2px 8px rgba(0,0,0,0.05)',
                  color: config.colors.titleColor,
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${config.colors.primary}20, ${config.colors.secondary}20)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    marginBottom: 16,
                  }}
                >
                  📚
                </div>
                <h4
                  style={{
                    fontSize: config.typography.titleSize * 0.75,
                    fontWeight: config.typography.titleWeight,
                    color:
                      config.card.style === 'gradient' ? 'white' : config.colors.titleColor,
                  }}
                >
                  بطاقة {i}
                </h4>
                <p
                  style={{
                    fontSize: config.typography.descriptionSize,
                    color:
                      config.card.style === 'gradient'
                        ? 'rgba(255,255,255,0.85)'
                        : config.colors.descriptionColor,
                    marginTop: 8,
                  }}
                >
                  وصف تجريبي للبطاقة
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSectionsStyle;