// frontend/portal-a/src/pages/Requests/AdminRequests.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

import {
  FaSearch, FaSpinner, FaEye, FaClock, FaCheckCircle,
  FaTimesCircle, FaFileAlt, FaComments, FaPhone,
  FaFilter, FaChevronLeft, FaChevronRight,
  FaUser, FaUserGraduate, FaEdit, FaTrash,
  FaChartBar, FaUsers, FaDollarSign, FaCalendarAlt,
} from 'react-icons/fa';

interface Request {
  _id: string;
  requestNumber: string;
  title: string;
  description: string;
  service: { _id: string; name: string; nameAr: string; icon: string };
  requestType: { _id: string; name: string; nameAr: string };
  customer: { _id: string; profile: { fullName: string; email: string } };
  specialist: { _id: string; profile: { fullName: string } };
  status: string;
  paymentStatus: string;
  price: number;
  estimatedDuration: string;
  createdAt: string;
  updatedAt: string;
  files: { _id: string; filename: string; category: string }[];
  messages: number;
  calls: number;
  activityLog: { action: string; timestamp: string; actorRole: string }[];
}

const AdminRequests: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [stats, setStats] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/requests/all?page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }));
      } else {
        setError(data.message || 'حدث خطأ في تحميل الطلبات');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, statusFilter, searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/requests/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [token]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    Promise.all([fetchRequests(), fetchStats()]);
  }, [fetchRequests, fetchStats]);

  const getStatusBadge = (status: string): { label: string; color: string; icon: React.ReactNode } => {
    const statusMap: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
      'new': { label: 'جديد', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <FaClock className="w-3 h-3" /> },
      'under_review': { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <FaClock className="w-3 h-3" /> },
      'assigned': { label: 'تم الإسناد', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <FaCheckCircle className="w-3 h-3" /> },
      'scope_definition': { label: 'تحديد النطاق', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: <FaClock className="w-3 h-3" /> },
      'awaiting_approval': { label: 'بانتظار الموافقة', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <FaClock className="w-3 h-3" /> },
      'awaiting_payment': { label: 'بانتظار الدفع', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: <FaClock className="w-3 h-3" /> },
      'in_progress': { label: 'قيد التنفيذ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <FaCheckCircle className="w-3 h-3" /> },
      'under_review_2': { label: 'مراجعة التسليم', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: <FaClock className="w-3 h-3" /> },
      'modification': { label: 'طلب تعديل', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <FaTimesCircle className="w-3 h-3" /> },
      'completed': { label: 'مكتمل', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <FaCheckCircle className="w-3 h-3" /> },
      'closed': { label: 'مغلق', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: <FaTimesCircle className="w-3 h-3" /> },
      'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <FaTimesCircle className="w-3 h-3" /> },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: null };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaFileAlt className="text-purple-600" />
              إدارة الطلبات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة جميع طلبات البوابة
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} طلب
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">الكل</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">جديد</p>
              <p className="text-xl font-bold text-blue-600">{stats.new}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">قيد التنفيذ</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats.assigned + stats.scope_definition + stats.awaiting_approval + stats.awaiting_payment + stats.in_progress}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">مكتمل</p>
              <p className="text-xl font-bold text-green-600">{stats.completed + stats.closed}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">تعديل</p>
              <p className="text-xl font-bold text-red-600">{stats.modification}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">ملغي</p>
              <p className="text-xl font-bold text-gray-500">{stats.cancelled}</p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن طلب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            >
              <option value="">جميع الحالات</option>
              <option value="new">جديد</option>
              <option value="under_review">قيد المراجعة</option>
              <option value="assigned">تم الإسناد</option>
              <option value="scope_definition">تحديد النطاق</option>
              <option value="awaiting_approval">بانتظار الموافقة</option>
              <option value="awaiting_payment">بانتظار الدفع</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="under_review_2">مراجعة التسليم</option>
              <option value="modification">طلب تعديل</option>
              <option value="completed">مكتمل</option>
              <option value="closed">مغلق</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        {requests.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الطلب</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العميل</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المختص</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((request, index) => {
                    const statusInfo = getStatusBadge(request.status);
                    return (
                      <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm font-mono">
                          {request.requestNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                              {request.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                              {request.service?.nameAr || request.service?.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {request.customer?.profile?.fullName || 'غير معروف'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {request.specialist?.profile?.fullName || 'غير معين'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.color} w-fit`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          {request.price > 0 ? `${request.price} ريال` : 'مجاني'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/request/${request._id}`)}
                              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                              title="عرض"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/request/${request._id}/edit`)}
                              className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition"
                              title="تعديل"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <FaFileAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات</h3>
            <p className="text-gray-500 dark:text-gray-400">لم يتم إنشاء أي طلب في هذه البوابة بعد</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between gap-4 mt-6">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              <FaChevronRight />
            </button>
            <span className="text-sm text-gray-500">
              صفحة {pagination.page} من {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              <FaChevronLeft />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;