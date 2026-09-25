// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import SplashScreen from '../components/common/SplashScreen';
import TopAnnouncementBar from '../components/sections/TopAnnouncementBar';
import HeroRaw from '../components/sections/Hero';
const Hero = HeroRaw as React.ComponentType<{ config?: any; liveStats?: any }>;
import MidBanner from '../components/sections/MidBanner';
import MainSections from '../components/sections/MainSections';
import PopupModal from '../components/common/PopupModal';
import { usePortalConfig } from '../context/PortalConfigContext';

// ============================================================
// ✅ Error Boundary
// ============================================================
class HomeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('❌ Home Error Boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {this.state.message || 'يرجى إعادة تحميل الصفحة'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-bold hover:opacity-90 transition"
            >
              إعادة تحميل
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// ✅ Loading Screen
// ============================================================
const HomeLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
        <span className="text-2xl">✨</span>
      </div>
      <p className="text-gray-500 dark:text-gray-400">جاري التحميل...</p>
    </div>
  </div>
);

// ============================================================
// ✅ Error Screen
// ============================================================
const HomeError: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">🔌</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        تعذر تحميل الصفحة
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-bold hover:opacity-90 transition"
      >
        إعادة المحاولة
      </button>
    </div>
  </div>
);

// ============================================================
// ✅ Home Component (المحتوى الفعلي)
// ============================================================
const HomeContent: React.FC = () => {
  const { config, loading, error, refreshConfig, liveStats } =
    usePortalConfig();

  // ✅ splashShownRef — يمنع إعادة إظهار Splash
  const splashShownRef = useRef(false);
  const [showSplash, setShowSplash] = useState(true);

  // ✅ مؤقّت Splash
  useEffect(() => {
    // ⛔ لا تفعل شيئاً حتى ينتهي التحميل
    if (loading) return;

    // ⛔ إذا سبق عرضه، لا تُعِد
    if (splashShownRef.current) {
      setShowSplash(false);
      return;
    }

    // ⛔ إذا لا يوجد config (خطأ)، أخفِ Splash
    if (!config) {
      splashShownRef.current = true;
      setShowSplash(false);
      return;
    }

    // ✅ إذا كان Splash معطّلاً
    if (config.splashScreen?.enabled === false) {
      splashShownRef.current = true;
      setShowSplash(false);
      return;
    }

    // ✅ عرض Splash لمدة محددة
    const duration = config.splashScreen?.duration || 3500;
    const timer = setTimeout(() => {
      splashShownRef.current = true;
      setShowSplash(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [loading, config]);

  // ============================================================
  // ✅ حالة التحميل
  // ============================================================
  if (loading) {
    return <HomeLoading />;
  }

  // ============================================================
  // ✅ حالة الخطأ
  // ============================================================
  if (error && !config) {
    return <HomeError message={error} onRetry={refreshConfig} />;
  }

  // ============================================================
  // ✅ استخراج الإعلانات (DRY)
  // ============================================================
  const announcements = config?.announcements || {};

  // ============================================================
  // ✅ Render
  // ============================================================
  return (
    <>
      {/* ✅ Splash Screen */}
      {showSplash && (
        <SplashScreen
          text={config?.splashScreen?.text}
          bgColor={config?.splashScreen?.bgColor}
          logo={config?.splashScreen?.logo}
        />
      )}

      {/* ✅ إعلان علوي */}
      {announcements.topBar?.enabled && (
        <TopAnnouncementBar config={announcements.topBar} />
      )}

      {/* ✅ Hero */}
      <Hero config={config} liveStats={liveStats} />

      {/* ✅ إعلان بين الأقسام */}
      {announcements.midBanner?.enabled && (
        <MidBanner config={announcements.midBanner} />
      )}

      {/* ✅ الأقسام الرئيسية */}
      <MainSections />

      {/* ✅ Popup */}
      {announcements.popup?.enabled && (
        <PopupModal config={announcements.popup} />
      )}
    </>
  );
};

// ============================================================
// ✅ Main Export with ErrorBoundary
// ============================================================
const Home: React.FC = () => (
  <HomeErrorBoundary>
    <HomeContent />
  </HomeErrorBoundary>
);

export default Home;