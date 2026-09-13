// src/components/layout/MainLayout.tsx
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useSidebar } from '../../context/SidebarContext';
import { FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isOpen, close, isMobile, sidebarType } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  
  // السايدبار يظهر فقط إذا كان النوع 'main' ومفتوح
  const showSidebar = isOpen && sidebarType === 'main';

  // روابط القائمة الرئيسية
  const mainMenuItems = [
    { to: '/', label: '🏠 الرئيسية' },
    { to: '/services', label: '📋 الخدمات' },
    { to: '/explanations', label: '📚 الشروحات' },
    { to: '/business', label: '💼 الأعمال والاقتصاد' },
    { to: '/library', label: '📖 المكتبة' },
    { to: '/videos', label: '🎬 الفيديوهات' },
    { to: '/infographics', label: '📊 الانفوجرافيك' },
    { to: '/offers', label: '🎯 العروض' },
    { to: '/about', label: 'ℹ️ نبذة عنا' },
    { to: '/login', label: 'ℹ️ تسجيل الدخول ' },

  ];

  // إضافة روابط لوحة التحكم حسب الدور
  const getDashboardLink = () => {
    if (!user) return null;
    
    if (user.role === 'customer') {
      return { to: '/dashboard', label: '📊 لوحة التحكم' };
    } else if (user.role === 'specialist') {
      return { to: '/specialist/dashboard', label: '📊 لوحة المختص' };
    } else if (user.role === 'portal_admin' || user.role === 'super_admin') {
      return { to: '/admin-dashboard', label: '📊 لوحة الإدارة' };
    }
    return null;
  };

  const dashboardLink = getDashboardLink();
  const allMenuItems = dashboardLink ? [dashboardLink, ...mainMenuItems] : mainMenuItems;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      
      <Footer />

      {/* ✅ السايدبار العام */}
      {showSidebar && (
        <>
          {/* خلفية مظللة */}
          {isMobile && (
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={close}
              aria-hidden="true"
            />
          )}
          
          {/* السايدبار */}
          <aside 
            className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            role="navigation"
            aria-label="القائمة الرئيسية"
          >
            {/* رأس السايدبار */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  ارتقاء
                </span>
                <span className="text-xs text-gray-400">القائمة</span>
              </div>
              <button
                onClick={close}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="إغلاق القائمة"
              >
                <FaTimes className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* محتوى السايدبار */}
            <nav className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
              <ul className="space-y-1">
                {allMenuItems.map((item) => {
                  const isActive = location.pathname === item.to || 
                                   (item.to !== '/' && location.pathname.startsWith(item.to));
                  
                  return (
                    <li key={item.to}>
                      <Link 
                        to={item.to} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        }`}
                        onClick={() => {
                          if (isMobile) close();
                        }}
                      >
                        <span className="text-lg">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* زر تسجيل الخروج إذا كان المستخدم مسجلاً */}
              {user && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      // تسجيل الخروج
                      if (isMobile) close();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="font-medium">تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </nav>
          </aside>
        </>
      )}
    </div>
  );
};

export default MainLayout;