// src/components/sections/MidBanner.tsx
import React, { useState, useEffect } from 'react';
import { FaBullhorn, FaTimes } from 'react-icons/fa';

const MidBanner: React.FC<{ config: any }> = ({ config }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const now = new Date();
    if (config.startDate && new Date(config.startDate) > now) return setVisible(false);
    if (config.endDate && new Date(config.endDate) < now) return setVisible(false);
  }, [config]);

  if (!visible) return null;

  return (
    <section className="mid-banner" style={{ background: config.bgColor }}>
      <div className="container-custom">
        <div className="mid-banner-content">
          {config.image && (
            <img src={config.image} alt={config.title} className="mid-banner-image" />
          )}
          <div className="mid-banner-text">
            <FaBullhorn className="mid-banner-icon" />
            <div>
              <h3 className="mid-banner-title">{config.title}</h3>
              <p className="mid-banner-description">{config.description}</p>
            </div>
          </div>
          {config.ctaText && (
            <a href={config.link} className="mid-banner-cta">
              {config.ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default MidBanner;