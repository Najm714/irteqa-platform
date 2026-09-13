// src/components/layout/Header.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';
import {
  FaBars,
  FaUserCircle,
  FaBell,
  FaSignOutAlt,
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';

// ============================================================
// ✅ واجهة الإشعار
// ============================================================
interface Notification {
  _id: string;
  title?: string;
  titleAr?: string;
  message?: string;
  messageAr?: string;
  type?: string;
  isRead: boolean;
  isDelivered?: boolean;
  createdAt: string;
  expiresAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
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

  // ✅ حالات
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingCount, setLoadingCount] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  // ============================================================
  // ✅ جلب عدد الإشعارات غير المقروءة
  // ============================================================
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingCount(true);
      const response = await fetch(`${API_URL}/notifications/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // ⚠️ 401 = جلسة منتهية
        if (response.status === 401) {
          console.warn('⚠️ Session expired, skipping count');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
const data = await response.json();
if (data.success) {
  // ✅ اقبل count أو unreadCount
  setUnreadCount(data.count ?? data.unreadCount ?? 0);
}
    } catch (error: any) {
      // ⚠️ تجاهل أخطاء الشبكة المؤقتة
      if (error.message?.includes('Failed to fetch') ||
          error.message?.includes('Network') ||
          error.name === 'TypeError') {
        console.warn('⚠️ Network error (ignored):', error.message);
      } else {
        console.error('❌ Error fetching unread count:', error);
      }
    } finally {
      setLoadingCount(false);
    }
  }, [token, API_URL]);

  // ============================================================
  // ✅ جلب قائمة الإشعارات (للـ dropdown)
  // ============================================================
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingList(true);
      const response = await fetch(`${API_URL}/notifications?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️ Session expired');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.data || []);
        // ⚠️ لا نُحدّث unreadCount من هنا
        // العداد الحقيقي يأتي من /unread/count
      }
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') ||
          error.message?.includes('Network')) {
        console.warn('⚠️ Network error (ignored)');
      } else {
        console.error('❌ Error fetching notifications:', error);
      }
    } finally {
      setLoadingList(false);
    }
  }, [token, API_URL]);

  // ============================================================
  // ✅ تعليم إشعار كمقروء
  // ============================================================
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token) return;

    try {
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
      });

      // تحديث محلي
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  }, [token, API_URL]);

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
  // ✅ عنوان الصفحة
  // ============================================================
  const getPageTitle = () => {
    const path = location.pathname;

    if (path.startsWith('/dashboard')) {
      if (path === '/dashboard') return 'نظرة عامة';
      if (path.includes('/requests')) return 'طلباتي';
      if (path.includes('/subscriptions')) return 'اشتراكاتي';
      if (path.includes('/payments')) return 'المدفوعات';
      if (path.includes('/notifications')) return 'الإشعارات';
      if (path.includes('/profile')) return 'الملف الشخصي';
      if (path.includes('/settings')) return 'الإعدادات';
      return 'لوحة التحكم';
    }

    if (path.startsWith('/specialist')) {
      if (path === '/specialist/dashboard' || path === '/specialist') return 'نظرة عامة';
      if (path.includes('/requests')) return 'الطلبات المسندة';
      if (path.includes('/tasks')) return 'المهام';
      if (path.includes('/calls')) return 'المكالمات';
      if (path.includes('/messages')) return 'الرسائل';
      if (path.includes('/files')) return 'الملفات';
      if (path.includes('/profile')) return 'الملف الشخصي';
      if (path.includes('/settings')) return 'الإعدادات';
      return 'لوحة المختص';
    }

    if (path.startsWith('/admin-')) {
      if (path === '/admin-dashboard') return 'نظرة عامة';
      if (path.includes('/services')) return 'الخدمات';
      if (path.includes('/sections')) return 'الأقسام';
      if (path.includes('/users')) return 'المستخدمين';
      if (path.includes('/payments')) return 'المدفوعات';
      if (path.includes('/subscriptions')) return 'الاشتراكات';
      if (path.includes('/requests')) return 'الطلبات';
      if (path.includes('/reports')) return 'التقارير';
      if (path.includes('/settings')) return 'الإعدادات';
      return 'لوحة الإدارة';
    }

    return '';
  };

  const getDashboardLabel = () => {
    if (location.pathname.startsWith('/dashboard')) return 'العميل';
    if (location.pathname.startsWith('/specialist')) return 'المختص';
    if (location.pathname.startsWith('/admin-')) return 'الإدارة';
    return '';
  };

  const isDashboard =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/specialist') ||
    location.pathname.startsWith('/admin-');

  // ============================================================
  // ✅ معالجات
  // ============================================================
  const handleMenuClick = () => {
    setSidebarType(getSidebarType());
    toggle();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ============================================================
  // ✅ النقر على إشعار
  // ============================================================
  const handleNotificationClick = async (notification: Notification) => {
    // 1. علّم كمقروء
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // 2. أغلق القائمة
    setShowNotifications(false);

    // 3. وجّه
    if (notification.data?.url) {
      navigate(notification.data.url);
    } else if (notification.data?.requestId) {
      navigate(`/request/${notification.data.requestId}`);
    } else if (notification.data?.paymentId) {
      navigate('/dashboard/payments');
    } else if (notification.data?.subscriptionId) {
      navigate('/dashboard/subscriptions');
    }
  };

  // ============================================================
  // ✅ إغلاق القائمة عند النقر خارجها
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
  // ✅ Polling الأولي (مع cleanup صحيح)
  // ============================================================
  useEffect(() => {
    if (!token) return;

    // جلب أولي
    fetchUnreadCount();

    // Polling كل 60 ثانية (بدلاً من 30)
    const interval = setInterval(() => {
      // ⚠️ لا نجلب إذا كان التبويب غير مرئي
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [token, fetchUnreadCount]);

  const pageTitle = getPageTitle();
  const dashboardLabel = getDashboardLabel();

  // ============================================================
  // ✅ Render
  // ============================================================
  return (
    <header className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="container-custom py-3 px-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          {/* الجهة اليمنى */}
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

          {/* الجهة اليسرى */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* تبديل الثيم */}
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />

            {/* زر الإشعارات */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => {
                  const newState = !showNotifications;
                  setShowNotifications(newState);
                  if (newState) {
                    fetchUnreadCount();
                    fetchNotifications();
                  }
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition relative"
                aria-label="الإشعارات"
              >
                <FaBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />

                {/* ✅ عداد صحيح */}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1 font-medium animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}

                {/* مؤشر جلب */}
                {loadingCount && !unreadCount && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* القائمة المنسدلة */}
              {showNotifications && (
                <div
                  ref={notificationRef}
                  className="absolute left-0 top-full mt-2 w-[340px] sm:w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[550px] overflow-hidden"
                >
                  {/* الرأس */}
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
                      aria-label="إغلاق"
                    >
                      <FaTimes className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {/* القائمة */}
                  <div className="overflow-y-auto max-h-[400px]">
                    {loadingList ? (
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
                                  {notification.titleAr || notification.title || notification.messageAr || notification.message || 'إشعار'}
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

            {/* معلومات المستخدم */}
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

            {/* زر تسجيل الخروج */}
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-500"
                aria-label="تسجيل الخروج"
              >
                <FaSignOutAlt className="w-5 h-5" />
              </button>
            )}

            {/* زر القائمة */}
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
    'call_scheduled': 'مكالمة',
    'subscription_created': 'اشتراك',
    'subscription_expiring': 'اشتراك',
    'subscription_expired': 'انتهاء',
    'subscription_cancelled': 'إلغاء',
    'system_alert': 'نظام',
    'support_reply': 'دعم',
    'scope_approved': 'اعتماد',
    'delivery_submitted': 'تسليم',
    'delivery_reviewed': 'مراجعة',
  };
  return labels[type] || type.replace(/_/g, ' ');
};

export default Header;