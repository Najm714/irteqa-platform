// src/components/sections/Hero/HeroCarousel.tsx
import React, { useState, useEffect } from 'react';

interface HeroCarouselProps {
  config?: any;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ config }) => {
  const slides = (config?.slides || []).filter((s: any) => s.isActive !== false);
  const [current, setCurrent] = useState(0);

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

  return (
    <section className="hero">
      <div className="container-custom text-center py-20">
        <h1 className="hero-title">{slide.title}</h1>
        <p className="hero-description">{slide.description}</p>
      </div>
    </section>
  );
};

export default HeroCarousel;