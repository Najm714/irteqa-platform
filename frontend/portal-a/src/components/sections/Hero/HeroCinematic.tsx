// src/components/sections/Hero/HeroCinematic.tsx
import React from 'react';
import HeroStats from './HeroStats';

// ============================================================
// ✅ Types
// ============================================================
interface HeroCinematicProps {
  config?: any;
  liveStats?: any;
}

// ============================================================
// ✅ Helper: استخراج portalId (للاستخدام في الـ images إن لزم)
// ============================================================
const resolvePortalId = (): string => {
  const envId = import.meta.env.VITE_PORTAL_ID;
  if (envId) return envId;

  const pathMatch = window.location.pathname.match(/\/portal\/([^/]+)/);
  if (pathMatch?.[1]) return pathMatch[1];

  const host = window.location.hostname;
  if (host !== 'localhost' && host.includes('.')) {
    const sub = host.split('.')[0];
    if (sub && sub !== 'www') return sub;
  }
  return '';
};

// ============================================================
// ✅ Helper: فصل العنوان عن الكلمة المميزة
// ============================================================
const splitTitle = (title: string, highlight: string) => {
  if (!title) return { before: '', highlight: '' };
  if (!highlight || !title.includes(highlight)) {
    return { before: title, highlight: '' };
  }
  const parts = title.split(highlight);
  return {
    before: parts[0] || '',
    highlight: highlight,
    after: parts.slice(1).join(highlight) || '',
  };
};

// ============================================================
// ✅ Helper: بناء style الخلفية
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
        style.backgroundRepeat = 'no-repeat';
      }
      break;

    case 'video':
    case 'animated':
    default:
      // القيم الافتراضية موجودة في CSS
      break;
  }

  return style;
};

// ============================================================
// ✅ Helper: توليد النجوم
// ============================================================
const generateStars = (count: number = 80) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 3,
  }));

// ============================================================
// ✅ المكوّن
// ============================================================
const HeroCinematic: React.FC<HeroCinematicProps> = ({ config, liveStats }) => {
  // ============================================================
  // ✅ المحتوى الرئيسي
  // ============================================================
  const mainContent = {
    title: config?.mainContent?.title || 'منصة ارتقاء',
    titleHighlight: config?.mainContent?.titleHighlight || 'ارتقاء',
    description:
      config?.mainContent?.description ||
      'تقدم خدمات متخصصة تجمع بين الخبرة والجودة',
    image: config?.mainContent?.image || '',
  };

  // ============================================================
  // ✅ العناصر النشطة
  // ============================================================
  const ctas = (config?.ctas || [])
    .filter((c: any) => c.isActive !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const badges = (config?.badges || [])
    .filter((b: any) => b.isActive !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  // ============================================================
  // ✅ الخلفية
  // ============================================================
  const bg = config?.background || {};
  const isVideo = bg.type === 'video' && bg.value;
  const isStarsEnabled =
    bg.starsEnabled !== false &&
    (bg.type === 'animated' || bg.type === 'gradient' || !bg.type);

  const overlayOpacity = bg.overlayOpacity ?? 0.3;
  const overlayColor = bg.overlayColor || '#000000';
  const showOverlay = bg.type !== 'solid' && overlayOpacity > 0;

  const stars = isStarsEnabled ? generateStars(80) : [];
  const heroStyle = buildBackgroundStyle(bg);

  // ============================================================
  // ✅ فصل العنوان
  // ============================================================
  const { before, highlight, after } = splitTitle(
    mainContent.title,
    mainContent.titleHighlight
  );

  // ============================================================
  // ✅ Render
  // ============================================================
  return (
    <section className="hero hero-cinematic" style={heroStyle}>
      {/* ====================================================
          فيديو الخلفية
      ==================================================== */}
      {isVideo && (
        <video
          className="hero-video-bg"
          src={bg.value}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}

      {/* ====================================================
          Overlay
      ==================================================== */}
      {showOverlay && (
        <div
          className="hero-overlay"
          style={{
            background: overlayColor,
            opacity: overlayOpacity,
          }}
          aria-hidden="true"
        />
      )}

      {/* ====================================================
          النجوم
      ==================================================== */}
      {stars.length > 0 && (
        <div className="stars" aria-hidden="true">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={
                {
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  '--duration': `${star.duration}s`,
                  animationDelay: `${star.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* ====================================================
          المحتوى الرئيسي
      ==================================================== */}
      <div className="container-custom">
        <div className="hero-cinematic-content">
          {/* ✅ العنوان مع الكلمة المميزة */}
          <h1 className="hero-title">
            {before}
            {highlight && (
              <span className="hero-title-highlight">{highlight}</span>
            )}
            {after}
          </h1>

          {/* ✅ الوصف */}
          {mainContent.description && (
            <p className="hero-description">{mainContent.description}</p>
          )}

          {/* ✅ الأزرار */}
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

          {/* ✅ الشارات */}
          {badges.length > 0 && (
            <div className="hero-badges">
              {badges.map((badge: any, i: number) => (
                <span
                  key={i}
                  className="hero-badge"
                  style={
                    badge.color
                      ? { color: badge.color, borderColor: `${badge.color}40` }
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
      </div>

      {/* ====================================================
          الإحصائيات المباشرة
      ==================================================== */}
      <HeroStats config={config} liveStats={liveStats} />
    </section>
  );
};

export default HeroCinematic;