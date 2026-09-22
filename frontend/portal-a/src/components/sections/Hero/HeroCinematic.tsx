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
    description:
      config?.mainContent?.description ||
      'تقدم خدمات متخصصة تجمع بين الخبرة والجودة',
  };

  const ctas = (config?.ctas || []).filter((c: any) => c.isActive !== false);
  const badges = (config?.badges || []).filter((b: any) => b.isActive !== false);

  // ✅ الخلفية
  const bg = config?.background || {};
  const starsEnabled = bg.starsEnabled !== false && (bg.type === 'animated' || bg.type === 'gradient');
  const overlayOpacity = bg.overlayOpacity ?? 0.3;
  const overlayColor = bg.overlayColor || '#000000';

  // ✅ فصل العنوان عن الكلمة المميزة
  const titleText = mainContent.title || '';
  const highlight = mainContent.titleHighlight || '';
  const titleBefore = highlight ? titleText.replace(highlight, '') : titleText;

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

  // ✅ بناء ستايل الخلفية
  const heroStyle: React.CSSProperties = {};
  if (bg.type === 'image' && bg.value) {
    heroStyle.backgroundImage = `url(${bg.value})`;
    heroStyle.backgroundSize = 'cover';
    heroStyle.backgroundPosition = 'center';
  } else if (bg.type === 'solid' && bg.value) {
    heroStyle.background = bg.value;
  } else if (bg.type === 'gradient' && bg.gradientColors?.length) {
    heroStyle.background = `linear-gradient(135deg, ${bg.gradientColors.join(', ')})`;
  }

  return (
    <section className="hero" style={heroStyle}>
      {/* ✅ فيديو الخلفية */}
      {bg.type === 'video' && bg.value && (
        <video
          className="hero-video-bg"
          src={bg.value}
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* ✅ Overlay */}
      {bg.type !== 'solid' && (
        <div
          className="hero-overlay"
          style={{ background: overlayColor, opacity: overlayOpacity }}
        />
      )}

      {/* ✅ النجوم */}
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
          {/* ✅ إصلاح: استخدام titleHighlight */}
          <h1 className="hero-title">
            {titleBefore}
            {highlight && <span className="hero-title-highlight">{highlight}</span>}
          </h1>
          <p>{mainContent.description}</p>

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

          {badges.length > 0 && (
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
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroCinematic;