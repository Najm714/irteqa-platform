// frontend/portal-a/src/pages/Specialist/SpecialistDashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import {
  FaHome,
  FaFileAlt,
  FaUser,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaPlus,
  FaEye,
  FaUserCircle,
  FaComments,
  FaUpload,
  FaPhoneAlt,
  FaTasks,
  FaChartBar,
  FaArrowLeft,
  FaChevronLeft,
  FaCalendarAlt,
  FaFolderOpen,
  FaBolt,
  FaCheck,
  FaExclamationCircle,
  FaInfoCircle,
  FaExternalLinkAlt,
} from 'react-icons/fa';

import SpecialistRequests from './SpecialistRequests';
import SpecialistTasks from './SpecialistTasks';
import SpecialistCalls from './SpecialistCalls';
import SpecialistMessages from './SpecialistMessages';
import SpecialistFiles from './SpecialistFiles';
import SpecialistProfile from './SpecialistProfile';
import SpecialistSettings from './SpecialistSettings';

// ============================================================
// Helpers
// ============================================================

const formatDate = (date: string | Date) => {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
};

const formatTime = (date: string | Date) => {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

const getStatusBadge = (status: string) => {
  const statusMap: Record<
    string,
    { label: string; color: string; dot: string }
  > = {
    new: {
      label: 'جديد',
      color:
        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      dot: 'bg-blue-500',
    },
    under_review: {
      label: 'قيد المراجعة',
      color:
        'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      dot: 'bg-yellow-500',
    },
    assigned: {
      label: 'تم الإسناد',
      color:
        'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      dot: 'bg-purple-500',
    },
    scope_definition: {
      label: 'تحديد النطاق',
      color:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      dot: 'bg-indigo-500',
    },
    awaiting_approval: {
      label: 'بانتظار الموافقة',
      color:
        'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      dot: 'bg-orange-500',
    },
    awaiting_payment: {
      label: 'بانتظار الدفع',
      color:
        'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      dot: 'bg-pink-500',
    },
    in_progress: {
      label: 'قيد التنفيذ',
      color:
        'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      dot: 'bg-green-500',
    },
    under_review_2: {
      label: 'مراجعة التسليم',
      color:
        'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      dot: 'bg-cyan-500',
    },
    modification: {
      label: 'طلب تعديل',
      color:
        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      dot: 'bg-red-500',
    },
    completed: {
      label: 'مكتمل',
      color:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    closed: {
      label: 'مغلق',
      color:
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      dot: 'bg-gray-500',
    },
    cancelled: {
      label: 'ملغي',
      color:
        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      dot: 'bg-red-500',
    },
  };

  return (
    statusMap[status] || {
      label: status || 'غير محدد',
      color:
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      dot: 'bg-gray-500',
    }
  );
};

// ============================================================
// Interfaces
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

interface OverviewTabProps {
  stats: SpecialistStats;
  recentRequests: any[];
  notifications: any[];
  adminUser: ExtendedUser | null;
  onNavigate: (path: string) => void;
}

// ============================================================
// Main Component
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

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  const extendedUser = user as ExtendedUser | null;

  // ============================================================
  // Avatar
  // ============================================================

  const getAvatarUrl = useCallback(
    (avatarId?: string) => {
      if (!avatarId) return '';

      return `${API_URL}/files/public/${encodeURIComponent(
        avatarId
      )}?portalId=${encodeURIComponent(PORTAL_ID)}`;
    },
    [API_URL, PORTAL_ID]
  );

  // ============================================================
  // Notifications
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
      console.error(
        '❌ Error fetching specialist notifications:',
        error
      );
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
        console.log(
          '🔔 Specialist unread notifications:',
          data.count ?? data.unreadCount ?? 0
        );
      }
    } catch (error) {
      console.error(
        '❌ Error fetching unread notification count:',
        error
      );
    }
  }, [token, API_URL, PORTAL_ID]);

  // ============================================================
  // Active Tab
  // ============================================================

  useEffect(() => {
    const path = location.pathname;

    if (path.includes('/specialist/requests')) {
      setActiveTab('requests');
    } else if (path.includes('/specialist/tasks')) {
      setActiveTab('tasks');
    } else if (path.includes('/specialist/calls')) {
      setActiveTab('calls');
    } else if (path.includes('/specialist/messages')) {
      setActiveTab('messages');
    } else if (path.includes('/specialist/files')) {
      setActiveTab('files');
    } else if (path.includes('/specialist/profile')) {
      setActiveTab('profile');
    } else if (path.includes('/specialist/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  // ============================================================
  // Responsive Sidebar
  // ============================================================

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // ============================================================
  // Dashboard Data
  // ============================================================

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/dashboard/specialist-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        }
      );

      if (response.status === 401) {
        await logout();
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data);

        setRecentRequests(
          data.data?.recentRequests || []
        );
      }
    } catch (error) {
      console.error(
        '❌ Error fetching specialist dashboard:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, PORTAL_ID, logout, navigate]);

  // ============================================================
  // Initial Loading
  // ============================================================

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
      easing: 'ease-out-cubic',
    });

    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================
  // Notification Polling
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
  }, [
    token,
    fetchNotifications,
    fetchUnreadCount,
  ]);

  // ============================================================
  // Logout
  // ============================================================

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ============================================================
  // Unread notifications
  // ============================================================

  const unreadCount = notifications.filter(
    (notification: any) => notification.isRead === false
  ).length;

  // ============================================================
  // Menu
  // ============================================================

  const menuItems = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      icon: <FaHome />,
      path: '/specialist/dashboard',
    },
    {
      id: 'requests',
      label: 'طلباتي المسندة',
      icon: <FaFileAlt />,
      path: '/specialist/requests',
    },
    {
      id: 'tasks',
      label: 'المهام',
      icon: <FaTasks />,
      path: '/specialist/tasks',
    },
    {
      id: 'calls',
      label: 'المكالمات',
      icon: <FaPhoneAlt />,
      path: '/specialist/calls',
    },
    {
      id: 'messages',
      label: 'الرسائل',
      icon: <FaComments />,
      path: '/specialist/messages',
    },
    {
      id: 'files',
      label: 'الملفات',
      icon: <FaUpload />,
      path: '/specialist/files',
    },
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: <FaUser />,
      path: '/specialist/profile',
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: <FaCog />,
      path: '/specialist/settings',
    },
  ];

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>

          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            جاري تحميل لوحة المختص
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            يرجى الانتظار...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-gray-950 flex"
    >
      {/* ========================================================
          Sidebar
      ======================================================== */}

      <aside
        className={`
          fixed top-0 right-0 h-full w-72
          bg-white dark:bg-gray-900
          border-l border-gray-200 dark:border-gray-800
          shadow-xl z-50
          transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          md:translate-x-0 md:relative md:z-0
        `}
      >
        <div className="h-full flex flex-col">

          {/* Logo */}

          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20">
                إ
              </div>

              <div>
                <h1 className="font-black text-gray-900 dark:text-white text-lg">
                  ارتقاء
                </h1>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  لوحة المختص
                </p>
              </div>

            </div>
          </div>

          {/* User */}

          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 p-3">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0">

                  {extendedUser?.profile?.avatar ? (
                    <img
                      src={getAvatarUrl(
                        extendedUser.profile.avatar
                      )}
                      alt={extendedUser.fullName || 'مختص'}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none';
                      }}
                    />
                  ) : (
                    <FaUserCircle className="text-purple-600 dark:text-purple-400 text-3xl" />
                  )}

                </div>

                <div className="min-w-0 flex-1">

                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {extendedUser?.fullName || 'مختص'}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {extendedUser?.email || ''}
                  </p>

                  <span className="inline-flex mt-1.5 text-[11px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full font-semibold">
                    مختص
                  </span>

                </div>

              </div>

            </div>
          </div>

          {/* Navigation */}

          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">

            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(item.path);

                  if (isMobile) {
                    setSidebarOpen(false);
                  }
                }}
                className={`
                  w-full flex items-center gap-3
                  px-4 py-3 rounded-xl
                  transition-all duration-200
                  text-right
                  ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <span className="text-lg shrink-0">
                  {item.icon}
                </span>

                <span className="font-semibold text-sm">
                  {item.label}
                </span>

                {activeTab === item.id && (
                  <FaChevronLeft className="mr-auto text-xs opacity-80" />
                )}
              </button>
            ))}

          </nav>

          {/* Logout */}

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <FaSignOutAlt className="text-lg" />

              <span className="font-semibold text-sm">
                تسجيل الخروج
              </span>
            </button>

          </div>

        </div>
      </aside>

      {/* ========================================================
          Main
      ======================================================== */}

      <main className="flex-1 min-h-screen overflow-x-hidden">

        {/* Header */}

        <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-3">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition md:hidden"
              >
                <svg
                  className="w-6 h-6 text-gray-700 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">
                  {menuItems.find(
                    (item) => item.id === activeTab
                  )?.label || 'لوحة المختص'}
                </h2>

                {activeTab === 'overview' && (
                  <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    مرحبًا بك في لوحة التحكم الخاصة بك
                  </p>
                )}
              </div>

            </div>

            {/* Header Actions */}

            <div className="flex items-center gap-2">

              {/* Notifications */}

              <div className="relative">

                <button
                  onClick={() => {
                    const newState =
                      !showNotifications;

                    setShowNotifications(newState);

                    if (newState) {
                      fetchNotifications();
                      fetchUnreadCount();
                    }
                  }}
                  className="relative w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition"
                >
                  <FaBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />

                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                      {unreadCount > 99
                        ? '99+'
                        : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 md:right-0 md:left-auto top-full mt-3 w-[320px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50">

                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">

                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          الإشعارات
                        </h4>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          آخر التنبيهات الخاصة بك
                        </p>
                      </div>

                      <FaBell className="text-purple-500" />

                    </div>

                    {notifications.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">

                        {notifications
                          .slice(0, 10)
                          .map(
                            (
                              notif: any,
                              index: number
                            ) => (
                              <div
                                key={
                                  notif._id || index
                                }
                                className={`
                                  p-4 border-b border-gray-100 dark:border-gray-800
                                  hover:bg-gray-50 dark:hover:bg-gray-800/50
                                  transition
                                  ${
                                    !notif.isRead
                                      ? 'bg-purple-50/70 dark:bg-purple-900/10'
                                      : ''
                                  }
                                `}
                              >
                                <div className="flex gap-3">

                                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                    <FaBell className="text-sm" />
                                  </div>

                                  <div className="flex-1 min-w-0">

                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-6">
                                      {notif.messageAr ||
                                        notif.message ||
                                        notif.titleAr ||
                                        notif.title ||
                                        'إشعار جديد'}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatTime(
                                        notif.createdAt
                                      )}
                                    </p>

                                  </div>

                                </div>
                              </div>
                            )
                          )}

                      </div>
                    ) : (
                      <div className="p-8 text-center">

                        <FaBell className="mx-auto text-3xl text-gray-300 dark:text-gray-600 mb-3" />

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          لا توجد إشعارات
                        </p>

                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Avatar */}

              <button
                onClick={() =>
                  navigate('/specialist/profile')
                }
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden"
              >
                {extendedUser?.profile?.avatar ? (
                  <img
                    src={getAvatarUrl(
                      extendedUser.profile.avatar
                    )}
                    alt={extendedUser.fullName || 'مختص'}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        'none';
                    }}
                  />
                ) : (
                  <FaUserCircle className="text-purple-600 dark:text-purple-400 text-xl" />
                )}
              </button>

            </div>

          </div>
        </header>

        {/* Content */}

        <div className="p-4 md:p-6 lg:p-8">

          {activeTab === 'overview' && stats && (
            <OverviewTab
              stats={stats}
              recentRequests={recentRequests}
              notifications={notifications}
              adminUser={extendedUser}
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
// Overview
// ============================================================

const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  recentRequests,
  notifications,
  adminUser,
  onNavigate,
}) => {

  const statCards = [
    {
      title: 'الطلبات المسندة',
      value: stats?.totalAssigned || 0,
      icon: <FaFileAlt />,
      gradient: 'from-purple-600 to-violet-500',
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      route: '/specialist/requests',
    },
    {
      title: 'قيد التنفيذ',
      value: stats?.inProgress || 0,
      icon: <FaClock />,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      route: '/specialist/tasks',
    },
    {
      title: 'بانتظار المراجعة',
      value: stats?.pendingReview || 0,
      icon: <FaCheckCircle />,
      gradient: 'from-cyan-500 to-blue-500',
      bg: 'bg-cyan-50 dark:bg-cyan-900/10',
      route: '/specialist/requests',
    },
    {
      title: 'المهام المكتملة',
      value: stats?.completed || 0,
      icon: <FaCheck />,
      gradient: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/10',
      route: '/specialist/tasks',
    },
    {
      title: 'المكالمات القادمة',
      value: stats?.upcomingCalls || 0,
      icon: <FaPhoneAlt />,
      gradient: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      route: '/specialist/calls',
    },
    {
      title: 'الرسائل',
      value: stats?.totalMessages || 0,
      icon: <FaComments />,
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50 dark:bg-pink-900/10',
      route: '/specialist/messages',
    },
  ];

  const quickActions = [
    {
      title: 'الطلبات المسندة',
      description: 'متابعة وإدارة الطلبات',
      icon: <FaFileAlt />,
      route: '/specialist/requests',
    },
    {
      title: 'المهام',
      description: 'عرض المهام الحالية',
      icon: <FaTasks />,
      route: '/specialist/tasks',
    },
    {
      title: 'المكالمات',
      description: 'إدارة المكالمات',
      icon: <FaPhoneAlt />,
      route: '/specialist/calls',
    },
    {
      title: 'الرسائل',
      description: 'التواصل مع العملاء',
      icon: <FaComments />,
      route: '/specialist/messages',
    },
    {
      title: 'الملفات',
      description: 'إدارة الملفات والتسليمات',
      icon: <FaFolderOpen />,
      route: '/specialist/files',
    },
    {
      title: 'الملف الشخصي',
      description: 'تحديث بياناتك',
      icon: <FaUser />,
      route: '/specialist/profile',
    },
    {
      title: 'الإعدادات',
      description: 'إعدادات الحساب',
      icon: <FaCog />,
      route: '/specialist/settings',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ======================================================
          Welcome / Profile Hero
      ====================================================== */}

      <section
        data-aos="fade-up"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 p-6 md:p-8 text-white shadow-xl shadow-purple-500/10"
      >

        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-10 w-72 h-72 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          <div className="flex items-center gap-4 md:gap-5">

            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden shrink-0">

              {adminUser?.profile?.avatar ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/files/public/${encodeURIComponent(
                    adminUser.profile.avatar
                  )}?portalId=${encodeURIComponent(
                    import.meta.env.VITE_PORTAL_ID || ''
                  )}`}
                  alt={adminUser.fullName || 'مختص'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUserCircle className="text-6xl text-white/90" />
              )}

            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2 mb-2">

                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold">
                  لوحة المختص
                </span>

                <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-200/20 text-xs font-semibold">
                  نشط
                </span>

              </div>

              <h1 className="text-2xl md:text-3xl font-black">
                مرحبًا، {adminUser?.fullName || 'مختص'}
              </h1>

              <p className="text-white/75 text-sm mt-2">
                تابع طلباتك ومهامك وتواصل مع العملاء من مكان واحد.
              </p>

              {adminUser?.email && (
                <p className="text-white/60 text-xs mt-2">
                  {adminUser.email}
                </p>
              )}

            </div>

          </div>

          <button
            onClick={() =>
              onNavigate('/specialist/profile')
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-purple-700 hover:bg-purple-50 transition font-bold text-sm shadow-lg"
          >
            <FaUser />
            الملف الشخصي
          </button>

        </div>

      </section>

      {/* ======================================================
          Request Room
      ====================================================== */}

      <section
        data-aos="fade-up"
        data-aos-delay="50"
        className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
      >

        <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-800">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FaFileAlt />
              </div>

              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  غرفة الطلبات
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  جميع الطلبات المسندة إليك ومراحل العمل الحالية
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                onNavigate('/specialist/requests')
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition"
            >
              فتح الطلبات
              <FaArrowLeft className="text-xs" />
            </button>

          </div>

        </div>

        <div className="p-5 md:p-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            <RequestRoomItem
              title="إجمالي الطلبات"
              value={stats?.totalAssigned || 0}
              icon={<FaFileAlt />}
              className="text-purple-600 bg-purple-50 dark:bg-purple-900/10"
            />

            <RequestRoomItem
              title="قيد التنفيذ"
              value={stats?.inProgress || 0}
              icon={<FaClock />}
              className="text-amber-600 bg-amber-50 dark:bg-amber-900/10"
            />

            <RequestRoomItem
              title="بانتظار المراجعة"
              value={stats?.pendingReview || 0}
              icon={<FaExclamationCircle />}
              className="text-orange-600 bg-orange-50 dark:bg-orange-900/10"
            />

            <RequestRoomItem
              title="مكتملة"
              value={stats?.completed || 0}
              icon={<FaCheckCircle />}
              className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10"
            />

          </div>

        </div>

      </section>

      {/* ======================================================
          Statistics
      ====================================================== */}

      <section data-aos="fade-up" data-aos-delay="100">

        <SectionHeader
          icon={<FaChartBar />}
          title="الإحصائيات"
          description="ملخص سريع لأدائك وحالة أعمالك"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

          {statCards.map((card) => (
            <button
              key={card.title}
              onClick={() =>
                onNavigate(card.route)
              }
              className={`
                group text-right
                ${card.bg}
                rounded-2xl p-5
                border border-gray-200 dark:border-gray-800
                hover:-translate-y-1
                hover:shadow-lg
                transition-all duration-200
              `}
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>

                  <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>

                </div>

                <div
                  className={`
                    w-12 h-12 rounded-2xl
                    bg-gradient-to-br ${card.gradient}
                    text-white
                    flex items-center justify-center
                    text-lg shadow-lg
                    group-hover:scale-110
                    transition-transform
                  `}
                >
                  {card.icon}
                </div>

              </div>

              <div className="flex items-center justify-between mt-5">

                <span className="text-xs text-gray-400">
                  عرض التفاصيل
                </span>

                <FaArrowLeft className="text-xs text-gray-400 group-hover:text-purple-600 transition" />

              </div>

            </button>
          ))}

        </div>

      </section>

      {/* ======================================================
          Quick Actions
      ====================================================== */}

      <section data-aos="fade-up" data-aos-delay="150">

        <SectionHeader
          icon={<FaBolt />}
          title="إجراءات سريعة"
          description="الوصول السريع إلى أهم أقسام لوحة المختص"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">

          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() =>
                onNavigate(action.route)
              }
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-right hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >

              <div className="flex items-center justify-between mb-4">

                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                  {action.icon}
                </div>

                <FaArrowLeft className="text-gray-300 group-hover:text-purple-500 transition" />

              </div>

              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {action.title}
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-5">
                {action.description}
              </p>

            </button>
          ))}

        </div>

      </section>

      {/* ======================================================
          Recent Requests + Recent Activity
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Requests */}

        <section
          data-aos="fade-up"
          data-aos-delay="200"
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
        >

          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">

            <div>

              <h2 className="font-black text-gray-900 dark:text-white">
                آخر الطلبات المسندة
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                أحدث الطلبات التي تم إسنادها إليك
              </p>

            </div>

            <button
              onClick={() =>
                onNavigate('/specialist/requests')
              }
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              عرض الكل
              <FaArrowLeft />
            </button>

          </div>

          {recentRequests.length > 0 ? (

            <div className="divide-y divide-gray-100 dark:divide-gray-800">

              {recentRequests
                .slice(0, 5)
                .map(
                  (request, index) => {
                    const status =
                      getStatusBadge(
                        request.status
                      );

                    return (
                      <button
                        key={
                          request._id ||
                          index
                        }
                        onClick={() =>
                          onNavigate(
                            `/request/${request._id}`
                          )
                        }
                        className="w-full text-right p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group"
                      >

                        <div className="flex items-start gap-3">

                          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <FaFileAlt className="text-sm" />
                          </div>

                          <div className="flex-1 min-w-0">

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                  {request.title ||
                                    'طلب بدون عنوان'}
                                </h3>

                                <div className="flex flex-wrap items-center gap-2 mt-1.5">

                                  {request.serviceName && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {request.serviceName}
                                    </span>
                                  )}

                                  <span className="text-gray-300">
                                    •
                                  </span>

                                  <span className="text-xs text-gray-400">
                                    {formatDate(
                                      request.createdAt
                                    )}
                                  </span>

                                </div>

                              </div>

                              <FaEye className="text-gray-300 group-hover:text-purple-500 transition shrink-0 mt-1" />

                            </div>

                            <div className="mt-3">

                              <span
                                className={`
                                  inline-flex items-center gap-1.5
                                  px-2.5 py-1
                                  rounded-full
                                  text-[11px]
                                  font-bold
                                  ${status.color}
                                `}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                                />
                                {status.label}
                              </span>

                            </div>

                          </div>

                        </div>

                      </button>
                    );
                  }
                )}

            </div>

          ) : (

            <div className="py-12 px-6 text-center">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <FaFileAlt className="text-xl text-gray-400" />
              </div>

              <p className="font-semibold text-gray-700 dark:text-gray-300">
                لا توجد طلبات مسندة حاليًا
              </p>

              <p className="text-xs text-gray-400 mt-1">
                ستظهر الطلبات الجديدة هنا عند إسنادها إليك.
              </p>

            </div>

          )}

        </section>

        {/* Recent Activity */}

        <section
          data-aos="fade-up"
          data-aos-delay="250"
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
        >

          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">

            <div>

              <h2 className="font-black text-gray-900 dark:text-white">
                آخر النشاطات
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                أحدث التحديثات والتنبيهات الخاصة بك
              </p>

            </div>

            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FaBell />
            </div>

          </div>

          {notifications.length > 0 ? (

            <div className="divide-y divide-gray-100 dark:divide-gray-800">

              {notifications
                .slice(0, 6)
                .map(
                  (
                    notification: any,
                    index: number
                  ) => (

                    <div
                      key={
                        notification._id ||
                        index
                      }
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >

                      <div className="flex gap-3">

                        <div
                          className={`
                            w-9 h-9 rounded-xl
                            flex items-center justify-center
                            shrink-0
                            ${
                              notification.isRead
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            }
                          `}
                        >
                          <FaBell className="text-sm" />
                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-start justify-between gap-3">

                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-6">
                              {notification.messageAr ||
                                notification.message ||
                                notification.titleAr ||
                                notification.title ||
                                'تحديث جديد'}
                            </p>

                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-2" />
                            )}

                          </div>

                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">

                            <FaCalendarAlt className="text-[10px]" />

                            <span>
                              {formatDate(
                                notification.createdAt
                              )}
                            </span>

                            <span>•</span>

                            <span>
                              {formatTime(
                                notification.createdAt
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                  )
                )}

            </div>

          ) : (

            <div className="py-12 px-6 text-center">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <FaBell className="text-xl text-gray-400" />
              </div>

              <p className="font-semibold text-gray-700 dark:text-gray-300">
                لا توجد نشاطات حديثة
              </p>

              <p className="text-xs text-gray-400 mt-1">
                ستظهر آخر التحديثات والإشعارات هنا.
              </p>

            </div>

          )}

        </section>

      </div>

      {/* ======================================================
          Footer Summary
      ====================================================== */}

      <section
        data-aos="fade-up"
        className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-900 dark:to-black p-5 text-white"
      >

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FaInfoCircle />
            </div>

            <div>

              <p className="font-bold text-sm">
                مساحة العمل الخاصة بك
              </p>

              <p className="text-xs text-gray-400 mt-1">
                يمكنك إدارة الطلبات والمهام والمكالمات والرسائل والملفات من القائمة الجانبية.
              </p>

            </div>

          </div>

          <button
            onClick={() =>
              onNavigate('/specialist/requests')
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-gray-900 hover:bg-gray-100 transition text-sm font-bold"
          >
            الذهاب إلى الطلبات
            <FaExternalLinkAlt className="text-xs" />
          </button>

        </div>

      </section>

    </div>
  );
};

// ============================================================
// Reusable UI
// ============================================================

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="flex items-center gap-3 mb-4">

      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
        {icon}
      </div>

      <div>

        <h2 className="font-black text-gray-900 dark:text-white">
          {title}
        </h2>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>

      </div>

    </div>
  );
};

interface RequestRoomItemProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}

const RequestRoomItem: React.FC<RequestRoomItemProps> = ({
  title,
  value,
  icon,
  className,
}) => {
  return (
    <div
      className={`
        rounded-2xl p-4
        ${className}
        border border-black/5 dark:border-white/5
      `}
    >

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {value}
          </p>

        </div>

        <div className="w-9 h-9 rounded-xl bg-white/80 dark:bg-gray-800/70 flex items-center justify-center">
          {icon}
        </div>

      </div>

    </div>
  );
};

export default SpecialistDashboard;
