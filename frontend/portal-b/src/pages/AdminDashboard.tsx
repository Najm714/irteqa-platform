// frontend/portal-a/src/pages/AdminDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Header from '../components/layout/Header';
import {
  FaUsers, FaFileAlt, FaMoneyBill, FaVideo,
  FaChartLine, FaCog, FaBell, FaSignOutAlt,
  FaSpinner, FaEye,
  FaClock,
  FaArrowUp, FaSun, FaMoon,
  FaEdit, FaTrash, FaPlus,
  FaExclamationTriangle,
  FaFolder, FaBook,
  FaChartBar,
  FaCoins,
  FaInfoCircle,
  FaFileUpload,
  FaHome,
  FaUserGraduate,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
  FaRocket, FaTag, FaTimes
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
    byStatus: Array<{ _id: string; count: number; total?: number }>;
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
    profile: { fullName: string };
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
    profile: { fullName: string };
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

// ============================================================
// المكون الرئيسي
// ============================================================

const AdminDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { isOpen, close, isMobile, sidebarType } = useSidebar();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    requests: { total: 0, byStatus: [] },
    users: { total: 0, byRole: [] },
    payments: { total: 0, totalRevenue: 0, byStatus: [] },
    subscriptions: { total: 0, byStatus: [] },
    content: { videos: 0, summaries: 0, total: 0 },
    sections: { total: 0, published: 0 },
    services: { total: 0, published: 0 },
    realtime: { activeUsers: 0, activeRequests: 0, pendingPayments: 0 },
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'users' | 'content' | 'payments' | 'settings'>('overview');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ✅ السايدبار يظهر فقط إذا كان النوع 'admin' ومفتوح
  const showAdminSidebar = isOpen && sidebarType === 'admin';

  // ============================================================
  // ✅ تهيئة AOS
  // ============================================================

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  // ============================================================
  // ✅ جلب جميع البيانات
  // ============================================================

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ جلب الإحصائيات
      const statsResponse = await fetch(`${API_URL}/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      if (statsResponse.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (!statsResponse.ok) throw new Error('Failed to fetch stats');

      const statsData = await statsResponse.json();
      if (statsData.success) {
        const data = statsData.data || {};
        setStats({
          requests: {
            total: data.requests?.total || 0,
            byStatus: data.requests?.byStatus || [],
          },
          users: {
            total: data.users?.total || 0,
            byRole: data.users?.byRole || [],
          },
          payments: {
            total: data.payments?.total || 0,
            totalRevenue: data.payments?.totalRevenue || 0,
            byStatus: data.payments?.byStatus || [],
          },
          subscriptions: {
            total: data.subscriptions?.total || 0,
            byStatus: data.subscriptions?.byStatus || [],
          },
          content: {
            videos: data.content?.videos || 0,
            summaries: data.content?.summaries || 0,
            total: data.content?.total || 0,
          },
          sections: {
            total: data.sections?.total || 0,
            published: data.sections?.published || 0,
          },
          services: {
            total: data.services?.total || 0,
            published: data.services?.published || 0,
          },
          realtime: {
            activeUsers: data.realtime?.activeUsers || 0,
            activeRequests: data.realtime?.activeRequests || 0,
            pendingPayments: data.realtime?.pendingPayments || 0,
          },
        });
      }

      // ✅ جلب النشاطات الأخيرة
      try {
        const activityResponse = await fetch(`${API_URL}/admin/audit-log?limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });

        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          if (activityData.success) {
            setRecentActivities(activityData.data || []);
          }
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
      }

      // ✅ جلب الطلبات الأخيرة
      try {
        const requestsResponse = await fetch(`${API_URL}/requests/all?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          if (requestsData.success) {
            setRecentRequests(requestsData.data || []);
          }
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
      }

      // ✅ جلب الإشعارات
      try {
        const notifResponse = await fetch(`${API_URL}/notifications?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });

        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          if (notifData.success) {
            setNotifications(notifData.data || []);
          }
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate, API_URL, PORTAL_ID]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================
  // ✅ دوال مساعدة
  // ============================================================

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'new': 'bg-blue-500',
      'under_review': 'bg-yellow-500',
      'assigned': 'bg-purple-500',
      'scope_definition': 'bg-indigo-500',
      'awaiting_approval': 'bg-orange-500',
      'awaiting_payment': 'bg-pink-500',
      'in_progress': 'bg-blue-500',
      'under_review_2': 'bg-cyan-500',
      'modification': 'bg-red-500',
      'completed': 'bg-green-500',
      'closed': 'bg-gray-500',
      'cancelled': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'new': 'جديد',
      'under_review': 'قيد المراجعة',
      'assigned': 'تم الإسناد',
      'scope_definition': 'تحديد النطاق',
      'awaiting_approval': 'بانتظار الموافقة',
      'awaiting_payment': 'بانتظار الدفع',
      'in_progress': 'قيد التنفيذ',
      'under_review_2': 'مراجعة التسليم',
      'modification': 'تعديل',
      'completed': 'مكتمل',
      'closed': 'مغلق',
      'cancelled': 'ملغي',
    };
    return texts[status] || status;
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'customer': 'عميل',
      'specialist': 'مختص',
      'portal_admin': 'مدير البوابة',
      'super_admin': 'مشرف عام',
    };
    return labels[role] || role;
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'created': 'أنشأ',
      'updated': 'حدث',
      'deleted': 'حذف',
      'viewed': 'عرض',
      'approved': 'وافق على',
      'rejected': 'رفض',
      'assigned': 'أسند',
      'completed': 'أكمل',
      'status_changed': 'غير الحالة',
      'request_created': 'أنشأ طلب',
      'request_updated': 'حدث طلب',
      'payment_submitted': 'قدم دفعة',
      'scope_defined': 'حدد النطاق',
      'scope_approved': 'وافق على النطاق',
      'specialist_assigned': 'أسند مختص',
      'work_delivered': 'سلم العمل',
      'modification_requested': 'طلب تعديل',
      'request_completed': 'أكمل الطلب',
      'request_closed': 'أغلق الطلب',
      'file_uploaded': 'رفع ملف',
      'message_sent': 'أرسل رسالة',
    };
    return labels[action] || action;
  };

  // ============================================================
  // ✅ قائمة الروابط الإدارية
  // ============================================================

  const adminLinks = [
    { to: '/admin-dashboard', label: 'الرئيسية', icon: <FaHome />, color: 'purple' },
    { to: '/admin-services', label: 'الخدمات', icon: <FaCog />, color: 'blue' },
    { to: '/admin-sections', label: 'الأقسام', icon: <FaFolder />, color: 'indigo' },
    { to: '/admin-requests', label: 'الطلبات', icon: <FaFileAlt />, color: 'pink' },
    { to: '/admin-videos', label: 'الفيديوهات', icon: <FaVideo />, color: 'red' },
    { to: '/admin-users', label: 'المستخدمين', icon: <FaUsers />, color: 'indigo' },
    { to: '/admin-payments', label: 'المدفوعات', icon: <FaMoneyBill />, color: 'yellow' },
    { to: '/admin-library', label: 'المكتبة', icon: <FaBook />, color: 'teal' },
    { to: '/admin-videos-library', label: 'مكتبة الفيديوهات', icon: <FaVideo />, color: 'purple' },
    { to: '/admin-infographics', label: 'الإنفوجرافيك', icon: <FaChartBar />, color: 'emerald' },
    { to: '/admin-offers', label: 'العروض', icon: <FaTag />, color: 'pink' },
    { to: '/admin-about', label: 'نبذة عنا', icon: <FaInfoCircle />, color: 'indigo' },
    { to: '/admin-service-details', label: 'تفاصيل الخدمات', icon: <FaInfoCircle />, color: 'cyan' },
    { to: '/admin-service-forms', label: 'نماذج الخدمات', icon: <FaFileUpload />, color: 'teal' },
    { to: '/admin-reports', label: 'التقارير', icon: <FaChartBar />, color: 'orange' },
    { to: '/admin-settings', label: 'الإعدادات', icon: <FaCog />, color: 'gray' },
  ];

  // ============================================================
  // ✅ عدد الإشعارات غير المقروءة
  // ============================================================

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // ============================================================
  // ✅ عرض حالة التحميل
  // ============================================================

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

  // ============================================================
  // ✅ عرض الخطأ
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">حدث خطأ</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ العرض الرئيسي
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* ✅ استخدام Header العام */}
      <Header />

      <div className="flex flex-1 relative">
        {/* ============================================================
            ✅ السايدبار الجانبي للمدير
            ============================================================ */}
        <aside 
          className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
            showAdminSidebar ? 'translate-x-0' : 'translate-x-full'
          } md:translate-x-0 md:relative md:z-0 md:shadow-none`}
        >
          <div className="h-full flex flex-col">
            {/* رأس السايدبار */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  إ
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-gray-900 dark:text-white text-lg truncate">لوحة الإدارة</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">مرحباً {user?.fullName || 'مدير'}</p>
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

            {/* قائمة الروابط الإدارية */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => {
                    if (isMobile) close();
                    // تحديث التبويب النشط
                    if (link.to === '/admin-dashboard') setActiveTab('overview');
                    else if (link.to === '/admin-requests') setActiveTab('requests');
                    else if (link.to === '/admin-users') setActiveTab('users');
                    else if (link.to === '/admin-videos' || link.to === '/admin-explanations') setActiveTab('content');
                    else if (link.to === '/admin-payments') setActiveTab('payments');
                    else if (link.to === '/admin-settings') setActiveTab('settings');
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    (link.to === '/admin-dashboard' && activeTab === 'overview') ||
                    (link.to === '/admin-requests' && activeTab === 'requests') ||
                    (link.to === '/admin-users' && activeTab === 'users') ||
                    ((link.to === '/admin-videos' || link.to === '/admin-explanations') && activeTab === 'content') ||
                    (link.to === '/admin-payments' && activeTab === 'payments') ||
                    (link.to === '/admin-settings' && activeTab === 'settings')
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{link.icon}</span>
                  <span className="font-medium truncate">{link.label}</span>
                </Link>
              ))}
            </nav>

            {/* زر تسجيل الخروج */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <FaSignOutAlt className="text-lg flex-shrink-0" />
                <span className="font-medium">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </aside>

        {/* خلفية مظللة للموبايل */}
        {isMobile && showAdminSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={close}
            aria-hidden="true"
          />
        )}

        {/* ============================================================
            ✅ المحتوى الرئيسي
            ============================================================ */}
        <main className="flex-1 min-h-screen overflow-x-hidden">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* ✅ تبويب نظرة عامة */}
            {activeTab === 'overview' && stats && (
              <OverviewTab 
                stats={stats} 
                recentActivities={recentActivities}
                recentRequests={recentRequests}
                notifications={notifications}
                unreadCount={unreadCount}
              />
            )}

            {/* ✅ تبويب الطلبات */}
            {activeTab === 'requests' && (
              <RequestsTab stats={stats} />
            )}

            {/* ✅ تبويب المستخدمين */}
            {activeTab === 'users' && (
              <UsersTab stats={stats} />
            )}

            {/* ✅ تبويب المحتوى */}
            {activeTab === 'content' && (
              <ContentTab stats={stats} />
            )}

            {/* ✅ تبويب المدفوعات */}
            {activeTab === 'payments' && (
              <PaymentsTab stats={stats} />
            )}

            {/* ✅ تبويب الإعدادات */}
            {activeTab === 'settings' && (
              <SettingsTab />
            )}
          </div>
        </main>
      </div>

      {/* ✅ زر العودة للأعلى */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 left-6 p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1 z-40"
        aria-label="العودة للأعلى"
      >
        <FaArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

// ============================================================
// ✅ مكونات التبويبات
// ============================================================

// ===== OverviewTab =====
interface OverviewTabProps {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  recentRequests: RecentRequest[];
  notifications: any[];
  unreadCount: number;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  stats, 
  recentActivities, 
  recentRequests,
  notifications,
  unreadCount 
}) => {
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'new': 'bg-blue-500',
      'under_review': 'bg-yellow-500',
      'assigned': 'bg-purple-500',
      'scope_definition': 'bg-indigo-500',
      'awaiting_approval': 'bg-orange-500',
      'awaiting_payment': 'bg-pink-500',
      'in_progress': 'bg-blue-500',
      'under_review_2': 'bg-cyan-500',
      'modification': 'bg-red-500',
      'completed': 'bg-green-500',
      'closed': 'bg-gray-500',
      'cancelled': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      'new': 'جديد',
      'under_review': 'قيد المراجعة',
      'assigned': 'تم الإسناد',
      'scope_definition': 'تحديد النطاق',
      'awaiting_approval': 'بانتظار الموافقة',
      'awaiting_payment': 'بانتظار الدفع',
      'in_progress': 'قيد التنفيذ',
      'under_review_2': 'مراجعة التسليم',
      'modification': 'تعديل',
      'completed': 'مكتمل',
      'closed': 'مغلق',
      'cancelled': 'ملغي',
    };
    return texts[status] || status;
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'customer': 'عميل',
      'specialist': 'مختص',
      'portal_admin': 'مدير البوابة',
      'super_admin': 'مشرف عام',
    };
    return labels[role] || role;
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      'created': 'أنشأ',
      'updated': 'حدث',
      'deleted': 'حذف',
      'viewed': 'عرض',
      'approved': 'وافق على',
      'rejected': 'رفض',
      'assigned': 'أسند',
      'completed': 'أكمل',
      'status_changed': 'غير الحالة',
      'request_created': 'أنشأ طلب',
      'request_updated': 'حدث طلب',
      'payment_submitted': 'قدم دفعة',
      'scope_defined': 'حدد النطاق',
      'scope_approved': 'وافق على النطاق',
      'specialist_assigned': 'أسند مختص',
      'work_delivered': 'سلم العمل',
      'modification_requested': 'طلب تعديل',
      'request_completed': 'أكمل الطلب',
      'request_closed': 'أغلق الطلب',
      'file_uploaded': 'رفع ملف',
      'message_sent': 'أرسل رسالة',
    };
    return labels[action] || action;
  };

  const statCards = [
    { icon: <FaFileAlt className="w-6 h-6" />, title: 'الطلبات', value: stats.requests?.total || 0, color: 'blue', subtitle: `${stats.requests?.byStatus?.find(s => s._id === 'new')?.count || 0} جديد` },
    { icon: <FaUsers className="w-6 h-6" />, title: 'المستخدمين', value: stats.users?.total || 0, color: 'purple', subtitle: `${stats.users?.byRole?.find(r => r._id === 'customer')?.count || 0} عميل` },
    { icon: <FaMoneyBill className="w-6 h-6" />, title: 'الإيرادات', value: `${(stats.payments?.totalRevenue || 0).toLocaleString()} ريال`, color: 'green', subtitle: `${stats.payments?.total || 0} دفعة` },
    { icon: <FaVideo className="w-6 h-6" />, title: 'المحتوى', value: stats.content?.total || 0, color: 'orange', subtitle: `${stats.content?.videos || 0} فيديو` },
    { icon: <FaFolder className="w-6 h-6" />, title: 'الأقسام', value: stats.sections?.total || 0, color: 'indigo', subtitle: `${stats.sections?.published || 0} منشور` },
    { icon: <FaCog className="w-6 h-6" />, title: 'الخدمات', value: stats.services?.total || 0, color: 'pink', subtitle: `${stats.services?.published || 0} منشور` },
  ];

  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
  };

  return (
    <div className="space-y-6" data-aos="fade-up">
      {/* ✅ بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            data-aos="fade-up"
            data-aos-delay={index * 50}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full ${colors[card.color as keyof typeof colors]}`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{card.title}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{card.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ الحالة الفورية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
          <div className="text-2xl font-bold text-green-500">
            {stats.realtime?.activeUsers || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">🟢 مستخدمين نشطين</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
          <div className="text-2xl font-bold text-blue-500">
            {stats.realtime?.activeRequests || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">⚡ طلبات نشطة</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center hover:shadow-md transition">
          <div className="text-2xl font-bold text-yellow-500">
            {stats.realtime?.pendingPayments || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">💳 دفعات معلقة</div>
        </div>
      </div>

      {/* ✅ الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* حالة الطلبات */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaFileAlt className="text-purple-600" />
            📋 حالة الطلبات
          </h3>
          <div className="space-y-3">
            {stats.requests?.byStatus?.map((item) => (
              <div key={item._id} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {getStatusText(item._id)}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStatusColor(item._id)} rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min((item.count / (stats.requests?.total || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white min-w-[30px] text-center text-sm">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
            {stats.requests?.byStatus?.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                لا توجد طلبات
              </div>
            )}
          </div>
        </div>

        {/* أدوار المستخدمين */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaUsers className="text-purple-600" />
            👥 أدوار المستخدمين
          </h3>
          <div className="space-y-3">
            {stats.users?.byRole?.map((item) => (
              <div key={item._id} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {getRoleLabel(item._id)}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((item.count / (stats.users?.total || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white min-w-[30px] text-center text-sm">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
            {stats.users?.byRole?.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                لا توجد مستخدمين
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ النشاطات الأخيرة */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaClock className="text-purple-600" />
            📋 النشاطات الأخيرة
          </h3>
          <span className="text-xs text-gray-400">{recentActivities.length} نشاط</span>
        </div>
        {recentActivities.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            لا توجد نشاطات مسجلة
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
            {recentActivities.slice(0, 10).map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                  {activity.action === 'created' || activity.action === 'request_created' ? <FaPlus /> :
                   activity.action === 'updated' || activity.action === 'request_updated' ? <FaEdit /> :
                   activity.action === 'deleted' ? <FaTrash /> :
                   activity.action === 'status_changed' ? <FaClock /> :
                   activity.action === 'payment_submitted' ? <FaMoneyBill /> :
                   activity.action === 'file_uploaded' ? <FaFileUpload /> :
                   activity.action === 'message_sent' ? <FaCheckCircle /> :
                   <FaEye />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activity.actorId?.profile?.fullName || 'مستخدم'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {' '}{getActionLabel(activity.action)} {activity.resourceType || 'مورد'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  {activity.metadata && (
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {typeof activity.metadata === 'string' 
                        ? activity.metadata 
                        : JSON.stringify(activity.metadata).substring(0, 100)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ أحدث الطلبات */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaRocket className="text-purple-600" />
            🚀 أحدث الطلبات
          </h3>
          <Link to="/admin-requests" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            عرض الكل
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            لا توجد طلبات
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الطلب</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العميل</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الخدمة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentRequests.map((request, index) => (
                  <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {request.title || 'طلب'}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          #{request.requestNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {request.accountId?.profile?.fullName || 'مستخدم'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {request.serviceId?.nameAr || request.serviceId?.name || 'خدمة'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {request.price > 0 ? `${request.price} ريال` : 'مجاني'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/request/${request._id}`}
                        className="px-3 py-1 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition text-sm"
                      >
                        <FaEye className="w-3 h-3 inline ml-1" /> عرض
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== RequestsTab =====
const RequestsTab: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FaFileAlt className="text-purple-600" />
        📋 إدارة الطلبات
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600">{stats.requests?.total || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">📊 إجمالي الطلبات</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.requests?.byStatus?.find(s => s._id === 'new')?.count || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">🆕 جديدة</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600">
            {stats.requests?.byStatus?.find(s => s._id === 'completed')?.count || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">✅ مكتملة</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600">
            {stats.requests?.byStatus?.find(s => s._id === 'cancelled')?.count || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">🚫 ملغية</div>
        </div>
      </div>
      <div className="text-center">
        <Link
          to="/admin-requests"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2"
        >
          <FaFileAlt /> الذهاب إلى إدارة الطلبات
        </Link>
      </div>
    </div>
  );
};

// ===== UsersTab =====
const UsersTab: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FaUsers className="text-purple-600" />
        👥 إدارة المستخدمين
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600">{stats.users?.total || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">👤 إجمالي المستخدمين</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600">
            {stats.users?.byRole?.find(r => r._id === 'customer')?.count || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">🛒 عملاء</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600">
            {stats.users?.byRole?.find(r => r._id === 'specialist')?.count || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">🎓 مختصين</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600">
            {(stats.users?.byRole?.find(r => r._id === 'portal_admin')?.count || 0) + 
             (stats.users?.byRole?.find(r => r._id === 'super_admin')?.count || 0)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">👑 مديرين</div>
        </div>
      </div>
      <div className="text-center">
        <Link
          to="/admin-users"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2"
        >
          <FaUsers /> الذهاب إلى إدارة المستخدمين
        </Link>
      </div>
    </div>
  );
};

// ===== ContentTab =====
const ContentTab: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FaVideo className="text-purple-600" />
        📝 إدارة المحتوى
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
          <div className="text-3xl font-bold text-purple-600">{stats.content?.videos || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">🎬 فيديوهات</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
          <div className="text-3xl font-bold text-blue-600">{stats.content?.summaries || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">📄 ملخصات</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
          <div className="text-3xl font-bold text-green-600">{stats.content?.total || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">📚 إجمالي المحتوى</div>
        </div>
      </div>
      <div className="text-center">
        <Link
          to="/admin-videos"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2"
        >
          <FaVideo /> الذهاب إلى إدارة المحتوى
        </Link>
      </div>
    </div>
  );
};

// ===== PaymentsTab =====
const PaymentsTab: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FaMoneyBill className="text-purple-600" />
        💰 إدارة المدفوعات
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600">{stats.payments?.totalRevenue?.toLocaleString() || 0} ريال</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">💰 إجمالي الإيرادات</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600">{stats.payments?.total || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">📊 إجمالي المدفوعات</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-500">{stats.realtime?.pendingPayments || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">⏳ مدفوعات معلقة</div>
        </div>
      </div>
      <div className="text-center">
        <Link
          to="/admin-payments"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2"
        >
          <FaCreditCard /> الذهاب إلى إدارة المدفوعات
        </Link>
      </div>
    </div>
  );
};

// ===== SettingsTab =====
const SettingsTab: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700" data-aos="fade-up">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FaCog className="text-purple-600" />
        ⚙️ إعدادات النظام
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        يمكنك إدارة إعدادات النظام من هنا
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
          <h4 className="font-semibold text-gray-900 dark:text-white">🌐 الإعدادات العامة</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">اسم الموقع، الوصف، الشعار</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
          <h4 className="font-semibold text-gray-900 dark:text-white">🔐 الأمان</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">صلاحيات المستخدمين، المصادقة</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
          <h4 className="font-semibold text-gray-900 dark:text-white">💳 الدفع</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">بوابات الدفع، العملات</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
          <h4 className="font-semibold text-gray-900 dark:text-white">📧 البريد الإلكتروني</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إعدادات SMTP، القوالب</p>
        </div>
      </div>
      <div className="mt-6 text-center">
        <Link
          to="/admin-settings"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2"
        >
          <FaCog /> الذهاب إلى الإعدادات المتقدمة
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;