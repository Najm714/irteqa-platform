// src/components/sections/Hero/HeroSplit.tsx
import React from 'react';
import HeroStats from './HeroStats';

// ============================================================
// ✅ Types
// ============================================================
interface HeroSplitProps {
  config?: any;
  liveStats?: any;
}

// ============================================================
// ✅ Helper: فصل العنوان
// ============================================================
const splitTitle = (title: string, highlight: string) => {
  if (!title) return { before: '', highlight: '', after: '' };
  if (!highlight || !title.includes(highlight)) {
    return { before: title, highlight: '', after: '' };
  }
  const parts = title.split(highlight);
  return {
    before: parts[0] || '',
    highlight: highlight,
    after: parts.slice(1).join(highlight) || '',
  };
};

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
const HeroSplit: React.FC<HeroSplitProps> = ({ config, liveStats }) => {
  const mainContent = {
    title: config?.mainContent?.title || 'منصة ارتقاء',
    titleHighlight: config?.mainContent?.titleHighlight || 'ارتقاء',
    description:
      config?.mainContent?.description ||
      'تقدم خدمات متخصصة تجمع بين الخبرة والجودة',
    image: config?.mainContent?.image || '',
    imagePosition: config?.mainContent?.imagePosition || 'right',
  };

  const ctas = (config?.ctas || [])
    .filter((c: any) => c.isActive !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const badges = (config?.badges || [])
    .filter((b: any) => b.isActive !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const bg = config?.background || {};
  const overlayOpacity = bg.overlayOpacity ?? 0.3;
  const overlayColor = bg.overlayColor || '#000000';
  const showOverlay = bg.type !== 'solid' && overlayOpacity > 0;
  const heroStyle = buildBackgroundStyle(bg);

  const { before, highlight, after } = splitTitle(
    mainContent.title,
    mainContent.titleHighlight
  );

  const isImageLeft = mainContent.imagePosition === 'left';

  return (
    <section className="hero hero-split" style={heroStyle}>
      {/* Overlay */}
      {showOverlay && (
        <div
          className="hero-overlay"
          style={{ background: overlayColor, opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}

      <div className="container-custom">
        <div
          className="hero-split-grid"
          style={{ direction: isImageLeft ? 'ltr' : 'rtl' }}
        >
          {/* ✅ المحتوى */}
          <div className="hero-split-content" style={{ direction: 'rtl' }}>
            <h1 className="hero-title">
              {before}
              {highlight && (
                <span className="hero-title-highlight">{highlight}</span>
              )}
              {after}
            </h1>

            {mainContent.description && (
              <p className="hero-description">{mainContent.description}</p>
            )}

            {ctas.length > 0 && (
              <div className="hero-actions">
                {ctas.map((cta: any, i: number) => (
                  <a
                    key={i}
                    href={cta.link || '#'}
                    target={cta.target || '_self'}
                    rel={
                      cta.target === '_blank'
                        ? 'noopener noreferrer'
                        : undefined
                    }
                    className={`btn-${cta.variant || 'primary'}`}
                  >
                    {cta.icon && (
                      <i className={`fa ${cta.icon}`} aria-hidden="true" />
                    )}
                    {cta.text}
                  </a>
                ))}
              </div>
            )}

            {badges.length > 0 && (
              <div className="hero-badges">
                {badges.map((badge: any, i: number) => (
                  <span
                    key={i}
                    className="hero-badge"
                    style={
                      badge.color
                        ? {
                            color: badge.color,
                            borderColor: `${badge.color}40`,
                          }
                        : undefined
                    }
                  >
                    {badge.icon && (
                      <i className={`fa ${badge.icon}`} aria-hidden="true" />
                    )}
                    {badge.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ✅ الصورة */}
          <div className="hero-split-image">
            {mainContent.image ? (
              <img
                src={mainContent.image}
                alt={mainContent.title}
                loading="lazy"
              />
            ) : (
              <div className="hero-split-placeholder">🎓</div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ الإحصائيات */}
      <HeroStats config={config} liveStats={liveStats} />
    </section>
  );
};

export default HeroSplit;