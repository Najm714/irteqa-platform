// frontend/portal-a/src/pages/Specialist/SpecialistSettings.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner, FaBell, FaLock, FaGlobe, FaSave, FaCheckCircle, FaTimesCircle, FaMoon, FaSun, FaLanguage } from 'react-icons/fa';

interface Settings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  twoFactorAuth: boolean;
  language: string;
  theme: string;
}

const SpecialistSettings: React.FC = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    twoFactorAuth: false,
    language: 'ar',
    theme: 'auto',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/auth/settings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '✅ تم حفظ الإعدادات بنجاح!' });
        // ✅ تطبيق المظهر فوراً
        applyTheme(settings.theme);
      } else {
        setMessage({ type: 'error', text: data.message || 'حدث خطأ في حفظ الإعدادات' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  // ✅ دالة تطبيق المظهر
  const applyTheme = (theme: string) => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'light') {
      html.classList.remove('dark');
    } else {
      // auto - يعتمد على إعدادات النظام
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  };

  // ✅ تطبيق المظهر عند تحميل الصفحة
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // ✅ إعادة تعيين الإعدادات إلى الافتراضية
  const resetToDefault = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات إلى الافتراضية؟')) {
      setSettings({
        emailNotifications: true,
        pushNotifications: true,
        orderUpdates: true,
        promotionalEmails: false,
        twoFactorAuth: false,
        language: 'ar',
        theme: 'auto',
      });
      setMessage({ type: 'success', text: '✅ تم إعادة تعيين الإعدادات إلى الافتراضية' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">⚙️ الإعدادات</h3>
        <button
          type="button"
          onClick={resetToDefault}
          className="text-sm text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition"
        >
          إعادة تعيين
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <FaCheckCircle className="w-5 h-5" />
          ) : (
            <FaTimesCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* الإشعارات */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaBell className="text-purple-600" />
            الإشعارات
          </h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">📧 إشعارات البريد الإلكتروني</span>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">📱 إشعارات التطبيق</span>
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">📦 تحديثات الطلبات</span>
              <input
                type="checkbox"
                checked={settings.orderUpdates}
                onChange={(e) => setSettings({ ...settings, orderUpdates: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">📨 رسائل ترويجية</span>
              <input
                type="checkbox"
                checked={settings.promotionalEmails}
                onChange={(e) => setSettings({ ...settings, promotionalEmails: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* الأمان */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaLock className="text-purple-600" />
            الأمان
          </h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">
                🔐 المصادقة الثنائية (2FA)
                <span className="text-xs text-gray-400 mr-2">(توصية أمنية)</span>
              </span>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* التفضيلات */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaGlobe className="text-purple-600" />
            التفضيلات
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                <FaLanguage />
                اللغة
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              >
                <option value="ar">🇸🇦 العربية</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                {settings.theme === 'dark' ? <FaMoon /> : settings.theme === 'light' ? <FaSun /> : <FaGlobe />}
                المظهر
              </label>
              <select
                value={settings.theme}
                onChange={(e) => {
                  const newTheme = e.target.value;
                  setSettings({ ...settings, theme: newTheme });
                  applyTheme(newTheme);
                }}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              >
                <option value="auto">🔄 تلقائي (حسب النظام)</option>
                <option value="light">☀️ فاتح</option>
                <option value="dark">🌙 داكن</option>
              </select>
            </div>
          </div>
        </div>

        {/* أزرار الحفظ */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SpecialistSettings;