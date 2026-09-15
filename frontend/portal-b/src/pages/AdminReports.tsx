// frontend/portal-a/src/pages/AdminReports.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  FaChartBar, FaSpinner, FaExclamationCircle, FaDownload,
  FaFileAlt, FaUsers, FaMoneyBill, FaVideo, FaClock,
  FaArrowUp, FaArrowDown, FaMinus, FaCalendarAlt,
  FaChartLine, FaChartPie, FaChartArea, FaTable,
  FaPrint, FaFilePdf, FaFileExcel, FaEye,
  FaUserPlus, FaShoppingCart, FaCreditCard,
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

// ============================================================
// واجهات البيانات
// ============================================================

interface ReportData {
  period: number;
  startDate: string;
  endDate: string;
  metrics: {
    newRequests: number;
    totalRequests: number;
    newUsers: number;
    totalUsers: number;
    newContent: number;
    totalContent: number;
    revenue: number;
    totalRevenue: number;
    activeUsers: number;
    pendingPayments: number;
  };
  sections: {
    total: number;
    published: number;
  };
  services: {
    total: number;
    published: number;
  };
  growth: {
    requests: {
      current: number;
      previous: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    };
    users: {
      current: number;
      previous: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    };
    revenue: {
      current: number;
      previous: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  topServices: Array<{
    _id: string;
    name: string;
    nameAr: string;
    count: number;
    revenue: number;
  }>;
  dailyStats: Array<{
    date: string;
    requests: number;
    users: number;
    revenue: number;
  }>;
  requestStatuses: Array<{
    _id: string;
    count: number;
  }>;
  userRoles: Array<{
    _id: string;
    count: number;
  }>;
}

// ============================================================
// المكون الرئيسي
// ============================================================

const AdminReports: React.FC = () => {
  const { token } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'users' | 'revenue' | 'content'>('overview');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ===== جلب التقارير =====
  const fetchReports = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ استخدام المسار الصحيح /api/reports/full
      const response = await fetch(`${API_URL}/reports/full?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        }
      });

      if (response.status === 401) {
        setError('غير مصرح لك بالوصول');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('فشل تحميل التقارير');
      }

      const data = await response.json();
      console.log('📊 Report data:', data);

      if (data.success && data.data) {
        setReportData(data.data);
      } else {
        setError(data.message || 'حدث خطأ في تحميل التقارير');
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'حدث خطأ في تحميل التقارير');
    } finally {
      setLoading(false);
    }
  }, [token, period, API_URL, PORTAL_ID]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchReports();
  }, [fetchReports]);

  // ===== تصدير التقرير =====
  const exportReport = async (format: 'csv' | 'json' = 'csv') => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/reports/export?period=${period}&format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });

      if (!response.ok) {
        throw new Error('فشل تصدير التقرير');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('حدث خطأ في تصدير التقرير');
    }
  };

  // ===== تنسيق الأرقام =====
  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // ===== تنسيق العملة =====
  const formatCurrency = (num: number) => {
    if (!num) return '0 ريال';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M ريال';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K ريال';
    return num.toLocaleString() + ' ريال';
  };

  // ===== الحصول على لون التغيير =====
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  // ===== الحصول على أيقونة التغيير =====
  const getChangeIcon = (change: number) => {
    if (change > 0) return <FaArrowUp className="w-3 h-3" />;
    if (change < 0) return <FaArrowDown className="w-3 h-3" />;
    return <FaMinus className="w-3 h-3" />;
  };

  // ===== الحصول على شارة الحالة =====
  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'new': { label: 'جديد', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      'under_review': { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'assigned': { label: 'تم الإسناد', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      'in_progress': { label: 'قيد التنفيذ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'completed': { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      'closed': { label: 'مغلق', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    };
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  // ===== الحصول على لون الدور =====
  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      'customer': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      'specialist': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'portal_admin': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'super_admin': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[role] || 'bg-gray-100 text-gray-700';
  };

  // ===== الحصول على اسم الدور =====
  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      'customer': 'عميل',
      'specialist': 'مختص',
      'portal_admin': 'مدير البوابة',
      'super_admin': 'مشرف عام',
    };
    return map[role] || role;
  };

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  // ===== عرض الخطأ =====
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <FaExclamationCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">عذراً!</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => fetchReports()}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaChartBar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد بيانات</h3>
          <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على بيانات للفترة المحددة</p>
        </div>
      </div>
    );
  }

  const { metrics, sections, services, growth, topServices, requestStatuses, userRoles } = reportData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom max-w-7xl">
        {/* ===== Header ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaChartBar className="text-purple-600" />
              التقارير والتحليلات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              تحليلات وإحصائيات المنصة للفترة المحددة
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            >
              <option value="7d">آخر 7 أيام</option>
              <option value="30d">آخر 30 يوم</option>
              <option value="90d">آخر 90 يوم</option>
              <option value="365d">آخر سنة</option>
            </select>
            <button 
              onClick={() => fetchReports()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <FaDownload /> تحديث
            </button>
            <button
              onClick={() => exportReport('csv')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <FaFileExcel /> CSV
            </button>
            <button
              onClick={() => exportReport('json')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FaFilePdf /> JSON
            </button>
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: '📊 نظرة عامة' },
            { id: 'requests', label: '📋 الطلبات' },
            { id: 'users', label: '👥 المستخدمين' },
            { id: 'revenue', label: '💰 الإيرادات' },
            { id: 'content', label: '📝 المحتوى' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============================================================
            تبويب نظرة عامة (يتم عرضه إذا كان activeTab === 'overview')
            ============================================================ */}
        {activeTab === 'overview' && (
          <>
            {/* بطاقات الإحصائيات الرئيسية */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              <StatCard
                icon={<FaFileAlt className="w-5 h-5" />}
                title="الطلبات الجديدة"
                value={formatNumber(metrics.newRequests)}
                change={growth.requests?.change || 0}
                color="blue"
              />
              <StatCard
                icon={<FaUserPlus className="w-5 h-5" />}
                title="المستخدمين الجدد"
                value={formatNumber(metrics.newUsers)}
                change={growth.users?.change || 0}
                color="green"
              />
              <StatCard
                icon={<FaMoneyBill className="w-5 h-5" />}
                title="الإيرادات"
                value={formatCurrency(metrics.revenue)}
                change={growth.revenue?.change || 0}
                color="gold"
              />
              <StatCard
                icon={<FaUsers className="w-5 h-5" />}
                title="المستخدمين النشطين"
                value={formatNumber(metrics.activeUsers)}
                color="purple"
              />
              <StatCard
                icon={<FaCreditCard className="w-5 h-5" />}
                title="مدفوعات معلقة"
                value={formatNumber(metrics.pendingPayments)}
                color="orange"
              />
            </div>

            {/* ملخص الفترة */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <FaCalendarAlt className="w-4 h-4" />
                  <span>من {new Date(reportData.startDate).toLocaleDateString('ar-SA')}</span>
                  <span>إلى {new Date(reportData.endDate).toLocaleDateString('ar-SA')}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">📊 إجمالي الطلبات: <span className="font-bold text-gray-900 dark:text-white">{metrics.totalRequests}</span></span>
                  <span className="text-gray-500 dark:text-gray-400">👥 إجمالي المستخدمين: <span className="font-bold text-gray-900 dark:text-white">{metrics.totalUsers}</span></span>
                  <span className="text-gray-500 dark:text-gray-400">💰 إجمالي الإيرادات: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalRevenue)}</span></span>
                </div>
              </div>
            </div>

            {/* النمو */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <GrowthCard
                title="نمو الطلبات"
                current={growth.requests?.current || 0}
                previous={growth.requests?.previous || 0}
                change={growth.requests?.change || 0}
                trend={growth.requests?.trend || 'stable'}
                icon={<FaFileAlt className="text-blue-500" />}
              />
              <GrowthCard
                title="نمو المستخدمين"
                current={growth.users?.current || 0}
                previous={growth.users?.previous || 0}
                change={growth.users?.change || 0}
                trend={growth.users?.trend || 'stable'}
                icon={<FaUsers className="text-green-500" />}
              />
              <GrowthCard
                title="نمو الإيرادات"
                current={growth.revenue?.current || 0}
                previous={growth.revenue?.previous || 0}
                change={growth.revenue?.change || 0}
                trend={growth.revenue?.trend || 'stable'}
                icon={<FaMoneyBill className="text-yellow-500" />}
                isCurrency
              />
            </div>

            {/* الأقسام والخدمات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaChartPie className="text-purple-600" />
                  حالة الطلبات
                </h3>
                <div className="space-y-3">
                  {requestStatuses && requestStatuses.length > 0 ? (
                    requestStatuses.map((item) => {
                      const status = getStatusBadge(item._id);
                      return (
                        <div key={item._id} className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">{item.count}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaChartPie className="text-purple-600" />
                  أدوار المستخدمين
                </h3>
                <div className="space-y-3">
                  {userRoles && userRoles.length > 0 ? (
                    userRoles.map((item) => (
                      <div key={item._id} className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(item._id)}`}>
                          {getRoleLabel(item._id)}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">{item.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات</p>
                  )}
                </div>
              </div>
            </div>

            {/* أفضل الخدمات */}
            {topServices && topServices.length > 0 && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaChartBar className="text-purple-600" />
                  أفضل الخدمات
                </h3>
                <div className="space-y-3">
                  {topServices.slice(0, 5).map((service, index) => (
                    <div key={service._id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {service.nameAr || service.name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {service.count} طلب
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((service.count / (topServices[0]?.count || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================================
            تبويب الطلبات
            ============================================================ */}
        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaFileAlt className="text-purple-600" />
              إحصائيات الطلبات
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalRequests}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">📊 إجمالي الطلبات</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600">{metrics.newRequests}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">🆕 طلبات جديدة</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center border border-yellow-200 dark:border-yellow-800">
                <div className="text-2xl font-bold text-yellow-600">
                  {requestStatuses?.find(s => s._id === 'in_progress')?.count || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">⚡ قيد التنفيذ</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-800">
                <div className="text-2xl font-bold text-emerald-600">
                  {requestStatuses?.find(s => s._id === 'completed')?.count || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">✅ مكتملة</div>
              </div>
            </div>

            {/* تفاصيل الحالات */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">حالات الطلبات</h4>
              {requestStatuses && requestStatuses.length > 0 ? (
                requestStatuses.map((item) => {
                  const status = getStatusBadge(item._id);
                  return (
                    <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-48 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((item.count / (metrics.totalRequests || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white min-w-[40px] text-center">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات</p>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            تبويب المستخدمين
            ============================================================ */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaUsers className="text-purple-600" />
              إحصائيات المستخدمين
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600">{metrics.totalUsers}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">👤 إجمالي المستخدمين</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600">{metrics.newUsers}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">🆕 مستخدمين جدد</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">🟢 نشطين</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-600">{metrics.totalUsers - metrics.activeUsers}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">🔴 غير نشطين</div>
              </div>
            </div>

            {/* أدوار المستخدمين */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300">توزيع الأدوار</h4>
              {userRoles && userRoles.length > 0 ? (
                userRoles.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(item._id)}`}>
                      {getRoleLabel(item._id)}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((item.count / (metrics.totalUsers || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white min-w-[40px] text-center">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات</p>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            تبويب الإيرادات
            ============================================================ */}
        {activeTab === 'revenue' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaMoneyBill className="text-purple-600" />
              إحصائيات الإيرادات
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">💰 إجمالي الإيرادات</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center border border-yellow-200 dark:border-yellow-800">
                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(metrics.revenue)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">📈 إيرادات الفترة</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center border border-orange-200 dark:border-orange-800">
                <div className="text-2xl font-bold text-orange-600">{metrics.pendingPayments}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">⏳ مدفوعات معلقة</div>
              </div>
            </div>

            {/* أفضل الخدمات من حيث الإيرادات */}
            {topServices && topServices.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">أفضل الخدمات من حيث الإيرادات</h4>
                <div className="space-y-3">
                  {topServices.slice(0, 5).map((service, index) => (
                    <div key={service._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {service.nameAr || service.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{service.count} طلب</span>
                        <span className="font-bold text-green-600">{formatCurrency(service.revenue || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            تبويب المحتوى
            ============================================================ */}
        {activeTab === 'content' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaVideo className="text-purple-600" />
              إحصائيات المحتوى
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600">{metrics.totalContent}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">📚 إجمالي المحتوى</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600">{metrics.newContent}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">🆕 محتوى جديد</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-600">{sections?.total || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">📂 الأقسام</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600">{services?.total || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">⚙️ الخدمات</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📂 الأقسام</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">إجمالي الأقسام</span>
                  <span className="font-bold text-gray-900 dark:text-white">{sections?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-500 dark:text-gray-400">منشورة</span>
                  <span className="font-bold text-green-600">{sections?.published || 0}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-500 dark:text-gray-400">غير منشورة</span>
                  <span className="font-bold text-red-600">{(sections?.total || 0) - (sections?.published || 0)}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">⚙️ الخدمات</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">إجمالي الخدمات</span>
                  <span className="font-bold text-gray-900 dark:text-white">{services?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-500 dark:text-gray-400">منشورة</span>
                  <span className="font-bold text-green-600">{services?.published || 0}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-500 dark:text-gray-400">غير منشورة</span>
                  <span className="font-bold text-red-600">{(services?.total || 0) - (services?.published || 0)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/admin-videos"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <FaVideo className="inline ml-2" /> إدارة المحتوى
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// مكونات مساعدة
// ============================================================

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: number;
  color: 'blue' | 'green' | 'purple' | 'gold' | 'orange' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    gold: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow" data-aos="fade-up" data-aos-delay={100}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-full ${colors[color]}`}>{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && change !== 0 && (
            <p className={`text-xs font-semibold ${getChangeColor(change)}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface GrowthCardProps {
  title: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  isCurrency?: boolean;
}

const GrowthCard: React.FC<GrowthCardProps> = ({ 
  title, current, previous, change, trend, icon, isCurrency 
}) => {
  const formatValue = (val: number) => {
    if (isCurrency) return val.toLocaleString() + ' ريال';
    return val.toString();
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <FaArrowUp className="w-4 h-4" />;
    if (trend === 'down') return <FaArrowDown className="w-4 h-4" />;
    return <FaMinus className="w-4 h-4" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow" data-aos="fade-up">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatValue(current)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            السابق: {formatValue(previous)}
          </p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;