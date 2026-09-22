// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import SplashScreen from '../components/common/SplashScreen';
import TopAnnouncementBar from '../components/sections/TopAnnouncementBar';
import Hero from '../components/sections/Hero';
import MidBanner from '../components/sections/MidBanner';
import MainSections from '../components/sections/MainSections';
import PopupModal from '../components/common/PopupModal';
import { usePortalConfig } from '../context/PortalConfigContext';

const Home: React.FC = () => {
  const { config, loading } = usePortalConfig();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // ✅ إذا كانت الإعدادات محمّلة
    if (!loading && config) {
      // SplashScreen معطّل
      if (config.splashScreen?.enabled === false) {
        setShowSplash(false);
        return;
      }

      const duration = config.splashScreen?.duration || 3500;
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [loading, config]);

  // ✅ لا تعرض شيئاً أثناء التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen
          text={config?.splashScreen?.text}
          bgColor={config?.splashScreen?.bgColor}
          logo={config?.splashScreen?.logo}
        />
      )}

      {/* إعلان علوي */}
      {config?.announcements?.topBar?.enabled && (
        <TopAnnouncementBar config={config.announcements.topBar} />
      )}

      {/* Hero الرئيسي */}
{React.createElement(Hero as React.ComponentType<{ config?: any }>, { config })}
      {/* إعلان بين الأقسام */}
      {config?.announcements?.midBanner?.enabled && (
        <MidBanner config={config.announcements.midBanner} />
      )}

      {/* الأقسام الرئيسية */}
      <MainSections />

      {/* Popup */}
      {config?.announcements?.popup?.enabled && (
        <PopupModal config={config.announcements.popup} />
      )}
    </>
  );
};

export default Home;