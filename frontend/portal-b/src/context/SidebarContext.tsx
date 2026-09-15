// src/context/SidebarContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

type SidebarType = 'main' | 'dashboard' | 'specialist' | 'admin';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
  isMobile: boolean;
  sidebarType: SidebarType;
  setSidebarType: (type: SidebarType) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarType, setSidebarType] = useState<SidebarType>('main');

  // ✅ التحقق من حجم الشاشة - مرة واحدة فقط
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // على الموبايل: السايدبار مغلق
      if (mobile) {
        setIsOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);  // ✅ فارغ

  // ✅ دوال ثابتة
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const handleSetSidebarType = useCallback((type: SidebarType) => {
    setSidebarType(type);
  }, []);

  // ✅ value ثابت
  const value = useMemo(() => ({
    isOpen,
    toggle,
    close,
    open,
    isMobile,
    sidebarType,
    setSidebarType: handleSetSidebarType,
  }), [isOpen, toggle, close, open, isMobile, sidebarType, handleSetSidebarType]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};