// src/components/sections/Hero/HeroInteractive.tsx
import React from 'react';

interface HeroInteractiveProps {
  config?: any;
}

const HeroInteractive: React.FC<HeroInteractiveProps> = ({ config }) => {
  const mainContent = config?.mainContent || {
    title: 'منصة ارتقاء',
    titleHighlight: 'ارتقاء',
    description: 'تقدم خدمات متخصصة',
  };
  const ctas = (config?.ctas || []).filter((c: any) => c.isActive !== false);

  const highlight = mainContent.titleHighlight || '';
  const titleBefore = highlight
    ? (mainContent.title || '').replace(highlight, '')
    : mainContent.title || '';

  return (
    <section className="hero">
      <div className="container-custom">
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
    </section>
  );
};

export default HeroInteractive;