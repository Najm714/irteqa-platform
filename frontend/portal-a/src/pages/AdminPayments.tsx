// frontend/portal-a/src/pages/AdminPayments.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaMoneyBill, FaSearch, FaSpinner,
  FaCheckCircle, FaTimesCircle,
  FaFileAlt, FaEye, FaDownload,
  FaFilePdf, FaFileImage, FaFileVideo,
  FaTimes,
} from 'react-icons/fa';

// ============================================================
// واجهات البيانات
// ============================================================

interface PaymentProof {
  _id: string;
  fileId: string;
  filename: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: Date;
}

interface Payment {
  _id: string;
  accountId: {
    _id: string;
    profile: { fullName: string };
    email: string;
  };
  requestId?: {
    _id: string;
    title: string;
  };
  subscriptionId?: {
    _id: string;
    materialId: {
      name: string;
      nameAr: string;
    };
  };
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  transactionId?: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded' | 'failed';
  proof?: PaymentProof;
  verifiedBy?: {
    _id: string;
    profile: { fullName: string };
  };
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// المكون الرئيسي
// ============================================================

const AdminPayments: React.FC = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processing, setProcessing] = useState(false);
  
  // ✅ حالة مودال عرض إثبات الدفع
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    url: string;
    name: string;
    type: string;
    size?: number;
  } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const PORTAL_ID = '6a8e3dab1175e7015f452904';

  // ===== تحميل المدفوعات =====
  const fetchPayments = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      console.log('📤 Fetching payments...');
      
      const response = await fetch(`${API_URL}/payments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Portal-Id': PORTAL_ID,
        }
      });
      
      const data = await response.json();
      console.log('📥 Payments response:', data);
      
      if (data.success) {
        setPayments(data.data || []);
        console.log(`✅ Payments loaded: ${data.data?.length || 0}`);
      } else {
        setError(data.message || 'حدث خطأ في تحميل المدفوعات');
      }
    } catch (err) {
      console.error('❌ Fetch payments error:', err);
      setError('حدث خطأ في تحميل المدفوعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token]);

  // ===== تحديث حالة الدفع =====
  const updatePaymentStatus = async (id: string, status: string) => {
    if (!token) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }
    
    if (!confirm(`هل أنت متأكد من ${status === 'verified' ? 'تأكيد' : 'رفض'} هذا الدفع؟`)) return;
    
    setProcessing(true);
    
    try {
      console.log(`📤 Updating payment ${id} to ${status}...`);
      
      const response = await fetch(`${API_URL}/payments/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Portal-Id': PORTAL_ID,
        },
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      console.log('📥 Update response:', data);
      
      if (data.success) {
        await fetchPayments();
        alert(`✅ تم ${status === 'verified' ? 'تأكيد' : 'رفض'} الدفع بنجاح!`);
      } else {
        alert(data.message || 'حدث خطأ في تحديث حالة الدفع');
      }
    } catch (err) {
      console.error('❌ Update payment error:', err);
      alert('حدث خطأ في تحديث حالة الدفع');
    } finally {
      setProcessing(false);
    }
  };

// ===== عرض إثبات الدفع =====
const viewProof = async (proof: PaymentProof) => {
  if (!proof) return;
  
  if (!token) {
    alert('يرجى تسجيل الدخول أولاً');
    return;
  }
  
  const fileId = proof._id || proof.fileId;
  if (!fileId) {
    alert('لا يوجد معرف للملف');
    return;
  }
  
  try {
    console.log('📎 Opening proof file:', fileId);
    
    // ✅ استخدام المسار الجديد /download-direct
    const response = await fetch(`${API_URL}/files/${fileId}/download-direct`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Portal-Id': PORTAL_ID,
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        alert('⚠️ يرجى تسجيل الدخول أولاً');
        return;
      }
      if (response.status === 403) {
        alert('⚠️ ليس لديك صلاحية لعرض هذا الملف');
        return;
      }
      if (response.status === 404) {
        alert('⚠️ الملف غير موجود');
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('📎 Blob size:', blob.size);
    
    const url = window.URL.createObjectURL(blob);
    const contentType = response.headers.get('content-type') || '';
    const contentDisposition = response.headers.get('content-disposition') || '';
    
    let filename = proof.originalName || proof.filename || 'إثبات الدفع';
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
    }
    
    console.log('📎 File loaded:', { contentType, filename, size: blob.size });
    
    setSelectedProof({
      url,
      name: filename,
      type: contentType,
      size: blob.size,
    });
    setShowProofModal(true);
    
  } catch (error) {
    console.error('❌ Error viewing proof:', error);
    alert('حدث خطأ في عرض الملف: ' + (error as Error).message);
  }
};
  // ===== الحصول على أيقونة الملف =====
  const getFileIcon = (mimeType?: string, filename?: string) => {
    if (!mimeType && !filename) return <FaFileAlt className="text-gray-500 w-5 h-5" />;
    
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return <FaFileImage className="text-purple-500 w-5 h-5" />;
    }
    if (mimeType === 'application/pdf' || ext === 'pdf') {
      return <FaFilePdf className="text-red-500 w-5 h-5" />;
    }
    if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(ext)) {
      return <FaFileVideo className="text-blue-500 w-5 h-5" />;
    }
    return <FaFileAlt className="text-gray-500 w-5 h-5" />;
  };

  // ===== تنسيق حجم الملف =====
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // ===== مودال عرض إثبات الدفع =====
  const renderProofModal = () => {
    if (!showProofModal || !selectedProof) return null;

    const isImage = selectedProof.type?.startsWith('image/');
    const isPdf = selectedProof.type === 'application/pdf';
    const isVideo = selectedProof.type?.startsWith('video/');
    const fileSize = formatFileSize(selectedProof.size);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          // تنظيف الـ URL عند الإغلاق
          if (selectedProof.url.startsWith('blob:')) {
            URL.revokeObjectURL(selectedProof.url);
          }
          setShowProofModal(false);
          setSelectedProof(null);
        }}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 min-w-0">
              {getFileIcon(selectedProof.type, selectedProof.name)}
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {selectedProof.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedProof.type || 'غير معروف'} • {fileSize}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={selectedProof.url}
                download={selectedProof.name}
                className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition"
                title="تحميل الملف"
              >
                <FaDownload className="w-5 h-5" />
              </a>
              <button
                onClick={() => {
                  if (selectedProof.url.startsWith('blob:')) {
                    URL.revokeObjectURL(selectedProof.url);
                  }
                  setShowProofModal(false);
                  setSelectedProof(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 min-h-[200px]">
            {isImage ? (
              <img
                src={selectedProof.url}
                alt={selectedProof.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  console.error('❌ Image load error');
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center py-12">
                        <div class="text-6xl mb-4">🖼️</div>
                        <p class="text-gray-600 dark:text-gray-400">تعذر تحميل الصورة</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${selectedProof.name}</p>
                        <a href="${selectedProof.url}" download="${selectedProof.name}" class="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                          <FaDownload class="inline ml-2" /> تحميل الملف
                        </a>
                      </div>
                    `;
                  }
                }}
              />
            ) : isPdf ? (
              <iframe
                src={selectedProof.url}
                className="w-full h-[70vh] rounded-lg"
                title={selectedProof.name}
              />
            ) : isVideo ? (
              <video
                src={selectedProof.url}
                controls
                className="max-w-full max-h-[70vh] rounded-lg"
                autoPlay={false}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {getFileIcon(selectedProof.type, selectedProof.name)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  لا يمكن معاينة هذا الملف
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {selectedProof.name} • {fileSize}
                </p>
                <a
                  href={selectedProof.url}
                  download={selectedProof.name}
                  className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <FaDownload className="inline ml-2" />
                  تحميل الملف
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ===== الحصول على حالة الدفع =====
  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: '⏳ قيد الانتظار' },
      'submitted': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: '📤 تم الإرسال' },
      'verified': { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: '✅ مؤكد' },
      'rejected': { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '❌ مرفوض' },
      'refunded': { color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400', label: '🔄 مسترجع' },
      'failed': { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: '❌ فشل' },
    };
    const { color, label } = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>;
  };

  // ===== الحصول على اسم طريقة الدفع =====
  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'credit_card': '💳 بطاقة ائتمان',
      'mada': '💳 مدى',
      'paypal': '💳 بايبال',
      'bank_transfer': '🏦 تحويل بنكي',
      'manual': '📝 يدوي',
      'wallet': '💰 محفظة',
      'free': '🎁 مجاني',
    };
    return labels[method] || method;
  };

  // ===== تصفية المدفوعات =====
  const filteredPayments = payments.filter(p =>
    p.accountId?.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.accountId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusFiltered = filterStatus === 'all' 
    ? filteredPayments 
    : filteredPayments.filter(p => p.status === filterStatus);

  // ===== إحصائيات المدفوعات =====
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending' || p.status === 'submitted').length,
    verified: payments.filter(p => p.status === 'verified').length,
    rejected: payments.filter(p => p.status === 'rejected' || p.status === 'failed').length,
    totalAmount: payments.reduce((sum, p) => sum + (p.status === 'verified' ? p.amount : 0), 0),
  };

  // ===== عرض حالة التحميل =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل المدفوعات...</p>
        </div>
      </div>
    );
  }

  // ===== JSX الرئيسي =====
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaMoneyBill className="text-purple-600" />
              إدارة المدفوعات
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              مراقبة وإدارة جميع المدفوعات في المنصة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              إجمالي المدفوعات: {stats.total}
            </span>
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              تحديث
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">⏳ معلقة</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.verified}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">✅ مؤكدة</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">❌ مرفوضة</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalAmount.toLocaleString()} ريال</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">💰 الإيرادات</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-400 mb-6">
            <FaTimesCircle className="inline ml-2" />
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن دفعة (المستخدم، المرجع)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">⏳ قيد الانتظار</option>
            <option value="submitted">📤 تم الإرسال</option>
            <option value="verified">✅ مؤكد</option>
            <option value="rejected">❌ مرفوض</option>
            <option value="refunded">🔄 مسترجع</option>
            <option value="failed">❌ فشل</option>
          </select>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            {statusFiltered.length} دفعة
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المستخدم</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المبلغ</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">طريقة الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">المرجع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">إثبات الدفع</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {statusFiltered.map((payment, index) => (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {payment.accountId?.profile?.fullName || 'مستخدم'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.accountId?.email || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">
                      {payment.amount} {payment.currency}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {getMethodLabel(payment.paymentMethod)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
                        {payment.reference}
                      </div>
                      {payment.transactionId && (
                        <div className="text-xs text-gray-400">{payment.transactionId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                    <td className="px-4 py-3">
                      {payment.proof ? (
                        <button
                          onClick={() => viewProof(payment.proof!)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm transition group"
                          title="عرض إثبات الدفع"
                          disabled={processing}
                        >
                          {getFileIcon(payment.proof?.mimeType, payment.proof?.filename || payment.proof?.originalName)}
                          <span className="truncate max-w-[80px]">
                            {payment.proof?.filename || payment.proof?.originalName || 'إثبات'}
                          </span>
                          <FaEye className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">لا يوجد</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(payment.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {(payment.status === 'pending' || payment.status === 'submitted') && (
                          <>
                            <button
                              onClick={() => updatePaymentStatus(payment._id, 'verified')}
                              disabled={processing}
                              className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 transition disabled:opacity-50"
                              title="تأكيد الدفع"
                            >
                              <FaCheckCircle />
                            </button>
                            <button
                              onClick={() => updatePaymentStatus(payment._id, 'rejected')}
                              disabled={processing}
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition disabled:opacity-50"
                              title="رفض الدفع"
                            >
                              <FaTimesCircle />
                            </button>
                          </>
                        )}
                        {payment.status === 'verified' && (
                          <span className="text-green-500 text-sm flex items-center gap-1">
                            <FaCheckCircle /> تم
                          </span>
                        )}
                        {payment.status === 'rejected' && (
                          <span className="text-red-500 text-sm flex items-center gap-1">
                            <FaTimesCircle /> مرفوض
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {statusFiltered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'لا توجد مدفوعات تطابق البحث'
                        : 'لا توجد مدفوعات حالياً'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== مودال عرض إثبات الدفع ===== */}
      {renderProofModal()}
    </div>
  );
};

export default AdminPayments;