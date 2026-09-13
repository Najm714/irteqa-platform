// frontend/portal-a/src/pages/AdminRequests.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaSearch, FaEye, FaEdit, FaTrash,
  FaCheckCircle, FaTimesCircle, FaClock, FaUser,
  FaFileAlt, FaMoneyBill, FaComments, FaPhone,
  FaFilter, FaChevronDown, FaChevronUp,
  FaExclamationTriangle, FaInfoCircle,
  FaPlus, FaUserCheck, FaUserClock,
  FaArrowLeft, FaArrowRight, FaTimes
} from 'react-icons/fa';

// ============================================================
// واجهات البيانات
// ============================================================

interface Request {
  _id: string;
  requestNumber: string;
  portalId: string;
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
  requestTypeId?: {
    _id: string;
    name: string;
    nameAr: string;
  };
  specialistId?: {
    _id: string;
    profile: { fullName: string };
  };
  title: string;
  description: string;
  status: 'new' | 'under_review' | 'assigned' | 'scope_definition' | 
    'awaiting_approval' | 'awaiting_payment' | 'in_progress' | 
    'under_review_2' | 'modification' | 'completed' | 'closed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  scope?: {
    requirements: string;
    deliverables: string;
    duration: string;
    price: number;
    modificationsIncluded: number;
    exclusions: string;
  };
  price: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  formData: any;
  formSchemaSnapshot: any;
  files: any[];
  messages: any[];
  calls: any[];
  activityLog: {
    action: string;
    userId: string;
    userName: string;
    userRole: string;
    timestamp: Date;
    details: any;
  }[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// ============================================================
// المكون الرئيسي
// ============================================================

const AdminRequests: React.FC = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6aa45ad70a89ed89eeb18e41';

  // ===== جلب الطلبات =====
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setRequests([]);
        setError(data.message || 'حدث خطأ في تحميل الطلبات');
      }
    } catch (err) {
      console.error('❌ Error fetching requests:', err);
      setError('حدث خطأ في تحميل الطلبات');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, PORTAL_ID]);

  // ===== ✅ useEffect لتحميل البيانات =====
  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    fetchRequests();
  }, [fetchRequests]);

  // ===== تحديث حالة الطلب =====
  const updateRequestStatus = async (requestId: string, status: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/status`, {
        method: 'PUT',
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
        setShowStatusModal(false);
        setSelectedRequest(null);
        alert(`✅ تم تحديث الحالة إلى ${getStatusText(status)}`);
      } else {
        alert(data.message || 'حدث خطأ في تحديث الحالة');
      }
    } catch (err) {
      alert('حدث خطأ في تحديث الحالة');
    } finally {
      setProcessing(false);
    }
  };

  // ===== حذف طلب =====
  const deleteRequest = async (requestId: string) => {
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
        alert('✅ تم حذف الطلب بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في حذف الطلب');
      }
    } catch (err) {
      alert('حدث خطأ في حذف الطلب');
    }
  };

  // ===== الحصول على نص الحالة =====
  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'new': 'جديد',
      'under_review': 'قيد المراجعة',
      'assigned': 'تم الإسناد',
      'scope_definition': 'تحديد النطاق',
      'awaiting_approval': 'بانتظار الموافقة',
      'awaiting_payment': 'بانتظار الدفع',
      'in_progress': 'قيد التنفيذ',
      'under_review_2': 'قيد المراجعة (2)',
      'modification': 'تعديل',
      'completed': 'مكتمل',
      'closed': 'مغلق',
    };
    return texts[status] || status;
  };

  // ===== الحصول على لون الحالة =====
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-500',
      'under_review': 'bg-yellow-500',
      'assigned': 'bg-purple-500',
      'scope_definition': 'bg-indigo-500',
      'awaiting_approval': 'bg-orange-500',
      'awaiting_payment': 'bg-pink-500',
      'in_progress': 'bg-blue-500',
      'under_review_2': 'bg-yellow-500',
      'modification': 'bg-orange-500',
      'completed': 'bg-green-500',
      'closed': 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  // ===== الحصول على أيقونة الحالة =====
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      'new': <FaPlus className="w-4 h-4" />,
      'under_review': <FaClock className="w-4 h-4" />,
      'assigned': <FaUserCheck className="w-4 h-4" />,
      'scope_definition': <FaFileAlt className="w-4 h-4" />,
      'awaiting_approval': <FaClock className="w-4 h-4" />,
      'awaiting_payment': <FaMoneyBill className="w-4 h-4" />,
      'in_progress': <FaSpinner className="w-4 h-4 animate-spin" />,
      'under_review_2': <FaClock className="w-4 h-4" />,
      'modification': <FaEdit className="w-4 h-4" />,
      'completed': <FaCheckCircle className="w-4 h-4" />,
      'closed': <FaCheckCircle className="w-4 h-4" />,
    };
    return icons[status] || <FaClock className="w-4 h-4" />;
  };

  // ===== الحصول على مراحل الطلب المسموحة =====
  const getAvailableStatuses = (currentStatus: string) => {
    const flow: Record<string, string[]> = {
      'new': ['under_review', 'cancelled'],
      'under_review': ['assigned', 'cancelled'],
      'assigned': ['scope_definition', 'cancelled'],
      'scope_definition': ['awaiting_approval'],
      'awaiting_approval': ['awaiting_payment', 'modification'],
      'awaiting_payment': ['in_progress', 'cancelled'],
      'in_progress': ['under_review_2', 'completed'],
      'under_review_2': ['modification', 'completed'],
      'modification': ['under_review_2', 'completed'],
      'completed': ['closed'],
      'closed': [],
      'cancelled': [],
    };
    return flow[currentStatus] || [];
  };

  // ===== الحصول على اسم المستخدم =====
  const getUserName = (account: any) => {
    if (!account) return 'مستخدم';
    if (typeof account === 'object' && account.profile) {
      return account.profile.fullName || account.email || 'مستخدم';
    }
    return account.email || 'مستخدم';
  };

  // ===== الحصول على اسم الخدمة =====
  const getServiceName = (service: any) => {
    if (!service) return 'خدمة';
    if (typeof service === 'object') {
      return service.nameAr || service.name || 'خدمة';
    }
    return 'خدمة';
  };

  // ===== تصفية الطلبات =====
  const filteredRequests = Array.isArray(requests) 
    ? requests.filter(request => {
        const matchesSearch =
          (request.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          getUserName(request.accountId).toLowerCase().includes(searchTerm.toLowerCase()) ||
          getServiceName(request.serviceId).toLowerCase().includes(searchTerm.toLowerCase()) ||
          (request.requestNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || request.status === filterStatus;

        return matchesSearch && matchesStatus;
      })
    : [];

  // ===== إحصائيات الطلبات =====
  const stats = {
    total: Array.isArray(requests) ? requests.length : 0,
    new: Array.isArray(requests) ? requests.filter(r => r.status === 'new').length : 0,
    inProgress: Array.isArray(requests) ? requests.filter(r => ['under_review', 'assigned', 'scope_definition', 'awaiting_approval', 'in_progress'].includes(r.status)).length : 0,
    completed: Array.isArray(requests) ? requests.filter(r => r.status === 'completed' || r.status === 'closed').length : 0,
    pendingPayment: Array.isArray(requests) ? requests.filter(r => r.status === 'awaiting_payment').length : 0,
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

  // ===== مودال تفاصيل الطلب =====
  const renderDetailsModal = () => {
    if (!showDetailsModal || !selectedRequest) return null;

    const request = selectedRequest;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل الطلب</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                #{request.requestNumber || request._id.slice(-6)}
              </span>
            </div>
            <button onClick={() => { setShowDetailsModal(false); setSelectedRequest(null); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* معلومات أساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">العميل</p>
                <p className="font-bold text-gray-900 dark:text-white">{getUserName(request.accountId)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{request.accountId?.email || ''}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">الخدمة</p>
                <p className="font-bold text-gray-900 dark:text-white">{getServiceName(request.serviceId)}</p>
              </div>
            </div>

            {/* الحالة */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">الحالة</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)} {getStatusText(request.status)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  request.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                  request.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {request.paymentStatus === 'paid' ? 'مدفوع' :
                   request.paymentStatus === 'pending' ? 'قيد الانتظار' : 'فشل'}
                </span>
              </div>
            </div>

            {/* العنوان والوصف */}
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">العنوان</h4>
              <p className="text-gray-900 dark:text-white">{request.title}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">الوصف</h4>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{request.description || 'لا يوجد وصف'}</p>
            </div>

            {/* النطاق */}
            {request.scope && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">نطاق العمل</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">المتطلبات</p>
                    <p className="text-sm text-gray-900 dark:text-white">{request.scope.requirements || '-'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">المخرجات</p>
                    <p className="text-sm text-gray-900 dark:text-white">{request.scope.deliverables || '-'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">المدة</p>
                    <p className="text-sm text-gray-900 dark:text-white">{request.scope.duration || '-'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">السعر</p>
                    <p className="text-sm font-bold text-purple-600">{request.scope.price || request.price} ريال</p>
                  </div>
                </div>
              </div>
            )}

            {/* سجل النشاط */}
            {request.activityLog && request.activityLog.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">سجل النشاط</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {request.activityLog.slice().reverse().map((log, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{log.userName}</span> {log.action}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('ar-SA')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* أزرار الإجراء */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link to={`/request/${request._id}`} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2">
                <FaEye /> الذهاب إلى غرفة الطلب
              </Link>
              <button onClick={() => { setShowDetailsModal(false); setSelectedRequest(request); setShowStatusModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <FaEdit /> تغيير الحالة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== مودال تغيير الحالة =====
  const renderStatusModal = () => {
    if (!showStatusModal || !selectedRequest) return null;

    const availableStatuses = getAvailableStatuses(selectedRequest.status);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">تغيير حالة الطلب</h3>
            <button onClick={() => { setShowStatusModal(false); setSelectedRequest(null); setSelectedStatus(''); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">الحالة الحالية</p>
              <p className="font-bold text-gray-900 dark:text-white">{getStatusText(selectedRequest.status)}</p>
            </div>

            {availableStatuses.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اختر الحالة الجديدة</label>
                <div className="space-y-2">
                  {availableStatuses.map((status) => (
                    <button key={status} onClick={() => setSelectedStatus(status)} className={`w-full px-4 py-2 rounded-lg border-2 transition text-right ${selectedStatus === status ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'}`}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getStatusColor(status)}`}>{getStatusText(status)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">لا توجد حالات متاحة للانتقال إليها</div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => { if (selectedStatus) { updateRequestStatus(selectedRequest._id, selectedStatus); } else { alert('يرجى اختيار حالة جديدة'); } }} disabled={!selectedStatus || processing} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                {processing ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} تأكيد التغيير
              </button>
              <button onClick={() => { setShowStatusModal(false); setSelectedRequest(null); setSelectedStatus(''); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">إلغاء</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaFileAlt className="text-purple-600" /> نظام إدارة الطلبات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة جميع الطلبات ومتابعة حالتها</p>
          </div>
          <Link to="/requests/create" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2">
            <FaPlus /> طلب جديد
          </Link>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">📊 إجمالي الطلبات</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.new}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">🆕 جديدة</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">⚡ قيد التنفيذ</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-pink-500">{stats.pendingPayment}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">💳 بانتظار الدفع</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">✅ مكتملة</div>
          </div>
        </div>

        {/* خطأ */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6">
            <FaExclamationTriangle className="inline ml-2" /> {error}
          </div>
        )}

        {/* بحث وتصفية */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input type="text" placeholder="بحث عن طلب (الرقم، العميل، الخدمة)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition">
              <option value="all">جميع الحالات</option>
              <option value="new">🆕 جديد</option>
              <option value="under_review">⏳ قيد المراجعة</option>
              <option value="assigned">👤 تم الإسناد</option>
              <option value="scope_definition">📋 تحديد النطاق</option>
              <option value="awaiting_approval">⏳ بانتظار الموافقة</option>
              <option value="awaiting_payment">💳 بانتظار الدفع</option>
              <option value="in_progress">⚡ قيد التنفيذ</option>
              <option value="modification">✏️ تعديل</option>
              <option value="completed">✅ مكتمل</option>
              <option value="closed">🔒 مغلق</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">{filteredRequests.length} طلب</div>
        </div>

        {/* جدول الطلبات */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الطلب</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">العميل</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الخدمة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المختص</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRequests.map((request, index) => (
                  <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">#{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{request.title || 'طلب'}</div>
                      <div className="text-xs text-gray-400">{request.requestNumber || request._id.slice(-8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{getUserName(request.accountId)}</div>
                      <div className="text-xs text-gray-400">{request.accountId?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getServiceName(request.serviceId)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{request.specialistId ? getUserName(request.specialistId) : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)} {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        request.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        request.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {request.paymentStatus === 'paid' ? '✅ مدفوع' : request.paymentStatus === 'pending' ? '⏳ قيد الانتظار' : '❌ فشل'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{new Date(request.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedRequest(request); setShowDetailsModal(true); }} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition" title="عرض التفاصيل">
                          <FaEye />
                        </button>
                        <button onClick={() => { setSelectedRequest(request); setShowStatusModal(true); }} className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 transition" title="تغيير الحالة">
                          <FaEdit />
                        </button>
                        <button onClick={() => deleteRequest(request._id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition" title="حذف">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm || filterStatus !== 'all' ? 'لا توجد طلبات تطابق البحث' : 'لا توجد طلبات حالياً'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* مودالات */}
      {renderDetailsModal()}
      {renderStatusModal()}
    </div>
  );
};

export default AdminRequests;