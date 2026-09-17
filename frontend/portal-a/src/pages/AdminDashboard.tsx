// frontend/portal-a/src/pages/AdminDashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Header from '../components/layout/Header';

import {
  FaUsers,
  FaFileAlt,
  FaMoneyBill,
  FaVideo,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaSpinner,
  FaEye,
  FaClock,
  FaArrowUp,
  FaEdit,
  FaTrash,
  FaPlus,
  FaExclamationTriangle,
  FaFolder,
  FaBook,
  FaChartBar,
  FaCoins,
  FaInfoCircle,
  FaFileUpload,
  FaHome,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
  FaRocket,
  FaTag,
  FaTimes,
  FaUserCircle,
  FaArrowLeft,
  FaUsersCog,
  FaClipboardList,
  FaBolt,
  FaChartLine,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaSyncAlt,
  FaExternalLinkAlt,
  FaLayerGroup,
  FaTasks,
} from 'react-icons/fa';

import AOS from 'aos';
import 'aos/dist/aos.css';

// ============================================================
// واجهات البيانات
// ============================================================

interface DashboardStats {
  requests: {
    total: number;
    byStatus: Array<{ _id: string; count: number }>;
  };

  users: {
    total: number;
    byRole: Array<{ _id: string; count: number }>;
  };

  payments: {
    total: number;
    totalRevenue: number;
    byStatus: Array<{
      _id: string;
      count: number;
      total?: number;
    }>;
  };

  subscriptions: {
    total: number;
    byStatus: Array<{ _id: string; count: number }>;
  };

  content: {
    videos: number;
    summaries: number;
    total: number;
  };

  sections?: {
    total: number;
    published: number;
  };

  services?: {
    total: number;
    published: number;
  };

  realtime?: {
    activeUsers: number;
    activeRequests: number;
    pendingPayments: number;
  };
}

interface RecentActivity {
  _id: string;

  action: string;

  actorId: {
    _id: string;
    profile: {
      fullName: string;
    };
    email: string;
  };

  actorRole: string;

  oldValue: any;
  newValue: any;
  metadata: any;

  timestamp: Date;

  resourceId: string;
  resourceType: string;
}

interface RecentRequest {
  _id: string;

  requestNumber: string;
  title: string;
  status: string;

  accountId: {
    _id: string;
    profile: {
      fullName: string;
    };
    email: string;
  };

  serviceId: {
    _id: string;
    name: string;
    nameAr: string;
  };

  price: number;

  createdAt: string;
}

interface ProfileData {
  fullName: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
}

// ============================================================
// المكون الرئيسي
// ============================================================

const AdminDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();

  const {
    isOpen,
    close,
    isMobile,
    sidebarType,
  } = useSidebar();

  const navigate = useNavigate();

  // ============================================================
  // State
  // ============================================================

  const [stats, setStats] = useState<DashboardStats>({
    requests: {
      total: 0,
      byStatus: [],
    },

    users: {
      total: 0,
      byRole: [],
    },

    payments: {
      total: 0,
      totalRevenue: 0,
      byStatus: [],
    },

    subscriptions: {
      total: 0,
      byStatus: [],
    },

    content: {
      videos: 0,
      summaries: 0,
      total: 0,
    },

    sections: {
      total: 0,
      published: 0,
    },

    services: {
      total: 0,
      published: 0,
    },

    realtime: {
      activeUsers: 0,
      activeRequests: 0,
      pendingPayments: 0,
    },
  });

  const [profile, setProfile] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
  });

  const [recentActivities, setRecentActivities] = useState<
    RecentActivity[]
  >([]);

  const [recentRequests, setRecentRequests] = useState<
    RecentRequest[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'requests' | 'users' | 'content' | 'payments' | 'settings'
  >('overview');

  const [notifications, setNotifications] = useState<any[]>([]);

  const [showNotifications, setShowNotifications] =
    useState(false);

  // ============================================================
  // Environment
  // ============================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5001/api';

  const PORTAL_ID =
    import.meta.env.VITE_PORTAL_ID || '';

  // ============================================================
  // Sidebar
  // ============================================================

  const showAdminSidebar =
    isOpen && sidebarType === 'admin';

  // ============================================================
  // AOS
  // ============================================================

  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
    });
  }, []);

  // ============================================================
  // Profile
  // ============================================================

  const fetchProfile = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        }
      );

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!response.ok) return;

      const data = await response.json();

      if (data.success) {
        const userData = data.data || {};

        setProfile({
          fullName:
            userData.fullName ||
            user?.fullName ||
            'مدير النظام',

          email:
            userData.email ||
            user?.email ||
            '',

          phone:
            userData.phone ||
            '',

          bio:
            userData.profile?.bio ||
            '',

          location:
            userData.profile?.location ||
            '',

          website:
            userData.profile?.website ||
            '',

          avatar:
            userData.profile?.avatar ||
            '',
        });
      }
    } catch (error) {
      console.error(
        'Error fetching profile:',
        error
      );

      setProfile((current) => ({
        ...current,

        fullName:
          current.fullName ||
          user?.fullName ||
          'مدير النظام',

        email:
          current.email ||
          user?.email ||
          '',
      }));
    }
  }, [
    token,
    API_URL,
    PORTAL_ID,
    logout,
    navigate,
    user,
  ]);

  // ============================================================
  // Dashboard Data
  // ============================================================

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        // ========================================================
        // Dashboard Statistics
        // ========================================================

        const statsResponse = await fetch(
          `${API_URL}/admin/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Portal-Id': PORTAL_ID,
            },
          }
        );

        if (statsResponse.status === 401) {
          logout();
          navigate('/login');
          return;
        }

        if (!statsResponse.ok) {
          throw new Error(
            'Failed to fetch dashboard statistics'
          );
        }

        const statsData =
          await statsResponse.json();

        if (statsData.success) {
          const data =
            statsData.data || {};

          setStats({
            requests: {
              total:
                data.requests?.total || 0,

              byStatus:
                data.requests?.byStatus || [],
            },

            users: {
              total:
                data.users?.total || 0,

              byRole:
                data.users?.byRole || [],
            },

            payments: {
              total:
                data.payments?.total || 0,

              totalRevenue:
                data.payments?.totalRevenue || 0,

              byStatus:
                data.payments?.byStatus || [],
            },

            subscriptions: {
              total:
                data.subscriptions?.total || 0,

              byStatus:
                data.subscriptions?.byStatus || [],
            },

            content: {
              total:
                data.content?.total || 0,

              videos:
                data.content?.videos || 0,

              summaries:
                data.content?.summaries || 0,
            },

            sections: {
              total:
                data.sections?.total || 0,

              published:
                data.sections?.published || 0,
            },

            services: {
              total:
                data.services?.total || 0,

              published:
                data.services?.published || 0,
            },

            realtime: {
              activeUsers:
                data.realtime?.activeUsers || 0,

              activeRequests:
                data.realtime?.activeRequests || 0,

              pendingPayments:
                data.realtime?.pendingPayments || 0,
            },
          });
        }

        // ========================================================
        // Recent Activity
        // ========================================================

        try {
          const activityResponse =
            await fetch(
              `${API_URL}/admin/audit-log?limit=10`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'X-Portal-Id': PORTAL_ID,
                },
              }
            );

          if (activityResponse.ok) {
            const activityData =
              await activityResponse.json();

            if (activityData.success) {
              setRecentActivities(
                activityData.data || []
              );
            }
          }
        } catch (err) {
          console.error(
            'Error fetching activities:',
            err
          );
        }

        // ========================================================
        // Recent Requests
        // ========================================================

        try {
          const requestsResponse =
            await fetch(
              `${API_URL}/requests/all?limit=5`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'X-Portal-Id': PORTAL_ID,
                },
              }
            );

          if (requestsResponse.ok) {
            const requestsData =
              await requestsResponse.json();

            if (requestsData.success) {
              setRecentRequests(
                requestsData.data || []
              );
            }
          }
        } catch (err) {
          console.error(
            'Error fetching requests:',
            err
          );
        }

        // ========================================================
        // Notifications
        // ========================================================

        try {
          const notifResponse =
            await fetch(
              `${API_URL}/notifications?limit=10`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'X-Portal-Id': PORTAL_ID,
                },
              }
            );

          if (notifResponse.ok) {
            const notifData =
              await notifResponse.json();

            if (notifData.success) {
              setNotifications(
                notifData.data || []
              );
            }
          }
        } catch (err) {
          console.error(
            'Error fetching notifications:',
            err
          );
        }
      } catch (err: any) {
        console.error(
          'Error fetching dashboard data:',
          err
        );

        setError(
          err.message ||
            'حدث خطأ في تحميل البيانات'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      token,
      API_URL,
      PORTAL_ID,
      logout,
      navigate,
    ]
  );

  // ============================================================
  // Notifications
  // ============================================================

  const fetchNotifications =
    useCallback(async () => {
      if (!token) return;

      try {
        const response =
          await fetch(
            `${API_URL}/notifications?limit=10`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Portal-Id': PORTAL_ID,
                'Content-Type':
                  'application/json',
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        if (data.success) {
          setNotifications(
            data.data || []
          );
        }
      } catch (error) {
        console.error(
          'Error fetching notifications:',
          error
        );
      }
    }, [
      token,
      API_URL,
      PORTAL_ID,
    ]);

  const fetchUnreadCount =
    useCallback(async () => {
      if (!token) return;

      try {
        const response =
          await fetch(
            `${API_URL}/notifications/unread/count`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Portal-Id': PORTAL_ID,
                'Content-Type':
                  'application/json',
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        if (data.success) {
          const count =
            data.count ??
            data.unreadCount ??
            0;

          console.log(
            'Unread notifications:',
            count
          );
        }
      } catch (error) {
        console.error(
          'Error fetching unread notification count:',
          error
        );
      }
    }, [
      token,
      API_URL,
      PORTAL_ID,
    ]);

  useEffect(() => {
    fetchProfile();
    fetchDashboardData();
    fetchNotifications();
    fetchUnreadCount();
  }, [
    fetchProfile,
    fetchDashboardData,
    fetchNotifications,
    fetchUnreadCount,
  ]);

  // ============================================================
  // Helpers
  // ============================================================

  const getStatusText = (
    status: string
  ) => {
    const texts: {
      [key: string]: string;
    } = {
      new: 'جديد',
      under_review: 'قيد المراجعة',
      assigned: 'تم الإسناد',
      scope_definition: 'تحديد النطاق',
      awaiting_approval:
        'بانتظار الموافقة',
      awaiting_payment:
        'بانتظار الدفع',
      in_progress: 'قيد التنفيذ',
      under_review_2:
        'مراجعة التسليم',
      modification: 'تعديل',
      completed: 'مكتمل',
      closed: 'مغلق',
      cancelled: 'ملغي',
    };

    return texts[status] || status;
  };

  const getStatusColor = (
    status: string
  ) => {
    const colors: {
      [key: string]: string;
    } = {
      new: 'bg-blue-500',
      under_review:
        'bg-yellow-500',
      assigned: 'bg-purple-500',
      scope_definition:
        'bg-indigo-500',
      awaiting_approval:
        'bg-orange-500',
      awaiting_payment:
        'bg-pink-500',
      in_progress:
        'bg-blue-500',
      under_review_2:
        'bg-cyan-500',
      modification:
        'bg-red-500',
      completed:
        'bg-green-500',
      closed:
        'bg-gray-500',
      cancelled:
        'bg-red-500',
    };

    return (
      colors[status] ||
      'bg-gray-500'
    );
  };

  const getStatusSoftColor = (
    status: string
  ) => {
    const colors: {
      [key: string]: string;
    } = {
      new:
        'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',

      under_review:
        'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',

      assigned:
        'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',

      scope_definition:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',

      awaiting_approval:
        'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',

      awaiting_payment:
        'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',

      in_progress:
        'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',

      under_review_2:
        'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',

      modification:
        'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',

      completed:
        'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',

      closed:
        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',

      cancelled:
        'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    };

    return (
      colors[status] ||
      'bg-gray-100 text-gray-700'
    );
  };

  const getRoleLabel = (
    role: string
  ) => {
    const labels: {
      [key: string]: string;
    } = {
      customer: 'عميل',
      specialist: 'مختص',
      portal_admin:
        'مدير البوابة',
      super_admin: 'مشرف عام',
    };

    return (
      labels[role] || role
    );
  };

  const getActionLabel = (
    action: string
  ) => {
    const labels: {
      [key: string]: string;
    } = {
      created: 'أنشأ',
      updated: 'حدث',
      deleted: 'حذف',
      viewed: 'عرض',
      approved: 'وافق على',
      rejected: 'رفض',
      assigned: 'أسند',
      completed: 'أكمل',
      status_changed:
        'غير الحالة',

      request_created:
        'أنشأ طلب',

      request_updated:
        'حدث طلب',

      payment_submitted:
        'قدم دفعة',

      scope_defined:
        'حدد النطاق',

      scope_approved:
        'وافق على النطاق',

      specialist_assigned:
        'أسند مختص',

      work_delivered:
        'سلم العمل',

      modification_requested:
        'طلب تعديل',

      request_completed:
        'أكمل الطلب',

      request_closed:
        'أغلق الطلب',

      file_uploaded:
        'رفع ملف',

      message_sent:
        'أرسل رسالة',
    };

    return (
      labels[action] ||
      action
    );
  };

  const getActivityIcon = (
    action: string
  ) => {
    if (
      action === 'created' ||
      action === 'request_created'
    ) {
      return <FaPlus />;
    }

    if (
      action === 'updated' ||
      action === 'request_updated'
    ) {
      return <FaEdit />;
    }

    if (action === 'deleted') {
      return <FaTrash />;
    }

    if (
      action === 'status_changed'
    ) {
      return <FaClock />;
    }

    if (
      action ===
      'payment_submitted'
    ) {
      return <FaMoneyBill />;
    }

    if (
      action === 'file_uploaded'
    ) {
      return <FaFileUpload />;
    }

    if (
      action === 'message_sent'
    ) {
      return <FaCheckCircle />;
    }

    if (
      action === 'specialist_assigned'
    ) {
      return <FaUsers />;
    }

    return <FaEye />;
  };

  const getStatusCount = (
    status: string
  ) => {
    return (
      stats.requests?.byStatus?.find(
        (item) =>
          item._id === status
      )?.count || 0
    );
  };

  const formatRelativeDate = (
    date: string | Date
  ) => {
    const value =
      new Date(date).getTime();

    const now =
      Date.now();

    const diff =
      Math.max(
        0,
        now - value
      );

    const minutes =
      Math.floor(
        diff / 60000
      );

    if (minutes < 1) {
      return 'الآن';
    }

    if (minutes < 60) {
      return `منذ ${minutes} دقيقة`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `منذ ${hours} ساعة`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days < 30) {
      return `منذ ${days} يوم`;
    }

    return new Date(
      date
    ).toLocaleDateString(
      'ar-SA'
    );
  };

  // ============================================================
  // Admin Links
  // ============================================================

  const adminLinks = [
    {
      to: '/admin-dashboard',
      label: 'الرئيسية',
      icon: <FaHome />,
      color: 'purple',
    },

    {
      to: '/admin-services',
      label: 'الخدمات',
      icon: <FaCog />,
      color: 'blue',
    },

    {
      to: '/admin-sections',
      label: 'الأقسام',
      icon: <FaFolder />,
      color: 'indigo',
    },

    {
      to: '/admin-requests',
      label: 'الطلبات',
      icon: <FaFileAlt />,
      color: 'pink',
    },

    {
      to: '/admin-explanations',
      label: 'الشروحات',
      icon: <FaBook />,
      color: 'green',
    },

    {
      to: '/admin-videos',
      label: 'الفيديوهات',
      icon: <FaVideo />,
      color: 'red',
    },

    {
      to: '/admin-users',
      label: 'المستخدمين',
      icon: <FaUsers />,
      color: 'indigo',
    },

    {
      to: '/admin-payments',
      label: 'المدفوعات',
      icon: <FaMoneyBill />,
      color: 'yellow',
    },

    {
      to: '/admin-subscriptions',
      label: 'الاشتراكات',
      icon: <FaCoins />,
      color: 'pink',
    },

    {
      to: '/admin-library',
      label: 'المكتبة',
      icon: <FaBook />,
      color: 'teal',
    },

    {
      to: '/admin-videos-library',
      label: 'مكتبة الفيديوهات',
      icon: <FaVideo />,
      color: 'purple',
    },

    {
      to: '/admin-infographics',
      label: 'الإنفوجرافيك',
      icon: <FaChartBar />,
      color: 'emerald',
    },

    {
      to: '/admin-offers',
      label: 'العروض',
      icon: <FaTag />,
      color: 'pink',
    },

    {
      to: '/admin-about',
      label: 'نبذة عنا',
      icon: <FaInfoCircle />,
      color: 'indigo',
    },

    {
      to: '/admin-service-details',
      label: 'تفاصيل الخدمات',
      icon: <FaInfoCircle />,
      color: 'cyan',
    },

    {
      to: '/admin-service-forms',
      label: 'نماذج الخدمات',
      icon: <FaFileUpload />,
      color: 'teal',
    },

    {
      to: '/admin-reports',
      label: 'التقارير',
      icon: <FaChartBar />,
      color: 'orange',
    },

    {
      to: '/admin-settings',
      label: 'الإعدادات',
      icon: <FaCog />,
      color: 'gray',
    },

    {
      to: '/admin-profile',
      label: 'الملف الشخصي',
      icon: <FaUserCircle />,
      color: 'gray',
    },
  ];

  // ============================================================
  // Unread notifications
  // ============================================================

  const unreadCount =
    notifications.filter(
      (notification: any) =>
        !notification.isRead
    ).length;

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>

          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            جاري تحميل لوحة التحكم
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            يرجى الانتظار...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Error
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <FaExclamationTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            حدث خطأ
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-5">
            {error}
          </p>

          <button
            onClick={() =>
              fetchDashboardData()
            }
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:shadow-lg transition"
          >
            إعادة المحاولة
          </button>
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
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col"
    >
      <Header />

      <div className="flex flex-1 relative">
        {/* ======================================================
            Sidebar
        ====================================================== */}

        <aside
          className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
            showAdminSidebar
              ? 'translate-x-0'
              : 'translate-x-full'
          } md:translate-x-0 md:relative md:z-0 md:shadow-none`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}

            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-purple-500/20">
                  إ
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                    لوحة الإدارة
                  </h1>

                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    مرحباً{' '}
                    {profile.fullName ||
                      user?.fullName ||
                      'مدير'}
                  </p>
                </div>

                {isMobile && (
                  <button
                    onClick={close}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
                    aria-label="إغلاق القائمة"
                  >
                    <FaTimes className="text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar Links */}

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {adminLinks.map(
                (link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => {
                      if (isMobile) {
                        close();
                      }

                      if (
                        link.to ===
                        '/admin-dashboard'
                      ) {
                        setActiveTab(
                          'overview'
                        );
                      } else if (
                        link.to ===
                        '/admin-requests'
                      ) {
                        setActiveTab(
                          'requests'
                        );
                      } else if (
                        link.to ===
                        '/admin-users'
                      ) {
                        setActiveTab(
                          'users'
                        );
                      } else if (
                        link.to ===
                          '/admin-videos' ||
                        link.to ===
                          '/admin-explanations'
                      ) {
                        setActiveTab(
                          'content'
                        );
                      } else if (
                        link.to ===
                        '/admin-payments'
                      ) {
                        setActiveTab(
                          'payments'
                        );
                      } else if (
                        link.to ===
                        '/admin-settings'
                      ) {
                        setActiveTab(
                          'settings'
                        );
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      (
                        link.to ===
                          '/admin-dashboard' &&
                        activeTab ===
                          'overview'
                      ) ||
                      (
                        link.to ===
                          '/admin-requests' &&
                        activeTab ===
                          'requests'
                      ) ||
                      (
                        link.to ===
                          '/admin-users' &&
                        activeTab ===
                          'users'
                      ) ||
                      (
                        (
                          link.to ===
                            '/admin-videos' ||
                          link.to ===
                            '/admin-explanations'
                        ) &&
                        activeTab ===
                          'content'
                      ) ||
                      (
                        link.to ===
                          '/admin-payments' &&
                        activeTab ===
                          'payments'
                      ) ||
                      (
                        link.to ===
                          '/admin-settings' &&
                        activeTab ===
                          'settings'
                      )
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">
                      {link.icon}
                    </span>

                    <span className="font-medium truncate">
                      {link.label}
                    </span>
                  </Link>
                )
              )}
            </nav>

            {/* Logout */}

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <FaSignOutAlt className="text-lg flex-shrink-0" />

                <span className="font-medium">
                  تسجيل الخروج
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}

        {isMobile &&
          showAdminSidebar && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={close}
              aria-hidden="true"
            />
          )}

        {/* ======================================================
            Main Content
        ====================================================== */}

        <main className="flex-1 min-h-screen overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto">

            {/* ================================================
                Top Admin Profile / Welcome
            ================================================= */}

            {activeTab === 'overview' && (
              <AdminProfileHeader
                profile={profile}
                unreadCount={unreadCount}
                showNotifications={
                  showNotifications
                }
                setShowNotifications={
                  setShowNotifications
                }
                notifications={
                  notifications
                }
                onRefresh={() =>
                  fetchDashboardData(
                    true
                  )
                }
                refreshing={refreshing}
              />
            )}

            {/* ================================================
                Overview
            ================================================= */}

            {activeTab ===
              'overview' && (
              <OverviewTab
                stats={stats}
                recentActivities={
                  recentActivities
                }
                recentRequests={
                  recentRequests
                }
                notifications={
                  notifications
                }
                unreadCount={
                  unreadCount
                }
              />
            )}

            {/* Requests */}

            {activeTab ===
              'requests' && (
              <RequestsTab
                stats={stats}
              />
            )}

            {/* Users */}

            {activeTab ===
              'users' && (
              <UsersTab
                stats={stats}
              />
            )}

            {/* Content */}

            {activeTab ===
              'content' && (
              <ContentTab
                stats={stats}
              />
            )}

            {/* Payments */}

            {activeTab ===
              'payments' && (
              <PaymentsTab
                stats={stats}
              />
            )}

            {/* Settings */}

            {activeTab ===
              'settings' && (
              <SettingsTab />
            )}
          </div>
        </main>
      </div>

      {/* Scroll Top */}

      <button
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          })
        }
        className="fixed bottom-6 left-6 p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1 z-40"
        aria-label="العودة للأعلى"
      >
        <FaArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

// ============================================================
// Admin Profile Header
// ============================================================

interface AdminProfileHeaderProps {
  profile: ProfileData;
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  notifications: any[];
  onRefresh: () => void;
  refreshing: boolean;
}

const AdminProfileHeader: React.FC<
  AdminProfileHeaderProps
> = ({
  profile,
  unreadCount,
  showNotifications,
  setShowNotifications,
  notifications,
  onRefresh,
  refreshing,
}) => {
  return (
    <div
      className="relative mb-6"
      data-aos="fade-down"
    >
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 shadow-xl shadow-purple-500/10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute -bottom-32 right-10 w-80 h-80 rounded-full bg-white" />
        </div>

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Profile */}

            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {profile.avatar ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/files/public/${profile.avatar}?portalId=${import.meta.env.VITE_PORTAL_ID || ''}`}
                    alt={profile.fullName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/50 shadow-lg bg-white"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <FaUserCircle className="w-10 h-10 text-white" />
                  </div>
                )}

                <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-green-400 border-2 border-purple-700" />
              </div>

              <div className="text-white min-w-0">
                <p className="text-white/70 text-sm mb-1">
                  مرحباً بك في لوحة الإدارة
                </p>

                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {profile.fullName ||
                    'مدير النظام'}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/80">
                  {profile.email && (
                    <span className="flex items-center gap-1.5">
                      <FaEnvelope />
                      {profile.email}
                    </span>
                  )}

                  {profile.phone && (
                    <span className="flex items-center gap-1.5">
                      <FaPhone />
                      {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}

            <div className="flex items-center gap-2">
              <Link
                to="/admin-profile"
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition flex items-center gap-2 text-sm font-medium"
              >
                <FaUserCircle />
                الملف الشخصي
              </Link>

              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="p-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition disabled:opacity-50"
                title="تحديث البيانات"
              >
                <FaSyncAlt
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>

              <div className="relative">
                <button
                  onClick={() =>
                    setShowNotifications(
                      (value) =>
                        !value
                    )
                  }
                  className="relative p-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition"
                  title="الإشعارات"
                >
                  <FaBell />

                  {unreadCount >
                    0 && (
                    <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-purple-700">
                      {unreadCount >
                      99
                        ? '99+'
                        : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 top-14 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 text-right">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        الإشعارات
                      </h3>

                      <span className="text-xs text-purple-600">
                        {unreadCount}{' '}
                        غير مقروء
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length ===
                      0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          لا توجد إشعارات
                        </div>
                      ) : (
                        notifications
                          .slice(
                            0,
                            10
                          )
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
                                className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                                  !notification.isRead
                                    ? 'bg-purple-50/50 dark:bg-purple-900/10'
                                    : ''
                                }`}
                              >
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {notification.title ||
                                    notification.message ||
                                    'إشعار جديد'}
                                </p>

                                {notification.message &&
                                  notification.title && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {
                                        notification.message
                                      }
                                    </p>
                                  )}
                              </div>
                            )
                          )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}

          {(profile.bio ||
            profile.location ||
            profile.website) && (
            <div className="relative mt-5 pt-4 border-t border-white/15 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
              {profile.bio && (
                <span className="max-w-2xl truncate">
                  {profile.bio}
                </span>
              )}

              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <FaMapMarkerAlt />
                  {profile.location}
                </span>
              )}

              {profile.website && (
                <span className="flex items-center gap-1.5">
                  <FaGlobe />
                  {profile.website}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Overview
// ============================================================

interface OverviewTabProps {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  recentRequests: RecentRequest[];
  notifications: any[];
  unreadCount: number;
}

const OverviewTab: React.FC<
  OverviewTabProps
> = ({
  stats,
  recentActivities,
  recentRequests,
}) => {
  // ==========================================================
  // Statistics Cards
  // ==========================================================

  const statCards = [
    {
      title: 'الطلبات',
      value:
        stats.requests?.total || 0,
      subtitle: `${stats.requests?.byStatus?.find(
        (s) => s._id === 'new'
      )?.count || 0} جديد`,
      icon: <FaFileAlt />,
      color:
        'from-blue-500 to-cyan-500',
      route: '/admin-requests',
    },

    {
      title: 'المستخدمون',
      value:
        stats.users?.total || 0,
      subtitle: `${stats.users?.byRole?.find(
        (r) =>
          r._id === 'customer'
      )?.count || 0} عميل`,
      icon: <FaUsers />,
      color:
        'from-purple-500 to-violet-500',
      route: '/admin-users',
    },

    {
      title: 'الإيرادات',
      value: `${(
        stats.payments
          ?.totalRevenue || 0
      ).toLocaleString()} ريال`,
      subtitle: `${stats.payments?.total || 0} دفعة`,
      icon: <FaMoneyBill />,
      color:
        'from-emerald-500 to-green-500',
      route: '/admin-payments',
    },

    {
      title: 'المحتوى',
      value:
        stats.content?.total || 0,
      subtitle: `${stats.content?.videos || 0} فيديو`,
      icon: <FaVideo />,
      color:
        'from-orange-500 to-amber-500',
      route: '/admin-videos',
    },

    {
      title: 'الأقسام',
      value:
        stats.sections?.total || 0,
      subtitle: `${stats.sections?.published || 0} منشور`,
      icon: <FaFolder />,
      color:
        'from-indigo-500 to-blue-500',
      route: '/admin-sections',
    },

    {
      title: 'الخدمات',
      value:
        stats.services?.total || 0,
      subtitle: `${stats.services?.published || 0} منشور`,
      icon: <FaCog />,
      color:
        'from-pink-500 to-rose-500',
      route: '/admin-services',
    },
  ];

  return (
    <div
      className="space-y-6"
      data-aos="fade-up"
    >
      {/* ======================================================
          Statistics
      ====================================================== */}

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              الإحصائيات الرئيسية
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              نظرة سريعة على أداء المنصة
            </p>
          </div>

          <FaChartLine className="text-purple-500 text-xl" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map(
            (card, index) => (
              <Link
                key={card.title}
                to={card.route}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                data-aos="fade-up"
                data-aos-delay={
                  index * 50
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-lg`}
                  >
                    <span className="text-lg">
                      {card.icon}
                    </span>
                  </div>

                  <FaExternalLinkAlt className="text-gray-300 dark:text-gray-600 group-hover:text-purple-500 transition text-xs" />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  {card.title}
                </p>

                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                  {card.value}
                </p>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                  {card.subtitle}
                </p>
              </Link>
            )
          )}
        </div>
      </section>

      {/* ======================================================
          Realtime
      ====================================================== */}

      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RealtimeCard
            icon={<FaUsers />}
            title="مستخدمون نشطون"
            value={
              stats.realtime
                ?.activeUsers || 0
            }
            description="النشاط الحالي"
            color="green"
          />

          <RealtimeCard
            icon={<FaBolt />}
            title="طلبات نشطة"
            value={
              stats.realtime
                ?.activeRequests || 0
            }
            description="طلبات قيد المعالجة"
            color="blue"
          />

          <RealtimeCard
            icon={<FaCreditCard />}
            title="دفعات معلقة"
            value={
              stats.realtime
                ?.pendingPayments || 0
            }
            description="تحتاج إلى مراجعة"
            color="yellow"
          />
        </div>
      </section>

      {/* ======================================================
          Quick Actions
      ====================================================== */}

      <QuickActions />

      {/* ======================================================
          Request Room
      ====================================================== */}

      <RequestRoom
        stats={stats}
        recentRequests={
          recentRequests
        }
      />

      {/* ======================================================
          Charts / Distribution
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequestStatusChart
          stats={stats}
        />

        <UserRolesChart
          stats={stats}
        />
      </div>

      {/* ======================================================
          Recent Requests + Recent Activity
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentRequests
          requests={recentRequests}
        />

        <RecentActivity
          activities={
            recentActivities
          }
        />
      </div>
    </div>
  );
};

// ============================================================
// Realtime Card
// ============================================================

const RealtimeCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
  color: 'green' | 'blue' | 'yellow';
}> = ({
  icon,
  title,
  value,
  description,
  color,
}) => {
  const styles = {
    green:
      'from-green-500 to-emerald-500',
    blue:
      'from-blue-500 to-cyan-500',
    yellow:
      'from-yellow-500 to-orange-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${styles[color]} text-white flex items-center justify-center`}
        >
          {icon}
        </div>

        <div className="text-left">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">
          {title}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// Quick Actions
// ============================================================

const QuickActions: React.FC = () => {
  const actions = [
    {
      to: '/admin-requests',
      title: 'إدارة الطلبات',
      description: 'متابعة الطلبات',
      icon: <FaClipboardList />,
      color:
        'from-pink-500 to-rose-500',
    },

    {
      to: '/admin-users',
      title: 'المستخدمون',
      description: 'إدارة الحسابات',
      icon: <FaUsersCog />,
      color:
        'from-purple-500 to-violet-500',
    },

    {
      to: '/admin-payments',
      title: 'المدفوعات',
      description: 'مراجعة المدفوعات',
      icon: <FaCreditCard />,
      color:
        'from-green-500 to-emerald-500',
    },

    {
      to: '/admin-services',
      title: 'الخدمات',
      description: 'إدارة الخدمات',
      icon: <FaCog />,
      color:
        'from-blue-500 to-cyan-500',
    },

    {
      to: '/admin-library',
      title: 'المكتبة',
      description: 'إدارة الملفات',
      icon: <FaBook />,
      color:
        'from-teal-500 to-cyan-500',
    },

    {
      to: '/admin-reports',
      title: 'التقارير',
      description: 'عرض التقارير',
      icon: <FaChartBar />,
      color:
        'from-orange-500 to-amber-500',
    },

    {
      to: '/admin-settings',
      title: 'الإعدادات',
      description: 'إعدادات النظام',
      icon: <FaCog />,
      color:
        'from-gray-500 to-slate-600',
    },

    {
      to: '/admin-profile',
      title: 'الملف الشخصي',
      description: 'إدارة الحساب',
      icon: <FaUserCircle />,
      color:
        'from-indigo-500 to-purple-500',
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            الإجراءات السريعة
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            الوصول المباشر إلى أقسام الإدارة
          </p>
        </div>

        <FaBolt className="text-purple-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map(
          (action, index) => (
            <Link
              key={action.to}
              to={action.to}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              data-aos="fade-up"
              data-aos-delay={
                index * 30
              }
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center mb-3 shadow-md`}
              >
                {action.icon}
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {action.title}
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {action.description}
              </p>

              <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                فتح
                <FaArrowLeft />
              </div>
            </Link>
          )
        )}
      </div>
    </section>
  );
};

// ============================================================
// Request Room
// ============================================================

const RequestRoom: React.FC<{
  stats: DashboardStats;
  recentRequests: RecentRequest[];
}> = ({
  stats,
  recentRequests,
}) => {
  const statuses = [
    {
      key: 'new',
      title: 'جديدة',
      icon: <FaPlus />,
      color: 'blue',
    },

    {
      key: 'under_review',
      title: 'قيد المراجعة',
      icon: <FaEye />,
      color: 'yellow',
    },

    {
      key: 'awaiting_payment',
      title: 'بانتظار الدفع',
      icon: <FaCreditCard />,
      color: 'pink',
    },

    {
      key: 'in_progress',
      title: 'قيد التنفيذ',
      icon: <FaTasks />,
      color: 'indigo',
    },

    {
      key: 'modification',
      title: 'تعديلات',
      icon: <FaEdit />,
      color: 'red',
    },

    {
      key: 'completed',
      title: 'مكتملة',
      icon: <FaCheckCircle />,
      color: 'green',
    },

    {
      key: 'closed',
      title: 'مغلقة',
      icon: <FaTimesCircle />,
      color: 'gray',
    },

    {
      key: 'cancelled',
      title: 'ملغاة',
      icon: <FaTimesCircle />,
      color: 'red',
    },
  ];

  const colorMap: Record<
    string,
    string
  > = {
    blue:
      'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',

    yellow:
      'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-300',

    pink:
      'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300',

    indigo:
      'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300',

    red:
      'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300',

    green:
      'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300',

    gray:
      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <section
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      data-aos="fade-up"
    >
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center">
              <FaClipboardList />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                غرفة الطلبات
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                متابعة دورة الطلبات بالكامل
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/admin-requests"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
        >
          فتح جميع الطلبات
          <FaArrowLeft />
        </Link>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {statuses.map(
            (status) => {
              const count =
                stats.requests?.byStatus?.find(
                  (item) =>
                    item._id ===
                    status.key
                )?.count || 0;

              return (
                <Link
                  key={status.key}
                  to="/admin-requests"
                  className="group rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${colorMap[status.color]} flex items-center justify-center mb-2`}
                  >
                    {status.icon}
                  </div>

                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {count}
                  </p>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {status.title}
                  </p>
                </Link>
              );
            }
          )}
        </div>

        {/* Summary */}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                إجمالي الطلبات
              </span>

              <FaFileAlt className="text-purple-500" />
            </div>

            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.requests?.total ||
                0}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                الطلبات النشطة
              </span>

              <FaBolt className="text-blue-500" />
            </div>

            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stats.realtime
                ?.activeRequests ||
                0}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                آخر طلب
              </span>

              <FaCalendarAlt className="text-green-500" />
            </div>

            <p className="text-sm font-bold text-gray-900 dark:text-white mt-2 truncate">
              {recentRequests[0]
                ?.title ||
                'لا توجد طلبات'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================
// Request Status Chart
// ============================================================

const RequestStatusChart: React.FC<{
  stats: DashboardStats;
}> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            حالة الطلبات
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            توزيع الطلبات حسب الحالة
          </p>
        </div>

        <FaChartBar className="text-purple-500" />
      </div>

      <div className="space-y-3">
        {stats.requests?.byStatus
          ?.map((item) => {
            const percentage =
              stats.requests.total
                ? Math.min(
                    (item.count /
                      stats.requests
                        .total) *
                      100,
                    100
                  )
                : 0;

            return (
              <div
                key={item._id}
                className="space-y-1"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {getStatusTextStatic(
                      item._id
                    )}
                  </span>

                  <span className="font-bold text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>

                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColorStatic(
                      item._id
                    )} rounded-full transition-all duration-700`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}

        {!stats.requests
          ?.byStatus?.length && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            لا توجد بيانات
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// User Roles Chart
// ============================================================

const UserRolesChart: React.FC<{
  stats: DashboardStats;
}> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            أدوار المستخدمين
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            توزيع الحسابات حسب الدور
          </p>
        </div>

        <FaUsers className="text-purple-500" />
      </div>

      <div className="space-y-4">
        {stats.users?.byRole?.map(
          (item) => {
            const percentage =
              stats.users.total
                ? Math.min(
                    (item.count /
                      stats.users
                        .total) *
                      100,
                    100
                  )
                : 0;

            return (
              <div
                key={item._id}
                className="space-y-1"
              >
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getRoleLabelStatic(
                      item._id
                    )}
                  </span>

                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    {item.count}
                  </span>
                </div>

                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          }
        )}

        {!stats.users
          ?.byRole?.length && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            لا توجد بيانات
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Recent Requests
// ============================================================

const RecentRequests: React.FC<{
  requests: RecentRequest[];
}> = ({ requests }) => {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaRocket className="text-purple-500" />
            أحدث الطلبات
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            آخر الطلبات المسجلة في المنصة
          </p>
        </div>

        <Link
          to="/admin-requests"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          عرض الكل
        </Link>
      </div>

      {requests.length ===
      0 ? (
        <div className="p-10 text-center text-gray-500 dark:text-gray-400">
          <FaFileAlt className="mx-auto text-3xl mb-3 opacity-40" />
          لا توجد طلبات
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {requests.map(
            (request) => (
              <div
                key={request._id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <FaFileAlt />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {request.title ||
                            'طلب'}
                        </h4>

                        <p className="text-xs text-gray-400 font-mono mt-1">
                          #
                          {
                            request.requestNumber
                          }
                        </p>
                      </div>

                      <span
                        className={`self-start px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusSoftColorStatic(
                          request.status
                        )}`}
                      >
                        {getStatusTextStatic(
                          request.status
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FaUserCircle />
                        {request.accountId
                          ?.profile
                          ?.fullName ||
                          'مستخدم'}
                      </span>

                      <span>
                        {request.serviceId
                          ?.nameAr ||
                          request.serviceId
                            ?.name ||
                          'خدمة'}
                      </span>

                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {request.price >
                        0
                          ? `${request.price.toLocaleString()} ريال`
                          : 'مجاني'}
                      </span>

                      <span>
                        {formatDateStatic(
                          request.createdAt
                        )}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/request/${request._id}`}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 hover:text-purple-600 transition"
                    title="عرض الطلب"
                  >
                    <FaEye />
                  </Link>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
};

// ============================================================
// Recent Activity
// ============================================================

const RecentActivity: React.FC<{
  activities: RecentActivity[];
}> = ({
  activities,
}) => {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaClock className="text-purple-500" />
            آخر النشاطات
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            أحدث العمليات الإدارية المسجلة
          </p>
        </div>

        <Link
          to="/admin-reports"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          سجل النشاط
        </Link>
      </div>

      {activities.length ===
      0 ? (
        <div className="p-10 text-center text-gray-500 dark:text-gray-400">
          <FaClock className="mx-auto text-3xl mb-3 opacity-40" />
          لا توجد نشاطات مسجلة
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {activities
            .slice(0, 10)
            .map(
              (
                activity,
                index
              ) => (
                <div
                  key={
                    activity._id ||
                    index
                  }
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center flex-shrink-0">
                      {getActivityIconStatic(
                        activity.action
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {activity
                              .actorId
                              ?.profile
                              ?.fullName ||
                              'مستخدم'}
                          </span>{' '}
                          {getActionLabelStatic(
                            activity.action
                          )}{' '}
                          <span className="text-purple-600 dark:text-purple-400">
                            {activity.resourceType ||
                              'مورد'}
                          </span>
                        </p>

                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDateTimeStatic(
                            activity.timestamp
                          )}
                        </span>
                      </div>

                      {activity.metadata && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                          {typeof activity.metadata ===
                          'string'
                            ? activity.metadata
                            : JSON.stringify(
                                activity.metadata
                              ).substring(
                                0,
                                120
                              )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
        </div>
      )}
    </section>
  );
};

// ============================================================
// Requests Tab
// ============================================================

const RequestsTab: React.FC<{
  stats: DashboardStats;
}> = ({ stats }) => {
  return (
    <div
      className="space-y-6"
      data-aos="fade-up"
    >
      <PageSectionHeader
        icon={<FaFileAlt />}
        title="إدارة الطلبات"
        description="مراقبة وإدارة جميع طلبات المنصة"
        route="/admin-requests"
        buttonText="فتح إدارة الطلبات"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SimpleStat
          title="إجمالي الطلبات"
          value={
            stats.requests?.total ||
            0
          }
          icon={<FaFileAlt />}
          color="blue"
        />

        <SimpleStat
          title="جديدة"
          value={getStatCount(
            stats,
            'new'
          )}
          icon={<FaPlus />}
          color="yellow"
        />

        <SimpleStat
          title="مكتملة"
          value={getStatCount(
            stats,
            'completed'
          )}
          icon={<FaCheckCircle />}
          color="green"
        />

        <SimpleStat
          title="ملغاة"
          value={getStatCount(
            stats,
            'cancelled'
          )}
          icon={<FaTimesCircle />}
          color="red"
        />
      </div>
    </div>
  );
};

// ============================================================
// Users Tab
// ============================================================

const UsersTab: React.FC<{
  stats: DashboardStats;
}> = ({ stats }) => {
  return (
    <div
      className="space-y-6"
      data-aos="fade-up"
    >
      <PageSectionHeader
        icon={<FaUsers />}
        title="إدارة المستخدمين"
        description="إدارة العملاء والمختصين والمديرين"
        route="/admin-users"
        buttonText="فتح إدارة المستخدمين"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SimpleStat
          title="إجمالي المستخدمين"
          value={
            stats.users?.total ||
            0
          }
          icon={<FaUsers />}
          color="purple"
        />

        <SimpleStat
          title="عملاء"
          value={
            stats.users?.byRole?.find(
              (r) =>
                r._id ===
                'customer'
            )?.count || 0
          }
          icon={<FaUsers />}
          color="green"
        />

        <SimpleStat
          title="مختصين"
          value={
            stats.users?.byRole?.find(
              (r) =>
                r._id ===
                'specialist'
            )?.count || 0
          }
          icon={<FaUsersCog />}
          color="blue"
        />

        <SimpleStat
          title="مديرين"
          value={
            (stats.users?.byRole?.find(
              (r) =>
                r._id ===
                'portal_admin'
            )?.count || 0) +
            (stats.users?.byRole?.find(
              (r) =>
                r._id ===
                'super_admin'
            )?.count || 0)
          }
          icon={<FaUsersCog />}
          color="red"
        />
      </div>
    </div>
  );
};

// ============================================================
// Content Tab
// ============================================================

const ContentTab: React.FC<{
  stats: DashboardStats;
}> = ({ stats }) => {
  return (
    <div
      className="space-y-6"
      data-aos="fade-up"
    >
      <PageSectionHeader
        icon={<FaVideo />}
        title="إدارة المحتوى"
        description="إدارة الفيديوهات والملخصات والمحتوى"
        route="/admin-videos"
        buttonText="فتح إدارة المحتوى"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimpleStat
          title="الفيديوهات"
          value={
            stats.content?.videos ||
            0
          }
          icon={<FaVideo />}
          color="purple"
        />

        <SimpleStat
          title="الملخصات"
          value={
            stats.content?.summaries ||
              0
          }
          icon={<FaFileAlt />}
          color="blue"
        />

        <SimpleStat
          title="إجمالي المحتوى"
          value={
            stats.content?.total ||
            0
          }
          icon={<FaLayerGroup />}
          color="green"
        />
      </div>
    </div>
  );
};

// ============================================================
// Payments Tab
// ============================================================

const PaymentsTab: React.FC<{
  stats: DashboardStats;
}> = ({ stats }) => {
  return (
    <div
      className="space-y-6"
      data-aos="fade-up"
    >
      <PageSectionHeader
        icon={<FaMoneyBill />}
        title="إدارة المدفوعات"
        description="متابعة الإيرادات وحالات المدفوعات"
        route="/admin-payments"
        buttonText="فتح إدارة المدفوعات"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimpleStat
          title="إجمالي الإيرادات"
          value={`${(
            stats.payments
              ?.totalRevenue ||
            0
          ).toLocaleString()} ريال`}
          icon={<FaMoneyBill />}
          color="green"
        />

        <SimpleStat
          title="إجمالي المدفوعات"
          value={
            stats.payments?.total ||
            0
          }
          icon={<FaCreditCard />}
          color="purple"
        />

        <SimpleStat
          title="مدفوعات معلقة"
          value={
            stats.realtime
              ?.pendingPayments ||
            0
          }
          icon={<FaClock />}
          color="yellow"
        />
      </div>
    </div>
  );
};

// ============================================================
// Settings Tab
// ============================================================

const SettingsTab: React.FC = () => {
  return (
    <div
      className="space-y-6"
      data-aos="fade-up"
    >
      <PageSectionHeader
        icon={<FaCog />}
        title="إعدادات النظام"
        description="إدارة إعدادات منصة ارتقاء"
        route="/admin-settings"
        buttonText="فتح الإعدادات"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettingsCard
          title="الإعدادات العامة"
          description="اسم الموقع والوصف والشعار"
          icon="🌐"
        />

        <SettingsCard
          title="الأمان"
          description="الصلاحيات والمصادقة"
          icon="🔐"
        />

        <SettingsCard
          title="الدفع"
          description="بوابات الدفع والعملات"
          icon="💳"
        />

        <SettingsCard
          title="البريد الإلكتروني"
          description="إعدادات SMTP والقوالب"
          icon="📧"
        />
      </div>
    </div>
  );
};

// ============================================================
// Page Section Header
// ============================================================

const PageSectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  route: string;
  buttonText: string;
}> = ({
  icon,
  title,
  description,
  route,
  buttonText,
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-xl">
            {icon}
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {title}
            </h2>

            <p className="text-sm text-white/75 mt-1">
              {description}
            </p>
          </div>
        </div>

        <Link
          to={route}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-purple-700 hover:bg-gray-100 transition font-semibold text-sm"
        >
          {buttonText}
          <FaArrowLeft />
        </Link>
      </div>
    </div>
  );
};

// ============================================================
// Simple Stat
// ============================================================

const SimpleStat: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color:
    | 'blue'
    | 'purple'
    | 'green'
    | 'yellow'
    | 'red';
}> = ({
  title,
  value,
  icon,
  color,
}) => {
  const classes = {
    blue:
      'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',

    purple:
      'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300',

    green:
      'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300',

    yellow:
      'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-300',

    red:
      'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${classes[color]}`}
      >
        {icon}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        {title}
      </p>

      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
  );
};

// ============================================================
// Settings Card
// ============================================================

const SettingsCard: React.FC<{
  title: string;
  description: string;
  icon: string;
}> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
      <div className="text-2xl mb-3">
        {icon}
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {description}
      </p>
    </div>
  );
};

// ============================================================
// Static Helpers
// ============================================================

const getStatusTextStatic = (
  status: string
) => {
  const texts: {
    [key: string]: string;
  } = {
    new: 'جديد',
    under_review:
      'قيد المراجعة',
    assigned: 'تم الإسناد',
    scope_definition:
      'تحديد النطاق',
    awaiting_approval:
      'بانتظار الموافقة',
    awaiting_payment:
      'بانتظار الدفع',
    in_progress:
      'قيد التنفيذ',
    under_review_2:
      'مراجعة التسليم',
    modification:
      'تعديل',
    completed:
      'مكتمل',
    closed:
      'مغلق',
    cancelled:
      'ملغي',
  };

  return texts[status] || status;
};

const getStatusColorStatic = (
  status: string
) => {
  const colors: {
    [key: string]: string;
  } = {
    new: 'bg-blue-500',
    under_review:
      'bg-yellow-500',
    assigned:
      'bg-purple-500',
    scope_definition:
      'bg-indigo-500',
    awaiting_approval:
      'bg-orange-500',
    awaiting_payment:
      'bg-pink-500',
    in_progress:
      'bg-blue-500',
    under_review_2:
      'bg-cyan-500',
    modification:
      'bg-red-500',
    completed:
      'bg-green-500',
    closed:
      'bg-gray-500',
    cancelled:
      'bg-red-500',
  };

  return (
    colors[status] ||
    'bg-gray-500'
  );
};

const getStatusSoftColorStatic = (
  status: string
) => {
  const colors: {
    [key: string]: string;
  } = {
    new:
      'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',

    under_review:
      'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',

    assigned:
      'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',

    scope_definition:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',

    awaiting_approval:
      'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',

    awaiting_payment:
      'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',

    in_progress:
      'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',

    under_review_2:
      'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',

    modification:
      'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',

    completed:
      'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',

    closed:
      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',

    cancelled:
      'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  };

  return (
    colors[status] ||
    'bg-gray-100 text-gray-700'
  );
};

const getRoleLabelStatic = (
  role: string
) => {
  const labels: {
    [key: string]: string;
  } = {
    customer: 'عميل',
    specialist: 'مختص',
    portal_admin:
      'مدير البوابة',
    super_admin:
      'مشرف عام',
  };

  return labels[role] || role;
};

const getActionLabelStatic = (
  action: string
) => {
  const labels: {
    [key: string]: string;
  } = {
    created: 'أنشأ',
    updated: 'حدث',
    deleted: 'حذف',
    viewed: 'عرض',
    approved: 'وافق على',
    rejected: 'رفض',
    assigned: 'أسند',
    completed: 'أكمل',
    status_changed:
      'غير الحالة',
    request_created:
      'أنشأ طلب',
    request_updated:
      'حدث طلب',
    payment_submitted:
      'قدم دفعة',
    scope_defined:
      'حدد النطاق',
    scope_approved:
      'وافق على النطاق',
    specialist_assigned:
      'أسند مختص',
    work_delivered:
      'سلم العمل',
    modification_requested:
      'طلب تعديل',
    request_completed:
      'أكمل الطلب',
    request_closed:
      'أغلق الطلب',
    file_uploaded:
      'رفع ملف',
    message_sent:
      'أرسل رسالة',
  };

  return (
    labels[action] ||
    action
  );
};

const getActivityIconStatic = (
  action: string
) => {
  if (
    action === 'created' ||
    action === 'request_created'
  ) {
    return <FaPlus />;
  }

  if (
    action === 'updated' ||
    action === 'request_updated'
  ) {
    return <FaEdit />;
  }

  if (action === 'deleted') {
    return <FaTrash />;
  }

  if (
    action === 'status_changed'
  ) {
    return <FaClock />;
  }

  if (
    action ===
    'payment_submitted'
  ) {
    return <FaMoneyBill />;
  }

  if (
    action === 'file_uploaded'
  ) {
    return <FaFileUpload />;
  }

  if (
    action === 'message_sent'
  ) {
    return <FaCheckCircle />;
  }

  if (
    action ===
    'specialist_assigned'
  ) {
    return <FaUsers />;
  }

  return <FaEye />;
};

const formatDateStatic = (
  date: string
) => {
  if (!date) return '-';

  return new Date(
    date
  ).toLocaleDateString(
    'ar-SA',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );
};

const formatDateTimeStatic = (
  date: string | Date
) => {
  if (!date) return '-';

  return new Date(
    date
  ).toLocaleString(
    'ar-SA',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    }
  );
};

const getStatCount = (
  stats: DashboardStats,
  status: string
) => {
  return (
    stats.requests?.byStatus?.find(
      (item) =>
        item._id === status
    )?.count || 0
  );
};

const getRoleLabel = (
  role: string
) => {
  return getRoleLabelStatic(
    role
  );
};

export default AdminDashboard;