// src/components/sections/Hero/HeroCinematic.tsx
import React from 'react';

interface HeroCinematicProps {
  config?: any;
}

const HeroCinematic: React.FC<HeroCinematicProps> = ({ config }) => {
  // ✅ القيم الافتراضية
  const mainContent = {
    title: config?.mainContent?.title || 'منصة ارتقاء',
    titleHighlight: config?.mainContent?.titleHighlight || 'ارتقاء',
    description: config?.mainContent?.description || 'تقدم خدمات متخصصة تجمع بين الخبرة والجودة',
  };

  const ctas = (config?.ctas || []).filter((c: any) => c.isActive !== false);
  const badges = (config?.badges || []).filter((b: any) => b.isActive !== false);
  const starsEnabled = config?.background?.starsEnabled !== false;

  const stars = starsEnabled
    ? Array.from({ length: 80 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 3,
      }))
    : [];

  return (
    <section className="hero">
      {stars.length > 0 && (
        <div className="stars">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                width: star.size + 'px',
                height: star.size + 'px',
                left: star.left + '%',
                top: star.top + '%',
                '--duration': star.duration + 's',
                animationDelay: star.delay + 's',
              } as any}
            />
          ))}
        </div>
      )}

      <div className="container-custom">
        <div className="hero-content">
        <h1>{mainContent.title}</h1>
          <p>{mainContent.description}</p>

          <div className="hero-actions">
            {ctas.map((cta: any, i: number) => (
              <a key={i} href={cta.link} className={`btn-${cta.variant || 'primary'}`}>
                {cta.text}
              </a>
            ))}
          </div>

          {badges.length > 0 && (
            <div className="hero-badges">
              {badges.map((badge: any, i: number) => (
                <span key={i} className="hero-badge">
                  {badge.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroCinematic;