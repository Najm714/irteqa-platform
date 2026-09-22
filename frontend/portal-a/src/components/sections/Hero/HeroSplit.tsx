// src/components/sections/Hero/HeroSplit.tsx
import React from 'react';

interface HeroSplitProps {
  config?: any;
}

const HeroSplit: React.FC<HeroSplitProps> = ({ config }) => {
  const mainContent = config?.mainContent || {
    title: 'منصة ارتقاء',
    titleHighlight: 'ارتقاء',
    description: 'تقدم خدمات متخصصة',
    image: '',
    imagePosition: 'right',
  };
  const ctas = (config?.ctas || []).filter((c: any) => c.isActive !== false);
  const badges = (config?.badges || []).filter((b: any) => b.isActive !== false);

  return (
    <section className="hero-split">
      <div className="container-custom">
        <div className="hero-split-grid">
          <div className="hero-split-content">
            <h1 className="hero-title">
              {mainContent.title?.replace(mainContent.titleHighlight, '')}
              <span className="hero-title-highlight">{mainContent.titleHighlight}</span>
            </h1>
            <p className="hero-description">{mainContent.description}</p>
            <div className="hero-actions">
              {ctas.map((cta: any, i: number) => (
                <a key={i} href={cta.link} className={`btn-${cta.variant || 'primary'}`}>
                  {cta.text}
                </a>
              ))}
            </div>
            <div className="hero-badges">
              {badges.map((badge: any, i: number) => (
                <span key={i} className="hero-badge">{badge.text}</span>
              ))}
            </div>
          </div>
          <div className="hero-split-image">
            {mainContent.image ? (
              <img src={mainContent.image} alt={mainContent.title} />
            ) : (
              <div className="hero-split-placeholder">🎓</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSplit;