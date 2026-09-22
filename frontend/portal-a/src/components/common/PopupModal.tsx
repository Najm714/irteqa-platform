// src/components/common/PopupModal.tsx
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const PopupModal: React.FC<{ config: any }> = ({ config }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!config.enabled) return;

    // ✅ التحقق من الجدولة
    const now = new Date();
    if (config.startDate && new Date(config.startDate) > now) return;
    if (config.endDate && new Date(config.endDate) < now) return;

    // ✅ التحقق من showOnce
    if (config.showOnce) {
      const seen = localStorage.getItem('popupSeen');
      if (seen === config.title) return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, config.showAfter || 5000);

    return () => clearTimeout(timer);
  }, [config]);

  const handleClose = () => {
    if (config.showOnce) {
      localStorage.setItem('popupSeen', config.title);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="popup-overlay" onClick={handleClose}>
      <div
        className="popup-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: config.bgColor,
          color: config.textColor,
        }}
      >
        <button onClick={handleClose} className="popup-close">
          <FaTimes />
        </button>

        {config.image && (
          <img src={config.image} alt={config.title} className="popup-image" />
        )}

        <h3 className="popup-title">{config.title}</h3>
        <p className="popup-description">{config.description}</p>

        {config.ctaText && (
          <a href={config.ctaLink} className="popup-cta">
            {config.ctaText}
          </a>
        )}
      </div>
    </div>
  );
};

export default PopupModal;