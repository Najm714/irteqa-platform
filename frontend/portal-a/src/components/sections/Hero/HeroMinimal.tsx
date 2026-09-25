// src/components/sections/Hero/HeroMinimal.tsx
import React from 'react';
import HeroStats from './HeroStats';

// ============================================================
// ✅ Types
// ============================================================
interface HeroMinimalProps {
  config?: any;
  liveStats?: any;
}

// ============================================================
// ✅ Helper: بناء الخلفية
// ============================================================
const buildBackgroundStyle = (background: any): React.CSSProperties => {
  if (!background) return {};
  const style: React.CSSProperties = {};

  switch (background.type) {
    case 'solid':
      if (background.value) style.background = background.value;
      break;
    case 'gradient':
      if (background.gradientColors?.length >= 2) {
        style.background = `linear-gradient(135deg, ${background.gradientColors.join(', ')})`;
      }
      break;
    case 'image':
      if (background.value) {
        style.backgroundImage = `url(${background.value})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }
      break;
    default:
      break;
  }
  return style;
};

// ============================================================
// ✅ المكوّن
// ============================================================
const HeroMinimal: React.FC<HeroMinimalProps> = ({ config, liveStats }) => {
  const mainContent = {
    title: config?.mainContent?.title || 'منصة ارتقاء',
    titleHighlight: config?.mainContent?.titleHighlight || 'ارتقاء',
    description:
      config?.mainContent?.description ||
      'تقدم خدمات متخصصة تجمع بين الخبرة والجودة',
  };

  const ctas = (config?.ctas || [])
    .filter((c: any) => c.isActive !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const bg = config?.background || {};
  const overlayOpacity = bg.overlayOpacity ?? 0.3;
  const overlayColor = bg.overlayColor || '#000000';
  const showOverlay = bg.type !== 'solid' && overlayOpacity > 0;
  const heroStyle = buildBackgroundStyle(bg);

  // ✅ minimal يعرض الكلمة المميزة فقط كنقطة
  const displayTitle = mainContent.titleHighlight
    ? `${mainContent.titleHighlight}.`
    : mainContent.title;

  return (
    <section className="hero hero-minimal" style={heroStyle}>
      {/* Overlay */}
      {showOverlay && (
        <div
          className="hero-overlay"
          style={{ background: overlayColor, opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}

      <div className="container-custom text-center py-20">
        <h1 className="hero-minimal-title">{displayTitle}</h1>

        {mainContent.description && (
          <p className="hero-minimal-description">{mainContent.description}</p>
        )}

        {ctas[0] && (
          <a
            href={ctas[0].link || '#'}
            target={ctas[0].target || '_self'}
            rel={
              ctas[0].target === '_blank' ? 'noopener noreferrer' : undefined
            }
            className="hero-minimal-cta"
          >
            {ctas[0].icon && (
              <i className={`fa ${ctas[0].icon}`} aria-hidden="true" />
            )}
            {ctas[0].text}
          </a>
        )}
      </div>

      {/* ✅ الإحصائيات */}
      <HeroStats config={config} liveStats={liveStats} />
    </section>
  );
};

export default HeroMinimal;