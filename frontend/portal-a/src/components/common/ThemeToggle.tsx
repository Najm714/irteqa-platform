// frontend/portal-a/src/components/common/ThemeToggle.tsx
import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa'; // ✅ استبدال lucide-react

interface ThemeToggleProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="تبديل الوضع"
    >
      {isDark ? <FaSun size={20} /> : <FaMoon size={20} />}
    </button>
  );
};

export default ThemeToggle;