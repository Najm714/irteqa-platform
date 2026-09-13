// frontend/portal-a/src/pages/Dashboard/CustomerDashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
// ✅ استيراد Header العام
import Header from '../../components/layout/Header';

// أيقونات
import {
  FaHome, FaFileAlt, FaCreditCard, FaUser, FaCog,
  FaBell, FaSignOutAlt, FaSpinner, FaUsers,
  FaClock, FaCheckCircle, FaTimesCircle, FaPlus,
  FaEye,
  FaUserCircle,
  FaGlobe, FaLock, FaSave, FaCamera,
  FaMapMarkerAlt,
  FaMoneyBill,
  FaTimes,
  FaSearch,
} from 'react-icons/fa';

// ============================================================
// ✅ دوال مساعدة
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
  const statusMap: Record<string, { label: string; color: string }> = {
    // حالات الطلبات
    'new': { label: 'جديد', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'under_review': { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'assigned': { label: 'تم الإسناد', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    'in_progress': { label: 'قيد التنفيذ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'completed': { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    'closed': { label: 'مغلق', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    // حالات الاشتراكات
    'active': { label: 'نشط', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'pending': { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'expired': { label: 'منتهي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    // حالات المدفوعات
    'paid': { label: 'مدفوع', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'failed': { label: 'فشل', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    'refunded': { label: 'مسترجع', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    'verified': { label: 'مؤكد', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'rejected': { label: 'مرفوض', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    'submitted': { label: 'مرسل', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };
  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
};

// ============================================================
// ✅ واجهات TypeScript
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
// ✅ المكون الرئيسي
// ============================================================

const CustomerDashboard: React.FC = () => {
  const { token, user, logout } = useAuth();
  const { isOpen, close, isMobile, sidebarType, setSidebarType } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  // ✅ السايدبار يظهر فقط إذا كان النوع 'dashboard' ومفتوح
  const showDashboardSidebar = isOpen && sidebarType === 'dashboard';

  const getAvatarUrl = (avatarId: string | undefined) => {
    if (!avatarId) return null;
    return `${API_URL}/files/public/${avatarId}`;
  };

  // ============================================================
  // ✅ جلب بيانات لوحة التحكم
  // ============================================================

  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const statsResponse = await fetch(`${API_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
        if (statsData.data.recentNotifications) {
          setNotifications(statsData.data.recentNotifications);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  // ============================================================
  // ✅ تهيئة AOS و sidebarType
  // ============================================================

  useEffect(() => {
    setSidebarType('dashboard');
    return () => setSidebarType('main');
  }, [setSidebarType]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================
  // ✅ تسجيل الخروج
  // ============================================================

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ============================================================
  // ✅ بيانات المستخدم
  // ============================================================

  const extendedUser = user as ExtendedUser;
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  // ============================================================
  // ✅ عناصر القائمة
  // ============================================================

  const menuItems = [
    { id: 'overview', label: 'نظرة عامة', icon: <FaHome /> },
    { id: 'requests', label: 'طلباتي', icon: <FaFileAlt /> },
    { id: 'subscriptions', label: 'اشتراكاتي', icon: <FaUsers /> },
    { id: 'payments', label: 'المدفوعات', icon: <FaCreditCard /> },
    { id: 'notifications', label: 'الإشعارات', icon: <FaBell /> },
    { id: 'addresses', label: 'العناوين', icon: <FaMapMarkerAlt /> },
    { id: 'profile', label: 'الملف الشخصي', icon: <FaUser /> },
    { id: 'settings', label: 'الإعدادات', icon: <FaCog /> },
  ];

  // ✅ احسب activeTab مباشرة من URL param

const activeTab = useMemo(() => {
  const path = location.pathname;
  if (path === '/dashboard' || path === '/dashboard/') return 'overview';
  if (path.startsWith('/dashboard/requests')) return 'requests';
  if (path.startsWith('/dashboard/subscriptions')) return 'subscriptions';
  if (path.startsWith('/dashboard/payments')) return 'payments';
  if (path.startsWith('/dashboard/notifications')) return 'notifications';
  if (path.startsWith('/dashboard/addresses')) return 'addresses';
  if (path.startsWith('/dashboard/profile')) return 'profile';
  if (path.startsWith('/dashboard/settings')) return 'settings';
  return 'overview';
}, [location.pathname]);
  // ✅ دالة التنقل
  const handleNavigate = (itemId: string) => {
    const path = itemId === 'overview' ? '/dashboard' : `/dashboard/${itemId}`;
    navigate(path);
    if (isMobile) close();
  };

  // ============================================================
  // ✅ عرض شاشة التحميل
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ✅ عرض لوحة التحكم
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <div className="flex flex-1 relative">
        {/* السايدبار الجانبي */}
        <aside
          className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transition-all duration-300 ease-in-out ${
            showDashboardSidebar ? 'translate-x-0' : 'translate-x-full'
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
                  <h1 className="font-bold text-gray-900 dark:text-white text-lg truncate">ارتقاء</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">منصة الخدمات الرقمية</p>
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

            {/* معلومات المستخدم */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                  {extendedUser?.profile?.avatar ? (
                    <img
                      src={getAvatarUrl(extendedUser.profile.avatar) || ''}
                      alt={extendedUser?.fullName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FaUserCircle className="text-purple-600 dark:text-purple-400 text-3xl" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {extendedUser?.fullName || 'مستخدم'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {extendedUser?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* قائمة التنقل */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <span className="font-medium truncate">{item.label}</span>
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* زر تسجيل الخروج */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <FaSignOutAlt className="text-lg flex-shrink-0" />
                <span className="font-medium">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </aside>

        {/* خلفية مظللة على الموبايل */}
        {isMobile && showDashboardSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={close}
            aria-hidden="true"
          />
        )}

        {/* المحتوى الرئيسي */}
        <main className="flex-1 min-h-screen overflow-x-hidden">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {activeTab === 'overview' && stats && (
              <OverviewTab stats={stats} onNavigate={navigate} />
            )}
            {activeTab === 'requests' && (
              <RequestsTab token={token} onNavigate={navigate} />
            )}
            {activeTab === 'subscriptions' && (
              <SubscriptionsTab token={token} onNavigate={navigate} />
            )}
            {activeTab === 'payments' && (
              <PaymentsTab token={token} />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab notifications={notifications} />
            )}
            {activeTab === 'addresses' && (
              <AddressesTab />
            )}
            {activeTab === 'profile' && (
              <ProfileTab token={token} user={extendedUser} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab token={token} user={extendedUser} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// ============================================================
// ✅ OverviewTab - نظرة عامة
// ============================================================

interface OverviewTabProps {
  stats: DashboardStats;
  onNavigate: (path: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats, onNavigate }) => {
  const statCards = [
    { title: 'الطلبات', value: stats?.totalRequests || 0, icon: <FaFileAlt className="text-purple-600" />, bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'قيد التنفيذ', value: stats?.inProgress || 0, icon: <FaClock className="text-yellow-600" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { title: 'مكتملة', value: stats?.completed || 0, icon: <FaCheckCircle className="text-green-600" />, bg: 'bg-green-50 dark:bg-green-900/20' },
    { title: 'الاشتراكات النشطة', value: stats?.activeSubscriptions || 0, icon: <FaUsers className="text-blue-600" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'المدفوعات المؤكدة', value: stats?.paidPayments || 0, icon: <FaCreditCard className="text-emerald-600" />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'المبلغ الإجمالي', value: `${stats?.totalAmount || 0} ريال`, icon: <FaMoneyBill className="text-amber-600" />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">⚡ إجراءات سريعة</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'طلب جديد', icon: <FaPlus />, path: '/services', color: 'purple' },
            { label: 'طلباتي', icon: <FaFileAlt />, path: '/dashboard/requests', color: 'blue' },
            { label: 'اشتراكاتي', icon: <FaUsers />, path: '/dashboard/subscriptions', color: 'green' },
            { label: 'الملف الشخصي', icon: <FaUser />, path: '/dashboard/profile', color: 'pink' },
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => onNavigate(action.path)}
              className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${
                action.color === 'purple' ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100' :
                action.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100' :
                action.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100' :
                'bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100'
              }`}
            >
              <span className={`text-2xl ${
                action.color === 'purple' ? 'text-purple-600' :
                action.color === 'blue' ? 'text-blue-600' :
                action.color === 'green' ? 'text-green-600' :
                'text-pink-600'
              }`}>{action.icon}</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">📋 آخر الطلبات</h3>
          <button onClick={() => onNavigate('/dashboard/requests')} className="text-sm text-purple-600 hover:text-purple-700">عرض الكل</button>
        </div>
        {stats?.recentRequests && stats.recentRequests.length > 0 ? (
          <div className="space-y-3">
            {stats.recentRequests.slice(0, 5).map((request, index) => {
              const status = getStatusBadge(request.status);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition cursor-pointer"
                  onClick={() => onNavigate(`/request/${request._id}`)}
                >
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
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>لا توجد طلبات</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ✅ RequestsTab - طلباتي
// ============================================================

interface RequestsTabProps {
  token: string | null;
  onNavigate: (path: string) => void;
}

const RequestsTab: React.FC<RequestsTabProps> = ({ token, onNavigate }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const url = filter === 'all'
          ? `${API_URL}/requests/my`
          : `${API_URL}/requests/my?status=${filter}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID
          }
        });
        const data = await response.json();
        if (data.success) setRequests(data.data || []);
      } catch (error) {
        console.error('❌ Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token, filter, API_URL]);

  const filteredRequests = requests.filter(req =>
    req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaFileAlt className="text-purple-600" />
          طلباتي
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({requests.length} طلب)</span>
        </h3>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 pr-9 pl-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition text-sm"
          >
            <option value="all">الكل</option>
            <option value="new">جديد</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
          <button
            onClick={() => onNavigate('/services')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm whitespace-nowrap"
          >
            <FaPlus className="w-4 h-4" /> طلب جديد
          </button>
        </div>
      </div>

      {filteredRequests.length > 0 ? (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const status = getStatusBadge(request.status);
            return (
              <div
                key={request._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer"
                onClick={() => onNavigate(`/request/${request._id}`)}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-mono text-gray-400">#{request.requestNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mt-1 truncate">{request.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {request.service?.nameAr || request.service?.name || request.serviceName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                      <span>📅 {formatDate(request.createdAt)}</span>
                      {request.price && request.price > 0 && <span>💰 {request.price} ريال</span>}
                      <span>📎 {request.files?.length || 0} ملفات</span>
                      {request.specialistName && <span>👤 {request.specialistName}</span>}
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-sm font-semibold transition whitespace-nowrap">
                    <FaEye className="inline ml-1" /> عرض
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <FaFileAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات</h4>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لم تقم بإنشاء أي طلب بعد'}
          </p>
          <button
            onClick={() => onNavigate('/services')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            {searchTerm ? 'مسح البحث' : 'استكشاف الخدمات'}
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ✅ SubscriptionsTab - اشتراكاتي
// ============================================================

interface SubscriptionsTabProps {
  token: string | null;
  onNavigate: (path: string) => void;
}

const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ token, onNavigate }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/explanations/subscriptions/my`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });
        const data = await response.json();
        if (data.success) {
          setSubscriptions(data.data || []);
          setError(null);
        } else {
          setError(data.message || 'حدث خطأ في تحميل الاشتراكات');
        }
      } catch (error) {
        console.error('❌ Error fetching subscriptions:', error);
        setError('حدث خطأ في تحميل الاشتراكات');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, [token, API_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center border border-red-200 dark:border-red-800">
        <FaTimesCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaUsers className="text-purple-600" />
          اشتراكاتي
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({subscriptions.length} اشتراك)</span>
        </h3>
        <button
          onClick={() => onNavigate('/explanations')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm"
        >
          <FaPlus className="w-4 h-4" /> استكشاف المواد
        </button>
      </div>

      {subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => {
            const status = getStatusBadge(sub.status);
            return (
              <div                key={sub._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {sub.materialId?.nameAr || sub.materialId?.name || 'اشتراك'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sub.materialId?.code || ''}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">المبلغ</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{sub.price || 0} ريال</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">تاريخ البداية</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {sub.startDate ? formatDate(sub.startDate) : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">تاريخ الانتهاء</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {sub.endDate ? formatDate(sub.endDate) : '-'}
                    </p>
                  </div>
                </div>
                {sub.status === 'active' && sub.endDate && (
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-sm text-green-700 dark:text-green-400">✅ نشط حتى {formatDate(sub.endDate)}</p>
                  </div>
                )}
                {sub.status === 'pending' && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">⏳ قيد المراجعة</p>
                  </div>
                )}
                {sub.status === 'expired' && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-sm text-red-700 dark:text-red-400">❌ منتهي</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <FaUsers className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد اشتراكات</h4>
          <p className="text-gray-500 dark:text-gray-400">لم تقم بالاشتراك في أي مادة بعد</p>
          <button
            onClick={() => onNavigate('/explanations')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            استكشاف المواد
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ✅ PaymentsTab - المدفوعات
// ============================================================

interface PaymentsTabProps {
  token: string | null;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ token }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('يرجى تسجيل الدخول لعرض المدفوعات');
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/payments/my`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });

        if (response.status === 401) {
          setError('جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى.');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          const paymentsData = data.data?.payments || data.data || [];
          setPayments(paymentsData);
        } else {
          setError(data.message || 'حدث خطأ في تحميل المدفوعات');
        }
      } catch (error: any) {
        console.error('❌ Error fetching payments:', error);
        setError(error.message || 'حدث خطأ في تحميل المدفوعات');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [token, API_URL]);

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidCount = payments.filter(p => p.status === 'paid' || p.status === 'verified').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center border border-red-200 dark:border-red-800">
        <FaTimesCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700 dark:text-red-400">{error}</p>
        {error.includes('جلسة الدخول منتهية') && (
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            تسجيل الدخول
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 mr-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المدفوعات</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAmount} ريال</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">عدد المدفوعات</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">المدفوعات المؤكدة</p>
          <p className="text-2xl font-bold text-green-600">{paidCount}</p>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FaCreditCard className="text-purple-600" />
        سجل المدفوعات
        {payments.length > 0 && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({payments.length} دفعة)</span>
        )}
      </h3>

      {payments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المرجع</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المبلغ</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الطريقة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => {
                const status = getStatusBadge(payment.status);
                return (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm font-mono">
                      #{payment._id.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm font-mono">
                      {payment.reference || '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {payment.amount} {payment.currency || 'ريال'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {payment.paymentMethod === 'credit_card' ? '💳 بطاقة' :
                       payment.paymentMethod === 'mada' ? '💳 مدى' :
                       payment.paymentMethod === 'bank_transfer' ? '🏦 تحويل' :
                       payment.paymentMethod === 'manual' ? '📝 يدوي' :
                       payment.paymentMethod === 'free' ? '🎁 مجاني' :
                       payment.paymentMethod || 'غير محدد'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <FaCreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد مدفوعات</h4>
          <p className="text-gray-500 dark:text-gray-400">لم تقم بأي عملية دفع بعد</p>
          <p className="text-sm text-gray-400 mt-2">ستظهر المدفوعات هنا عند إتمام أي عملية دفع</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ✅ NotificationsTab - الإشعارات
// ============================================================

interface NotificationsTabProps {
  notifications: Notification[];
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ notifications }) => {
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaBell className="text-purple-600" />
          الإشعارات
          {unreadCount > 0 && (
            <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full">{unreadCount} غير مقروء</span>
          )}
        </h3>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border transition ${
                !notif.isRead
                  ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs text-gray-400">{formatDateTime(notif.createdAt)}</p>
                {!notif.isRead && (
                  <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">جديد</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <FaBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد إشعارات</h4>
          <p className="text-gray-500 dark:text-gray-400">سيتم عرض الإشعارات هنا عند ورودها</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ✅ AddressesTab - العناوين
// ============================================================

const AddressesTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FaMapMarkerAlt className="text-purple-600" />
        العناوين
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
        <FaMapMarkerAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">جاري التطوير</h4>
        <p className="text-gray-500 dark:text-gray-400">سيتم إضافة إدارة العناوين قريباً</p>
      </div>
    </div>
  );
};

// ============================================================
// ✅ ProfileTab - الملف الشخصي
// ============================================================

interface ProfileTabProps {
  token: string | null;
  user: ExtendedUser;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ token, user }) => {
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    website: user?.profile?.website || '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  const getAvatarUrl = (avatarId: string | undefined) => {
    if (!avatarId) return null;
    return `${API_URL}/files/public/${avatarId}`;
  };

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (data.success) {
        const userData = data.data;
        setProfile({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.profile?.bio || '',
          location: userData.profile?.location || '',
          website: userData.profile?.website || '',
        });
        if (userData.profile?.avatar) {
          setAvatarPreview(getAvatarUrl(userData.profile.avatar));
        }
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'حجم الصورة يتجاوز 5MB' });
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatar) return null;
    const formData = new FormData();
    formData.append('file', avatar);
    formData.append('category', 'profile');
    formData.append('portalId', PORTAL_ID);
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (data.success) return data.data.file._id;
    throw new Error(data.message || 'فشل رفع الصورة');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      let avatarId = null;
      if (avatar) {
        avatarId = await uploadAvatar();
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '✅ تم تحديث الملف الشخصي بنجاح!' });

        if (data.data?.profile?.avatar) {
          setAvatarPreview(getAvatarUrl(data.data.profile.avatar));
        }

        if (data.data) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const currentUser = JSON.parse(storedUser);
            const updatedUser = {
              ...currentUser,
              fullName: profile.fullName,
              phone: profile.phone,
              profile: {
                ...currentUser.profile,
                avatar: data.data.profile?.avatar || avatarId,
                bio: profile.bio,
                location: profile.location,
                website: profile.website,
              },
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'حدث خطأ في التحديث' });
      }
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'حدث خطأ في التحديث' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const avatarSrc = avatarPreview || getAvatarUrl(user?.profile?.avatar);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">👤 الملف الشخصي</h3>
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden border-2 border-purple-200 dark:border-purple-800">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="الصورة الشخصية"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <FaUserCircle className="text-purple-600 dark:text-purple-400 text-6xl" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full cursor-pointer hover:bg-purple-700 transition shadow-lg">
              <FaCamera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-2">اضغط على الكاميرا لتغيير الصورة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل *</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={profile.email}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الجوال</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="05xxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الموقع</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="المدينة، الدولة"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نبذة عني</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition resize-none"
            placeholder="اكتب نبذة عن نفسك..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الموقع الإلكتروني</label>
          <input
            type="url"
            value={profile.website}
            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            placeholder="https://example.com"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </form>
    </div>
  );
};

// ============================================================
// ✅ SettingsTab - الإعدادات
// ============================================================

interface SettingsTabProps {
  token: string | null;
  user: ExtendedUser;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ token }) => {
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/auth/settings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Portal-Id': PORTAL_ID,
          },
        });
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error('❌ Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, [token, API_URL]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: '✅ تم حفظ الإعدادات بنجاح!' });

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const currentUser = JSON.parse(storedUser);
          const updatedUser = {
            ...currentUser,
            preferences: data.data || settings,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'حدث خطأ في حفظ الإعدادات' });
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      setMessage({ type: 'error', text: 'حدث خطأ في حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">⚙️ الإعدادات</h3>
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaBell className="text-purple-600" />
            الإشعارات
          </h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">إشعارات البريد الإلكتروني</span>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">إشعارات التطبيق</span>
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">تحديثات الطلبات</span>
              <input
                type="checkbox"
                checked={settings.orderUpdates}
                onChange={(e) => setSettings({ ...settings, orderUpdates: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">رسائل ترويجية</span>
              <input
                type="checkbox"
                checked={settings.promotionalEmails}
                onChange={(e) => setSettings({ ...settings, promotionalEmails: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaLock className="text-purple-600" />
            الأمان
          </h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">المصادقة الثنائية (2FA)</span>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
            <button
              type="button"
              onClick={() => { window.location.href = '/change-password'; }}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              تغيير كلمة المرور
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaGlobe className="text-purple-600" />
            التفضيلات
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اللغة</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المظهر</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              >
                <option value="auto">تلقائي</option>
                <option value="light">فاتح</option>
                <option value="dark">داكن</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  );
};

export default CustomerDashboard;