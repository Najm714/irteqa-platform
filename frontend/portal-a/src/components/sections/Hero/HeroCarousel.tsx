// src/components/sections/Hero/HeroCarousel.tsx
import React, { useState, useEffect, useCallback } from 'react';

interface HeroCarouselProps {
  config?: any;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ config }) => {
  const slides = (config?.slides || []).filter((s: any) => s.isActive !== false);
  const [current, setCurrent] = useState(0);

  const goTo = useCallback(
    (idx: number) => setCurrent((idx + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, slides[current]?.duration || 5000);
    return () => clearTimeout(timer);
  }, [current, slides]);

  if (slides.length === 0) {
    return (
      <section className="hero">
        <div className="container-custom text-center py-20">
          <h1>لا توجد شرائح</h1>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  const slideStyle: React.CSSProperties = {
    background: slide.bgColor || undefined,
  };
  if (slide.image) {
    slideStyle.backgroundImage = `url(${slide.image})`;
    slideStyle.backgroundSize = 'cover';
    slideStyle.backgroundPosition = 'center';
  }

  return (
    <section className="hero hero-carousel" style={slideStyle}>
      <div className="container-custom text-center py-20">
        <h1 className="hero-title">{slide.title}</h1>
        {slide.description && (
          <p className="hero-description">{slide.description}</p>
        )}

        {slide.cta?.text && (
          <a href={slide.cta.link} className="btn-primary">
            {slide.cta.text}
          </a>
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
    </section>
  );
};

export default HeroCarousel;