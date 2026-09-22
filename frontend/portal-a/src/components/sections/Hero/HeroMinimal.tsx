// src/components/sections/Hero/HeroMinimal.tsx
import React from 'react';

interface HeroMinimalProps {
  config?: any;
}

const HeroMinimal: React.FC<HeroMinimalProps> = ({ config }) => {
  const mainContent = config?.mainContent || {
    title: 'منصة ارتقاء',
    titleHighlight: 'ارتقاء',
    description: 'تقدم خدمات متخصصة',
  };
  const ctas = (config?.ctas || []).filter((c: any) => c.isActive !== false);

  return (
    <section className="hero">
      <div className="container-custom text-center py-20">
        <h1 className="hero-title">{mainContent.titleHighlight}.</h1>
        <p className="hero-description">{mainContent.description}</p>
        {ctas[0] && (
          <a href={ctas[0].link} className="btn-primary">
            {ctas[0].text}
          </a>
        )}
      </div>
    </section>
  );
};

export default HeroMinimal;