// frontend/portal-a/src/pages/Admin/AdminRequestManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaFileAlt, FaSearch, FaSpinner, FaEye, FaEdit,
  FaUserCheck, FaMoneyBill, FaClock, FaCheckCircle,
  FaTimesCircle, FaExclamationTriangle, FaTrash,
  FaFilter, FaChevronLeft, FaChevronRight,
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt,
  FaComments, FaUpload, FaDownload,
  FaShieldAlt, FaUserGraduate, FaBuilding,
  FaTag, FaInfoCircle, FaChartBar,
  FaPlus, FaSave, FaTimes, FaArrowLeft,
} from 'react-icons/fa';

// ============================================================
// ✅ واجهات البيانات
// ============================================================

interface Request {
  _id: string;
  requestNumber: string;
  title: string;
  description: string;
  serviceId: {
    _id: string;
    name: string;
    nameAr: string;
    icon: string;
  };
  requestTypeId?: {
    _id: string;
    name: string;
    nameAr: string;
  };
  accountId: {
    _id: string;
    profile: { fullName: string };
    email: string;
    phone?: string;
  };
  specialistId?: {
    _id: string;
    profile: { fullName: string };
    email: string;
  };
  status: string;
  paymentStatus: string;
  price: number;
  currency: string;
  scope?: {
    description: string;
    deliverables: string[];
    requirements: string[];
    estimatedDuration: string;
    price: number;
    currency: string;
    modificationsIncluded: number;
    exclusions: string[];
    approvedBy?: string;
    approvedAt?: Date;
  };
  formData: any;
  files: { fileId: any; category: string }[];
  messages: any[];
  calls: any[];
  activityLog: any[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

interface RequestStats {
  total: number;
  new: number;
  under_review: number;
  assigned: number;
  scope_definition: number;
  awaiting_approval: number;
  awaiting_payment: number;
  in_progress: number;
  under_review_2: number;
  modification: number;
  completed: number;
  closed: number;
  cancelled: number;
}

interface Specialist {
  _id: string;
  email: string;
  profile: { fullName: string };
  isActive: boolean;
}

// ============================================================
// ✅ المكون الرئيسي
// ============================================================

const AdminRequestManager: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // ✅ حالات الطلبات
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // ✅ حالات المودالات
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ✅ بيانات النماذج
  const [scopeData, setScopeData] = useState({
    description: '',
    deliverables: '',
    requirements: '',
    estimatedDuration: '',
    price: '',
    modificationsIncluded: '',
    exclusions: '',
  });
  const [newStatus, setNewStatus] = useState<string>('');
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== جلب الطلبات =====
  const fetchRequests = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

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
        setRequests(data.data || []);
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

  // ===== جلب الإحصائيات =====
  const fetchStats = useCallback(async () => {
    if (!token) return;

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
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [token]);

  // ===== جلب المختصين =====
  const fetchSpecialists = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/admin/users?role=specialist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSpecialists(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching specialists:', error);
    }
  }, [token]);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    Promise.all([fetchRequests(), fetchStats(), fetchSpecialists()]);
  }, [fetchRequests, fetchStats, fetchSpecialists]);

  // ===== تغيير حالة الطلب =====
  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        await fetchStats();
        setShowStatusModal(false);
        alert('✅ تم تحديث حالة الطلب بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في تحديث الحالة');
      }
    } catch (error) {
      alert('حدث خطأ في تحديث الحالة');
    }
  };

  // ===== إسناد مختص =====
  const handleAssignSpecialist = async (requestId: string, specialistId: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/assign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ specialistId }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        await fetchStats();
        setShowAssignModal(false);
        alert('✅ تم إسناد الطلب إلى المختص بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في إسناد المختص');
      }
    } catch (error) {
      alert('حدث خطأ في إسناد المختص');
    }
  };

  // ===== تحديد النطاق =====
  const handleDefineScope = async (requestId: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/scope`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          description: scopeData.description,
          deliverables: scopeData.deliverables.split('\n').filter(Boolean),
          requirements: scopeData.requirements.split('\n').filter(Boolean),
          estimatedDuration: scopeData.estimatedDuration,
          price: parseFloat(scopeData.price),
          modificationsIncluded: parseInt(scopeData.modificationsIncluded) || 0,
          exclusions: scopeData.exclusions.split('\n').filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        setShowScopeModal(false);
        setScopeData({
          description: '',
          deliverables: '',
          requirements: '',
          estimatedDuration: '',
          price: '',
          modificationsIncluded: '',
          exclusions: '',
        });
        alert('✅ تم تحديد نطاق العمل بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في تحديد النطاق');
      }
    } catch (error) {
      alert('حدث خطأ في تحديد النطاق');
    }
  };

  // ===== تأكيد الدفع =====
  const handleVerifyPayment = async (requestId: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/payment/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ verified: true }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        await fetchStats();
        alert('✅ تم تأكيد الدفع بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في تأكيد الدفع');
      }
    } catch (error) {
      alert('حدث خطأ في تأكيد الدفع');
    }
  };

  // ===== رفض الدفع =====
  const handleRejectPayment = async (requestId: string, reason: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/payment/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        await fetchStats();
        alert('✅ تم رفض الدفع');
      } else {
        alert(data.message || 'حدث خطأ في رفض الدفع');
      }
    } catch (error) {
      alert('حدث خطأ في رفض الدفع');
    }
  };

  // ===== حذف الطلب =====
  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    try {
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        await fetchStats();
        alert('✅ تم حذف الطلب بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في حذف الطلب');
      }
    } catch (error) {
      alert('حدث خطأ في حذف الطلب');
    }
  };

  // ===== الحصول على شارة الحالة =====
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      'new': { label: 'جديد', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <FaClock className="w-3 h-3" /> },
      'under_review': { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <FaClock className="w-3 h-3" /> },
      'assigned': { label: 'تم الإسناد', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: <FaUserCheck className="w-3 h-3" /> },
      'scope_definition': { label: 'تحديد النطاق', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: <FaEdit className="w-3 h-3" /> },
      'awaiting_approval': { label: 'بانتظار الموافقة', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <FaClock className="w-3 h-3" /> },
      'awaiting_payment': { label: 'بانتظار الدفع', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: <FaMoneyBill className="w-3 h-3" /> },
      'in_progress': { label: 'قيد التنفيذ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <FaCheckCircle className="w-3 h-3" /> },
      'under_review_2': { label: 'مراجعة التسليم', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: <FaClock className="w-3 h-3" /> },
      'modification': { label: 'طلب تعديل', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <FaExclamationTriangle className="w-3 h-3" /> },
      'completed': { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <FaCheckCircle className="w-3 h-3" /> },
      'closed': { label: 'مغلق', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: <FaTimesCircle className="w-3 h-3" /> },
      'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <FaTimesCircle className="w-3 h-3" /> },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: null };
  };

  // ===== الحصول على شارة حالة الدفع =====
  const getPaymentBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'pending': { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'submitted': { label: 'تم الإرسال', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      'verified': { label: 'مؤكد', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'rejected': { label: 'مرفوض', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      'refunded': { label: 'مسترجع', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
      'not_required': { label: 'غير مطلوب', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    };
    return map[status] || map.pending;
  };

  // ===== الحصول على الحالات المتاحة للانتقال =====
  const getAvailableStatuses = (currentStatus: string) => {
    const flow: Record<string, string[]> = {
      'new': ['under_review', 'cancelled'],
      'under_review': ['assigned', 'cancelled'],
      'assigned': ['scope_definition', 'cancelled'],
      'scope_definition': ['awaiting_approval', 'cancelled'],
      'awaiting_approval': ['awaiting_payment', 'scope_definition', 'cancelled'],
      'awaiting_payment': ['in_progress', 'cancelled'],
      'in_progress': ['under_review_2', 'cancelled'],
      'under_review_2': ['modification', 'completed', 'cancelled'],
      'modification': ['in_progress', 'cancelled'],
      'completed': ['closed'],
      'closed': [],
      'cancelled': [],
    };
    return flow[currentStatus] || [];
  };

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== تنسيق الوقت =====
  const formatTime = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ===== عرض حالة التحميل =====
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
      <div className="container-custom max-w-7xl">
        {/* ===== Header ===== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaFileAlt className="text-purple-600" />
              إدارة الطلبات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة جميع طلبات البوابة - عرض، تعديل، إسناد، دفع
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.total} طلب
            </span>
            <button
              onClick={() => fetchRequests()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              تحديث
            </button>
          </div>
        </div>

        {/* ===== الإحصائيات ===== */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <StatCard label="الكل" value={stats.total} color="gray" />
            <StatCard label="جديد" value={stats.new} color="blue" />
            <StatCard label="قيد التنفيذ" value={stats.assigned + stats.scope_definition + stats.awaiting_approval + stats.awaiting_payment + stats.in_progress} color="yellow" />
            <StatCard label="مكتمل" value={stats.completed + stats.closed} color="green" />
            <StatCard label="تعديل" value={stats.modification} color="red" />
            <StatCard label="ملغي" value={stats.cancelled} color="gray" />
          </div>
        )}

        {/* ===== Search & Filter ===== */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن طلب (رقم، عنوان، عميل، خدمة)..."
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
            <button className="px-4 py-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              <FaFilter />
            </button>
          </div>
        </div>

        {/* ===== جدول الطلبات ===== */}
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
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الدفع</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((request, index) => {
                    const status = getStatusBadge(request.status);
                    const payment = getPaymentBadge(request.paymentStatus);
                    return (
                      <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm font-mono">
                          {request.requestNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[200px]">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {request.title || 'طلب'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {request.serviceId?.nameAr || request.serviceId?.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {request.accountId?.profile?.fullName || 'غير معروف'}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[120px]">
                              {request.accountId?.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {request.specialistId?.profile?.fullName || 
                            <span className="text-yellow-500 text-xs">غير معين</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.color} w-fit`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payment.color}`}>
                            {payment.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          {request.price > 0 ? `${request.price} ريال` : 'مجاني'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {/* عرض التفاصيل */}
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailsModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                              title="عرض التفاصيل"
                            >
                              <FaEye className="w-3 h-3" />
                            </button>

                            {/* تغيير الحالة */}
                            {getAvailableStatuses(request.status).length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setNewStatus('');
                                  setShowStatusModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition"
                                title="تغيير الحالة"
                              >
                                <FaEdit className="w-3 h-3" />
                              </button>
                            )}

                            {/* إسناد مختص */}
                            {(!request.specialistId || request.status === 'new') && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setSelectedSpecialist('');
                                  setShowAssignModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 transition"
                                title="إسناد مختص"
                              >
                                <FaUserCheck className="w-3 h-3" />
                              </button>
                            )}

                            {/* تحديد النطاق */}
                            {request.status === 'assigned' && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setScopeData({
                                    description: request.scope?.description || '',
                                    deliverables: request.scope?.deliverables?.join('\n') || '',
                                    requirements: request.scope?.requirements?.join('\n') || '',
                                    estimatedDuration: request.scope?.estimatedDuration || '',
                                    price: request.scope?.price?.toString() || '',
                                    modificationsIncluded: request.scope?.modificationsIncluded?.toString() || '',
                                    exclusions: request.scope?.exclusions?.join('\n') || '',
                                  });
                                  setShowScopeModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 transition"
                                title="تحديد النطاق"
                              >
                                <FaEdit className="w-3 h-3" />
                              </button>
                            )}

                            {/* تأكيد الدفع */}
                            {request.paymentStatus === 'submitted' && (
                              <button
                                onClick={() => handleVerifyPayment(request._id)}
                                className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 transition"
                                title="تأكيد الدفع"
                              >
                                <FaCheckCircle className="w-3 h-3" />
                              </button>
                            )}

                            {/* حذف الطلب */}
                            {request.status !== 'cancelled' && request.status !== 'closed' && (
                              <button
                                onClick={() => handleDeleteRequest(request._id)}
                                className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
                                title="حذف"
                              >
                                <FaTrash className="w-3 h-3" />
                              </button>
                            )}
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
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات</h4>
            <p className="text-gray-500 dark:text-gray-400">لم يتم إنشاء أي طلب في هذه البوابة بعد</p>
          </div>
        )}

        {/* ===== Pagination ===== */}
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

      {/* ============================================================
          مودال تفاصيل الطلب
          ============================================================ */}
      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
          onStatusChange={() => {
            setShowStatusModal(true);
            setShowDetailsModal(false);
          }}
          onAssign={() => {
            setShowAssignModal(true);
            setShowDetailsModal(false);
          }}
          onScope={() => {
            setScopeData({
              description: selectedRequest.scope?.description || '',
              deliverables: selectedRequest.scope?.deliverables?.join('\n') || '',
              requirements: selectedRequest.scope?.requirements?.join('\n') || '',
              estimatedDuration: selectedRequest.scope?.estimatedDuration || '',
              price: selectedRequest.scope?.price?.toString() || '',
              modificationsIncluded: selectedRequest.scope?.modificationsIncluded?.toString() || '',
              exclusions: selectedRequest.scope?.exclusions?.join('\n') || '',
            });
            setShowScopeModal(true);
            setShowDetailsModal(false);
          }}
          onVerifyPayment={() => handleVerifyPayment(selectedRequest._id)}
          onDelete={() => handleDeleteRequest(selectedRequest._id)}
        />
      )}

      {/* ============================================================
          مودال إسناد مختص
          ============================================================ */}
      {showAssignModal && selectedRequest && (
        <AssignSpecialistModal
          request={selectedRequest}
          specialists={specialists}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedRequest(null);
          }}
          onAssign={(specialistId) => handleAssignSpecialist(selectedRequest._id, specialistId)}
        />
      )}

      {/* ============================================================
          مودال تغيير الحالة
          ============================================================ */}
      {showStatusModal && selectedRequest && (
        <StatusModal
          request={selectedRequest}
          availableStatuses={getAvailableStatuses(selectedRequest.status)}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedRequest(null);
          }}
          onUpdate={(status) => handleUpdateStatus(selectedRequest._id, status)}
        />
      )}

      {/* ============================================================
          مودال تحديد النطاق
          ============================================================ */}
      {showScopeModal && selectedRequest && (
        <ScopeModal
          request={selectedRequest}
          scopeData={scopeData}
          setScopeData={setScopeData}
          onClose={() => {
            setShowScopeModal(false);
            setSelectedRequest(null);
          }}
          onSave={() => handleDefineScope(selectedRequest._id)}
        />
      )}
    </div>
  );
};

// ============================================================
// ✅ مكون بطاقة الإحصائيات
// ============================================================

interface StatCardProps {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    gray: 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={`${colors[color]} rounded-xl p-4 border text-center`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

// ============================================================
// ✅ مودال تفاصيل الطلب
// ============================================================

interface RequestDetailsModalProps {
  request: Request;
  onClose: () => void;
  onStatusChange: () => void;
  onAssign: () => void;
  onScope: () => void;
  onVerifyPayment: () => void;
  onDelete: () => void;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  request,
  onClose,
  onStatusChange,
  onAssign,
  onScope,
  onVerifyPayment,
  onDelete,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaInfoCircle className="text-purple-600" />
            تفاصيل الطلب
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* معلومات أساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">رقم الطلب</p>
              <p className="font-semibold text-gray-900 dark:text-white">{request.requestNumber}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">العنوان</p>
              <p className="font-semibold text-gray-900 dark:text-white">{request.title}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">العميل</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {request.accountId?.profile?.fullName || 'غير معروف'}
              </p>
              <p className="text-xs text-gray-400">{request.accountId?.email}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">المختص</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {request.specialistId?.profile?.fullName || 'غير معين'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">الخدمة</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {request.serviceId?.nameAr || request.serviceId?.name}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">السعر</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {request.price > 0 ? `${request.price} ريال` : 'مجاني'}
              </p>
            </div>
          </div>

          {/* النطاق */}
          {request.scope && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📐 نطاق العمل</h4>
              <p className="text-gray-600 dark:text-gray-400">{request.scope.description}</p>
              {request.scope.deliverables && request.scope.deliverables.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">المخرجات:</p>
                  <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-400">
                    {request.scope.deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-gray-400">المدة:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{request.scope.estimatedDuration || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400">السعر:</span>
                  <span className="font-semibold text-purple-600">{request.scope.price} ريال</span>
                </div>
                <div>
                  <span className="text-gray-400">التعديلات:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{request.scope.modificationsIncluded || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* الإجراءات */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onStatusChange}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <FaEdit className="w-4 h-4" />
              تغيير الحالة
            </button>
            {!request.specialistId && (
              <button
                onClick={onAssign}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <FaUserCheck className="w-4 h-4" />
                إسناد مختص
              </button>
            )}
            {request.status === 'assigned' && (
              <button
                onClick={onScope}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <FaEdit className="w-4 h-4" />
                تحديد النطاق
              </button>
            )}
            {request.paymentStatus === 'submitted' && (
              <button
                onClick={onVerifyPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <FaCheckCircle className="w-4 h-4" />
                تأكيد الدفع
              </button>
            )}
            {request.status !== 'cancelled' && request.status !== 'closed' && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <FaTrash className="w-4 h-4" />
                حذف الطلب
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ✅ مودال إسناد مختص
// ============================================================

interface AssignSpecialistModalProps {
  request: Request;
  specialists: Specialist[];
  onClose: () => void;
  onAssign: (specialistId: string) => void;
}

const AssignSpecialistModal: React.FC<AssignSpecialistModalProps> = ({
  request,
  specialists,
  onClose,
  onAssign,
}) => {
  const [selected, setSelected] = useState<string>('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaUserCheck className="inline ml-2 text-purple-600" />
            إسناد مختص
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            اختر المختص المناسب للطلب #{request.requestNumber}
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {specialists.length > 0 ? (
              specialists.map((specialist) => (
                <div
                  key={specialist._id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                    selected === specialist._id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                  onClick={() => setSelected(specialist._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <FaUserGraduate className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {specialist.profile?.fullName || 'مختص'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{specialist.email}</p>
                    </div>
                  </div>
                  {selected === specialist._id && (
                    <FaCheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>لا يوجد مختصين متاحين</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => selected && onAssign(selected)}
              disabled={!selected}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaUserCheck className="w-4 h-4" />
              إسناد
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ✅ مودال تغيير الحالة
// ============================================================

interface StatusModalProps {
  request: Request;
  availableStatuses: string[];
  onClose: () => void;
  onUpdate: (status: string) => void;
}

const StatusModal: React.FC<StatusModalProps> = ({
  request,
  availableStatuses,
  onClose,
  onUpdate,
}) => {
  const [selected, setSelected] = useState<string>('');

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
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
    return map[status] || status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaEdit className="inline ml-2 text-purple-600" />
            تغيير حالة الطلب
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            الحالة الحالية: <span className="font-semibold text-gray-900 dark:text-white">
              {getStatusLabel(request.status)}
            </span>
          </p>

          <div className="space-y-2">
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelected(status)}
                className={`w-full text-right px-4 py-3 rounded-lg border-2 transition ${
                  selected === status
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => selected && onUpdate(selected)}
              disabled={!selected}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaCheckCircle className="w-4 h-4" />
              تحديث
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ✅ مودال تحديد النطاق
// ============================================================

interface ScopeModalProps {
  request: Request;
  scopeData: any;
  setScopeData: (data: any) => void;
  onClose: () => void;
  onSave: () => void;
}

const ScopeModal: React.FC<ScopeModalProps> = ({
  request,
  scopeData,
  setScopeData,
  onClose,
  onSave,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaEdit className="inline ml-2 text-purple-600" />
            تحديد نطاق العمل
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            تحديد نطاق العمل للطلب #{request.requestNumber}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وصف النطاق *</label>
            <textarea
              value={scopeData.description}
              onChange={(e) => setScopeData({ ...scopeData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="وصف تفصيلي لنطاق العمل..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المخرجات (كل سطر)</label>
            <textarea
              value={scopeData.deliverables}
              onChange={(e) => setScopeData({ ...scopeData, deliverables: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="المخرجات المتوقعة..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المدة المتوقعة</label>
              <input
                type="text"
                value={scopeData.estimatedDuration}
                onChange={(e) => setScopeData({ ...scopeData, estimatedDuration: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                placeholder="مثال: 5 أيام"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر *</label>
              <input
                type="number"
                value={scopeData.price}
                onChange={(e) => setScopeData({ ...scopeData, price: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التعديلات المشمولة</label>
            <input
              type="number"
              value={scopeData.modificationsIncluded}
              onChange={(e) => setScopeData({ ...scopeData, modificationsIncluded: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاستثناءات (كل سطر)</label>
            <textarea
              value={scopeData.exclusions}
              onChange={(e) => setScopeData({ ...scopeData, exclusions: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="ما لا يشملها العمل..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSave}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <FaSave className="w-4 h-4" />
              حفظ النطاق
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestManager;