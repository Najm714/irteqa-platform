// frontend/portal-a/src/components/common/BackToTop.tsx
import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa'; // ✅ استبدال lucide-react

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`back-to-top ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="العودة للأعلى"
    >
      <FaArrowUp size={24} />
    </button>
  );
};

export default BackToTop;