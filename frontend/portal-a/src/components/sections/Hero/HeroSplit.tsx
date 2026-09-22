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

  const highlight = mainContent.titleHighlight || '';
  const titleBefore = highlight
    ? (mainContent.title || '').replace(highlight, '')
    : mainContent.title || '';

  const isImageLeft = mainContent.imagePosition === 'left';

  return (
    <section className="hero-split">
      <div className="container-custom">
        <div
          className="hero-split-grid"
          style={{ direction: isImageLeft ? 'ltr' : 'rtl' }}
        >
          <div className="hero-split-content" style={{ direction: 'rtl' }}>
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
            <div className="hero-badges">
              {badges.map((badge: any, i: number) => (
                <span
                  key={i}
                  className="hero-badge"
                  style={badge.color ? { color: badge.color } : undefined}
                >
                  {badge.text}
                </span>
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