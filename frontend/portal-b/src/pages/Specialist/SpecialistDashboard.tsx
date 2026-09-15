// frontend/portal-a/src/pages/Specialist/SpecialistDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaHome, FaFileAlt, FaUser, FaCog, FaBell, FaSignOutAlt,
  FaSpinner, FaClock, FaCheckCircle, FaTimesCircle, FaPlus,
  FaEye, FaUserCircle, FaEnvelope, FaPhone, FaGlobe,
  FaLock, FaSave, FaCamera, FaUpload, FaComments,
  FaMapMarkerAlt, FaMoneyBill, FaCalendarAlt, FaTasks,
  FaVideo, FaPhoneAlt, FaUsers, FaChartBar,
} from 'react-icons/fa';

// ✅ استيراد المكونات المنفصلة
import SpecialistRequests from './SpecialistRequests';
import SpecialistTasks from './SpecialistTasks';
import SpecialistCalls from './SpecialistCalls';
import SpecialistMessages from './SpecialistMessages';
import SpecialistFiles from './SpecialistFiles';
import SpecialistProfile from './SpecialistProfile';
import SpecialistSettings from './SpecialistSettings';

// ============================================================
// ✅ دوال مساعدة
// ============================================================

const formatDate = (date: string | Date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: string | Date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    'new': { label: 'جديد', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'under_review': { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'assigned': { label: 'تم الإسناد', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    'scope_definition': { label: 'تحديد النطاق', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    'awaiting_approval': { label: 'بانتظار الموافقة', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    'awaiting_payment': { label: 'بانتظار الدفع', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
    'in_progress': { label: 'قيد التنفيذ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'under_review_2': { label: 'مراجعة التسليم', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    'modification': { label: 'طلب تعديل', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    'completed': { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'closed': { label: 'مغلق', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
};

// ============================================================
// ✅ واجهة المستخدم
// ============================================================

interface ExtendedUser {
  id?: string;
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  profile?: {
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  };
}

interface SpecialistStats {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  pendingReview: number;
  upcomingCalls: number;
  totalMessages: number;
  totalFiles: number;
  recentRequests: any[];
  notifications: any[];
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const SpecialistDashboard: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [stats, setStats] = useState<SpecialistStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

const getAvatarUrl = (avatarId: string | undefined) => {
  if (!avatarId) return null;

  return `${API_URL}/files/public/${avatarId}?portalId=${PORTAL_ID}`;
};
  // ============================================================
  // 🔔 نظام الإشعارات
  // ============================================================

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  }, [token, API_URL, PORTAL_ID]);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications/unread/count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const count = data.count ?? data.unreadCount ?? 0;

        // تحديث الإشعارات الموجودة محليًا لاستخدام العدد الصحيح
        setNotifications((current) => {
          if (!current.length) return current;
          return current;
        });

        console.log('🔔 Specialist unread notifications:', count);
      }
    } catch (error) {
      console.error('❌ Error fetching unread notification count:', error);
    }
  }, [token, API_URL, PORTAL_ID]);

  // ✅ تحديد التبويب النشط
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/specialist/requests')) setActiveTab('requests');
    else if (path.includes('/specialist/tasks')) setActiveTab('tasks');
    else if (path.includes('/specialist/calls')) setActiveTab('calls');
    else if (path.includes('/specialist/messages')) setActiveTab('messages');
    else if (path.includes('/specialist/files')) setActiveTab('files');
    else if (path.includes('/specialist/profile')) setActiveTab('profile');
    else if (path.includes('/specialist/settings')) setActiveTab('settings');
    else setActiveTab('overview');
  }, [location.pathname]);

  // ===== التحقق من حجم الشاشة =====
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== جلب بيانات لوحة التحكم =====
  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/dashboard/specialist-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setRecentRequests(data.data.recentRequests || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, PORTAL_ID]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchDashboardData();
  }, [fetchDashboardData]);

    // ============================================================
  // 🔔 تحميل الإشعارات وتحديث العدد دوريًا
  // ============================================================

  useEffect(() => {
    if (!token) return;

    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        fetchUnreadCount();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [token, fetchNotifications, fetchUnreadCount]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const extendedUser = user as ExtendedUser;
const unreadCount = notifications.filter(
  (n: any) => n.isRead === false
).length;

  const menuItems = [
    { id: 'overview', label: 'نظرة عامة', icon: <FaHome />, path: '/specialist/dashboard' },
    { id: 'requests', label: 'طلباتي المسندة', icon: <FaFileAlt />, path: '/specialist/requests' },
    { id: 'tasks', label: 'المهام', icon: <FaTasks />, path: '/specialist/tasks' },
    { id: 'calls', label: 'المكالمات', icon: <FaPhoneAlt />, path: '/specialist/calls' },
    { id: 'messages', label: 'الرسائل', icon: <FaComments />, path: '/specialist/messages' },
    { id: 'files', label: 'الملفات', icon: <FaUpload />, path: '/specialist/files' },
    { id: 'profile', label: 'الملف الشخصي', icon: <FaUser />, path: '/specialist/profile' },
    { id: 'settings', label: 'الإعدادات', icon: <FaCog />, path: '/specialist/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* ===== القائمة الجانبية ===== */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl z-50 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0 md:relative md:z-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg">إ</div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white text-lg">ارتقاء</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">لوحة المختص</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-2xl overflow-hidden">
                {extendedUser?.profile?.avatar ? (
                  <img
                    src={getAvatarUrl(extendedUser.profile.avatar)}
                    alt={extendedUser?.fullName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <FaUserCircle className="text-purple-600 dark:text-purple-400 text-3xl" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{extendedUser?.fullName || 'مختص'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{extendedUser?.email}</p>
                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full">مختص</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(item.path);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <FaSignOutAlt className="text-lg" />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== المحتوى الرئيسي ===== */}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition md:hidden">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {menuItems.find(item => item.id === activeTab)?.label || 'لوحة المختص'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
  onClick={() => {
    const newState = !showNotifications;
    setShowNotifications(newState);

    if (newState) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }}
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition relative">
                  <FaBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white">الإشعارات</h4>
                    </div>
                    {notifications.length > 0 ? (
                      notifications.slice(0, 10).map((notif: any, index: number) => (
                        <div key={index} className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition ${!notif.isRead ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
  {notif.messageAr || notif.message || notif.titleAr || notif.title}
</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400"><p>لا توجد إشعارات</p></div>
                    )}
                  </div>
                )}
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden">
                {extendedUser?.profile?.avatar ? (
                  <img
                    src={getAvatarUrl(extendedUser.profile.avatar)}
                    alt={extendedUser?.fullName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <FaUserCircle className="text-purple-600 dark:text-purple-400 text-xl" />
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'overview' && stats && (
            <OverviewTab 
              stats={stats} 
              recentRequests={recentRequests} 
              onNavigate={navigate} 
            />
          )}
          {activeTab === 'requests' && (
            <SpecialistRequests />
          )}
          {activeTab === 'tasks' && (
            <SpecialistTasks />
          )}
          {activeTab === 'calls' && (
            <SpecialistCalls />
          )}
          {activeTab === 'messages' && (
            <SpecialistMessages />
          )}
          {activeTab === 'files' && (
            <SpecialistFiles />
          )}
          {activeTab === 'profile' && (
            <SpecialistProfile />
          )}
          {activeTab === 'settings' && (
            <SpecialistSettings />
          )}
        </div>
      </main>
    </div>
  );
};

// ============================================================
// ✅ تبويب نظرة عامة
// ============================================================

interface OverviewTabProps {
  stats: SpecialistStats;
  recentRequests: any[];
  onNavigate: (path: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats, recentRequests, onNavigate }) => {
  const statCards = [
    { title: 'الطلبات المسندة', value: stats?.totalAssigned || 0, icon: <FaFileAlt className="text-purple-600" />, bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'قيد التنفيذ', value: stats?.inProgress || 0, icon: <FaClock className="text-yellow-600" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { title: 'بانتظار المراجعة', value: stats?.pendingReview || 0, icon: <FaCheckCircle className="text-orange-600" />, bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { title: 'مكتملة', value: stats?.completed || 0, icon: <FaCheckCircle className="text-green-600" />, bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'مكالمات قادمة', value: stats?.upcomingCalls || 0, icon: <FaPhoneAlt className="text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'رسائل غير مقروءة', value: stats?.totalMessages || 0, icon: <FaComments className="text-pink-600" />, bg: 'bg-pink-50 dark:bg-pink-900/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className={`${card.bg} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-2xl shadow-sm">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">📋 آخر الطلبات المسندة</h3>
          <button onClick={() => onNavigate('/specialist/requests')} className="text-sm text-purple-600 hover:text-purple-700">عرض الكل</button>
        </div>
        {recentRequests.length > 0 ? (
          <div className="space-y-3">
            {recentRequests.slice(0, 5).map((request, index) => {
              const status = getStatusBadge(request.status);
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-pointer" onClick={() => onNavigate(`/request/${request._id}`)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{request.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{request.serviceName}</span>
                      <span>•</span>
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                  <FaEye className="text-gray-400 hover:text-purple-600 transition" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>لا توجد طلبات مسندة</p></div>
        )}
      </div>
    </div>
  );
};

export default SpecialistDashboard;