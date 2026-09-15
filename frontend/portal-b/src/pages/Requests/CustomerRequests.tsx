// frontend/portal-a/src/pages/Requests/CustomerRequests.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AOS from 'aos';
import 'aos/dist/aos.css';

import {
  FaPlus, FaSearch, FaSpinner, FaEye, FaClock,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaFileAlt, FaComments, FaPhone, FaFilter,
  FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';

interface Request {
  _id: string;
  requestNumber: string;
  title: string;
  description: string;
  service: { _id: string; name: string; nameAr: string; icon: string };
  requestType: { _id: string; name: string; nameAr: string };
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
}

const CustomerRequests: React.FC = () => {
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

  // ===== جلب الطلبات =====
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/requests/my?page=${pagination.page}&limit=${pagination.limit}`;
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

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchRequests();
  }, [fetchRequests]);

  // ===== الحصول على حالة الطلب =====
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
      'modification': { label: 'طلب تعديل', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <FaExclamationTriangle className="w-3 h-3" /> },
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaFileAlt className="text-purple-600" />
              طلباتي
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة جميع طلباتك ومتابعة حالتها
            </p>
          </div>
          <Link
            to="/services"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
          >
            <FaPlus />
            طلب جديد
          </Link>
        </div>

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
            <button className="px-4 py-3 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition">
              <FaFilter />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الطلبات</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">قيد التنفيذ</p>
            <p className="text-2xl font-bold text-blue-600">
              {requests.filter(r => ['new', 'under_review', 'assigned', 'scope_definition', 'awaiting_approval', 'awaiting_payment', 'in_progress', 'under_review_2', 'modification'].includes(r.status)).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">مكتملة</p>
            <p className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'completed' || r.status === 'closed').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">ملغية</p>
            <p className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'cancelled').length}
            </p>
          </div>
        </div>

        {/* Requests List */}
        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request, index) => {
              const statusInfo = getStatusBadge(request.status);
              return (
                <div
                  key={request._id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/request/${request._id}`)}
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-mono text-gray-400">{request.requestNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                        {request.paymentStatus === 'verified' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            ✅ دفع مؤكد
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mt-1">
                        {request.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {request.service?.nameAr || request.service?.name}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>📅 {new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
                        {request.specialist && (
                          <span>👤 {request.specialist.profile?.fullName || 'غير معين'}</span>
                        )}
                        {request.price > 0 && (
                          <span>💰 {request.price} ريال</span>
                        )}
                        <span>📎 {request.files?.length || 0} ملفات</span>
                        <span>💬 {request.messages || 0}</span>
                        <span>📞 {request.calls || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/request/${request._id}`); }}
                        className="px-4 py-2 bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                      >
                        <FaEye className="w-3 h-3" />
                        عرض
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <FaFileAlt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات</h3>
            <p className="text-gray-500 dark:text-gray-400">لم تقم بإنشاء أي طلب بعد</p>
            <Link
              to="/services"
              className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              استكشاف الخدمات
            </Link>
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

export default CustomerRequests;