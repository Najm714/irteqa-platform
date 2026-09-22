// src/components/sections/TopAnnouncementBar.tsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaBullhorn } from 'react-icons/fa';

const TopAnnouncementBar: React.FC<{ config: any }> = ({ config }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // ✅ التحقق من الجدولة
    const now = new Date();
    if (config.startDate && new Date(config.startDate) > now) return setVisible(false);
    if (config.endDate && new Date(config.endDate) < now) return setVisible(false);

    // ✅ التحقق من إغلاق سابق
    const dismissed = localStorage.getItem('topBarDismissed');
    if (dismissed === config.text) setVisible(false);
  }, [config]);

  const handleDismiss = () => {
    localStorage.setItem('topBarDismissed', config.text);
    setVisible(false);
  };

  if (!visible || !config.enabled) return null;

  return (
    <div
      className="top-announcement-bar"
      style={{
        background: config.bgColor,
        color: config.textColor,
      }}
    >
      <div className="container-custom">
        <div className="flex items-center justify-center gap-3 py-2 text-sm">
          <FaBullhorn className="flex-shrink-0" />
          {config.link ? (
            <a href={config.link} className="hover:underline font-medium">
              {config.text}
            </a>
          ) : (
            <span>{config.text}</span>
          )}
          {config.dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute left-4 p-1 hover:bg-white/10 rounded"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopAnnouncementBar;