// frontend/portal-a/src/pages/Dashboard/Notifications.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, 
  FaSpinner, 
  FaCheckCircle, 
  FaClock, 
  FaFileAlt, 
  FaComments, 
  FaCreditCard, 
  FaUser, 
  FaTrash, 
  FaCheckDouble,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationCircle,
  FaUsers,
  FaPhone,
  FaEye,
  FaEnvelope,
  FaCalendarCheck,
  FaEdit,
  FaDownload,
  FaStar,
  FaReply,
  FaVideo,
} from 'react-icons/fa';

// ✅ واجهة الإشعار المتطابقة مع نموذج الـ Backend
interface Notification {
  _id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: string; // request_created, request_assigned, payment_received, etc.
  isRead: boolean;
  isDelivered?: boolean;
  channels?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
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
  createdAt: string;
  expiresAt?: string;
}

const Notifications: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ============================================================
  // ✅ جلب الإشعارات
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
        throw new Error(`HTTP ${response.status}`);
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
  // ✅ تحديد إشعار كمقروء
  // ============================================================

  const markAsRead = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH', // ✅ كما هو محدد في الـ routes
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
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
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
        method: 'PATCH', // ✅ كما هو محدد في الـ routes
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
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // ============================================================
  // ✅ حذف إشعار
  // ============================================================

  const deleteNotification = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
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
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  };

  // ============================================================
  // ✅ الحصول على أيقونة حسب نوع الإشعار (من الـ Backend)
  // ============================================================

  const getTypeIcon = (type: string) => {
    // أنواع الطلبات
    if (type.includes('request')) {
      switch (type) {
        case 'request_created': return <FaFileAlt className="text-blue-500" />;
        case 'request_assigned': return <FaUser className="text-purple-500" />;
        case 'request_updated': return <FaEdit className="text-yellow-500" />;
        case 'request_completed': return <FaCheckCircle className="text-green-500" />;
        case 'request_cancelled': return <FaTimesCircle className="text-red-500" />;
        default: return <FaFileAlt className="text-blue-500" />;
      }
    }
    
    // أنواع المدفوعات
    if (type.includes('payment')) {
      switch (type) {
        case 'payment_received': return <FaCreditCard className="text-green-500" />;
        case 'payment_verified': return <FaCheckCircle className="text-emerald-500" />;
        case 'payment_failed': return <FaTimesCircle className="text-red-500" />;
        default: return <FaCreditCard className="text-green-500" />;
      }
    }
    
    // أنواع الاشتراكات
    if (type.includes('subscription')) {
      switch (type) {
        case 'subscription_created': return <FaUsers className="text-purple-500" />;
        case 'subscription_expiring': return <FaClock className="text-yellow-500" />;
        case 'subscription_expired': return <FaTimesCircle className="text-red-500" />;
        case 'subscription_cancelled': return <FaTimesCircle className="text-orange-500" />;
        default: return <FaUsers className="text-purple-500" />;
      }
    }
    
    // أنواع الرسائل والمكالمات
    if (type === 'new_message') return <FaComments className="text-emerald-500" />;
    if (type === 'new_call') return <FaPhone className="text-indigo-500" />;
    if (type === 'call_scheduled') return <FaCalendarCheck className="text-indigo-500" />;
    
    // أنواع المحتوى
    if (type === 'content_available') return <FaVideo className="text-pink-500" />;
    if (type === 'delivery_submitted') return <FaDownload className="text-orange-500" />;
    if (type === 'delivery_reviewed') return <FaStar className="text-yellow-500" />;
    if (type === 'modification_requested') return <FaEdit className="text-orange-500" />;
    
    // أنواع النظام
    if (type === 'system_alert') return <FaExclamationCircle className="text-red-500" />;
    if (type === 'support_reply') return <FaReply className="text-blue-500" />;
    if (type === 'scope_approved') return <FaCheckCircle className="text-green-500" />;
    if (type === 'review_requested') return <FaStar className="text-yellow-500" />;
    
    // افتراضي
    return <FaBell className="text-purple-500" />;
  };

  // ============================================================
  // ✅ الحصول على لون الخلفية حسب نوع الإشعار
  // ============================================================

  const getTypeColor = (type: string) => {
    if (type.includes('request') || type === 'support_reply' || type === 'review_requested') {
      return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
    if (type.includes('payment') || type === 'subscription_created') {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }
    if (type.includes('expiring') || type === 'modification_requested') {
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    }
    if (type.includes('expired') || type.includes('cancelled') || type.includes('failed') || type === 'system_alert') {
      return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    }
    if (type.includes('call') || type === 'new_message') {
      return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
    }
    if (type.includes('content') || type === 'delivery_submitted') {
      return 'border-pink-500 bg-pink-50 dark:bg-pink-900/20';
    }
    return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
  };

  // ============================================================
  // ✅ الحصول على تسمية النوع بالعربية
  // ============================================================

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'request_created': 'طلب جديد',
      'request_assigned': 'تم إسناد الطلب',
      'request_updated': 'تحديث الطلب',
      'request_completed': 'اكتمال الطلب',
      'request_cancelled': 'إلغاء الطلب',
      'scope_approved': 'اعتماد النطاق',
      'payment_received': 'استلام الدفع',
      'payment_verified': 'تأكيد الدفع',
      'payment_failed': 'فشل الدفع',
      'new_message': 'رسالة جديدة',
      'new_call': 'مكالمة جديدة',
      'call_scheduled': 'مكالمة مجدولة',
      'delivery_submitted': 'تسليم مكتمل',
      'delivery_reviewed': 'مراجعة التسليم',
      'modification_requested': 'طلب تعديل',
      'subscription_created': 'اشتراك جديد',
      'subscription_expiring': 'اشتراك على وشك الانتهاء',
      'subscription_expired': 'انتهاء الاشتراك',
      'subscription_cancelled': 'إلغاء الاشتراك',
      'content_available': 'محتوى جديد',
      'review_requested': 'طلب تقييم',
      'system_alert': 'تنبيه النظام',
      'support_reply': 'رد الدعم',
    };
    return labels[type] || type.replace(/_/g, ' ');
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
      if (minutes < 60) return `${minutes} دقيقة`;
      if (hours < 24) return `${hours} ساعة`;
      if (days < 7) return `${days} يوم`;
      if (days < 30) return `${Math.floor(days / 7)} أسبوع`;
      return notifDate.toLocaleDateString('ar-SA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
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
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

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
  // ✅ جلب الإشعارات عند التحميل وتحديثها دورياً
  // ============================================================

  useEffect(() => {
    fetchNotifications();

    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ============================================================
  // ✅ حساب الإشعارات غير المقروءة (باستخدام isRead)
  // ============================================================

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ============================================================
  // ✅ تصفية الإشعارات (باستخدام isRead)
  // ============================================================

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  // ============================================================
  // ✅ حالة التحميل
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="mr-3 text-gray-500 dark:text-gray-400">جاري تحميل الإشعارات...</span>
      </div>
    );
  }

  // ============================================================
  // ✅ حالة الخطأ
  // ============================================================

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center border border-red-200 dark:border-red-800">
        <FaTimesCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={fetchNotifications}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // ============================================================
  // ✅ عرض الصفحة
  // ============================================================

  return (
    <div className="space-y-4" data-aos="fade-up">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaBell className="text-purple-600" />
            الإشعارات
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} غير مقروء
              </span>
            )}
          </h3>
          <span className="text-sm text-gray-400">
            ({notifications.length} إشعار)
          </span>
        </div>

        {/* أزرار التحكم */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
            className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-sm"
          >
            <option value="all">الكل</option>
            <option value="unread">غير مقروء ({unreadCount})</option>
            <option value="read">مقروء</option>
          </select>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={isMarkingAll}
              className="px-3 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition disabled:opacity-50 flex items-center gap-1 text-sm"
            >
              {isMarkingAll ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaCheckDouble className="w-4 h-4" />
              )}
              تعيين الكل كمقروء
            </button>
          )}
        </div>
      </div>

      {/* قائمة الإشعارات */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-xl border-r-4 transition-all cursor-pointer ${
                getTypeColor(notification.type)
              } ${
                !notification.isRead 
                  ? 'shadow-md hover:shadow-lg' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between gap-3">
                {/* المحتوى */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* أيقونة */}
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                    
                    {/* العنوان */}
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {notification.titleAr || notification.title}
                    </h4>

                    {/* علامة جديدة */}
                    {!notification.isRead && (
                      <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        جديد
                      </span>
                    )}
                  </div>

                  {/* الرسالة */}
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm line-clamp-2">
                    {notification.messageAr || notification.message}
                  </p>

                  {/* التفاصيل السفلية */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>{formatTime(notification.createdAt)}</span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                      {getTypeLabel(notification.type)}
                    </span>
                    {notification.priority === 'high' && (
                      <span className="text-red-500">⚡ عاجل</span>
                    )}
                    {notification.priority === 'urgent' && (
                      <span className="text-red-600 font-bold">🔴 طارئ</span>
                    )}
                    {notification.data?.requestId && (
                      <span className="flex items-center gap-1 text-purple-500">
                        <FaEye className="w-3 h-3" />
                        عرض الطلب
                      </span>
                    )}
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex gap-1 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition"
                      title="تعيين كمقروء"
                    >
                      <FaCheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition"
                    title="حذف"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* حالة عدم وجود إشعارات */
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBell className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'unread' 
              ? 'جميع الإشعارات قد تمت قراءتها' 
              : 'سيتم عرض الإشعارات هنا عند ورودها'}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              عرض جميع الإشعارات
            </button>
          )}
        </div>
      )}

      {/* عدد الإشعارات في الأسفل */}
      {filteredNotifications.length > 5 && (
        <div className="text-center text-sm text-gray-400 pt-2">
          عرض {filteredNotifications.length} من {notifications.length} إشعار
        </div>
      )}
    </div>
  );
};

export default Notifications;