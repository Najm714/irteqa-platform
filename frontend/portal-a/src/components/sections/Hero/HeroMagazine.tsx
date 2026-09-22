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

  return (
    <section className="hero">
      <div className="container-custom">
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
      </div>
    </section>
  );
};

export default HeroMagazine;