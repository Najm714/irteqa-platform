// src/components/sections/Hero/HeroMagazine.tsx
import React from 'react';

interface HeroMagazineProps {
  config?: any;
}

const HeroMagazine: React.FC<HeroMagazineProps> = ({ config }) => {
  const mainContent = config?.mainContent || {
    title: 'منصة ارتقاء',
    titleHighlight: 'ارتقاء',
    description: 'تقدم خدمات متخصصة',
  };
  const ctas = (config?.ctas || []).filter((c: any) => c.isActive !== false);
  const badges = (config?.badges || []).filter((b: any) => b.isActive !== false);

  const highlight = mainContent.titleHighlight || '';
  const titleBefore = highlight
    ? (mainContent.title || '').replace(highlight, '')
    : mainContent.title || '';

  return (
    <section className="hero hero-magazine">
      <div className="container-custom">
        <div className="hero-magazine-grid">
          <div className="hero-magazine-main">
            <h1 className="hero-title">
              {titleBefore}
              {highlight && <span className="hero-title-highlight">{highlight}</span>}
            </h1>
            <p className="hero-description">{mainContent.description}</p>
            <div className="hero-actions">
              {ctas.map((cta: any, i: number) => (
                <a
                  key={i}
                  href={cta.link}
                  target={cta.target || '_self'}
                  rel={cta.target === '_blank' ? 'noopener noreferrer' : undefined}
                  className={`btn-${cta.variant || 'primary'}`}
                >
                  {cta.text}
                </a>
              ))}
            </div>
          </div>

          {badges.length > 0 && (
            <aside className="hero-magazine-side">
              {badges.map((badge: any, i: number) => (
                <div
                  key={i}
                  className="hero-magazine-badge"
                  style={badge.color ? { borderColor: badge.color } : undefined}
                >
                  {badge.icon && <i className={`fa ${badge.icon}`} />}
                  <span>{badge.text}</span>
                </div>
              ))}
            </aside>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroMagazine;