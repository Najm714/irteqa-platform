// src/components/common/SplashScreen.tsx
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  text?: string;
  bgColor?: string;
  logo?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  text = 'منصة ارتقاء',
  bgColor = '#0f0f23',
  logo,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 100));
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500"
      style={{ background: bgColor }}
    >
      {/* Stars Background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6">
        {logo ? (
          <img src={logo} alt={text} className="w-24 h-24 mx-auto mb-6" />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/50">
            <span className="text-4xl font-black text-white">إ</span>
          </div>
        )}

        <h1 className="text-3xl font-bold text-white mb-2">{text}</h1>
        <p className="text-white/60 text-sm mb-8">جاري التحميل...</p>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-white/40 text-xs mt-4">{progress}%</p>
      </div>
    </div>
  );
};

export default SplashScreen;