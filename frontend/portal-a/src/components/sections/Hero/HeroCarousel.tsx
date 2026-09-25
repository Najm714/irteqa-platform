// src/components/sections/Hero/HeroCarousel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import HeroStats from './HeroStats';

// ============================================================
// ✅ Types
// ============================================================
interface HeroCarouselProps {
  config?: any;
  liveStats?: any;
}

// ============================================================
// ✅ المكوّن
// ============================================================
const HeroCarousel: React.FC<HeroCarouselProps> = ({ config, liveStats }) => {
  const slides = (config?.slides || [])
    .filter((s: any) => s.isActive !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const [current, setCurrent] = useState(0);

  const goTo = useCallback(
    (idx: number) => {
      if (slides.length === 0) return;
      setCurrent((idx + slides.length) % slides.length);
    },
    [slides.length]
  );

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // ✅ Auto-rotate
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, slides[current]?.duration || 5000);
    return () => clearTimeout(timer);
  }, [current, slides]);

  // ✅ Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goPrev();
      if (e.key === 'ArrowLeft') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // ✅ Empty state
  if (slides.length === 0) {
    return (
      <section className="hero hero-carousel">
        <div className="container-custom text-center py-20">
          <h1 className="hero-title">لا توجد شرائح</h1>
          <p className="hero-description">
            قم بإضافة شرائح من لوحة التحكم
          </p>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  // ✅ بناء style الشريحة
  const slideStyle: React.CSSProperties = {};
  if (slide.image) {
    slideStyle.backgroundImage = `url(${slide.image})`;
    slideStyle.backgroundSize = 'cover';
    slideStyle.backgroundPosition = 'center';
  } else if (slide.bgColor) {
    slideStyle.background = slide.bgColor;
  }

  return (
    <section className="hero hero-carousel">
      {/* ✅ خلفية الشريحة */}
      <div className="hero-slide-bg" style={slideStyle}>
        <div className="hero-slide-overlay" />
      </div>

      {/* ✅ أسهم التنقل */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-arrow-right"
            onClick={goPrev}
            aria-label="السابق"
          >
            ›
          </button>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-arrow-left"
            onClick={goNext}
            aria-label="التالي"
          >
            ‹
          </button>
        </>
      )}

      {/* ✅ المحتوى */}
      <div className="container-custom">
        <div className="hero-carousel-content">
          <h1 className="hero-title">{slide.title}</h1>

          {slide.description && (
            <p className="hero-description">{slide.description}</p>
          )}

          {slide.cta?.text && (
            <div className="hero-actions">
              <a
                href={slide.cta.link || '#'}
                target={slide.cta.target || '_self'}
                rel={
                  slide.cta.target === '_blank'
                    ? 'noopener noreferrer'
                    : undefined
                }
                className="btn-primary"
              >
                {slide.cta.text}
              </a>
            </div>
          )}

          {/* ✅ نقاط التنقل */}
          {slides.length > 1 && (
            <div className="hero-carousel-dots">
              {slides.map((_: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  className={`hero-carousel-dot ${i === current ? 'active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`شريحة ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ الإحصائيات */}
      <HeroStats config={config} liveStats={liveStats} />
    </section>
  );
};

export default HeroCarousel;