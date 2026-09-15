// frontend/portal-a/src/pages/Admin/AdminRequests.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// أيقونات
import {
  FaSpinner, FaEye, FaEdit, FaTrash, FaUserCheck,
  FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaPlus, FaSearch, FaFilter,
  FaChevronLeft, FaChevronRight, FaMoneyBill,
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt,
  FaComments, FaUpload, FaDownload, FaShare,
  FaShieldAlt, FaUserGraduate, FaBuilding,
  FaTag, FaInfoCircle, FaChartBar, FaTimes,
  FaSave, FaArrowLeft, FaList, FaRocket,
  FaCreditCard, FaWallet, FaPhoneAlt, FaVideo,
  FaPaperPlane, FaReply, FaPrint, FaBookmark,
  FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaFile,
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
  paymentProofs: {
    fileId: {
      _id: string;
      originalName: string;
      size: number;
      mimeType: string;
    } | string;
    filename: string;
    uploadedAt: Date;
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    rejectionReason?: string;
  }[];
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
    phone?: string;
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

const AdminRequests: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // ===== حالات الطلبات =====
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

  // ===== حالات المودالات =====
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRejectPaymentModal, setShowRejectPaymentModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  // ===== بيانات النماذج =====
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [newStatus, setNewStatus] = useState<string>('');
  const [paymentReason, setPaymentReason] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [callData, setCallData] = useState({
    purpose: '',
    scheduledAt: '',
    duration: 30,
    notes: '',
  });
  const [scopeData, setScopeData] = useState({
    description: '',
    deliverables: '',
    requirements: '',
    estimatedDuration: '',
    price: '',
    modificationsIncluded: '',
    exclusions: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = import.meta.env.VITE_PORTAL_ID || '';

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
        const requestsData = (data.data || []).map((req: any) => ({
          ...req,
          paymentProofs: req.paymentProofs || [],
          files: req.files || [],
        }));
        setRequests(requestsData);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || data.data?.length || 0,
          pages: data.pagination?.pages || 1,
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

  // ============================================================
  // ✅ دوال التحكم في الطلبات
  // ============================================================

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
        setSelectedSpecialist('');
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
        setShowPaymentModal(false);
        alert('✅ تم تأكيد الدفع بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في تأكيد الدفع');
      }
    } catch (error) {
      alert('حدث خطأ في تأكيد الدفع');
    }
  };

  // ===== رفض الدفع =====
  const handleRejectPayment = async (requestId: string) => {
    if (!paymentReason) {
      alert('⚠️ يرجى إدخال سبب الرفض');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/payment/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ reason: paymentReason }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        await fetchStats();
        setShowRejectPaymentModal(false);
        setPaymentReason('');
        alert('✅ تم رفض الدفع');
      } else {
        alert(data.message || 'حدث خطأ في رفض الدفع');
      }
    } catch (error) {
      alert('حدث خطأ في رفض الدفع');
    }
  };

  // ===== إرسال رسالة =====
  const handleSendMessage = async (requestId: string) => {
    if (!messageText.trim()) {
      alert('⚠️ يرجى كتابة رسالة');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ message: messageText.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        setShowMessageModal(false);
        setMessageText('');
        alert('✅ تم إرسال الرسالة بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في إرسال الرسالة');
      }
    } catch (error) {
      alert('حدث خطأ في إرسال الرسالة');
    }
  };

  // ===== جدولة مكالمة =====
  const handleScheduleCall = async (requestId: string) => {
    if (!callData.purpose || !callData.scheduledAt) {
      alert('⚠️ يرجى إدخال الغرض والوقت');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({
          purpose: callData.purpose,
          scheduledAt: new Date(callData.scheduledAt),
          duration: callData.duration,
          notes: callData.notes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests();
        setShowCallModal(false);
        setCallData({
          purpose: '',
          scheduledAt: '',
          duration: 30,
          notes: '',
        });
        alert('✅ تم جدولة المكالمة بنجاح');
      } else {
        alert(data.message || 'حدث خطأ في جدولة المكالمة');
      }
    } catch (error) {
      alert('حدث خطأ في جدولة المكالمة');
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

  // ===== تحميل ملف إثبات الدفع =====
  const handleDownloadProof = async (fileId: string | undefined, filename: string) => {
    if (!fileId) {
      console.warn('⚠️ No fileId provided for download');
      alert('⚠️ لا يوجد معرف للملف');
      return;
    }

    try {
      console.log('📥 Downloading proof file:', fileId, filename);
      
      const response = await fetch(`${API_URL}/files/${fileId}/download-direct`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('⚠️ جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى.');
          return;
        }
        if (response.status === 404) {
          alert('⚠️ الملف غير موجود');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'proof-file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ File downloaded successfully');
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('حدث خطأ في تحميل ملف إثبات الدفع');
    }
  };

  // ===== عرض ملف إثبات الدفع =====
  const handleViewProof = (fileId: string | undefined) => {
    if (!fileId) {
      alert('⚠️ لا يوجد معرف للملف');
      return;
    }
    window.open(`${API_URL}/files/${fileId}/view?token=${token}`, '_blank');
  };

  // ===== الحصول على أيقونة الملف =====
  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return <FaFile className="text-gray-500 w-4 h-4" />;
    if (mimeType === 'application/pdf') return <FaFilePdf className="text-red-500 w-4 h-4" />;
    if (mimeType.includes('word')) return <FaFileWord className="text-blue-500 w-4 h-4" />;
    if (mimeType.includes('excel')) return <FaFileExcel className="text-green-500 w-4 h-4" />;
    if (mimeType.includes('image')) return <FaFileImage className="text-purple-500 w-4 h-4" />;
    return <FaFile className="text-gray-500 w-4 h-4" />;
  };

  // ============================================================
  // ✅ دوال مساعدة
  // ============================================================

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

  // ===== تنسيق التاريخ =====
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ===== الحصول على الحالات المتاحة للانتقال =====
  const getAvailableStatuses = (currentStatus: string) => {
    const flow: Record<string, string[]> = {
      'new': ['under_review', 'cancelled'],
      'under_review': ['assigned', 'cancelled'],
      'assigned': ['scope_definition', 'cancelled'],
      'scope_definition': ['awaiting_approval', 'cancelled'],
      'awaiting_approval': ['awaiting_payment', 'modification', 'cancelled'],
      'awaiting_payment': ['in_progress', 'cancelled'],
      'in_progress': ['under_review_2', 'completed', 'cancelled'],
      'under_review_2': ['modification', 'completed', 'cancelled'],
      'modification': ['in_progress', 'completed', 'cancelled'],
      'completed': ['closed'],
      'closed': [],
      'cancelled': [],
    };
    return flow[currentStatus] || [];
  };

  // ===== الحصول على اسم الحالة =====
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

  // ============================================================
  // ✅ عرض حالة التحميل
  // ============================================================
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
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({pagination.total} طلب)
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              تحكم كامل ومطلق في جميع طلبات البوابة
            </p>
          </div>
          <button
            onClick={() => fetchRequests()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <FaRocket className="w-4 h-4" />
            تحديث
          </button>
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
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">ملفات الدفع</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((request, index) => {
                    const status = getStatusBadge(request.status);
                    const payment = getPaymentBadge(request.paymentStatus);
                    const hasProofs = request.paymentProofs && request.paymentProofs.length > 0;
                    
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
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payment.color}`}>
                              {payment.label}
                            </span>
                            {/* ✅ أزرار تغيير حالة الدفع */}
                            {request.paymentStatus === 'submitted' && (
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-2 py-0.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 rounded text-xs transition flex items-center gap-1"
                                  title="تأكيد الدفع"
                                >
                                  <FaCheckCircle className="w-3 h-3" />
                                  تأكيد
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setPaymentReason('');
                                    setShowRejectPaymentModal(true);
                                  }}
                                  className="px-2 py-0.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 rounded text-xs transition flex items-center gap-1"
                                  title="رفض الدفع"
                                >
                                  <FaTimesCircle className="w-3 h-3" />
                                  رفض
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        {/* ✅ خانة ملفات الدفع */}
                        <td className="px-4 py-3">
                          {hasProofs ? (
                            <div className="flex flex-col gap-1">
                              {request.paymentProofs.map((proof, idx) => {
                                const fileId = typeof proof.fileId === 'object' ? proof.fileId?._id : proof.fileId;
                                const filename = typeof proof.fileId === 'object' ? proof.fileId?.originalName : proof.filename;
                                const mimeType = typeof proof.fileId === 'object' ? proof.fileId?.mimeType : '';
                                
                                if (!fileId) {
                                  return (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                      <FaFile className="w-4 h-4 text-gray-400" />
                                      <span>{filename || 'ملف'}</span>
                                      <span className="text-yellow-500 text-xs">⚠️ غير متاح</span>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    {getFileIcon(mimeType)}
                                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                                      {filename || 'ملف'}
                                    </span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleDownloadProof(fileId, filename || 'ملف')}
                                        className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition"
                                        title="تحميل"
                                      >
                                        <FaDownload className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleViewProof(fileId)}
                                        className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 transition"
                                        title="معاينة"
                                      >
                                        <FaEye className="w-3 h-3" />
                                      </button>
                                    </div>
                                    {proof.verified ? (
                                      <span className="text-green-500 text-xs">✅</span>
                                    ) : proof.rejectionReason ? (
                                      <span className="text-red-500 text-xs" title={proof.rejectionReason}>❌</span>
                                    ) : (
                                      <span className="text-yellow-500 text-xs">⏳</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">لا توجد ملفات</span>
                          )}
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
                            {(!request.specialistId || request.status === 'new' || request.status === 'under_review') && (
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
                            {(request.status === 'assigned' || request.status === 'scope_definition') && (
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
          ✅ مودال تفاصيل الطلب
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
          onVerifyPayment={() => {
            setShowPaymentModal(true);
            setShowDetailsModal(false);
          }}
          onRejectPayment={() => {
            setPaymentReason('');
            setShowRejectPaymentModal(true);
            setShowDetailsModal(false);
          }}
          onSendMessage={() => {
            setMessageText('');
            setShowMessageModal(true);
            setShowDetailsModal(false);
          }}
          onScheduleCall={() => {
            setCallData({
              purpose: '',
              scheduledAt: '',
              duration: 30,
              notes: '',
            });
            setShowCallModal(true);
            setShowDetailsModal(false);
          }}
          onDelete={() => handleDeleteRequest(selectedRequest._id)}
        />
      )}

      {/* ============================================================
          ✅ مودال إسناد مختص
          ============================================================ */}
      {showAssignModal && selectedRequest && (
        <AssignSpecialistModal
          request={selectedRequest}
          specialists={specialists}
          selectedSpecialist={selectedSpecialist}
          setSelectedSpecialist={setSelectedSpecialist}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedSpecialist('');
          }}
          onAssign={(specialistId) => handleAssignSpecialist(selectedRequest._id, specialistId)}
        />
      )}

      {/* ============================================================
          ✅ مودال تغيير الحالة
          ============================================================ */}
      {showStatusModal && selectedRequest && (
        <StatusModal
          request={selectedRequest}
          availableStatuses={getAvailableStatuses(selectedRequest.status)}
          onClose={() => setShowStatusModal(false)}
          onUpdate={(status) => handleUpdateStatus(selectedRequest._id, status)}
        />
      )}

      {/* ============================================================
          ✅ مودال تحديد النطاق
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

      {/* ============================================================
          ✅ مودال تأكيد الدفع
          ============================================================ */}
      {showPaymentModal && selectedRequest && (
        <PaymentModal
          request={selectedRequest}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={() => handleVerifyPayment(selectedRequest._id)}
        />
      )}

      {/* ============================================================
          ✅ مودال رفض الدفع
          ============================================================ */}
      {showRejectPaymentModal && selectedRequest && (
        <RejectPaymentModal
          request={selectedRequest}
          reason={paymentReason}
          setReason={setPaymentReason}
          onClose={() => {
            setShowRejectPaymentModal(false);
            setPaymentReason('');
          }}
          onReject={() => handleRejectPayment(selectedRequest._id)}
        />
      )}

      {/* ============================================================
          ✅ مودال إرسال رسالة
          ============================================================ */}
      {showMessageModal && selectedRequest && (
        <MessageModal
          request={selectedRequest}
          messageText={messageText}
          setMessageText={setMessageText}
          onClose={() => {
            setShowMessageModal(false);
            setMessageText('');
          }}
          onSend={() => handleSendMessage(selectedRequest._id)}
        />
      )}

      {/* ============================================================
          ✅ مودال جدولة مكالمة
          ============================================================ */}
      {showCallModal && selectedRequest && (
        <CallModal
          request={selectedRequest}
          callData={callData}
          setCallData={setCallData}
          onClose={() => {
            setShowCallModal(false);
            setCallData({
              purpose: '',
              scheduledAt: '',
              duration: 30,
              notes: '',
            });
          }}
          onSchedule={() => handleScheduleCall(selectedRequest._id)}
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
  onRejectPayment: () => void;
  onSendMessage: () => void;
  onScheduleCall: () => void;
  onDelete: () => void;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  request,
  onClose,
  onStatusChange,
  onAssign,
  onScope,
  onVerifyPayment,
  onRejectPayment,
  onSendMessage,
  onScheduleCall,
  onDelete,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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

          {/* إثباتات الدفع في المودال */}
          {request.paymentProofs && request.paymentProofs.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">💳 إثباتات الدفع</h4>
              <div className="space-y-1">
                {request.paymentProofs.map((proof, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                      {typeof proof.fileId === 'object' ? proof.fileId?.originalName : proof.filename}
                    </span>
                    {proof.verified ? (
                      <span className="text-green-500 text-xs">✅ مؤكد</span>
                    ) : proof.rejectionReason ? (
                      <span className="text-red-500 text-xs" title={proof.rejectionReason}>❌ مرفوض</span>
                    ) : (
                      <span className="text-yellow-500 text-xs">⏳ قيد المراجعة</span>
                    )}
                  </div>
                ))}
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
            {(request.status === 'assigned' || request.status === 'scope_definition') && (
              <button
                onClick={onScope}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <FaEdit className="w-4 h-4" />
                تحديد النطاق
              </button>
            )}
            {request.paymentStatus === 'submitted' && (
              <>
                <button
                  onClick={onVerifyPayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <FaCheckCircle className="w-4 h-4" />
                  تأكيد الدفع
                </button>
                <button
                  onClick={onRejectPayment}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <FaTimesCircle className="w-4 h-4" />
                  رفض الدفع
                </button>
              </>
            )}
            <button
              onClick={onSendMessage}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition flex items-center gap-2"
            >
              <FaPaperPlane className="w-4 h-4" />
              إرسال رسالة
            </button>
            <button
              onClick={onScheduleCall}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition flex items-center gap-2"
            >
              <FaPhoneAlt className="w-4 h-4" />
              جدولة مكالمة
            </button>
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
  selectedSpecialist: string;
  setSelectedSpecialist: (id: string) => void;
  onClose: () => void;
  onAssign: (specialistId: string) => void;
}

const AssignSpecialistModal: React.FC<AssignSpecialistModalProps> = ({
  request,
  specialists,
  selectedSpecialist,
  setSelectedSpecialist,
  onClose,
  onAssign,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpecialists = specialists.filter((s) =>
    s.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaUserCheck className="inline ml-2 text-purple-600" />
            إسناد مختص للطلب
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <p className="text-sm text-gray-500 dark:text-gray-400">الطلب</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              #{request.requestNumber} - {request.title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {request.serviceId?.nameAr || request.serviceId?.name}
            </p>
          </div>

          <div className="mb-4">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن مختص..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredSpecialists.length > 0 ? (
              filteredSpecialists.map((specialist) => (
                <div
                  key={specialist._id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                    selectedSpecialist === specialist._id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedSpecialist(specialist._id)}
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
                  {selectedSpecialist === specialist._id && (
                    <FaCheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaUserGraduate className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>لا يوجد مختصين متاحين</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => selectedSpecialist && onAssign(selectedSpecialist)}
              disabled={!selectedSpecialist}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaUserCheck className="w-4 h-4" />
              إسناد المختص
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
  const [selectedStatus, setSelectedStatus] = useState<string>('');

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
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">الطلب</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              #{request.requestNumber} - {request.title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              الحالة الحالية: <span className="font-semibold">{getStatusLabel(request.status)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اختر الحالة الجديدة:</p>
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`w-full text-right px-4 py-3 rounded-lg border-2 transition ${
                  selectedStatus === status
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                  {getStatusLabel(status)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => selectedStatus && onUpdate(selectedStatus)}
              disabled={!selectedStatus}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaCheckCircle className="w-4 h-4" />
              تحديث الحالة
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

// ============================================================
// ✅ مودال تأكيد الدفع
// ============================================================

interface PaymentModalProps {
  request: Request;
  onClose: () => void;
  onConfirm: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  request,
  onClose,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaCheckCircle className="inline ml-2 text-green-600" />
            تأكيد الدفع
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">تأكيد الدفع للطلب</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              #{request.requestNumber} - {request.title}
            </p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-500 dark:text-gray-400">المبلغ</span>
              <span className="font-bold text-purple-600">{request.price} ريال</span>
            </div>
          </div>

          <p className="text-sm text-green-600 dark:text-green-400 mb-4">
            سيتم تأكيد الدفع وتغيير حالة الطلب إلى "قيد التنفيذ"
          </p>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <FaCheckCircle className="w-4 h-4" />
              تأكيد الدفع
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
// ✅ مودال رفض الدفع
// ============================================================

interface RejectPaymentModalProps {
  request: Request;
  reason: string;
  setReason: (reason: string) => void;
  onClose: () => void;
  onReject: () => void;
}

const RejectPaymentModal: React.FC<RejectPaymentModalProps> = ({
  request,
  reason,
  setReason,
  onClose,
  onReject,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaTimesCircle className="inline ml-2 text-red-600" />
            رفض الدفع
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            رفض الدفع للطلب #{request.requestNumber}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              سبب الرفض *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="أدخل سبب رفض الدفع..."
              required
            />
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onReject}
              disabled={!reason.trim()}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaTimesCircle className="w-4 h-4" />
              تأكيد الرفض
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
// ✅ مودال إرسال رسالة
// ============================================================

interface MessageModalProps {
  request: Request;
  messageText: string;
  setMessageText: (text: string) => void;
  onClose: () => void;
  onSend: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({
  request,
  messageText,
  setMessageText,
  onClose,
  onSend,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaPaperPlane className="inline ml-2 text-pink-600" />
            إرسال رسالة
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            إرسال رسالة للطلب #{request.requestNumber}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نص الرسالة *
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="اكتب رسالتك هنا..."
              required
            />
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSend}
              disabled={!messageText.trim()}
              className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaPaperPlane className="w-4 h-4" />
              إرسال
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
// ✅ مودال جدولة مكالمة
// ============================================================

interface CallModalProps {
  request: Request;
  callData: any;
  setCallData: (data: any) => void;
  onClose: () => void;
  onSchedule: () => void;
}

const CallModal: React.FC<CallModalProps> = ({
  request,
  callData,
  setCallData,
  onClose,
  onSchedule,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            <FaPhoneAlt className="inline ml-2 text-cyan-600" />
            جدولة مكالمة
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            جدولة مكالمة للطلب #{request.requestNumber}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الغرض من المكالمة *
            </label>
            <input
              type="text"
              value={callData.purpose}
              onChange={(e) => setCallData({ ...callData, purpose: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="الغرض من المكالمة..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              التاريخ والوقت *
            </label>
            <input
              type="datetime-local"
              value={callData.scheduledAt}
              onChange={(e) => setCallData({ ...callData, scheduledAt: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              المدة (دقائق)
            </label>
            <input
              type="number"
              value={callData.duration}
              onChange={(e) => setCallData({ ...callData, duration: parseInt(e.target.value) || 30 })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              min="5"
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              value={callData.notes}
              onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              placeholder="أي معلومات إضافية..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSchedule}
              disabled={!callData.purpose || !callData.scheduledAt}
              className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaPhoneAlt className="w-4 h-4" />
              جدولة
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
// ✅ دوال مساعدة للشارات
// ============================================================

const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    'new': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'under_review': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'assigned': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'scope_definition': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'awaiting_approval': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'awaiting_payment': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'in_progress': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'under_review_2': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'modification': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'closed': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const getStatusLabel = (status: string): string => {
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

export default AdminRequests;