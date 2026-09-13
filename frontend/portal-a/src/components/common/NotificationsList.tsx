// src/components/common/NotificationsList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaBell, 
  FaTimes, 
  FaCheck, 
  FaClipboardList, 
  FaPhone, 
  FaCreditCard, 
  FaSpinner,
  FaFileAlt,
  FaUsers,
  FaInfoCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

// ✅ واجهة الإشعارات المتطابقة مع الـ API
interface Notification {
  _id: string;
  title?: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: 'request' | 'call' | 'payment' | 'subscription' | 'system' | 'message' | 'file';
  data?: {
    requestId?: string;
    paymentId?: string;
    subscriptionId?: string;
    url?: string;
  };
}

interface NotificationsListProps {
  limit?: number;
  onNotificationClick?: (notification: Notification) => void;
  showViewAll?: boolean;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  limit = 10,
  onNotificationClick,
  showViewAll = true,
}) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ============================================================
  // ✅ جلب الإشعارات من الـ API
  // ============================================================

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.data || []);
      } else {
        setError(data.message || 'حدث خطأ في تحميل الإشعارات');
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setError('حدث خطأ في تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ============================================================
  // ✅ تحديد الإشعار كمقروء
  // ============================================================

  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
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
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // ============================================================
  // ✅ تحديد الكل كمقروء
  // ============================================================

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    setIsMarkingAll(true);
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
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
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // ============================================================
  // ✅ جلب الإشعارات عند التحميل
  // ============================================================

  useEffect(() => {
    fetchNotifications();

    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ============================================================
  // ✅ الحصول على أيقونة حسب النوع
  // ============================================================

  const getIcon = (type?: string) => {
    switch (type) {
      case 'request': return FaClipboardList;
      case 'call': return FaPhone;
      case 'payment': return FaCreditCard;
      case 'subscription': return FaUsers;
      case 'file': return FaFileAlt;
      case 'system': return FaInfoCircle;
      case 'message': return FaExclamationCircle;
      default: return FaBell;
    }
  };

  // ============================================================
  // ✅ الحصول على لون حسب النوع
  // ============================================================

  const getColor = (type?: string) => {
    switch (type) {
      case 'request': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'call': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
      case 'payment': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'subscription': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'file': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'system': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'message': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700/30 dark:text-gray-400';
    }
  };

  // ============================================================
  // ✅ تنسيق الوقت
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

  // ============================================================
  // ✅ معالجة النقر على الإشعار
  // ============================================================

  const handleNotificationClick = async (notification: Notification) => {
    // تحديد الإشعار كمقروء
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // استدعاء الدالة الخارجية إذا وجدت
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // ============================================================
  // ✅ حساب الإشعارات غير المقروءة
  // ============================================================

  const unreadCount = notifications.filter(n => !n.read).length;

  // ============================================================
  // ✅ عرض الإشعارات المحدودة
  // ============================================================

  const displayedNotifications = limit > 0 
    ? notifications.slice(0, limit) 
    : notifications;

  // ============================================================
  // ✅ حالة التحميل
  // ============================================================

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="w-6 h-6 text-purple-600 animate-spin" />
          <span className="mr-3 text-gray-500 dark:text-gray-400">جاري تحميل الإشعارات...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ حالة الخطأ
  // ============================================================

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <FaExclamationCircle className="text-3xl text-red-500 mx-auto mb-3" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ عرض قائمة الإشعارات
  // ============================================================

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      {/* رأس القائمة */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            الإشعارات
          </h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={isMarkingAll}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium transition disabled:opacity-50"
          >
            {isMarkingAll ? (
              <FaSpinner className="w-3 h-3 animate-spin inline ml-1" />
            ) : (
              'تحديد الكل كمقروء'
            )}
          </button>
        )}
      </div>

      {/* قائمة الإشعارات */}
      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <FaBell className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد إشعارات</p>
          <p className="text-xs text-gray-400 mt-1">ستظهر الإشعارات هنا عند ورودها</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {displayedNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const colorClass = getColor(notification.type);
            
            return (
              <div
                key={notification._id}
                className={`p-3 rounded-lg transition-all cursor-pointer ${
                  notification.read
                    ? 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {/* أيقونة */}
                  <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="text-sm" />
                  </div>
                  
                  {/* المحتوى */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                        {notification.title || notification.message.substring(0, 50)}
                        {notification.message.length > 50 && '...'}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                    
                    {notification.message && notification.title && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.type && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                          {notification.type === 'request' ? 'طلب' :
                           notification.type === 'payment' ? 'دفع' :
                           notification.type === 'subscription' ? 'اشتراك' :
                           notification.type === 'call' ? 'مكالمة' :
                           notification.type === 'file' ? 'ملف' :
                           notification.type === 'system' ? 'نظام' :
                           notification.type === 'message' ? 'رسالة' :
                           notification.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* زر عرض الكل */}
      {showViewAll && notifications.length > limit && limit > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              // التوجيه إلى صفحة الإشعارات
              window.location.href = '/dashboard/notifications';
            }}
            className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
          >
            عرض جميع الإشعارات ({notifications.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;