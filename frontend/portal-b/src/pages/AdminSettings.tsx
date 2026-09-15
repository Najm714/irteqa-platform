// frontend/portal-a/src/pages/AdminSettings.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaCog, FaSave, FaSpinner, FaExclamationCircle,
  FaGlobe, FaPalette, FaLock,
  FaCreditCard, FaBell, FaBook,
} from 'react-icons/fa';

interface Settings {
  general: {
    siteName: string;
    siteNameAr: string;
    siteDescription: string;
    siteDescriptionAr: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    addressAr: string;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    darkMode: boolean;
  };
  auth: {
    registrationEnabled: boolean;
    requireEmailVerification: boolean;
    defaultRole: string;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  payment: {
    enabled: boolean;
    currency: string;
    stripeEnabled: boolean;
    paytabsEnabled: boolean;
    manualPaymentEnabled: boolean;
  };
  content: {
    enableVideos: boolean;
    enableSummaries: boolean;
    maxVideoSize: number;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    newRequest: boolean;
    requestUpdate: boolean;
    paymentReceived: boolean;
    newMessage: boolean;
  };
  system: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maintenanceMessageAr: string;
    debugMode: boolean;
  };
}

const AdminSettings: React.FC = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    fetchSettings();
  }, []);

  
  const fetchSettings = async () => {
    try {
      setLoading(true);
const response = await fetch(`${API_URL}/admin/settings`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Portal-Id': PORTAL_ID,
  },
});
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الإعدادات');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/admin/settings`, {
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
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || 'حدث خطأ في حفظ الإعدادات');
      }
    } catch (err) {
      setError('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof Settings, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  const sections = [
    { id: 'general', label: '🌐 عام', icon: <FaGlobe /> },
    { id: 'appearance', label: '🎨 المظهر', icon: <FaPalette /> },
    { id: 'auth', label: '🔐 المصادقة', icon: <FaLock /> },
    { id: 'payment', label: '💳 الدفع', icon: <FaCreditCard /> },
    { id: 'content', label: '📚 المحتوى', icon: <FaBook /> },
    { id: 'notifications', label: '🔔 الإشعارات', icon: <FaBell /> },
    { id: 'system', label: '⚙️ النظام', icon: <FaCog /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaExclamationCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">لا توجد إعدادات</p>
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
              إعدادات النظام
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة إعدادات المنصة
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>

        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-xl border border-green-400 mb-6">
            ✅ تم حفظ الإعدادات بنجاح
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6">
            <FaExclamationCircle className="inline ml-2" />
            {error}
          </div>
        )}

        {/* Sections */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-20">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full px-4 py-3 text-right flex items-center gap-3 transition ${
                    activeSection === section.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-r-4 border-purple-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {section.icon}
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              {activeSection === 'general' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">🌐 الإعدادات العامة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        اسم الموقع (عربي)
                      </label>
                      <input
                        type="text"
                        value={settings.general.siteNameAr || ''}
                        onChange={(e) => updateSetting('general', 'siteNameAr', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        اسم الموقع (إنجليزي)
                      </label>
                      <input
                        type="text"
                        value={settings.general.siteName || ''}
                        onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        وصف الموقع (عربي)
                      </label>
                      <textarea
                        value={settings.general.siteDescriptionAr || ''}
                        onChange={(e) => updateSetting('general', 'siteDescriptionAr', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        وصف الموقع (إنجليزي)
                      </label>
                      <textarea
                        value={settings.general.siteDescription || ''}
                        onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        البريد الإلكتروني للتواصل
                      </label>
                      <input
                        type="email"
                        value={settings.general.contactEmail || ''}
                        onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        رقم الهاتف
                      </label>
                      <input
                        type="text"
                        value={settings.general.contactPhone || ''}
                        onChange={(e) => updateSetting('general', 'contactPhone', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">🎨 المظهر</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        اللون الأساسي
                      </label>
                      <input
                        type="color"
                        value={settings.appearance.primaryColor || '#7C3AED'}
                        onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
                        className="w-full h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        اللون الثانوي
                      </label>
                      <input
                        type="color"
                        value={settings.appearance.secondaryColor || '#6D28D9'}
                        onChange={(e) => updateSetting('appearance', 'secondaryColor', e.target.value)}
                        className="w-full h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        لون الإبراز
                      </label>
                      <input
                        type="color"
                        value={settings.appearance.accentColor || '#F59E0B'}
                        onChange={(e) => updateSetting('appearance', 'accentColor', e.target.value)}
                        className="w-full h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.appearance.darkMode || false}
                        onChange={(e) => updateSetting('appearance', 'darkMode', e.target.checked)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">تفعيل الوضع الداكن</span>
                    </label>
                  </div>
                </div>
              )}

              {activeSection === 'auth' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">🔐 المصادقة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الدور الافتراضي
                      </label>
                      <select
                        value={settings.auth.defaultRole || 'customer'}
                        onChange={(e) => updateSetting('auth', 'defaultRole', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      >
                        <option value="customer">عميل</option>
                        <option value="specialist">مختص</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الحد الأقصى لمحاولات الدخول
                      </label>
                      <input
                        type="number"
                        value={settings.auth.maxLoginAttempts || 5}
                        onChange={(e) => updateSetting('auth', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        مدة الحظر (دقائق)
                      </label>
                      <input
                        type="number"
                        value={settings.auth.lockoutDuration || 30}
                        onChange={(e) => updateSetting('auth', 'lockoutDuration', parseInt(e.target.value) || 30)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.auth.registrationEnabled !== false}
                          onChange={(e) => updateSetting('auth', 'registrationEnabled', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">تفعيل التسجيل</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.auth.requireEmailVerification !== false}
                          onChange={(e) => updateSetting('auth', 'requireEmailVerification', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">طلب تأكيد البريد الإلكتروني</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'payment' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">💳 الدفع</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        العملة
                      </label>
                      <select
                        value={settings.payment.currency || 'SAR'}
                        onChange={(e) => updateSetting('payment', 'currency', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                      >
                        <option value="SAR">ريال سعودي (SAR)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                        <option value="EUR">يورو (EUR)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.payment.enabled !== false}
                          onChange={(e) => updateSetting('payment', 'enabled', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">تفعيل الدفع</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.payment.manualPaymentEnabled !== false}
                          onChange={(e) => updateSetting('payment', 'manualPaymentEnabled', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">الدفع اليدوي</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'content' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">📚 المحتوى</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الحد الأقصى لحجم الفيديو (ميجابايت)
                      </label>
                      <input
                        type="number"
                        value={settings.content.maxVideoSize || 500}
                        onChange={(e) => updateSetting('content', 'maxVideoSize', parseInt(e.target.value) || 500)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الحد الأقصى لحجم الملف (ميجابايت)
                      </label>
                      <input
                        type="number"
                        value={settings.content.maxFileSize || 50}
                        onChange={(e) => updateSetting('content', 'maxFileSize', parseInt(e.target.value) || 50)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        min="1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        أنواع الملفات المسموحة (افصل بينها بفاصلة)
                      </label>
                      <input
                        type="text"
                        value={(settings.content.allowedFileTypes || []).join(', ')}
                        onChange={(e) => updateSetting('content', 'allowedFileTypes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                        placeholder="pdf, doc, docx, jpg, png"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.content.enableVideos !== false}
                          onChange={(e) => updateSetting('content', 'enableVideos', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">تفعيل الفيديوهات</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.content.enableSummaries !== false}
                          onChange={(e) => updateSetting('content', 'enableSummaries', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">تفعيل الملخصات</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">🔔 الإشعارات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailEnabled !== false}
                          onChange={(e) => updateSetting('notifications', 'emailEnabled', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">إشعارات البريد الإلكتروني</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notifications.pushEnabled !== false}
                          onChange={(e) => updateSetting('notifications', 'pushEnabled', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">إشعارات فورية</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notifications.newRequest !== false}
                          onChange={(e) => updateSetting('notifications', 'newRequest', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">طلب جديد</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notifications.requestUpdate !== false}
                          onChange={(e) => updateSetting('notifications', 'requestUpdate', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">تحديث الطلب</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notifications.paymentReceived !== false}
                          onChange={(e) => updateSetting('notifications', 'paymentReceived', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">استلام دفعة</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.notifications.newMessage !== false}
                          onChange={(e) => updateSetting('notifications', 'newMessage', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">رسالة جديدة</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'system' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">⚙️ النظام</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.system.maintenanceMode || false}
                          onChange={(e) => updateSetting('system', 'maintenanceMode', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">وضع الصيانة</span>
                      </label>
                    </div>
                    {settings.system.maintenanceMode && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            رسالة الصيانة (عربي)
                          </label>
                          <textarea
                            value={settings.system.maintenanceMessageAr || ''}
                            onChange={(e) => updateSetting('system', 'maintenanceMessageAr', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            رسالة الصيانة (إنجليزي)
                          </label>
                          <textarea
                            value={settings.system.maintenanceMessage || ''}
                            onChange={(e) => updateSetting('system', 'maintenanceMessage', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.system.debugMode || false}
                          onChange={(e) => updateSetting('system', 'debugMode', e.target.checked)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">وضع التصحيح (Debug Mode)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;