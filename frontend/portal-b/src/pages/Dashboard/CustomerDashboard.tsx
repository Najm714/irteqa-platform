// frontend/portal-a/src/pages/Dashboard/CustomerDashboard.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';

import {
  FaHome,
  FaFileAlt,
  FaCreditCard,
  FaUser,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaSpinner,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaEye,
  FaUserCircle,
  FaGlobe,
  FaLock,
  FaSave,
  FaCamera,
  FaMapMarkerAlt,
  FaMoneyBill,
  FaTimes,
  FaSearch,
  FaArrowLeft,
  FaArrowUp,
  FaChartLine,
  FaRocket,
  FaCalendarAlt,
  FaReceipt,
  FaBookOpen,
  FaChevronLeft,
  FaShieldAlt,
} from 'react-icons/fa';

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

const formatDateTime = (date: string | Date) => {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
    {
      label: string;
      color: string;
    }
  > = {
    new: {
      label: 'جديد',
      color:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    under_review: {
      label: 'قيد المراجعة',
      color:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    assigned: {
      label: 'تم الإسناد',
      color:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    in_progress: {
      label: 'قيد التنفيذ',
      color:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    completed: {
      label: 'مكتمل',
      color:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    cancelled: {
      label: 'ملغي',
      color:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    closed: {
      label: 'مغلق',
      color:
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
    active: {
      label: 'نشط',
      color:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    pending: {
      label: 'قيد الانتظار',
      color:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    expired: {
      label: 'منتهي',
      color:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    paid: {
      label: 'مدفوع',
      color:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    failed: {
      label: 'فشل',
      color:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    refunded: {
      label: 'مسترجع',
      color:
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
    verified: {
      label: 'مؤكد',
      color:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    rejected: {
      label: 'مرفوض',
      color:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    submitted: {
      label: 'مرسل',
      color:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
  };

  return (
    statusMap[status] || {
      label: status,
      color:
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
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

interface DashboardStats {
  totalRequests: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalPayments: number;
  totalAmount: number;
  paidPayments: number;
  pendingPayments: number;
  recentRequests: any[];
  recentNotifications: any[];
}

interface Request {
  _id: string;
  requestNumber: string;
  title: string;
  status: string;
  serviceName: string;
  specialistName?: string;
  createdAt: string;
  price?: number;
  files?: any[];
  service?: {
    nameAr?: string;
    name?: string;
  };
}

interface Subscription {
  _id: string;
  materialId?: {
    nameAr?: string;
    name?: string;
    code?: string;
  };
  status: string;
  price: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  reference: string;
  createdAt: string;
}

interface Notification {
  _id: string;
  title?: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  isRead: boolean;
  type?: string;
  createdAt: string;
  data?: any;
}

// ============================================================
// Main Dashboard
// ============================================================

const CustomerDashboard: React.FC = () => {
  const { token, user, logout } = useAuth();
  const {
    isOpen,
    close,
    isMobile,
    sidebarType,
    setSidebarType,
  } = useSidebar();

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  const showDashboardSidebar =
    isOpen && sidebarType === 'dashboard';

  const extendedUser = user as ExtendedUser;

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
  // Dashboard data
  // ============================================================

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      if (response.status === 401) {
        await logout();
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data);

        if (data.data?.recentNotifications) {
          setNotifications(data.data.recentNotifications);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    API_URL,
    PORTAL_ID,
    logout,
    navigate,
  ]);

  // ============================================================
  // Sidebar
  // ============================================================

  useEffect(() => {
    setSidebarType('dashboard');

    return () => {
      setSidebarType('main');
    };
  }, [setSidebarType]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================
  // Logout
  // ============================================================

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ============================================================
  // Navigation
  // ============================================================

  const menuItems = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      icon: <FaHome />,
    },
    {
      id: 'requests',
      label: 'طلباتي',
      icon: <FaFileAlt />,
    },
    {
      id: 'payments',
      label: 'المدفوعات',
      icon: <FaCreditCard />,
    },
    {
      id: 'notifications',
      label: 'الإشعارات',
      icon: <FaBell />,
    },
    {
      id: 'addresses',
      label: 'العناوين',
      icon: <FaMapMarkerAlt />,
    },
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: <FaUser />,
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: <FaCog />,
    },
  ];

  const activeTab = useMemo(() => {
    const path = location.pathname;

    if (path === '/dashboard' || path === '/dashboard/') {
      return 'overview';
    }

    if (path.startsWith('/dashboard/requests')) {
      return 'requests';
    }

    if (path.startsWith('/dashboard/subscriptions')) {
      return 'subscriptions';
    }

    if (path.startsWith('/dashboard/payments')) {
      return 'payments';
    }

    if (path.startsWith('/dashboard/notifications')) {
      return 'notifications';
    }

    if (path.startsWith('/dashboard/addresses')) {
      return 'addresses';
    }

    if (path.startsWith('/dashboard/profile')) {
      return 'profile';
    }

    if (path.startsWith('/dashboard/settings')) {
      return 'settings';
    }

    return 'overview';
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    navigate(path);

    if (isMobile) {
      close();
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100 dark:border-purple-900/40" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 border-r-pink-500 animate-spin" />
          </div>

          <h3 className="font-bold text-gray-800 dark:text-white">
            جاري تحميل لوحة التحكم
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            يرجى الانتظار...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Main
  // ============================================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col"
    >
      <Header />

      <div className="flex flex-1 relative">
        {/* ======================================================
            Sidebar
        ====================================================== */}

        <aside
          className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 ease-in-out ${
            showDashboardSidebar
              ? 'translate-x-0'
              : 'translate-x-full'
          } md:translate-x-0 md:relative md:z-0 md:shadow-none`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}

            <div className="p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20">
                  إ
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="font-black text-gray-900 dark:text-white text-lg">
                    ارتقاء
                  </h1>

                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    لوحة العميل
                  </p>
                </div>

                {isMobile && (
                  <button
                    onClick={close}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    aria-label="إغلاق القائمة"
                  >
                    <FaTimes className="text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* User mini profile */}

            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center border border-purple-100 dark:border-purple-900/40 flex-shrink-0">
                    {extendedUser?.profile?.avatar ? (
                      <img
                        src={
                          getAvatarUrl(
                            extendedUser.profile.avatar
                          ) || ''
                        }
                        alt={extendedUser?.fullName || 'المستخدم'}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <FaUserCircle className="text-purple-600 dark:text-purple-400 text-3xl" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">
                      {extendedUser?.fullName || 'مستخدم'}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {extendedUser?.email || ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}

            <nav className="flex-1 overflow-y-auto p-3">
              <p className="px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                القائمة الرئيسية
              </p>

              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleNavigate(
                        item.id === 'overview'
                          ? '/dashboard'
                          : `/dashboard/${item.id}`
                      )
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-lg w-5 text-center">
                      {item.icon}
                    </span>

                    <span className="font-semibold text-sm flex-1 text-right">
                      {item.label}
                    </span>

                    {item.id === 'notifications' &&
                      unreadCount > 0 && (
                        <span className="min-w-6 h-6 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </nav>

            {/* Logout */}

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
              >
                <FaSignOutAlt />
                <span className="font-semibold text-sm">
                  تسجيل الخروج
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}

        {isMobile && showDashboardSidebar && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={close}
            aria-hidden="true"
          />
        )}

        {/* ======================================================
            Content
        ====================================================== */}

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {activeTab === 'overview' && stats && (
              <OverviewTab
                stats={stats}
                user={extendedUser}
                notifications={notifications}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'requests' && (
              <RequestsTab
                token={token}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsTab token={token} />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab
                notifications={notifications}
              />
            )}

            {activeTab === 'addresses' && <AddressesTab />}

            {activeTab === 'profile' && (
              <ProfileTab
                token={token}
                user={extendedUser}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                token={token}
                user={extendedUser}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// ============================================================
// Overview
// ============================================================

interface OverviewTabProps {
  stats: DashboardStats;
  user: ExtendedUser;
  notifications: Notification[];
  onNavigate: (path: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  user,
  notifications,
  onNavigate,
}) => {
  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  const statCards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.totalRequests || 0,
      icon: <FaFileAlt />,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      path: '/dashboard/requests',
    },
    {
      title: 'قيد التنفيذ',
      value: stats.inProgress || 0,
      icon: <FaClock />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      path: '/dashboard/requests',
    },
    {
      title: 'طلبات مكتملة',
      value: stats.completed || 0,
      icon: <FaCheckCircle />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      path: '/dashboard/requests',
    },
    {
      title: 'المدفوعات المؤكدة',
      value: stats.paidPayments || 0,
      icon: <FaCreditCard />,
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      path: '/dashboard/payments',
    },
    {
      title: 'إجمالي المدفوعات',
      value: `${stats.totalAmount || 0} ريال`,
      icon: <FaMoneyBill />,
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
      path: '/dashboard/payments',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 text-white shadow-xl shadow-purple-500/15">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-28 right-10 w-72 h-72 rounded-full bg-pink-300/10 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                {user?.profile?.avatar ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/files/public/${encodeURIComponent(
                      user.profile.avatar
                    )}?portalId=${encodeURIComponent(
                      import.meta.env.VITE_PORTAL_ID || ''
                    )}`}
                    alt={user.fullName || 'المستخدم'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="text-5xl text-white/90" />
                )}
              </div>

              <div>
                <p className="text-white/70 text-sm mb-1">
                  مرحبًا بك من جديد 👋
                </p>

                <h2 className="text-2xl sm:text-3xl font-black">
                  {user?.fullName || 'مستخدم ارتقاء'}
                </h2>

                <p className="text-white/75 text-sm mt-1">
                  تابع طلباتك واشتراكاتك ومدفوعاتك من مكان واحد.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/services')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-purple-700 rounded-xl font-bold hover:bg-white/90 transition shadow-lg"
            >
              <FaPlus />
              إنشاء طلب جديد
            </button>
          </div>
        </div>
      </section>

      {/* Profile / Notification strip */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FaUser className="text-purple-600 dark:text-purple-400" />
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  حسابك
                </p>
                <p className="font-bold text-gray-900 dark:text-white">
                  الملف الشخصي
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/dashboard/profile')}
              className="text-sm text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              تعديل الملف
              <FaChevronLeft className="text-xs" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/70 p-3">
              <p className="text-xs text-gray-400">البريد الإلكتروني</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate mt-1">
                {user?.email || '-'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/70 p-3">
              <p className="text-xs text-gray-400">رقم الجوال</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                {user?.phone || 'غير مضاف'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/70 p-3">
              <p className="text-xs text-gray-400">الموقع</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate mt-1">
                {user?.profile?.location || 'غير مضاف'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/dashboard/notifications')}
          className="text-right bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-purple-300 dark:hover:border-purple-700 transition"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FaBell className="text-red-500" />
            </div>

            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount} جديد
              </span>
            )}
          </div>

          <p className="font-bold text-gray-900 dark:text-white mt-4">
            الإشعارات
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0
              ? `لديك ${unreadCount} إشعار غير مقروء`
              : 'لا توجد إشعارات غير مقروءة'}
          </p>
        </button>
      </div>

      {/* Statistics */}

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              الإحصائيات
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ملخص سريع لنشاط حسابك
            </p>
          </div>

          <FaChartLine className="text-purple-500 text-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {statCards.map((card, index) => (
            <button
              key={index}
              onClick={() => onNavigate(card.path)}
              className="text-right bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>

                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                </div>

                <div
                  className={`w-12 h-12 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center text-xl`}
                >
                  {card.icon}
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-400 mt-4">
                التفاصيل
                <FaChevronLeft className="text-[9px]" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Quick Actions */}

      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              إجراءات سريعة
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              الوصول السريع إلى أهم خدماتك
            </p>
          </div>

          <FaRocket className="text-purple-500" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'طلب جديد',
              icon: <FaPlus />,
              path: '/services',
              color:
                'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
            },
            {
              label: 'طلباتي',
              icon: <FaFileAlt />,
              path: '/dashboard/requests',
              color:
                'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
            },

            {
              label: 'الملف الشخصي',
              icon: <FaUser />,
              path: '/dashboard/profile',
              color:
                'text-pink-600 bg-pink-50 dark:bg-pink-900/20',
            },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.path)}
              className="p-4 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:-translate-y-0.5 transition-all"
            >
              <div
                className={`w-11 h-11 mx-auto rounded-xl ${action.color} flex items-center justify-center text-lg`}
              >
                {action.icon}
              </div>

              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-3">
                {action.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Requests + Subscription */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent requests */}

        <section className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-black text-gray-900 dark:text-white">
                آخر الطلبات
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                أحدث طلباتك المسجلة
              </p>
            </div>

            <button
              onClick={() =>
                onNavigate('/dashboard/requests')
              }
              className="text-sm text-purple-600 dark:text-purple-400 font-semibold"
            >
              عرض الكل
            </button>
          </div>

          {stats.recentRequests &&
          stats.recentRequests.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.recentRequests
                .slice(0, 5)
                .map((request, index) => {
                  const status = getStatusBadge(
                    request.status
                  );

                  return (
                    <button
                      key={request._id || index}
                      onClick={() =>
                        onNavigate(
                          `/request/${request._id}`
                        )
                      }
                      className="w-full text-right p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition flex items-center gap-4"
                    >
                      <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 flex-shrink-0">
                        <FaFileAlt />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {request.title ||
                              'طلب بدون عنوان'}
                          </h4>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>
                            {request.serviceName ||
                              request.service?.nameAr ||
                              'خدمة'}
                          </span>

                          <span>•</span>

                          <span>
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>

                      <FaChevronLeft className="text-gray-300 flex-shrink-0" />
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <FaFileAlt className="mx-auto text-4xl text-gray-300 dark:text-gray-700" />

              <p className="font-bold text-gray-700 dark:text-gray-300 mt-3">
                لا توجد طلبات حتى الآن
              </p>

              <button
                onClick={() => onNavigate('/services')}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold"
              >
                استكشاف الخدمات
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Payment summary */}

      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white">
              ملخص المدفوعات
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              نظرة سريعة على عمليات الدفع
            </p>
          </div>

          <FaReceipt className="text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              إجمالي العمليات
            </p>

            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {stats.totalPayments || 0}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              المدفوعات المؤكدة
            </p>

            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {stats.paidPayments || 0}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              قيد الانتظار
            </p>

            <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
              {stats.pendingPayments || 0}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/dashboard/payments')}
          className="mt-4 text-sm text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-2"
        >
          عرض سجل المدفوعات
          <FaArrowLeft />
        </button>
      </section>
    </div>
  );
};

// ============================================================
// Requests
// ============================================================

interface RequestsTabProps {
  token: string | null;
  onNavigate: (path: string) => void;
}

const RequestsTab: React.FC<RequestsTabProps> = ({
  token,
  onNavigate,
}) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const url =
          filter === 'all'
            ? `${API_URL}/requests/my`
            : `${API_URL}/requests/my?status=${filter}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });

        const data = await response.json();

        if (data.success) {
          setRequests(data.data || []);
        }
      } catch (error) {
        console.error(
          '❌ Error fetching requests:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token, filter, API_URL, PORTAL_ID]);

  const filteredRequests = requests.filter((request) => {
    const term = searchTerm.toLowerCase();

    return (
      request.title?.toLowerCase().includes(term) ||
      request.requestNumber
        ?.toLowerCase()
        .includes(term) ||
      request.serviceName?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaFileAlt />}
        title="طلباتي"
        description="إدارة ومتابعة جميع طلباتك"
        count={`${requests.length} طلب`}
      />

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="ابحث في الطلبات..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              className="w-full pr-11 pl-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
            />
          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-purple-500"
          >
            <option value="all">كل الطلبات</option>
            <option value="new">جديد</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>

          <button
            onClick={() => onNavigate('/services')}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/15"
          >
            <FaPlus />
            طلب جديد
          </button>
        </div>
      </div>

      {filteredRequests.length > 0 ? (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const status = getStatusBadge(request.status);

            return (
              <button
                key={request._id}
                onClick={() =>
                  onNavigate(`/request/${request._id}`)
                }
                className="w-full text-right bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <FaFileAlt />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">
                        #{request.requestNumber}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <h4 className="font-black text-gray-900 dark:text-white mt-2 truncate">
                      {request.title}
                    </h4>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {request.service?.nameAr ||
                        request.service?.name ||
                        request.serviceName}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt />
                        {formatDate(request.createdAt)}
                      </span>

                      {request.price &&
                        request.price > 0 && (
                          <span className="flex items-center gap-1">
                            <FaMoneyBill />
                            {request.price} ريال
                          </span>
                        )}

                      <span>
                        📎 {request.files?.length || 0} ملفات
                      </span>

                      {request.specialistName && (
                        <span>
                          👤 {request.specialistName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <span className="text-sm font-bold">
                      عرض
                    </span>
                    <FaChevronLeft />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FaFileAlt />}
          title="لا توجد طلبات"
          description={
            searchTerm
              ? 'لا توجد نتائج مطابقة للبحث'
              : 'لم تقم بإنشاء أي طلب بعد'
          }
          action={
            !searchTerm
              ? {
                  label: 'استكشاف الخدمات',
                  onClick: () =>
                    onNavigate('/services'),
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

// ============================================================
// Payments
// ============================================================

interface PaymentsTabProps {
  token: string | null;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({
  token,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError(
        'يرجى تسجيل الدخول لعرض المدفوعات'
      );
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_URL}/payments/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Portal-Id': PORTAL_ID,
            },
          }
        );

        if (response.status === 401) {
          setError(
            'جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى.'
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          const paymentsData =
            data.data?.payments ||
            data.data ||
            [];

          setPayments(paymentsData);
        } else {
          setError(
            data.message ||
              'حدث خطأ في تحميل المدفوعات'
          );
        }
      } catch (error: any) {
        console.error(
          '❌ Error fetching payments:',
          error
        );

        setError(
          error.message ||
            'حدث خطأ في تحميل المدفوعات'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [token, API_URL, PORTAL_ID]);

  const totalAmount = payments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );

  const paidCount = payments.filter(
    (payment) =>
      payment.status === 'paid' ||
      payment.status === 'verified'
  ).length;

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => window.location.reload()}
        loginAction={
          error.includes('جلسة الدخول منتهية')
            ? () => {
                window.location.href = '/login';
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaCreditCard />}
        title="المدفوعات"
        description="سجل عمليات الدفع الخاصة بحسابك"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="إجمالي المدفوعات"
          value={`${totalAmount} ريال`}
          icon={<FaMoneyBill />}
          color="purple"
        />

        <SummaryCard
          title="عدد العمليات"
          value={payments.length}
          icon={<FaReceipt />}
          color="blue"
        />

        <SummaryCard
          title="المدفوعات المؤكدة"
          value={paidCount}
          icon={<FaCheckCircle />}
          color="green"
        />
      </div>

      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-black text-gray-900 dark:text-white">
            سجل المدفوعات
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            جميع العمليات المالية المرتبطة بحسابك
          </p>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/70">
                <tr>
                  <th className="px-5 py-4 text-right text-xs font-bold text-gray-500">
                    المرجع
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-gray-500">
                    المبلغ
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-gray-500">
                    الطريقة
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-gray-500">
                    الحالة
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-gray-500">
                    التاريخ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payments.map((payment) => {
                  const status = getStatusBadge(
                    payment.status
                  );

                  return (
                    <tr
                      key={payment._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                    >
                      <td className="px-5 py-4 text-sm font-mono text-gray-500">
                        {payment.reference ||
                          `#${payment._id.slice(-8)}`}
                      </td>

                      <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">
                        {payment.amount}{' '}
                        {payment.currency || 'ريال'}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {payment.paymentMethod ===
                        'credit_card'
                          ? 'بطاقة'
                          : payment.paymentMethod ===
                            'mada'
                          ? 'مدى'
                          : payment.paymentMethod ===
                            'bank_transfer'
                          ? 'تحويل بنكي'
                          : payment.paymentMethod ===
                            'manual'
                          ? 'يدوي'
                          : payment.paymentMethod ===
                            'free'
                          ? 'مجاني'
                          : payment.paymentMethod ||
                            'غير محدد'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<FaCreditCard />}
            title="لا توجد مدفوعات"
            description="ستظهر عمليات الدفع هنا عند إتمام أي عملية دفع"
          />
        )}
      </section>
    </div>
  );
};

// ============================================================
// Notifications
// ============================================================

interface NotificationsTabProps {
  notifications: Notification[];
}

const NotificationsTab: React.FC<
  NotificationsTabProps
> = ({ notifications }) => {
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaBell />}
        title="الإشعارات"
        description="آخر التنبيهات والتحديثات الخاصة بحسابك"
        count={
          unreadCount > 0
            ? `${unreadCount} غير مقروء`
            : undefined
        }
      />

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-5 rounded-2xl border transition ${
                !notification.isRead
                  ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notification.isRead
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                  }`}
                >
                  <FaBell />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {notification.titleAr ||
                        notification.title ||
                        'إشعار جديد'}
                    </h4>

                    {!notification.isRead && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                        جديد
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {notification.messageAr ||
                      notification.message}
                  </p>

                  <p className="text-xs text-gray-400 mt-3">
                    {formatDateTime(
                      notification.createdAt
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FaBell />}
          title="لا توجد إشعارات"
          description="سيتم عرض الإشعارات هنا عند ورودها"
        />
      )}
    </div>
  );
};

// ============================================================
// Addresses
// ============================================================

const AddressesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaMapMarkerAlt />}
        title="العناوين"
        description="إدارة عناوينك ومواقعك"
      />

      <EmptyState
        icon={<FaMapMarkerAlt />}
        title="جاري التطوير"
        description="سيتم إضافة إدارة العناوين قريباً"
      />
    </div>
  );
};

// ============================================================
// Profile
// ============================================================

interface ProfileTabProps {
  token: string | null;
  user: ExtendedUser;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  token,
  user,
}) => {
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    website: user?.profile?.website || '',
  });

  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  const getAvatarUrl = (avatarId?: string) => {
    if (!avatarId) return '';

    return `${API_URL}/files/public/${encodeURIComponent(
      avatarId
    )}?portalId=${encodeURIComponent(PORTAL_ID)}`;
  };

  const fetchProfile = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        const userData = data.data;

        setProfile({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.profile?.bio || '',
          location:
            userData.profile?.location || '',
          website:
            userData.profile?.website || '',
        });

        if (userData.profile?.avatar) {
          setAvatarPreview(
            getAvatarUrl(
              userData.profile.avatar
            )
          );
        }
      }
    } catch (error) {
      console.error(
        '❌ Error fetching profile:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, PORTAL_ID]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAvatarChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'حجم الصورة يتجاوز 5MB',
      });
      return;
    }

    setAvatar(file);

    const reader = new FileReader();

    reader.onload = () =>
      setAvatarPreview(reader.result as string);

    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<
    string | null
  > => {
    if (!avatar) return null;

    const formData = new FormData();

    formData.append('file', avatar);
    formData.append('category', 'profile');
    formData.append('portalId', PORTAL_ID);

    const response = await fetch(
      `${API_URL}/files/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (data.success) {
      return data.data.file._id;
    }

    throw new Error(
      data.message || 'فشل رفع الصورة'
    );
  };

  const handleSave = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      let avatarId = null;

      if (avatar) {
        avatarId = await uploadAvatar();
      }

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Portal-Id': PORTAL_ID,
          },
          body: JSON.stringify({
            fullName: profile.fullName,
            phone: profile.phone,
            bio: profile.bio,
            location: profile.location,
            website: profile.website,
            avatar: avatarId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'تم تحديث الملف الشخصي بنجاح',
        });

        if (data.data?.profile?.avatar) {
          setAvatarPreview(
            getAvatarUrl(
              data.data.profile.avatar
            )
          );
        }

        const storedUser =
          localStorage.getItem('user');

        if (storedUser) {
          const currentUser =
            JSON.parse(storedUser);

          const updatedUser = {
            ...currentUser,
            fullName: profile.fullName,
            phone: profile.phone,
            profile: {
              ...currentUser.profile,
              avatar:
                data.data?.profile?.avatar ||
                avatarId,
              bio: profile.bio,
              location: profile.location,
              website: profile.website,
            },
          };

          localStorage.setItem(
            'user',
            JSON.stringify(updatedUser)
          );
        }

        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setMessage({
          type: 'error',
          text:
            data.message ||
            'حدث خطأ في التحديث',
        });
      }
    } catch (error: any) {
      console.error(
        '❌ Error updating profile:',
        error
      );

      setMessage({
        type: 'error',
        text:
          error.message ||
          'حدث خطأ في التحديث',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const avatarSrc =
    avatarPreview ||
    getAvatarUrl(user?.profile?.avatar);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaUser />}
        title="الملف الشخصي"
        description="إدارة معلومات حسابك وصورتك الشخصية"
      />

      {message && (
        <div
          className={`p-4 rounded-2xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-6"
      >
        {/* Avatar */}

        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/40 dark:to-pink-950/30 flex items-center justify-center overflow-hidden border-2 border-purple-200 dark:border-purple-800">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="الصورة الشخصية"
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        'none';
                    }}
                  />
                ) : (
                  <FaUserCircle className="text-purple-600 dark:text-purple-400 text-6xl" />
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl cursor-pointer hover:scale-105 transition shadow-lg flex items-center justify-center">
                <FaCamera />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <h3 className="font-black text-gray-900 dark:text-white mt-4">
              {profile.fullName ||
                'مستخدم ارتقاء'}
            </h3>

            <p className="text-xs text-gray-400 mt-1">
              اضغط على الكاميرا لتغيير الصورة
            </p>
          </div>
        </section>

        {/* Information */}

        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
              <FaUser />
            </div>

            <div>
              <h3 className="font-black text-gray-900 dark:text-white">
                المعلومات الأساسية
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                معلومات حسابك الشخصية
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              label="الاسم الكامل *"
              value={profile.fullName}
              onChange={(value) =>
                setProfile({
                  ...profile,
                  fullName: value,
                })
              }
              required
            />

            <FormField
              label="البريد الإلكتروني"
              value={profile.email}
              disabled
              helper="لا يمكن تغيير البريد الإلكتروني"
            />

            <FormField
              label="رقم الجوال"
              value={profile.phone}
              onChange={(value) =>
                setProfile({
                  ...profile,
                  phone: value,
                })
              }
              placeholder="05xxxxxxxx"
            />

            <FormField
              label="الموقع"
              value={profile.location}
              onChange={(value) =>
                setProfile({
                  ...profile,
                  location: value,
                })
              }
              placeholder="المدينة، الدولة"
            />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              نبذة عني
            </label>

            <textarea
              value={profile.bio}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  bio: event.target.value,
                })
              }
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 outline-none transition resize-none"
              placeholder="اكتب نبذة عن نفسك..."
            />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              الموقع الإلكتروني
            </label>

            <div className="relative">
              <FaGlobe className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="url"
                value={profile.website}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    website:
                      event.target.value,
                  })
                }
                className="w-full pr-11 pl-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 outline-none transition"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/15"
        >
          {saving ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaSave />
          )}

          {saving
            ? 'جاري الحفظ...'
            : 'حفظ التغييرات'}
        </button>
      </form>
    </div>
  );
};

// ============================================================
// Settings
// ============================================================

interface SettingsTabProps {
  token: string | null;
  user: ExtendedUser;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  token,
}) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    twoFactorAuth: false,
    language: 'ar',
    theme: 'auto',
  });

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          `${API_URL}/auth/settings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Portal-Id': PORTAL_ID,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error(
          '❌ Error fetching settings:',
          error
        );
      }
    };

    fetchSettings();
  }, [token, API_URL, PORTAL_ID]);

  const handleSaveSettings = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_URL}/auth/settings`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Portal-Id': PORTAL_ID,
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'تم حفظ الإعدادات بنجاح',
        });

        const storedUser =
          localStorage.getItem('user');

        if (storedUser) {
          const currentUser =
            JSON.parse(storedUser);

          localStorage.setItem(
            'user',
            JSON.stringify({
              ...currentUser,
              preferences:
                data.data || settings,
            })
          );
        }
      } else {
        setMessage({
          type: 'error',
          text:
            data.message ||
            'حدث خطأ في حفظ الإعدادات',
        });
      }
    } catch (error) {
      console.error(
        '❌ Error saving settings:',
        error
      );

      setMessage({
        type: 'error',
        text: 'حدث خطأ في حفظ الإعدادات',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaCog />}
        title="الإعدادات"
        description="تحكم في الإشعارات والأمان والتفضيلات"
      />

      {message && (
        <div
          className={`p-4 rounded-2xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSaveSettings}
        className="space-y-5"
      >
        <SettingsSection
          icon={<FaBell />}
          title="الإشعارات"
          description="حدد الإشعارات التي تريد استقبالها"
        >
          <ToggleRow
            label="إشعارات البريد الإلكتروني"
            checked={settings.emailNotifications}
            onChange={(value) =>
              setSettings({
                ...settings,
                emailNotifications: value,
              })
            }
          />

          <ToggleRow
            label="إشعارات التطبيق"
            checked={settings.pushNotifications}
            onChange={(value) =>
              setSettings({
                ...settings,
                pushNotifications: value,
              })
            }
          />

          <ToggleRow
            label="تحديثات الطلبات"
            checked={settings.orderUpdates}
            onChange={(value) =>
              setSettings({
                ...settings,
                orderUpdates: value,
              })
            }
          />

          <ToggleRow
            label="رسائل ترويجية"
            checked={settings.promotionalEmails}
            onChange={(value) =>
              setSettings({
                ...settings,
                promotionalEmails: value,
              })
            }
          />
        </SettingsSection>

        <SettingsSection
          icon={<FaShieldAlt />}
          title="الأمان"
          description="إعدادات حماية حسابك"
        >
          <ToggleRow
            label="المصادقة الثنائية (2FA)"
            checked={settings.twoFactorAuth}
            onChange={(value) =>
              setSettings({
                ...settings,
                twoFactorAuth: value,
              })
            }
          />

          <button
            type="button"
            onClick={() => {
              window.location.href =
                '/change-password';
            }}
            className="text-purple-600 dark:text-purple-400 text-sm font-semibold flex items-center gap-2"
          >
            <FaLock />
            تغيير كلمة المرور
          </button>
        </SettingsSection>

        <SettingsSection
          icon={<FaGlobe />}
          title="التفضيلات"
          description="تخصيص تجربة استخدام المنصة"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              اللغة
            </label>

            <select
              value={settings.language}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  language:
                    event.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-purple-500"
            >
              <option value="ar">
                العربية
              </option>
              <option value="en">
                English
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              المظهر
            </label>

            <select
              value={settings.theme}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  theme: event.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-purple-500"
            >
              <option value="auto">
                تلقائي
              </option>
              <option value="light">
                فاتح
              </option>
              <option value="dark">
                داكن
              </option>
            </select>
          </div>
        </SettingsSection>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/15"
        >
          {saving ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaSave />
          )}

          {saving
            ? 'جاري الحفظ...'
            : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  );
};

// ============================================================
// Reusable UI
// ============================================================

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
        جاري التحميل...
      </p>
    </div>
  </div>
);

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  count?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  description,
  count,
  action,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
        {icon}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            {title}
          </h2>

          {count && (
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">
              {count}
            </span>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>

    {action}
  </div>
);

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
    <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 flex items-center justify-center text-2xl">
      {icon}
    </div>

    <h4 className="text-lg font-black text-gray-900 dark:text-white mt-5">
      {title}
    </h4>

    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
      {description}
    </p>

    {action && (
      <button
        onClick={action.onClick}
        className="mt-5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-sm"
      >
        {action.label}
      </button>
    )}
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  loginAction?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  loginAction,
}) => (
  <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-8 text-center border border-red-200 dark:border-red-800">
    <FaTimesCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

    <p className="text-red-700 dark:text-red-400 font-semibold">
      {message}
    </p>

    <div className="flex justify-center gap-2 mt-5">
      {loginAction && (
        <button
          onClick={loginAction}
          className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold"
        >
          تسجيل الدخول
        </button>
      )}

      <button
        onClick={onRetry}
        className="px-5 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold"
      >
        إعادة المحاولة
      </button>
    </div>
  </div>
);

interface InfoBoxProps {
  label: string;
  value: React.ReactNode;
}

const InfoBox: React.FC<InfoBoxProps> = ({
  label,
  value,
}) => (
  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
    <p className="text-xs text-gray-400">
      {label}
    </p>

    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">
      {value}
    </p>
  </div>
);

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: 'purple' | 'blue' | 'green';
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  color,
}) => {
  const styles = {
    purple:
      'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    blue:
      'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green:
      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {value}
          </p>
        </div>

        <div
          className={`w-12 h-12 rounded-xl ${styles[color]} flex items-center justify-center text-xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

interface FormFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  helper?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
  required,
  placeholder,
  helper,
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>

    <input
      type="text"
      value={value}
      onChange={(event) =>
        onChange?.(event.target.value)
      }
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 outline-none transition ${
        disabled
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500'
      }`}
    />

    {helper && (
      <p className="text-xs text-gray-400 mt-1">
        {helper}
      </p>
    )}
  </div>
);

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<
  SettingsSectionProps
> = ({
  icon,
  title,
  description,
  children,
}) => (
  <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
    <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
        {icon}
      </div>

      <div>
        <h3 className="font-black text-gray-900 dark:text-white">
          {title}
        </h3>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
    </div>

    <div className="p-5 space-y-5">
      {children}
    </div>
  </section>
);

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  checked,
  onChange,
}) => (
  <label className="flex items-center justify-between gap-4 cursor-pointer">
    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
      {label}
    </span>

    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition ${
        checked
          ? 'bg-purple-600'
          : 'bg-gray-300 dark:bg-gray-700'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
          checked ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  </label>
);

export default CustomerDashboard;