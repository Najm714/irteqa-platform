// src/components/sections/Hero/HeroInteractive.tsx
import React, { useRef, useEffect, useState } from 'react';
import HeroStats from './HeroStats';

// ============================================================
// ✅ Types
// ============================================================
interface HeroInteractiveProps {
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
const HeroInteractive: React.FC<HeroInteractiveProps> = ({
  config,
  liveStats,
}) => {
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

  const { before, highlight, after } = splitTitle(
    mainContent.title,
    mainContent.titleHighlight
  );

  // ✅ Mouse tracking
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };

    const section = sectionRef.current;
    section?.addEventListener('mousemove', handleMouseMove);

    return () => {
      section?.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero hero-interactive"
      style={heroStyle}
    >
      {/* ✅ طبقات متحركة */}
      <div
        className="hero-layer layer-1"
        style={{
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
        }}
        aria-hidden="true"
      />
      <div
        className="hero-layer layer-2"
        style={{
          transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
        }}
        aria-hidden="true"
      />
      <div
        className="hero-layer layer-3"
        style={{
          transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
        }}
        aria-hidden="true"
      />

      {/* Overlay */}
      {showOverlay && (
        <div
          className="hero-overlay"
          style={{ background: overlayColor, opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}

      {/* ✅ المحتوى */}
      <div className="container-custom">
        <div className="hero-interactive-content">
          <div
            className="hero-interactive-inner"
            style={{
              transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)`,
            }}
          >
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
          </div>
        </div>
      </div>

      {/* ✅ الإحصائيات */}
      <HeroStats config={config} liveStats={liveStats} />
    </section>
  );
};

export default HeroInteractive;