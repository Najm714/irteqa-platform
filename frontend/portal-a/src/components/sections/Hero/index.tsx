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
  liveStats?: any;
}

const Hero: React.FC<HeroProps> = ({ config, liveStats }) => {
  const layout = config?.layout || 'cinematic';
  const commonProps = { config, liveStats };

  switch (layout) {
    case 'split':
      return <HeroSplit {...commonProps} />;
    case 'carousel':
      return <HeroCarousel {...commonProps} />;
    case 'magazine':
      return <HeroMagazine {...commonProps} />;
    case 'interactive':
      return <HeroInteractive {...commonProps} />;
    case 'minimal':
      return <HeroMinimal {...commonProps} />;
    case 'cinematic':
    default:
      return <HeroCinematic {...commonProps} />;
  }
};

export default Hero;