// src/context/SidebarContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  // التحقق من حجم الشاشة
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // على الموبايل: السايدبار مغلق افتراضياً
      // على الديسكتوب: السايدبار مفتوح افتراضياً (للداشبورد)
      if (mobile) {
        setIsOpen(false);
      } else {
        // على الديسكتوب، نفتح السايدبار إذا كان من نوع dashboard/specialist/admin
        if (sidebarType === 'dashboard' || sidebarType === 'specialist' || sidebarType === 'admin') {
          setIsOpen(true);
        }
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarType]);

  const toggle = () => setIsOpen(prev => !prev);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      toggle, 
      close, 
      open, 
      isMobile, 
      sidebarType, 
      setSidebarType 
    }}>
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