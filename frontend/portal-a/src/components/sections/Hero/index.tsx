// src/components/sections/Hero/index.tsx
import React from 'react';
import HeroCinematic from './HeroCinematic';
import HeroSplit from './HeroSplit';
import HeroCarousel from './HeroCarousel';
import HeroMagazine from './HeroMagazine';
import HeroInteractive from './HeroInteractive';
import HeroMinimal from './HeroMinimal';
import './Hero.css';

interface HeroProps {
  config?: any;
}

const Hero: React.FC<HeroProps> = ({ config }) => {
  const layout = config?.layout || 'cinematic';

  switch (layout) {
    case 'split':
      return <HeroSplit config={config} />;
    case 'carousel':
      return <HeroCarousel config={config} />;
    case 'magazine':
      return <HeroMagazine config={config} />;
    case 'interactive':
      return <HeroInteractive config={config} />;
    case 'minimal':
      return <HeroMinimal config={config} />;
    case 'cinematic':
    default:
      return <HeroCinematic config={config} />;
  }
};

export default Hero;