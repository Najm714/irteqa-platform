// src/components/layout/Header.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';
import NotificationsList from '../common/NotificationsList';
import { 
  FaBars, 
  FaUserCircle, 
  FaBell, 
  FaSignOutAlt,
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';

// ✅ واجهة الإشعار المتطابقة مع الـ Backend
interface Notification {
  _id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: string;
  isRead: boolean; // ✅ استخدام isRead بدلاً من read
  isDelivered?: boolean;
  createdAt: string;
  expiresAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  data?: {
    requestId?: string;
    messageId?: string;
    callId?: string;
    paymentId?: string;
    subscriptionId?: string;
    deliveryId?: string;
    contentId?: string;
    actorId?: string;
    url?: string;
    metadata?: Record<string, any>;
  };
}

const Header: React.FC = () => {
  const { toggle, setSidebarType } = useSidebar();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ حالة الإشعارات
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  // ============================================================
  // ✅ جلب عدد الإشعارات غير المقروءة (باستخدام isRead)
  // ============================================================

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/notifications/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ============================================================
  // ✅ جلب الإشعارات للقائمة المنبثقة
  // ============================================================

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.data || []);
        // ✅ تحديث العداد بناءً على isRead
        const unread = (data.data || []).filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  }, [token]);

  // ============================================================
  // ✅ تحديد نوع السايدبار
  // ============================================================

  const getSidebarType = (): 'main' | 'dashboard' | 'specialist' | 'admin' => {
    if (location.pathname.startsWith('/dashboard')) return 'dashboard';
    if (location.pathname.startsWith('/specialist')) return 'specialist';
    if (location.pathname.startsWith('/admin-')) return 'admin';
    return 'main';
  };

  // ============================================================
  // ✅ تحديد عنوان الصفحة
  // ============================================================

  const getPageTitle = () => {
    if (location.pathname.startsWith('/dashboard')) {
      if (location.pathname === '/dashboard') return 'نظرة عامة';
      if (location.pathname.includes('/requests')) return 'طلباتي';
      if (location.pathname.includes('/subscriptions')) return 'اشتراكاتي';
      if (location.pathname.includes('/payments')) return 'المدفوعات';
      if (location.pathname.includes('/notifications')) return 'الإشعارات';
      if (location.pathname.includes('/profile')) return 'الملف الشخصي';
      if (location.pathname.includes('/settings')) return 'الإعدادات';
      return 'لوحة التحكم';
    }
    
    if (location.pathname.startsWith('/specialist')) {
      if (location.pathname === '/specialist/dashboard') return 'نظرة عامة';
      if (location.pathname.includes('/requests')) return 'الطلبات المسندة';
      if (location.pathname.includes('/tasks')) return 'المهام';
      if (location.pathname.includes('/calls')) return 'المكالمات';
      if (location.pathname.includes('/messages')) return 'الرسائل';
      if (location.pathname.includes('/files')) return 'الملفات';
      if (location.pathname.includes('/profile')) return 'الملف الشخصي';
      if (location.pathname.includes('/settings')) return 'الإعدادات';
      return 'لوحة المختص';
    }
    
    if (location.pathname.startsWith('/admin-')) {
      if (location.pathname === '/admin-dashboard') return 'نظرة عامة';
      if (location.pathname.includes('/services')) return 'الخدمات';
      if (location.pathname.includes('/sections')) return 'الأقسام';
      if (location.pathname.includes('/users')) return 'المستخدمين';
      if (location.pathname.includes('/payments')) return 'المدفوعات';
      if (location.pathname.includes('/subscriptions')) return 'الاشتراكات';
      if (location.pathname.includes('/requests')) return 'الطلبات';
      if (location.pathname.includes('/reports')) return 'التقارير';
      if (location.pathname.includes('/settings')) return 'الإعدادات';
      return 'لوحة الإدارة';
    }
    
    return '';
  };

  // ============================================================
  // ✅ تحديد اسم لوحة التحكم للعرض
  // ============================================================

  const getDashboardLabel = () => {
    if (location.pathname.startsWith('/dashboard')) return 'العميل';
    if (location.pathname.startsWith('/specialist')) return 'المختص';
    if (location.pathname.startsWith('/admin-')) return 'الإدارة';
    return '';
  };

  // ============================================================
  // ✅ تحديد ما إذا كانت الصفحة من لوحات التحكم
  // ============================================================

  const isDashboard = location.pathname.startsWith('/dashboard') || 
                      location.pathname.startsWith('/specialist') || 
                      location.pathname.startsWith('/admin-');

  // ============================================================
  // ✅ معالجة النقر على زر القائمة
  // ============================================================

  const handleMenuClick = () => {
    setSidebarType(getSidebarType());
    toggle();
  };

  // ============================================================
  // ✅ معالجة تسجيل الخروج
  // ============================================================

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ============================================================
  // ✅ معالجة النقر على الإشعار
  // ============================================================

  const handleNotificationClick = (notification: Notification) => {
    setShowNotifications(false);

    // التوجيه حسب نوع الإشعار
    if (notification.data?.url) {
      navigate(notification.data.url);
    } else if (notification.data?.requestId) {
      navigate(`/request/${notification.data.requestId}`);
    } else if (notification.data?.paymentId) {
      navigate('/dashboard/payments');
    } else if (notification.data?.subscriptionId) {
      navigate('/dashboard/subscriptions');
    } else if (notification.data?.messageId) {
      navigate('/dashboard/messages');
    } else if (notification.data?.callId) {
      navigate('/dashboard/calls');
    }
  };

  // ============================================================
  // ✅ النقر خارج القائمة لإغلاقها
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // ✅ جلب الإشعارات عند التحميل وتحديثها دورياً
  // ============================================================

  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      
      // تحديث العداد كل 30 ثانية
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [token, fetchUnreadCount]);

  const pageTitle = getPageTitle();
  const dashboardLabel = getDashboardLabel();

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="container-custom py-3 px-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* ========== الجهة اليمنى ========== */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 text-2xl font-black flex-shrink-0">
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                ارتقاء
              </span>
              {isDashboard && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                  {dashboardLabel}
                </span>
              )}
            </Link>
            
            {pageTitle && (
              <>
                <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block truncate max-w-[150px] md:max-w-[300px]">
                  {pageTitle}
                </span>
              </>
            )}
          </div>

          {/* ========== الجهة اليسرى ========== */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* ✅ زر تبديل الثيم */}
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />

            {/* ✅ زر الإشعارات */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    // تحديث العداد والإشعارات عند فتح القائمة
                    fetchUnreadCount();
                    fetchNotifications();
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
                aria-label="الإشعارات"
              >
                <FaBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                
                {/* ✅ عداد الإشعارات غير المقروءة (باستخدام isRead) */}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1 font-medium animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ✅ قائمة الإشعارات المنبثقة */}
              {showNotifications && (
                <div 
                  ref={notificationRef}
                  className="absolute left-0 top-full mt-2 w-[340px] sm:w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[550px] overflow-hidden"
                >
                  {/* رأس القائمة */}
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FaBell className="text-purple-600" />
                      الإشعارات
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </h4>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      aria-label="إغلاق الإشعارات"
                    >
                      <FaTimes className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {/* ✅ قائمة الإشعارات */}
                  <div className="overflow-y-auto max-h-[400px]">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <FaSpinner className="w-6 h-6 text-purple-600 animate-spin" />
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-pointer ${
                              !notification.isRead 
                                ? 'bg-purple-50 dark:bg-purple-900/10 border-r-4 border-purple-500' 
                                : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.isRead ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {notification.titleAr || notification.title || notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {formatTime(notification.createdAt)}
                                  </span>
                                  {notification.type && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500">
                                      {getTypeLabel(notification.type)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaBell className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد إشعارات</p>
                        <p className="text-sm text-gray-400 mt-1">ستظهر الإشعارات هنا عند ورودها</p>
                      </div>
                    )}
                  </div>

                  {/* زر عرض الكل */}
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          navigate('/dashboard/notifications');
                          setShowNotifications(false);
                        }}
                        className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                      >
                        عرض جميع الإشعارات
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ✅ معلومات المستخدم */}
            {user && (
              <div className="flex items-center gap-2 hidden md:flex">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user?.profile?.avatar ? (
                    <img 
                      src={`${API_URL}/files/public/${user.profile.avatar}`} 
                      alt={user?.fullName || 'مستخدم'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FaUserCircle className="text-purple-600 dark:text-purple-400 text-xl" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate hidden lg:block">
                  {user?.fullName || 'مستخدم'}
                </span>
              </div>
            )}

            {/* ✅ زر تسجيل الخروج */}
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-500"
                aria-label="تسجيل الخروج"
              >
                <FaSignOutAlt className="w-5 h-5" />
              </button>
            )}

            {/* ✅ زر القائمة (هامبورجر) */}
            <button
              onClick={handleMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="فتح القائمة"
            >
              <FaBars className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================================
// ✅ دوال مساعدة
// ============================================================

const formatTime = (date: string) => {
  try {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now.getTime() - notifDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${minutes} د`;
    if (hours < 24) return `${hours} س`;
    if (days < 7) return `${days} ي`;
    if (days < 30) return `${Math.floor(days / 7)} أسبوع`;
    return notifDate.toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '-';
  }
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'request_created': 'طلب',
    'request_assigned': 'إسناد',
    'request_updated': 'تحديث',
    'request_completed': 'اكتمال',
    'request_cancelled': 'إلغاء',
    'payment_received': 'دفع',
    'payment_verified': 'تأكيد',
    'payment_failed': 'فشل',
    'new_message': 'رسالة',
    'new_call': 'مكالمة',
    'subscription_created': 'اشتراك',
    'subscription_expiring': 'اشتراك',
    'subscription_expired': 'انتهاء',
    'system_alert': 'نظام',
    'support_reply': 'دعم',
  };
  return labels[type] || type.replace(/_/g, ' ');
};

export default Header;