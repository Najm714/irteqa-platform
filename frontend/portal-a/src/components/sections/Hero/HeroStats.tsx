// src/components/sections/Hero/HeroStats.tsx
import React from 'react';

interface HeroStatsProps {
  config?: any;
  liveStats?: any;
}

const HeroStats: React.FC<HeroStatsProps> = ({ config, liveStats }) => {
  const statsConfig = config?.liveStats;
  if (!statsConfig?.enabled || !statsConfig.items?.length) return null;

  const getValue = (item: any) => {
    if (item.isDynamic && liveStats) {
      return liveStats[item.dynamicKey] ?? item.staticValue ?? '0';
    }
    return item.staticValue || '0';
  };

  const items = [...statsConfig.items].sort(
    (a: any, b: any) => (a.order || 0) - (b.order || 0)
  );

  return (
    <div className="hero-stats-bar">
      <div className="container-custom">
        <div className="hero-stats-grid">
          {items.map((item: any, i: number) => (
            <div key={i} className="hero-stat-item">
              {item.icon && (
                <div className="hero-stat-icon">
                  <i className={`fa ${item.icon}`} aria-hidden="true" />
                </div>
              )}
              <div
                className="hero-stat-value"
                style={{ color: item.color || '#a78bfa' }}
              >
                {getValue(item)}
                {item.suffix || ''}
              </div>
              <div className="hero-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroStats;